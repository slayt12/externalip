/**
 * Read a browser name and version from a User-Agent header.
 *
 * Uses ua-parser-js 1.x (MIT). Version 2 is AGPL-3.0 and is intentionally
 * not used. Input is capped before parsing so a huge header cannot dominate
 * CPU even if a parser regression lands later.
 *
 * Invariant: name and version are short strings with no ASCII control characters.
 */

'use strict';

const parser = require('ua-parser-js');

const MAX_UA = 500;

function clean(value, max) {
  if (typeof value !== 'string' || value.length === 0) return 'Unknown';
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);
  return cleaned || 'Unknown';
}

function browserInfo(userAgent) {
  const ua = typeof userAgent === 'string' ? userAgent.slice(0, MAX_UA) : '';
  let name = 'Unknown';
  let version = 'Unknown';

  try {
    const info = parser(ua);
    if (info && info.browser) {
      name = clean(info.browser.name, 80);
      version = clean(info.browser.version, 40);
    }
  } catch (err) {
    console.error('User-Agent parse failed');
  }

  return { name, version };
}

module.exports = { browserInfo };
