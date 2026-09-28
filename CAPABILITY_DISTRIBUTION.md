# Access-controlled Candidate Master delivery — experimental checkpoint

Date: 2026-09-28. **Implemented and tested locally; no service deployed, no public Pages change.** The public code branch contains no real-person mapping, image bytes, signing key or admin secret. The 2026-09-28 private R2 edition was staged outside the repository. Phase 2 remains NOT PASS and Retrospective Trigger is unadopted.

## Boundary and flow

Public GitHub Pages serves HTML/JS and a small `candidate-distribution.json` pointer containing only a Worker URL. The Worker serves a public *metadata-only* manifest (master version, SHA-256, edition URLs). An R2 bucket with **public access disabled** holds `masters/<master_version>.json`. Only the Worker can read it via a binding. The Worker requires a signed Bearer Capability for a version-specific GET. The browser verifies SHA-256 and schema/partition before storing the edition in IndexedDB.

An authorized sender device holds a time-limited **issuer** Capability in its own IndexedDB. At **共有URLを作成**, the app asks the Worker to mint a **read-only**, version-specific Capability expiring with the result link, at most seven days and no later than its parent issuer. The URL fragment contains the existing nine-person result payload and this Capability; it contains no sender answers, uncertainty or history. Fragment data is not sent in the initial HTTP request. **自分も選んでみる** carries only set ID, master/set versions and the read Capability to the next app URL fragment. That page removes the invite fragment from the address bar immediately, downloads the edition, then starts a new player/session. A read Capability cannot mint other grants or read a different version. There is no master listing endpoint or arbitrary object key supplied by the client.

The sender must first receive an issuer invite from the administrator. An administrator separately invokes `POST /v1/admin/invite` with a secret stored only in the Worker; this is a **human deployment/commissioning step**, not normal Player Setup. A family recipient can receive a read-only invite link. To permit their device to generate share-to-play links later, the administrator can issue an issuer invite for that device. No user account or login UI is required.

## Direct-entry limit

An already provisioned device opens the ordinary URL and reuses a hash-verified local edition. A *clean* device with no token and no cache cannot securely download a private master from a plain unrestricted URL. That would make the endpoint effectively public. Its first entry therefore requires an owner-issued invitation link (no login, JSON file or manual settings). A normal URL on a brand-new device shows an explicit access failure and retry; it never starts the synthetic set. This is an unavoidable authorization bootstrap, not a client bug.

## Server contract

| Route | Access | Result |
|---|---|---|
| `GET /v1/manifest` | Public | Version/hash/endpoint metadata only |
| `GET /v1/capability` | Signed read or issuer token | Scope/version/expiry, no identity information |
| `GET /v1/master/<version>` | Signed read or issuer token matching that version | Private JSON with `Cache-Control: no-store` |
| `POST /v1/grants` | Signed issuer token | Version-specific read token; maximum seven days and parent expiry |
| `POST /v1/admin/invite` | Administrator secret, not called by app | Read or issuer invite; maximum 30 days |

Signed payloads use HMAC-SHA-256, scope, version, random nonce and millisecond expiry. The Worker checks request Origin against the exact Pages origin and supports the Authorization preflight. CORS is not treated as authorization; Bearer verification is required. Worker secrets must be configured as secrets, never plain repository variables. The static endpoint pointer must be replaced **only after** private service setup and endpoint validation.

## Activation requiring human-side configuration

1. Choose/configure a Worker endpoint and a private R2 bucket, with public bucket URLs disabled. Bind it as `MASTER_BUCKET`.
2. Upload the staged `masters/<version>.json` to that private bucket. Set `MANIFEST_JSON` to the staged metadata manifest; keep earlier edition objects and metadata when issuing later versions.
3. Set `APP_ORIGIN` to the exact GitHub Pages origin. Set independent high-entropy `CAPABILITY_SECRET` and `ADMIN_SECRET` as Worker secrets. Keep them out of Git, logs and URLs.
4. Deploy the Worker, issue an initial owner issuer invite through the admin endpoint, and test an authorized download plus 401 without a token.
5. Replace the public pointer with the Worker HTTPS origin and then merge/deploy the client branch. Verify Pages and iPad Safari with a real invited session and a fresh recipient.

`node prepare-private-worker-edition.mjs PRIVATE_MASTER.json PRIVATE_OUTPUT_DIR` creates the exact R2 object and metadata manifest **outside Git**. It neither configures the service nor uploads the real-person JSON. The existing local JSON import remains an emergency/developer fallback at `catalog.html`, absent from normal Player Setup.

## Limits and unresolved evidence

- A forwarded result/invite URL grants whoever holds it access until expiry. A copied master remains on a recipient device after token expiry; expiry prevents **new server fetches**, not deletion or revocation of downloaded data. Rotate `CAPABILITY_SECRET` to invalidate all outstanding tokens. Per-token revocation, rate limits, audit logging and owner token recovery are not implemented.
- The private master contains official image URLs, not image binaries. Browsers request portraits directly from the official hosts. A successful request would establish only technical reachability, not permission to embed, crop, cache or redistribute. iPad/iPhone Safari hotlink behavior and rights remain UNVERIFIED.
- The URL fragment is omitted from HTTP requests and Referer headers, but it remains in copied links, Message/AirDrop history, recipient browser history and screenshots until the invite is consumed. The app strips the invite fragment on Player Setup; the Shared Result fragment stays so the result can be reopened/copied. Do not put tokens in query strings or Worker logs.
- R2/Worker account setup, billing settings and service deployment have not been authorized or performed. The local Worker harness verifies contract behavior and real 263-person bytes, but no live endpoint, clean Safari device or AirDrop exchange has passed. The public `main` remains unchanged.
