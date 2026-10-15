# ipcheck

Small service that reports the connecting IP address, browser name and version, and ISP.

## Run

```bash
npm install
npm start
```

Replit maps container port 80 (see `.replit`). Set `PORT` to listen somewhere else.

```bash
PORT=3000 npm start
```

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `80` | Listen port. |
| `TRUST_PROXY` | `1` | Express `trust proxy` value. One hop trusts only the nearest reverse proxy. Use `loopback` for a proxy on localhost, a subnet such as `10.0.0.0/8` for a known proxy range, or `true` to trust every `X-Forwarded-For` hop. |

`TRUST_PROXY=true` lets a client choose the IP this service reports by prepending `X-Forwarded-For`. Leave the default unless a deployment really has a different proxy layout.

## HTTP API

`GET /` returns the HTML page. `GET /api` returns JSON:

```json
{
  "ip": "203.0.113.9",
  "browser": { "name": "Chrome", "version": "120.0.0.0" },
  "isp": "Example ISP"
}
```

Responses send `Cache-Control: no-store` so a shared cache cannot serve one visitor's IP to another.

## ISP lookup

The ISP comes from ip-api.com's free JSON endpoint. That endpoint is HTTP only, capped at 45 requests per minute, and limited to non-commercial use. This server requests only `status` and `isp`, refuses redirects, skips private addresses, and caches results for 10 minutes.

## Dependencies

- `express` 5.3.0, the current release. It depends on `proxy-addr` 2.0.8 or newer (`GHSA-jqcg-44mw-7w3h`) and `qs` 6.16.0 or newer.
- `ua-parser-js` 1.0.41, the latest MIT release. Version 2.0.10 is newer but licensed AGPL-3.0, which adds a network source-sharing duty. Stay on 1.x unless that license is acceptable. The client-hints ReDoS fixed in 2.0.10 does not apply to 1.x, and this app does not call `withClientHints()`.

Keep `package-lock.json` and `bun.lock` updated together. An older npm lockfile installed `proxy-addr` 2.0.7 and `qs` 6.15.2 even after the Bun lockfile had moved on.

The Stripe value in the page is a publishable key (`pk_live_...`). It is meant to be public. Do not put a secret key (`sk_live_...`) in this repository.

## Tests

```bash
npm test
```
