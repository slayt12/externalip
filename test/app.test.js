/**
 * Security checks for the IP page: escaping, proxy trust, and the ISP lookup.
 */

'use strict';

const assert = require('node:assert/strict');
const { describe, it, after } = require('node:test');
const { createApp } = require('../index');
const { escapeHtml } = require('../lib/escape-html/escape-html');
const { isPublicIp } = require('../lib/public-ip/public-ip');
const { trustProxySetting } = require('../lib/trust-proxy/trust-proxy');
const { createLookupIsp } = require('../lib/lookup-isp/lookup-isp');
const { createRateLimit } = require('../lib/rate-limit/rate-limit');
const { browserInfo } = require('../lib/browser-info/browser-info');

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

describe('escapeHtml', () => {
  it('encodes markup characters', () => {
    assert.equal(
      escapeHtml(`<img src=x onerror=alert(1)>&"'`),
      '&lt;img src=x onerror=alert(1)&gt;&amp;&quot;&#39;',
    );
  });
});

describe('isPublicIp', () => {
  it('rejects private, loopback, and non-addresses', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.1.1', '172.16.0.1', '169.254.1.1', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', 'not-an-ip', '8.8.8.8<script>']) {
      assert.equal(isPublicIp(ip), false, ip);
    }
  });

  it('accepts public addresses', () => {
    assert.equal(isPublicIp('8.8.8.8'), true);
    assert.equal(isPublicIp('2001:4860:4860::8888'), true);
    assert.equal(isPublicIp('::ffff:8.8.8.8'), true);
    assert.equal(isPublicIp('172.15.255.255'), true);
  });
});

describe('trustProxySetting', () => {
  it('defaults to one hop', () => {
    assert.equal(trustProxySetting(undefined), 1);
    assert.equal(trustProxySetting(''), 1);
    assert.equal(trustProxySetting('2'), 2);
    assert.equal(trustProxySetting('true'), true);
    assert.equal(trustProxySetting('false'), false);
    assert.equal(trustProxySetting('loopback'), 'loopback');
  });
});

describe('browserInfo', () => {
  it('does not echo a raw user-agent into the name', () => {
    const info = browserInfo('<script>alert(1)</script>');
    assert.equal(info.name.includes('<'), false);
    assert.equal(info.version.includes('<'), false);
  });

  it('reads a normal Chrome user-agent', () => {
    const info = browserInfo('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    assert.equal(info.name, 'Chrome');
    assert.equal(info.version, '120.0.0.0');
  });
});

describe('lookupIsp', () => {
  it('does not call the network for a private address', async () => {
    let called = false;
    const lookup = createLookupIsp({
      fetchImpl: async () => {
        called = true;
        throw new Error('should not fetch');
      },
    });
    assert.equal(await lookup('192.168.1.20'), 'unknown');
    assert.equal(called, false);
  });

  it('requests only ip-api and refuses redirects', async () => {
    let seen;
    const lookup = createLookupIsp({
      fetchImpl: async (url, options) => {
        seen = { href: String(url), options };
        return {
          ok: true,
          async text() {
            return JSON.stringify({ status: 'success', isp: 'Example <ISP>' });
          },
        };
      },
    });

    assert.equal(await lookup('8.8.8.8'), 'Example <ISP>');
    const parsed = new URL(seen.href);
    assert.equal(parsed.protocol, 'http:');
    assert.equal(parsed.hostname, 'ip-api.com');
    assert.equal(parsed.pathname, '/json/8.8.8.8');
    assert.equal(parsed.searchParams.get('fields'), 'status,isp');
    assert.equal(seen.options.redirect, 'error');
  });

  it('ignores a failed lookup body', async () => {
    const lookup = createLookupIsp({
      fetchImpl: async () => ({
        ok: true,
        async text() {
          return JSON.stringify({ status: 'fail', message: 'reserved range' });
        },
      }),
    });
    assert.equal(await lookup('8.8.4.4'), 'unknown');
  });
});

describe('rate limit', () => {
  it('stops a client after the configured number of calls', () => {
    const limit = createRateLimit({ max: 2, windowMs: 60_000 });
    const req = { ip: '203.0.113.10' };
    let nexts = 0;
    const next = () => {
      nexts += 1;
    };

    limit(req, { set() {}, status() { return this; }, type() { return this; }, send() {} }, next);
    limit(req, { set() {}, status() { return this; }, type() { return this; }, send() {} }, next);

    let status;
    let body;
    const res = {
      set() { return this; },
      status(code) { status = code; return this; },
      type() { return this; },
      send(payload) { body = payload; return this; },
    };
    limit(req, res, next);
    assert.equal(nexts, 2);
    assert.equal(status, 429);
    assert.equal(body, 'Too many requests');
  });
});

describe('HTTP app', () => {
  const servers = [];

  after(async () => {
    await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
  });

  async function start(options) {
    const server = await listen(createApp({
      lookupIsp: async () => 'Example ISP',
      rateLimit: createRateLimit({ max: 100 }),
      ...options,
    }));
    servers.push(server);
    return `http://127.0.0.1:${server.address().port}`;
  }

  it('uses the address added by the nearest proxy and ignores a prepended one', async () => {
    const base = await start({ trustProxy: 1 });
    const res = await fetch(`${base}/api`, {
      headers: { 'x-forwarded-for': '198.51.100.1, 203.0.113.9' },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ip, '203.0.113.9');
    assert.equal(body.isp, 'Example ISP');
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(res.headers.get('x-powered-by'), null);
  });

  it('trusts the leftmost address only when every hop is trusted', async () => {
    const base = await start({ trustProxy: true });
    const res = await fetch(`${base}/api`, {
      headers: { 'x-forwarded-for': '198.51.100.1, 203.0.113.9' },
    });
    const body = await res.json();
    assert.equal(body.ip, '198.51.100.1');
  });

  it('escapes the ISP in the HTML page and binds scripts to the CSP nonce', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    const base = await start({
      trustProxy: 1,
      lookupIsp: async () => payload,
    });
    const res = await fetch(`${base}/`, {
      headers: {
        'x-forwarded-for': '203.0.113.50',
        'user-agent': '<script>alert(1)</script>',
      },
    });
    const html = await res.text();
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(html.includes(payload), false);
    assert.equal(html.includes('<script>alert(1)</script>'), false);
    assert.match(html, /ISP: &lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(html, /IP address: 203\.0\.113\.50/);

    const csp = res.headers.get('content-security-policy');
    const nonce = csp.match(/'nonce-([^']+)'/)[1];
    assert.match(html, new RegExp(`nonce="${nonce}"`));
    const scriptSrc = csp.split(';').map((part) => part.trim()).find((part) => part.startsWith('script-src'));
    assert.equal(scriptSrc.includes('unsafe-inline'), false);
    assert.equal(scriptSrc.includes('unsafe-eval'), false);
  });
});
