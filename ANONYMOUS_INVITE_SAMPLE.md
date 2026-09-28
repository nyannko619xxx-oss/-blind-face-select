> Cloud Test status, 2026-09-28: The dedicated fixture-only Worker and D1 are deployed at [the Test URL](https://blind-face-select-invite-test-v01.nyannko619xxx.workers.dev/index.html). [Live verification](https://github.com/nyannko619xxx-oss/-blind-face-select/actions/runs/36402368785) passed, including 20-way single-use Claim, expiry, tamper, auth, Origin, and recipient re-invite. The predeployment instructions below are retained as the original Sample specification; [VERIFICATION.md](VERIFICATION.md) records the activation. Human Owner access is still pending a private credential handoff. No owner/invite token is published. Safari and OS Share Sheet QA remain unverified.\n\n# Anonymous Single-Use Invite Chain — Sample v0.1

Date: 2026-09-28. **Experimental, isolated from Production.** No real candidate master, real photo, R2, production selection state, or public Pages deployment is used. This sample verifies the invitation and anonymous access mechanics against five fictional FACE labels. It does not make the full real-person Blind Face Select playable yet.

## Run locally

Requires Node 24 with built-in `node:sqlite`.

```sh
node verify-invite-sample.mjs
node verify-invite-sample-http.mjs
node invite-sample-local.mjs
```

Open `http://127.0.0.1:8788/index.html`, then **ローカルOwnerとして開始**. Select up to two fixture cards. Press **本日の招待URLを発行** and use the OS share sheet or copy the link. Open the link in a separate browser profile/private context to model a recipient, then press **招待を受け取る**. Opening or previewing the page alone does not consume the token. The first claimant gets a fresh anonymous session and may issue one invite on the same JST day; a second claimant sees a used/expired message. The local Owner route is restricted to the loopback-only development server and does **not** exist in the deployable Worker.

The Worker source is `invite-sample-worker.mjs`; the isolated schema is `invite-sample-schema.sql`; static UI is only `invite-sample-assets/`. `wrangler.invite-sample.example.jsonc` targets a **dedicated test D1 database** and a separate test Worker. It contains no R2 binding or real-person data. Before any remote deploy, confirm the actual account plan and billing, create the dedicated database only if permitted, replace the placeholders, apply schema, register `ADMIN_SECRET` as a secret, and bootstrap the owner via a private administrator request. Never put a session token, invite token, or administrator secret in Git or logs. Cloudflare deployment is not yet performed.

## Mechanism

| Step | Mechanism |
|---|---|
| Owner bootstrap | Administrator-only API returns a random anonymous browser token; the normal UI never sees the admin secret. Local development has a separate loopback-only shortcut. |
| Issue | A valid session inserts a random invite-token hash with `UNIQUE(issuer_session_id, issued_jst_day)`. The date is computed at issue time with UTC+9. No Cron or unused quota carryover. |
| Claim | One `INSERT ... SELECT ... RETURNING` creates the recipient session. `UNIQUE(claimed_invite_hash)` makes simultaneous claim/retry create at most one session. |
| Access | A session token is required for the sample fixture and issuing invites. Tokens are 256-bit random; the database stores their SHA-256 hashes. |
| Share | Web Share API delegates destination choice to the OS; Clipboard is the fallback. The server does not receive or record the destination/method. |

Session lifetime is 30 days; invite lifetime is 24 hours from issue. The daily issue quota resets at JST midnight even when yesterday's invite is still valid. An expired session cannot issue or fetch the protected fixture. All responses disable caching. Link fragments are stripped from the browser address bar on opening, then the session token is held in localStorage. The invite bearer remains visible in the message/recipient link until first Claim; whoever receives it first can claim it. The sample has no recovery, revocation, abuse analytics, or device transfer.

## Verification / limits

- `verify-invite-sample.mjs`: unauthorized fixture/bootstrap, 5 fixture cards behind session, one issue/day, JST 23:59→00:00 rollover, 30 simultaneous claims with **1 success / 29 used**, invited recipient re-invite, session expiry, foreign Origin refusal.
- `verify-invite-sample-http.mjs`: local static UI/JS served, loopback Owner, API issue and Claim over HTTP, recipient fixture access, URL reuse refused.
- Browser visual/Share Sheet behavior and iPad Safari: **UNVERIFIED**. Local API/SQLite results do not prove Cloudflare D1 behavior; real D1 concurrency and free-plan/billing must be checked before remote activation. No human response was simulated.
- The actual Selection Engine and 263-person Master are not attached. Connecting this gate to private Candidate Master download requires separate approval and live end-to-end testing. Image technical reachability and rights remain UNVERIFIED.

The dedicated D1 UNIQUE constraints are the minimum concurrency requirement. D1's documented free tier has hard limits; an account-specific plan/billing check is still required before creation. Phase 2 remains NOT PASS; Retrospective Trigger remains UNADOPTED.
