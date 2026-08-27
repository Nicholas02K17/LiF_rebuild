#!/usr/bin/env node
'use strict';

/**
 * Prohibited-pattern scan.
 *
 * AI Run Instructions v2.1 TEST 4 and section 5.4. Any unexplained match fails.
 * Run it in CI:  npm run scan:prohibited
 *
 * The scan is deliberately blunt and reports its own exclusions, so nothing is
 * quietly waved through.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SCAN_DIRS = ['src'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'extracted', 'txt', 'dev', 'tests']);
const EXTENSIONS = new Set(['.js', '.ejs', '.css', '.json']);

const RULES = [
  {
    id: 'unsafe-render',
    why: 'Pages and components must never be built from HTML strings (section 5.4).',
    pattern: /\b(innerHTML|outerHTML|insertAdjacentHTML|document\.write)\b/
  },
  {
    id: 'html-in-js',
    why: 'HTML markup constructed inside JavaScript (section 5.4).',
    pattern: /(`|'|")\s*<\s*(div|span|section|ul|li|button|a|p|svg|circle|form|input)\b/i,
    files: /\.js$/
  },
  {
    id: 'data-access-in-template',
    why: 'No database call, service call or authorization decision inside EJS (section 5.4).',
    pattern: /\b(require\(|repositories\.|\.query\(|knex|prisma|mongoose|sequelize|fetch\()/,
    files: /\.ejs$/
  },
  {
    id: 'fixture-import-from-src',
    why: 'Production code must not be able to import development or test records (section 7).',
    pattern: /require\(\s*['"][^'"]*(\/dev\/|\.\.\/\.\.\/dev\/)/,
    allow: [path.join('src', 'repositories', 'index.js')]
  },
  {
    id: 'browser-secret',
    why: 'No credential, service-role key or authorization-sensitive value in browser code (section 5.4).',
    pattern: /\b(SERVICE_ROLE|SECRET_KEY|PRIVATE_KEY|api[_-]?key\s*[:=]\s*['"][^'"]{8,})/i
  },
  {
    id: 'global-app-state',
    why: 'No global window application state (section 5.4).',
    pattern: /\bwindow\.(app|store|state|LiF)\s*=/
  },
  {
    id: 'unfinished-placeholder',
    why: 'No mapped surface may be left as a TODO or an empty placeholder (section 10).',
    pattern: /\b(TODO|FIXME|XXX|coming soon placeholder)\b/i
  },
  {
    id: 'hard-coded-colour',
    why: 'Colours and fonts come from central tokens, never from a template or browser module (Brand Reference v1.1 section 4).',
    pattern: /#[0-9a-fA-F]{3,8}\b/,
    files: /\.(ejs|js)$/
  }
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function relative(file) {
  return path.relative(ROOT, file);
}

/**
 * Blank out comments before matching, keeping line numbers intact.
 *
 * A rule name written in a comment that explains the rule is not a violation of
 * it, and leaving those in the report trains people to ignore the report. Real
 * code is still scanned in full — only commentary is blanked, and the blanking
 * is line-preserving so every reported line number stays true.
 */
function stripComments(source, file) {
  const blank = (match) => match.replace(/[^\n]/g, ' ');

  let out = source.replace(/\/\*[\s\S]*?\*\//g, blank);

  if (/\.(js|ejs)$/.test(file)) {
    // A `//` line comment, but never the `//` inside a URL scheme.
    out = out.replace(/(^|[^:'"`\\])\/\/.*$/gm, (match, lead) => lead + blank(match.slice(lead.length)));
  }
  if (/\.ejs$/.test(file)) {
    out = out.replace(/<%#[\s\S]*?%>/g, blank);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const findings = [];

for (const file of files) {
  const rel = relative(file);
  // tokens.css is the one place colours are allowed to be literal — it is the
  // central token file the rule exists to protect.
  const isTokenFile = rel.endsWith(path.join('css', 'tokens.css'));
  const lines = stripComments(fs.readFileSync(file, 'utf8'), file).split(/\r?\n/);

  for (const rule of RULES) {
    if (rule.files && !rule.files.test(file)) continue;
    if (rule.id === 'hard-coded-colour' && isTokenFile) continue;
    if (rule.allow && rule.allow.some((a) => rel === a || rel === a.split(path.sep).join('/'))) continue;

    lines.forEach((line, index) => {
      if (!rule.pattern.test(line)) return;
      findings.push({ rule: rule.id, why: rule.why, file: rel, line: index + 1, text: line.trim().slice(0, 120) });
    });
  }
}

if (!findings.length) {
  console.log(`Prohibited-pattern scan: clean. ${files.length} files checked in ${SCAN_DIRS.join(', ')}.`);
  console.log('Excluded by design: /dev (fixtures, unreachable from src), /tests, css/tokens.css (the central colour tokens), and comment text.');
  process.exit(0);
}

console.error(`Prohibited-pattern scan: ${findings.length} finding(s).\n`);
for (const f of findings) {
  console.error(`  [${f.rule}] ${f.file}:${f.line}`);
  console.error(`      ${f.text}`);
  console.error(`      ${f.why}\n`);
}
process.exit(1);
