/**
 * Limit how often one client IP can hit this process.
 *
 * The key is req.ip, which already accounts for the trusted proxy hop.
 * The map is capped so a stream of distinct addresses cannot grow without bound.
 *
 * Invariant: calls beyond `max` in a window get 429 and do not call next().
 */

'use strict';

function createRateLimit(options = {}) {
  const windowMs = options.windowMs ?? 60 * 1000;
  const max = options.max ?? 60;
  const maxKeys = options.maxKeys ?? 5000;
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
    let bucket = hits.get(key);

    if (!bucket || now - bucket.start >= windowMs) {
      if (!bucket && hits.size >= maxKeys) {
        const oldest = hits.keys().next().value;
        hits.delete(oldest);
      }
      bucket = { start: now, count: 0 };
      hits.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
      res.status(429).type('text/plain').send('Too many requests');
      return;
    }

    next();
  };
}

module.exports = { createRateLimit };
