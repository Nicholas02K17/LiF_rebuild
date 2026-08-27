'use strict';

const path = require('path');
const fs = require('fs');
const config = require('../config');

/**
 * Centralized member-facing terminology.
 *
 * Dashboard Unified v1.2 section 19.2 (FOUNDATIONAL DEVELOPER REQUIREMENT):
 * every member-facing label, button, popup, automatic message and email
 * template resolves through a key. Changing LiF wording is a content change,
 * never a database, API or template change.
 *
 * English is always available even when another preferred language is selected
 * (Shared Foundation v1.4 section 2). If a key is missing from the preferred
 * locale, English answers and the fallback is reported rather than hidden.
 */

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const cache = new Map();

function load(locale) {
  if (cache.has(locale)) return cache.get(locale);
  const file = path.join(CONTENT_DIR, `terminology.${locale}.json`);
  if (!fs.existsSync(file)) {
    if (locale === 'en') throw new Error('English terminology is required and is missing.');
    return null;
  }
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  cache.set(locale, parsed);
  return parsed;
}

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

/**
 * @param {string} locale
 * @returns {{ t: (key: string, vars?: Object) => string, locale: string, fallbacks: string[] }}
 */
function forLocale(locale = config.locale) {
  const english = load('en');
  const preferred = locale === 'en' ? english : load(locale);
  const fallbacks = [];

  function t(key, vars) {
    if (preferred && Object.prototype.hasOwnProperty.call(preferred, key)) {
      return interpolate(preferred[key], vars);
    }
    if (Object.prototype.hasOwnProperty.call(english, key)) {
      if (locale !== 'en') fallbacks.push(key);
      return interpolate(english[key], vars);
    }
    // A missing key is a content bug, never a silent blank in the interface.
    return `[missing: ${key}]`;
  }

  return { t, locale, fallbacks };
}

module.exports = { forLocale };
