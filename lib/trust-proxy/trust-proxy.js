/**
 * Resolve the Express trust-proxy setting.
 *
 * `true` trusts every X-Forwarded-For hop, so a client can pick the IP this
 * service reports. One hop matches a single reverse proxy (Replit, nginx).
 * Set TRUST_PROXY to a hop count, `loopback`, a subnet, `true`, or `false`.
 *
 * Invariant: an empty value means exactly one trusted hop.
 */

'use strict';

function trustProxySetting(raw = process.env.TRUST_PROXY) {
  if (raw == null || raw === '') return 1;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^[0-9]+$/.test(raw)) return Number(raw);
  return raw;
}

module.exports = { trustProxySetting };
