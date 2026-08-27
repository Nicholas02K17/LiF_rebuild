'use strict';

/**
 * A deliberately trivial diagnostic function.
 *
 * It has no dependencies, requires nothing at module load, and cannot throw
 * before it answers. That is the whole point: if `/` returns Vercel's crash
 * page and this returns JSON, the platform and the build are fine and the fault
 * is in the application. If this crashes too, the fault is the build or the
 * configuration and nothing in `src/` is implicated.
 *
 * It reports only non-secret deployment flags — the same values that are
 * already written down in the public README. It never enumerates process.env.
 *
 * Safe to delete once the deployment is healthy.
 */

const SAFE_FLAGS = [
  'NODE_ENV',
  'LIF_REVIEW_DEPLOYMENT',
  'LIF_DATA_ADAPTER',
  'PORT',
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_GIT_COMMIT_SHA'
];

/** Files loaded by a runtime path, which a bundler cannot trace on its own. */
const RUNTIME_FILES = [
  'src/app.js',
  'src/views/layouts/base.ejs',
  'src/views/features/hub/index.ejs',
  'src/views/partials/seed-mark.ejs',
  'src/content/terminology.en.json',
  'src/public/css/tokens.css',
  'dev/adapters/devRepositories.js',
  'dev/seed/hub.dataset.js',
  'node_modules/express/package.json',
  'node_modules/ejs/package.json'
];

/** Modules that must be resolvable, not merely present on disk. */
const RUNTIME_MODULES = ['express', 'ejs'];

module.exports = function health(req, res) {
  const report = {
    functionRuns: true,
    node: process.version,
    cwd: process.cwd(),
    dirname: __dirname,
    flags: {},
    files: {},
    reviewAdapterResolves: null,
    reviewAdapterError: null,
    appLoads: null,
    appError: null
  };

  for (const key of SAFE_FLAGS) {
    const value = process.env[key];
    report.flags[key] = value === undefined ? '(unset)' : value === '' ? '(empty string)' : value;
  }

  try {
    const fs = require('fs');
    const path = require('path');
    const root = path.join(__dirname, '..');
    for (const relative of RUNTIME_FILES) {
      report.files[relative] = fs.existsSync(path.join(root, relative));
    }
  } catch (error) {
    report.files.error = String(error && error.message);
  }

  report.modules = {};
  for (const name of RUNTIME_MODULES) {
    try {
      require.resolve(name);
      report.modules[name] = true;
    } catch {
      report.modules[name] = false;
    }
  }

  // Whether the module is genuinely resolvable in the bundle, which is a
  // different question from whether a file exists next to this one.
  try {
    require.resolve('../dev/adapters/devRepositories');
    report.reviewAdapterResolves = true;
  } catch (error) {
    report.reviewAdapterResolves = false;
    report.reviewAdapterError = String(error && error.message);
  }

  // The question that matters: does the application itself load in here?
  try {
    require('../src/app');
    report.appLoads = true;
  } catch (error) {
    report.appLoads = false;
    report.appError = String(error && error.message);
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(report, null, 2));
};
