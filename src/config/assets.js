'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Asset fingerprint.
 *
 * Stylesheets and browser modules are served with a long cache lifetime, which
 * is right — they are fetched on every page and they rarely change. But a long
 * lifetime without a changing URL means a deployed fix is invisible to anyone
 * who has been here before, for as long as the cache lasts. That is not a
 * caching subtlety, it is a bug: the page ships new markup that its old
 * stylesheet has no rules for, and the result is worse than either version.
 *
 * So every asset URL carries `?v=<fingerprint>`, and the fingerprint changes
 * whenever the assets do. A new deployment is a new URL, and the browser
 * fetches it because it has never seen it before.
 *
 * The value is computed once at boot: hosting platforms hand us the commit,
 * which changes exactly when the code does; locally we hash the files
 * themselves so an edit busts the cache without a commit.
 */

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const FINGERPRINTED_DIRS = ['css', 'js'];

function fromPlatform() {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.RENDER_GIT_COMMIT ||
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.SOURCE_VERSION;
  return sha ? String(sha).slice(0, 12) : null;
}

function walk(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function fromContents() {
  const hash = crypto.createHash('sha256');
  const files = FINGERPRINTED_DIRS.flatMap((dir) => walk(path.join(PUBLIC_DIR, dir))).sort();

  for (const file of files) {
    try {
      hash.update(path.relative(PUBLIC_DIR, file));
      hash.update(fs.readFileSync(file));
    } catch {
      // A file we cannot read cannot contribute; the rest still fingerprints.
    }
  }
  return hash.digest('hex').slice(0, 12);
}

let cached = null;

function version() {
  if (cached) return cached;
  cached = fromPlatform() || fromContents() || 'dev';
  return cached;
}

/** `/assets/css/tokens.css` -> `/assets/css/tokens.css?v=abc123` */
function url(assetPath) {
  const separator = assetPath.includes('?') ? '&' : '?';
  return `${assetPath}${separator}v=${version()}`;
}

module.exports = { version, url };
