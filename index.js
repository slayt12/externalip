/**
 * External IP check service.
 *
 * Returns the visitor IP, a parsed browser name and version, and an ISP name.
 * Deployed on Replit with local port 80 (.replit). PORT overrides that default.
 * On Vercel this file is the zero-config Express entrypoint: Vercel loads it
 * as a module and serves the exported app, so the listen block never runs.
 *
 * Invariants:
 * - HTML is escaped. The ISP lookup never follows redirects and never sends
 *   private addresses off-box.
 * - Exactly one proxy hop is trusted unless TRUST_PROXY says otherwise.
 *   TRUST_PROXY=true restores the old "trust every hop" behavior.
 *
 * Exit codes: 0 while serving; 1 if the listen socket fails.
 */

'use strict';

const express = require('express');
const { trustProxySetting } = require('./lib/trust-proxy/trust-proxy');
const { browserInfo } = require('./lib/browser-info/browser-info');
const { lookupIsp } = require('./lib/lookup-isp/lookup-isp');
const { createRateLimit } = require('./lib/rate-limit/rate-limit');
const { renderPage } = require('./lib/render-page/render-page');
const { securityHeaders } = require('./lib/security-headers/security-headers');

function createApp(options = {}) {
  const app = express();
  const lookup = options.lookupIsp || lookupIsp;
  const limit = options.rateLimit || createRateLimit();

  app.disable('x-powered-by');
  app.set('trust proxy', options.trustProxy ?? trustProxySetting());
  app.use(securityHeaders);
  app.use(limit);

  app.get('/', async (req, res) => {
    const report = await clientReport(req, lookup);
    res.type('html').send(renderPage({
      ip: report.ip,
      browserName: report.browser.name,
      browserVersion: report.browser.version,
      isp: report.isp,
      nonce: res.locals.nonce,
    }));
  });

  app.get('/api', async (req, res) => {
    const report = await clientReport(req, lookup);
    res.json({
      ip: report.ip,
      browser: {
        name: report.browser.name,
        version: report.browser.version,
      },
      isp: report.isp,
    });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) {
      next(err);
      return;
    }
    res.status(500).type('text/plain').send('Something went wrong');
  });

  return app;
}

async function clientReport(req, lookup) {
  const ip = typeof req.ip === 'string' ? req.ip : '';
  const browser = browserInfo(req.get('user-agent'));
  let isp = 'unknown';
  try {
    const found = await lookup(ip);
    if (typeof found === 'string' && found) isp = found;
  } catch (err) {
    console.error('ISP lookup failed');
  }
  console.log(ip);
  return { ip, browser, isp };
}

const app = createApp();

if (require.main === module) {
  const port = Number(process.env.PORT) || 80;
  const server = app.listen(port, (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(`Listening on port ${port}`);
  });
  server.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });
}

// Vercel loads this file as a module and needs the app as the default export.
module.exports = app;
module.exports.createApp = createApp;
