'use strict';

/**
 * Runs a real request against the Hub from inside the deployment, and reports
 * whatever happens as JSON.
 *
 * `/` returns the platform's opaque crash page and the runtime logs are behind
 * an account login, so the only way to see the actual error is to have the
 * deployment perform the request itself and tell us. It builds the app exactly
 * as `api/index.js` does, serves it on a loopback port, fetches `/`, and
 * reports the status, the first part of the body, and any error — including
 * errors that would otherwise kill the process, which are captured rather than
 * allowed to terminate anything.
 *
 * Safe to delete once the deployment is healthy.
 */

const http = require('http');

module.exports = async function diag(req, res) {
  const report = { stage: 'starting', captured: [] };

  // Catch what would normally end the process, so it becomes data instead.
  const onUnhandled = (error) => {
    report.captured.push({ kind: 'unhandledRejection', message: String(error && error.message), stack: String(error && error.stack).split('\n').slice(0, 6) });
  };
  const onUncaught = (error) => {
    report.captured.push({ kind: 'uncaughtException', message: String(error && error.message), stack: String(error && error.stack).split('\n').slice(0, 6) });
  };
  process.on('unhandledRejection', onUnhandled);
  process.on('uncaughtException', onUncaught);

  let server = null;

  try {
    report.stage = 'requiring config';
    const config = require('../src/config');
    report.reviewDeployment = config.reviewDeployment;
    report.dataAdapter = config.dataAdapter;

    report.stage = 'binding repositories';
    const repositories = require('../src/repositories');
    if (config.reviewDeployment) {
      const devAdapter = require('../dev/adapters/devRepositories');
      repositories.bind(devAdapter.create());
    }

    report.stage = 'creating app';
    const { createApp } = require('../src/app');
    const app = createApp();

    report.stage = 'listening';
    server = http.createServer(app);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });

    const base = 'http://127.0.0.1:' + server.address().port;

    for (const target of ['/', '/assets/css/tokens.css']) {
      report.stage = 'fetching ' + target;
      try {
        const response = await fetch(base + target);
        const body = await response.text();
        report[target] = {
          status: response.status,
          length: body.length,
          preview: body.slice(0, 700)
        };
      } catch (error) {
        report[target] = { fetchError: String(error && error.message) };
      }
    }

    // Probe the pieces the Hub route uses and nothing else does, since that
    // route is the only one failing.
    report.stage = 'probing repositories';
    try {
      const bound = repositories.get();
      report.repositories = {
        resolved: true,
        hasMember: typeof bound.memberRepository === 'object',
        hasPlayground: typeof bound.playgroundRepository === 'object'
      };
    } catch (error) {
      report.repositories = { resolved: false, error: String(error && error.message) };
    }

    report.stage = 'probing loadHub';
    try {
      const hubService = require('../src/services/hub.service');
      const hub = await hubService.loadHub({ memberId: 'mem_dev_0001', isMember: true });
      report.loadHub = { ok: true, summaries: hub.summaries.length, activity: hub.activity.length };
    } catch (error) {
      report.loadHub = {
        ok: false,
        error: String(error && error.message),
        stack: String(error && error.stack).split('\n').slice(0, 6)
      };
    }

    // The decisive test: drive the exact handler api/index.js exports, in its
    // own module state, the way the platform drives it.
    report.stage = 'probing the exported handler';
    try {
      const exported = require('./index.js');
      report.exportedHandler = { type: typeof exported, isExpress: typeof exported === 'function' && typeof exported.handle === 'function' };

      const probeServer = http.createServer(exported);
      await new Promise((resolve, reject) => {
        probeServer.once('error', reject);
        probeServer.listen(0, '127.0.0.1', resolve);
      });
      const probeBase = 'http://127.0.0.1:' + probeServer.address().port;
      try {
        const response = await fetch(probeBase + '/');
        const body = await response.text();
        report.exportedHandler.homeStatus = response.status;
        report.exportedHandler.homePreview = body.slice(0, 300);
      } catch (error) {
        report.exportedHandler.fetchError = String(error && error.message);
      }
      probeServer.close();
    } catch (error) {
      report.exportedHandler = { error: String(error && error.message) };
    }

    report.stage = 'done';
  } catch (error) {
    report.stage = 'threw during ' + report.stage;
    report.error = String(error && error.message);
    report.stack = String(error && error.stack).split('\n').slice(0, 8);
  } finally {
    process.off('unhandledRejection', onUnhandled);
    process.off('uncaughtException', onUncaught);
    if (server) {
      try {
        server.close();
      } catch {
        /* nothing useful to do */
      }
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(report, null, 2));
};
