'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

/**
 * Deployed changes must actually reach a returning visitor.
 *
 * A long `max-age` on an un-versioned asset URL means a fix ships to the server
 * and is never seen: the browser keeps the old stylesheet and renders new
 * markup against rules that no longer match it. That happened on the first
 * review deployment — the Hub shipped a new circle and the cached stylesheet
 * had nothing to draw it with.
 *
 * These pin the pairing that prevents it: fingerprinted URLs may be cached
 * hard, everything else must revalidate.
 *
 * Run in a child process so production mode is genuine rather than patched.
 */

const ROOT = path.join(__dirname, '..', '..');

function run(expression, env = {}) {
  const stdout = execFileSync(process.execPath, ['-e', expression], {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: undefined, LIF_REVIEW_DEPLOYMENT: undefined, ...env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return JSON.parse(stdout.trim());
}

const PROBE = `
  const assets = require('./src/config/assets');
  const repositories = require('./src/repositories');
  repositories.bind(require('./dev/adapters/devRepositories').create());
  const { createApp } = require('./src/app');

  const server = createApp().listen(0, async () => {
    const base = 'http://127.0.0.1:' + server.address().port;
    const version = assets.version();

    const page = await (await fetch(base + '/')).text();
    const stylesheet = /href="(\\/assets\\/css\\/features\\/hub\\.css[^"]*)"/.exec(page);
    const entryModule = /src="(\\/assets\\/js\\/hub\\.page\\.js[^"]*)"/.exec(page);

    const fingerprinted = await fetch(base + '/assets/css/features/hub.css?v=' + version);
    const bare = await fetch(base + '/assets/css/features/hub.css');
    const stale = await fetch(base + '/assets/css/features/hub.css?v=notthecurrentone');

    console.log(JSON.stringify({
      version,
      stylesheetHref: stylesheet && stylesheet[1],
      entryHref: entryModule && entryModule[1],
      fingerprintedCache: fingerprinted.headers.get('cache-control'),
      bareCache: bare.headers.get('cache-control'),
      staleCache: stale.headers.get('cache-control'),
      bareHasEtag: Boolean(bare.headers.get('etag'))
    }));
    server.close();
    process.exit(0);
  });
`;

test('every asset the shell links carries the current fingerprint', () => {
  const r = run(PROBE, { NODE_ENV: 'production', LIF_REVIEW_DEPLOYMENT: 'true' });

  assert.ok(r.version && r.version.length >= 8, 'a fingerprint exists');
  assert.ok(r.stylesheetHref.includes('?v=' + r.version), 'stylesheet URL is versioned');
  assert.ok(r.entryHref.includes('?v=' + r.version), 'browser entry point is versioned');
});

test('a fingerprinted asset may be cached hard; anything else must revalidate', () => {
  const r = run(PROBE, { NODE_ENV: 'production', LIF_REVIEW_DEPLOYMENT: 'true' });

  assert.match(r.fingerprintedCache, /immutable/, 'the versioned URL is immutable');
  assert.match(r.fingerprintedCache, /max-age=31536000/);

  // The case that caused the bug: a stable URL with a long lifetime.
  assert.match(r.bareCache, /max-age=0|no-cache|must-revalidate/, 'an un-versioned URL revalidates');
  assert.doesNotMatch(r.bareCache, /max-age=(?!0)\d/, 'and is never given a long lifetime');
  assert.ok(r.bareHasEtag, 'so revalidation is a cheap 304');

  // A fingerprint from an older deployment must not earn the long cache.
  assert.match(r.staleCache, /max-age=0|no-cache|must-revalidate/);
});

test('development never caches an asset at all', () => {
  const r = run(PROBE, {});
  assert.match(r.fingerprintedCache, /no-store/);
  assert.match(r.bareCache, /no-store/);
});

test('the fingerprint changes when an asset changes', () => {
  const probe = `
    const fs = require('fs');
    const path = require('path');
    const file = path.join('src', 'public', 'css', 'tokens.css');
    const original = fs.readFileSync(file);
    try {
      delete require.cache[require.resolve('./src/config/assets')];
      const before = require('./src/config/assets').version();

      fs.writeFileSync(file, Buffer.concat([original, Buffer.from('\\n/* fingerprint probe */\\n')]));
      delete require.cache[require.resolve('./src/config/assets')];
      const after = require('./src/config/assets').version();

      console.log(JSON.stringify({ before, after, changed: before !== after }));
    } finally {
      fs.writeFileSync(file, original);
    }
  `;
  // No platform commit in the environment, so it must hash the files themselves.
  const r = run(probe, { VERCEL_GIT_COMMIT_SHA: undefined, RENDER_GIT_COMMIT: undefined });
  assert.equal(r.changed, true, 'editing an asset must produce a new fingerprint');
});
