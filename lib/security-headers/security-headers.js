/**
 * Set per-response browser protections.
 *
 * The page is different for every visitor, so shared caches must not store it.
 * Script sources are limited to this response's nonce plus the Google tag and
 * Stripe buy-button hosts already used by the page. Styles stay inline because
 * Stripe's button injects style into the page.
 *
 * Invariant: every HTML response carries a nonce that renderPage also uses.
 */

'use strict';

const crypto = require('crypto');

function securityHeaders(req, res, next) {
  const nonce = crypto.randomBytes(16).toString('base64url');
  res.locals.nonce = nonce;
  res.set({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': [
      "default-src 'self'",
      `script-src 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://*.js.stripe.com`,
      "style-src 'self' 'unsafe-inline' https://js.stripe.com",
      "img-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.stripe.com data:",
      "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://api.stripe.com",
      "frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action https://checkout.stripe.com",
    ].join('; '),
  });
  next();
}

module.exports = { securityHeaders };
