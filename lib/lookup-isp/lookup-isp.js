/**
 * Look up an ISP name for a public IP.
 *
 * ip-api.com's free endpoint is HTTP-only (HTTPS requires their paid plan),
 * limited to 45 requests per minute, and non-commercial. Redirects are
 * refused so a tampered response cannot turn this into a request to another
 * host. Only the status and isp fields are requested.
 *
 * Invariant: the function resolves to a short display string and does not throw.
 * It does not call the network for private or invalid addresses.
 */

'use strict';

const { isPublicIp } = require('../public-ip/public-ip');

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 1000;
const OUTBOUND_MAX = 40;
const OUTBOUND_WINDOW_MS = 60 * 1000;
const MAX_BODY = 8192;
const DEFAULT_TIMEOUT_MS = 3000;

function cleanIsp(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 120);
}

function createLookupIsp(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const cache = new Map();
  let windowStart = 0;
  let outbound = 0;

  return async function lookupIsp(ip) {
    if (!isPublicIp(ip)) return 'unknown';

    const now = Date.now();
    const cached = cache.get(ip);
    if (cached && cached.expires > now) return cached.isp;

    if (now - windowStart >= OUTBOUND_WINDOW_MS) {
      windowStart = now;
      outbound = 0;
    }
    if (outbound >= OUTBOUND_MAX) return 'unknown';
    outbound += 1;

    let url;
    try {
      url = new URL(`http://ip-api.com/json/${ip}`);
    } catch (err) {
      return 'unknown';
    }
    if (url.hostname !== 'ip-api.com' || url.protocol !== 'http:') return 'unknown';
    url.searchParams.set('fields', 'status,isp');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        signal: controller.signal,
        redirect: 'error',
        headers: { accept: 'application/json' },
      });
      if (!response || !response.ok) return 'unknown';
      const text = await response.text();
      if (typeof text !== 'string' || text.length > MAX_BODY) return 'unknown';

      const data = JSON.parse(text);
      const isp = cleanIsp(data && data.status === 'success' ? data.isp : '');
      if (!isp) return 'unknown';

      if (cache.size >= CACHE_MAX) {
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
      }
      cache.set(ip, { isp, expires: now + CACHE_TTL_MS });
      return isp;
    } catch (err) {
      return 'unknown';
    } finally {
      clearTimeout(timer);
    }
  };
}

const lookupIsp = createLookupIsp();

module.exports = { createLookupIsp, lookupIsp };
