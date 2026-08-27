'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

/**
 * The production data guard.
 *
 * AI Run Instructions v2.1 section 7: production code must not be able to
 * import fixture records. A hosted review deployment is the one exception, and
 * it has to be asked for by name.
 *
 * These run in child processes because the guard fires at module load, and a
 * `require` cache would hide it.
 */

const ROOT = path.join(__dirname, '..', '..');

function boot(env, expression = "const c = require('./src/config'); console.log(JSON.stringify({adapter: c.dataAdapter, review: c.reviewDeployment}));") {
  try {
    const stdout = execFileSync(process.execPath, ['-e', expression], {
      cwd: ROOT,
      env: { ...process.env, NODE_ENV: undefined, LIF_DATA_ADAPTER: undefined, LIF_REVIEW_DEPLOYMENT: undefined, ...env },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { ok: true, out: stdout.trim() };
  } catch (error) {
    return { ok: false, err: String(error.stderr || error.message) };
  }
}

test('production refuses the fixture adapter', () => {
  const result = boot({ NODE_ENV: 'production', LIF_DATA_ADAPTER: 'dev' });
  assert.equal(result.ok, false, 'it must not boot');
  assert.match(result.err, /not permitted in production/);
  assert.match(result.err, /LIF_REVIEW_DEPLOYMENT/, 'and it must say what the legitimate route is');
});

test('production defaults to the host adapter, never to fixtures', () => {
  const result = boot({ NODE_ENV: 'production' });
  assert.equal(result.ok, true);
  assert.equal(JSON.parse(result.out).adapter, 'host');
});

test('a review deployment must be asked for by name', () => {
  // Anything other than the exact string is not a review deployment.
  for (const value of ['1', 'yes', 'TRUE', '']) {
    const result = boot({ NODE_ENV: 'production', LIF_DATA_ADAPTER: 'dev', LIF_REVIEW_DEPLOYMENT: value });
    assert.equal(result.ok, false, `LIF_REVIEW_DEPLOYMENT=${JSON.stringify(value)} must not unlock fixtures`);
  }

  const declared = boot({ NODE_ENV: 'production', LIF_DATA_ADAPTER: 'dev', LIF_REVIEW_DEPLOYMENT: 'true' });
  assert.equal(declared.ok, true);
  const parsed = JSON.parse(declared.out);
  assert.equal(parsed.adapter, 'dev');
  assert.equal(parsed.review, true);
});

test('a production request with no bound backend fails closed, leaking nothing', () => {
  const expression = `
    const { createApp } = require('./src/app');
    const server = createApp().listen(0, async () => {
      const response = await fetch('http://127.0.0.1:' + server.address().port + '/');
      const body = await response.text();
      console.log(JSON.stringify({
        status: response.status,
        leaksFixture: /Wren|Halifax|Coastal Growers/.test(body),
        leaksStack: /node_modules|at Object\\.|\\.js:\\d+:\\d+/.test(body)
      }));
      server.close();
      process.exit(0);
    });
  `;
  const result = boot({ NODE_ENV: 'production' }, expression);
  assert.equal(result.ok, true, 'the app boots; it is the request that must fail');

  const outcome = JSON.parse(result.out);
  assert.equal(outcome.status, 500, 'no viewer resolver and no repositories bound');
  assert.equal(outcome.leaksFixture, false, 'no fixture record reaches the browser');
  assert.equal(outcome.leaksStack, false, 'no stack trace reaches the browser');
});

test('a review deployment serves the Hub and says what it is on the page', () => {
  const expression = `
    const handler = require('./api/index.js');
    const server = require('http').createServer(handler).listen(0, async () => {
      const response = await fetch('http://127.0.0.1:' + server.address().port + '/');
      const body = await response.text();
      console.log(JSON.stringify({
        status: response.status,
        banner: /Review deployment/.test(body),
        hub: /Welcome Home/.test(body)
      }));
      server.close();
      process.exit(0);
    });
  `;
  const result = boot({ NODE_ENV: 'production', LIF_REVIEW_DEPLOYMENT: 'true' }, expression);
  assert.equal(result.ok, true);

  const outcome = JSON.parse(result.out);
  assert.equal(outcome.status, 200);
  assert.equal(outcome.hub, true, 'the Hub renders');
  assert.equal(outcome.banner, true, 'and it never pretends to be the connected Playground');
});

/**
 * Developer detail must never reach a browser that is not the developer's own.
 *
 * NODE_ENV is the most misconfigured variable there is — an empty value in a
 * hosting dashboard reads as "development" to `NODE_ENV || 'development'`. These
 * pin the behaviour so that mistake can never expose a stack trace again.
 */

const FAILING_APP = `
  const repositories = require('./src/repositories');
  const { createApp } = require('./src/app');
  const dev = require('./dev/adapters/devRepositories').create();
  dev.memberRepository.findIdentity = async () => {
    throw new Error('SECRET_DB_HOST=internal-db.lif.local refused the connection');
  };
  repositories.bind(dev);
  const server = createApp().listen(0, async () => {
    const body = await (await fetch('http://127.0.0.1:' + server.address().port + '/')).text();
    console.log(JSON.stringify({
      leaksStack: /at async |\.js:\d+:\d+/.test(body),
      leaksInternals: /internal-db\.lif\.local/.test(body),
      staysCalm: /Nothing you have entered is lost/.test(body)
    }));
    server.close();
    process.exit(0);
  });
`;

test('an empty NODE_ENV on a review deployment still hides developer detail', () => {
  const result = boot({ NODE_ENV: '', LIF_REVIEW_DEPLOYMENT: 'true' }, FAILING_APP);
  assert.equal(result.ok, true);

  const outcome = JSON.parse(result.out);
  assert.equal(outcome.leaksStack, false, 'no stack trace');
  assert.equal(outcome.leaksInternals, false, 'no internal hostname');
  assert.equal(outcome.staysCalm, true, 'and the Member still gets the calm wording');
});

test('a hosting platform alone is enough to hide developer detail', () => {
  // No review flag, no usable NODE_ENV — only the platform's own marker.
  for (const marker of ['VERCEL', 'RENDER', 'FLY_APP_NAME', 'AWS_LAMBDA_FUNCTION_NAME']) {
    const result = boot({ NODE_ENV: '', [marker]: '1' }, FAILING_APP);
    assert.equal(result.ok, true, `${marker} run should serve a page`);
    const outcome = JSON.parse(result.out);
    assert.equal(outcome.leaksStack, false, `${marker}: no stack trace`);
    assert.equal(outcome.leaksInternals, false, `${marker}: no internal hostname`);
  }
});

test('a developer on their own machine still gets the detail they need', () => {
  const result = boot({}, FAILING_APP.replace('staysCalm:', 'hasDetail: /Developer detail/.test(body), staysCalm:'));
  assert.equal(result.ok, true);
  assert.equal(JSON.parse(result.out).hasDetail, true);
});
