# Cloudflare activation checkpoint (2026-09-28)

**State:** deployment blocked by missing authenticated Cloudflare account access. This file contains no credential, candidate mapping, image binary, or invite. Public `main` and GitHub Pages remain unchanged.

## Prepared inputs

- Worker source: `candidate-distribution-worker.mjs` on `checkpoint/capability-distribution`.
- Configuration template: `wrangler.example.jsonc`; `APP_ORIGIN` is the exact GitHub Pages origin `https://nyannko619xxx-oss.github.io` (origin excludes repository path).
- Private R2 object, outside Git: `masters/starto-junior-2026-09-28.json` (500,336 bytes). The object SHA-256 in the metadata-only `MANIFEST_JSON` is `78d91f78d41db6699541146ac1dc7f89b8a9006f186d2033e678565ed3c1d45d`.
- Private source and staged object were available in the Work workspace at this checkpoint. Upload only through an authenticated Cloudflare channel; never commit them to the public repository.

## Activation sequence after account access

1. Confirm the account's R2/Workers billing state and stop before any paid-plan or billable activation requiring the owner's decision. Create a dedicated R2 bucket. Keep both `r2.dev` public development URL and custom-domain public access disabled.
2. Upload the private object to the exact key above. Create a Worker with the R2 binding `MASTER_BUCKET`. Use the template after replacing the bucket name. Set `MANIFEST_JSON` to metadata only and retain the exact `APP_ORIGIN`.
3. Generate independent cryptographically random `CAPABILITY_SECRET` and `ADMIN_SECRET` values in the authenticated environment. Set them as Worker secrets, never in Git, Wrangler plain `vars`, shell history, public JS, URLs, or output logs. Verify both are configured without printing values.
4. Deploy to the assigned HTTPS Worker URL. Verify the public `/v1/manifest` has only version/hash/URL metadata. The private object URL must not be public.
5. Verify live requests: no Bearer → 401; authorized matching version → 200 with expected hash and 105/158/263 partitions; expired/tampered token → 401; wrong version/scope → denial; foreign Origin → 403. Issue the first owner issuer invite through `POST /v1/admin/invite` over HTTPS with the admin secret without echoing the response into public logs. The invite is private.
6. In a clean browser context, use the owner invite; verify manifest fetch, authorized master download, IndexedDB reuse, all three real sets, no synthetic fallback. On a second clean context, open a result share, then **自分も選んでみる**; verify read capability consumption and new session with no sender history/answers/uncertainty. Verify expired link handling.
7. Only after all endpoint and share-to-play checks pass, set `candidate-distribution.json` to the actual Worker HTTPS origin and deploy the client branch to public `main`. Then request iPad/iPhone physical QA. Do not change the production Selection Engine or Phase 2 state.

## Access boundary and remaining decisions

There is no Cloudflare connector, authenticated Wrangler session, or Cloudflare API credential in this Work environment. No Worker, R2 bucket, secret, upload, live endpoint, or invite was created. Browser control would require a separately authorized fallback and, if a sign-in/account/billing step is encountered, owner action. This is the handoff gate.

The direct-entry URL on a clean device still needs a short-lived owner invitation: unrestricted automatic private-master access from a plain URL would defeat access control. A share recipient's read capability downloads the complete 263-person mapping; forwarding the URL delegates access until expiry, and a downloaded copy persists locally. Technical image loading and rights permission remain separate and UNVERIFIED.
