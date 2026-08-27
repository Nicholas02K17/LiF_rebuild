'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

/**
 * A failing request must return a 500. It must never kill the process.
 *
 * Express 4 does not await an async handler, so a rejection escapes as an
 * unhandled rejection and Node terminates on those. On a serverless host that
 * is not a 500 — it is the entire function dying with an opaque platform error,
 * which is exactly what happened in the first deployment of this Hub. The cause
 * was one `finally` reaching for a repository that was not in the bundle.
 *
 * These run in child processes because the failure being guarded against is
 * process death, which cannot be observed from inside the process it kills.
 */

const ROOT = path.join(__dirname, '..', '..');

function run(expression, env = {}) {
  try {
    const stdout = execFileSync(process.execPath, ['-e', expression], {
      cwd: ROOT,
      env: { ...process.env, NODE_ENV: undefined, LIF_REVIEW_DEPLOYMENT: undefined, ...env },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { survived: true, out: stdout.trim() };
  } catch (error) {
    return { survived: false, err: String(error.stderr || error.message) };
  }
}

test('a handler that throws answers 500 instead of killing the process', () => {
  const expression = `
    process.on('unhandledRejection', (e) => { console.error('PROCESS DIED: ' + e.message); process.exit(7); });
    process.on('uncaughtException',  (e) => { console.error('PROCESS DIED: ' + e.message); process.exit(7); });

    const repositories = require('./src/repositories');
    const { createApp } = require('./src/app');

    const dev = require('./dev/adapters/devRepositories').create();
    dev.memberRepository.findIdentity = async () => { throw new Error('the backend went away mid-request'); };
    repositories.bind(dev);

    const server = createApp().listen(0, async () => {
      const response = await fetch('http://127.0.0.1:' + server.address().port + '/');
      console.log(JSON.stringify({ status: response.status, stillAlive: true }));
      server.close();
      process.exit(0);
    });
  `;

  const result = run(expression);
  assert.equal(result.survived, true, 'the process must outlive a failing request');
  const outcome = JSON.parse(result.out);
  assert.equal(outcome.status, 500);
});

test('a throw from the cleanup path does not take the process down either', () => {
  // The original defect: `finally` reached for a repository that was not there.
  const expression = `
    process.on('unhandledRejection', (e) => { console.error('PROCESS DIED: ' + e.message); process.exit(7); });
    process.on('uncaughtException',  (e) => { console.error('PROCESS DIED: ' + e.message); process.exit(7); });

    const repositories = require('./src/repositories');
    const { createApp } = require('./src/app');

    const dev = require('./dev/adapters/devRepositories').create();
    repositories.bind(dev);

    // Make the repository unavailable the instant the request starts, so the
    // cleanup in \`finally\` finds nothing to talk to.
    const app = createApp();
    app.use((req, res, next) => { repositories.reset(); next(); });

    const server = app.listen(0, async () => {
      const response = await fetch('http://127.0.0.1:' + server.address().port + '/?state=empty');
      console.log(JSON.stringify({ status: response.status, stillAlive: true }));
      server.close();
      process.exit(0);
    });
  `;

  const result = run(expression);
  assert.equal(result.survived, true, 'cleanup must never be able to kill the process');
});

test('the serverless entry point survives its fixtures being absent', () => {
  // Simulates the review adapter being dropped from a deployment bundle.
  const expression = `
    process.on('unhandledRejection', (e) => { console.error('PROCESS DIED: ' + e.message); process.exit(7); });
    process.on('uncaughtException',  (e) => { console.error('PROCESS DIED: ' + e.message); process.exit(7); });

    const Module = require('module');
    const realResolve = Module._resolveFilename;
    Module._resolveFilename = function (request, ...rest) {
      if (request.includes('dev/adapters/devRepositories')) {
        throw new Error("Cannot find module '" + request + "'");
      }
      return realResolve.call(this, request, ...rest);
    };

    const handler = require('./api/index.js');
    const server = require('http').createServer(handler).listen(0, async () => {
      const response = await fetch('http://127.0.0.1:' + server.address().port + '/');
      const body = await response.text();
      console.log(JSON.stringify({
        status: response.status,
        readable: /could not start/.test(body),
        leaksStack: /\\.js:\\d+:\\d+/.test(body)
      }));
      server.close();
      process.exit(0);
    });
  `;

  const result = run(expression, { NODE_ENV: 'production', LIF_REVIEW_DEPLOYMENT: 'true' });
  assert.equal(result.survived, true, 'a missing fixture module must not crash the function');

  const outcome = JSON.parse(result.out);
  assert.equal(outcome.status, 500);
  assert.equal(outcome.readable, true, 'and it must say something a person can act on');
  assert.equal(outcome.leaksStack, false);
});
