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

Node 22 is required (`engines.node` is `22.x`). Vercel reads that field to pick the runtime.

## Deploy to Vercel

Vercel runs this as a zero-config Express app: it finds `index.js` at the root and turns the whole app into one function. `.replit`, the port-80 default, and `PORT` are not used there.

Vercel requires the entry file to export the Express app or call `app.listen`. `index.js` exports the app as `module.exports` (with `createApp` attached for the tests) and only calls `listen` when run directly with `node index.js`. Keep both.

```bash
npm i -g vercel          # CLI 47.0.5 or newer
vercel link              # once; writes .vercel/ (git-ignored)
vercel dev               # run locally the way Vercel will
vercel deploy            # preview deployment
vercel deploy --prod     # production
```

You can also connect the Git repository in the Vercel dashboard, which deploys previews on every push and production builds from `master`.

Notes for Vercel:

- Leave `TRUST_PROXY` unset. Vercel replaces `X-Forwarded-For` with the real client IP, so the default of one trusted hop is correct.
- The rate limiter, ISP cache, and outbound cap live in memory, so each function instance has its own copy and a cold start clears them. To enforce a per-client limit across instances, use Vercel Firewall rate limiting.
- `vercel dev` does not keep that in-memory state between requests at all, so the rate limiter never triggers there. Test it with `npm start` instead.
- Outbound requests come from Vercel's shared egress IPs, so ip-api.com's 45-per-minute limit is shared with other tenants. Expect `unknown` ISP results more often than on a dedicated host.
- `vercel env pull` writes `.env.local`, which contains a `VERCEL_OIDC_TOKEN`. `.gitignore` excludes `.env*` and `.vercel`. Do not commit them.

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
