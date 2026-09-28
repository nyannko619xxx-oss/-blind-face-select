# Anonymous Invite Sample v0.2 fixture E2E — 2026-09-28

**Dedicated Cloudflare Test DEPLOYED / automated E2E VERIFIED; iPad and iPhone Safari v0.2 QA PENDING.** v0.1 anonymous Invite/Claim/Session Worker routes, JST one-per-day quota, single-use D1 constraint, and human Owner record remain intact. User-reported v0.1 real-device core flow is PASS. Existing Owner marker count was observed as **1**; the earlier assumption of 0 was stale and removed from the v0.2 test without mutating the human record.

The participant UI now presents a 55-person fictional face-placeholder selection and a saved TOP9 result to an authenticated anonymous session. It reuses the unchanged production selection-engine **source as an isolated static Test copy**, with the same 5-face up-to-two / 4-face up-to-two / late 3-face one / boundary / direct ranking behavior. The production engine and public Pages were not edited. Fixture progress is stored under a session-token-derived localStorage key, isolating separate anonymous browsers and allowing reload/resume. The Worker fixture endpoint remains protected; the UI must validate its session and fixture response before mounting the game. No real candidate Master, official image, R2 or private distribution is connected. The visible copy uses participant language instead of fixture/Claim/anonymous Session/JST terminology in the ordinary selection and invite flow. The one-time Owner setup remains a separate setup control.

[Successful Test workflow](https://github.com/nyannko619xxx-oss/-blind-face-select/actions/runs/36428892025): 120 simulated 55-candidate paths produced nine unique results and covered 5/4/3 screens; source parity with `selection-engine.js` verified. Live Test Worker asset propagation, protected fixture/Invite endpoints, wrong Owner code, foreign Origin, and invite issue/Claim/reuse/recipient re-invite passed. A fresh headless browser context used a temporary D1 session, completed fixture TOP9 in **42 comparison screens**, reloaded midway, and issued an Invite. A second clean browser opened that URL, Claimed once, completed its own TOP9 in **42 screens** and retained an available daily invite. A third clean browser could not reuse the link. Both sender and recipient session fixtures and their test Invite were cleaned from D1; the human Owner row was untouched. Neither temporary bearer nor invite URL was printed to logs/artifacts. Headless Chromium is automated verification, **not** iPad/iPhone Safari QA.

**Human QA:** On the existing Owner iPad Safari open [Test URL](https://blind-face-select-invite-test-v01.nyannko619xxx.workers.dev/?v=sample-v02-1), confirm 「顔だけで選んでみる」, start, observe 5/4/3 displays, mark 「この比較は迷った」 on one screen, close/reopen once and resume, reach TOP9. Existing daily invite quota may already be used; use the next JST day or an invited recipient's available slot rather than reset human D1. On iPhone or separate Safari, open a fresh issued invite, tap 「招待を受け取る」, finish TOP9, confirm 「友だちを招待する」 and one-per-day quota. Check portrait, tap targets and result readability. Do not send invite or session token to Chat. Native OS Share Sheet and actual AirDrop are human-only checks.

State: Anonymous Invite v0.1 real-device core flow PASS (user-reported); v0.2 Test automation PASS / real-device UX UNVERIFIED. Phase 2 NOT PASS; Retrospective Trigger UNADOPTED; Production engine/public Pages unchanged; 263-person Master and official images disconnected; rights UNVERIFIED; R2 not used. Stop at Real Candidate Gate after human v0.2 E2E.

---

# Owner Bootstrap tab-closure recovery — 2026-09-28

**Test-only fix DEPLOYED / automated PASS; human Safari Claim PENDING.** Human clarified the original Safari tab was closed before Owner Claim. That version kept its random code solely in tab-scoped `sessionStorage`; a new tab generates a different code while Cloudflare retains the old `OWNER_BOOTSTRAP_CODE`. This is the established cause of the mismatch. Cloudflare Secret values cannot be retrieved through the API, and no server-side copy or Git/Chat copy exists. The closed tab's old code is unrecoverable from the original app storage. A previously copied code may still exist in the user's private clipboard or password manager; that possibility is **UNVERIFIED**, not an automatic recovery guarantee.

New test UI stores the unclaimed code in same-origin `localStorage`, restores it after reload or tab closure in the same Safari data store, migrates code from an older *still-open* sessionStorage tab, and clears it immediately after a successful Claim. It never auto-generates a replacement on reopening. Explicit 「初回Owner設定」 generates a code only when no saved code exists; 「登録済みの旧コードを貼る」 lets the person privately paste a previously copied code into the browser, save it locally, and Claim without touching Cloudflare. The code is not put into URLs, Git, logs, artifacts or Chat. Same-origin browser storage remains sensitive until Claim, so the sample must be used only on the intended device; private browsing/storage clearing still loses it. No Worker code, route, D1 schema or Secret was changed. The D1 unique Owner marker remains one-time.

[Automated run](https://github.com/nyannko619xxx-oss/-blind-face-select/actions/runs/36416225102) PASS: browser-state harness verifies generation, reload/new-tab restoration, old-code paste, successful Claim and local code removal, session persistence and Invite control. Existing sample regression and HTTP smoke pass. The dedicated live Worker was redeployed; new HTML/JS propagation matched; wrong/malformed Owner codes and foreign Origin rejected; unauthorized fixture/Invite rejected; live D1 Invite issue → recipient Claim → reuse rejection → recipient fixture → re-invite passed with temporary rows cleaned. The Owner marker remained **0**. This does not prove the human old code is available or iPad Safari Claim has succeeded.

**Human retry decision:** Open [dedicated Test URL](https://blind-face-select-invite-test-v01.nyannko619xxx.workers.dev/?v=owner-persist-20260928-3) in the original Safari browser. If the old code is privately retained in clipboard, tap 「登録済みの旧コードを貼る」, paste into the local field, then 「Ownerとして開始」. Report only success or the inline error text, never the code. If the old code was lost, no safe technical operation can derive it from the registered Secret. At that point, a **single human Cloudflare Secret value replacement** with the newly generated and now persistent code is unavoidable; Work must not do a silent bypass or request the value in Chat. After replacement and Deploy, close/reopen Safari to verify the same new code is restored, then Claim. No human Cloudflare change was requested or performed in this checkpoint.

State: dedicated Test only; public main/Pages and Production Selection Engine unchanged; R2 and real candidate/photo data untouched. Phase 2 NOT PASS; Retrospective Trigger UNADOPTED; image rights UNVERIFIED.

---

# iPad Owner Bootstrap repair — 2026-09-28

**Test-only UI repair DEPLOYED / automated regression PASS; human Owner Claim PENDING.** Human report: `OWNER_BOOTSTRAP_CODE` was added as a Production Secret on the dedicated Test Worker, but Safari's 「Ownerとして開始」 appeared unresponsive. The visible 「ローカルOwnerとして開始」 returned `{"error":"not_found"}`.

[Read-only live diagnosis](https://github.com/nyannko619xxx-oss/-blind-face-select/actions/runs/36407035472): exactly the dedicated Test Worker and D1; Secret **name** present (value never read); `ADMIN_SECRET` absent; fixed Owner marker count **0**, so the human Owner Claim did not succeed; deployed Worker version `8e16603e-5da7-4d7e-aeb9-ac5dc5115428` at diagnosis; live `app.js` matched the checkpoint branch; POST `/v1/sample/owner/claim` with deliberately wrong code returned 403 `invalid_owner_code`. Thus route, POST method, same-origin handling, Worker Secret binding and JavaScript delivery were functional. The exact reason the user's own code was not accepted or sent is **UNVERIFIED**; the original UI provided no visible feedback at the button.

Confirmed UI defects: (1) Claim error text was set only in the top-of-page status, outside the visible button area on a scrolled iPad; button re-enabled with no local feedback, appearing inert. (2) The author CSS `a.action { display:inline-block }` overrode the `hidden` attribute, exposing the loopback-only `/dev/owner` link on the public Test UI; the deployable Worker never implements that route, so `not_found` was expected. A separate risk was found: a successful one-time Claim followed by a transient fixture/session fetch error caused `showSession` to erase the newly issued token. This did **not** occur in the reported attempt because the Owner marker count remained zero, but was corrected before further human testing.

Fix: `[hidden]{display:none!important}`; Owner feedback next to the button with pending/error text; network failure after successful Claim retains the anonymous Session token and offers 「Sessionを再読み込み」; token is cleared only on explicit 401; cache-busted `app.js?v=owner-fix-20260928-1`. No Worker route, selection rule or D1 schema change. [Repair workflow](https://github.com/nyannko619xxx-oss/-blind-face-select/blob/checkpoint/anonymous-invite-sample-v0.1/.github/workflows/repair-owner-test.yml) resolves exact Test resources, checks the Owner Secret name exists, and redeploys only the dedicated fixture Worker **without rotating or deleting the human Secret**.

[Successful live repair run](https://github.com/nyannko619xxx-oss/-blind-face-select/actions/runs/36407568796), Worker version `b53bf4ff-fd91-4972-9eea-65aecd00d7e9`: local Sample tests PASS; new HTML/JS propagated and matched; Owner POST route returned 400 for malformed code and 403 for a valid-format wrong code; GET without session rejected; foreign Origin rejected; `/dev/owner` remains absent but is hidden in the public UI. A runner-only D1 session verified Invite issue → Claim → reused-link rejection → recipient fixture → recipient re-invite, then cleaned its own test rows. Owner marker remained 0. A clean cloud browser observed the local-only link hidden and the inline wrong-code message next to Owner Claim. This is not iPad Safari verification. Initial repair run encountered stale assets immediately after deploy; retry with propagation wait passed. Existing Secret value was never requested or output.

**Human retry:** Use the **same original Safari tab** that generated the registered code. Reload that tab (if needed navigate within the same tab to `https://blind-face-select-invite-test-v01.nyannko619xxx.workers.dev/?v=owner-fix-20260928-1`), then tap 「Ownerとして開始」. Do not generate a new code or register the Secret again. Success: five fictional FACE cards plus 「招待する」. If an inline message appears, report only its text, never the code. If a different tab lost the original sessionStorage code, pause before any new registration. Human Safari Claim, Share Sheet and recipient QA remain PENDING.

State: dedicated Test only; public main/Pages, Production Selection Engine, real candidate Master/images, R2 unchanged. Phase 2 NOT PASS; Retrospective Trigger UNADOPTED; image rights UNVERIFIED.

---

# Human Owner bootstrap checkpoint — 2026-09-28

**IMPLEMENTED and live API VERIFIED; iPad Safari human Claim PENDING.** The isolated Sample UI now generates a 256-bit random Owner code within the participant's browser. It keeps the code in that tab's sessionStorage, shows a copy control for direct entry into the dedicated Test Worker's Cloudflare Secret `OWNER_BOOTSTRAP_CODE`, and sends it only in an HTTPS POST body to `/v1/sample/owner/claim`. No Owner code is placed in a URL, Chat, Git source, GitHub Action log, or artifact. On success the anonymous 30-day session token is stored locally and the code is removed from sessionStorage; existing invite and fixture paths then apply. The Secret remains in Cloudflare until removed by the human, but the server's fixed unique D1 marker permits **only one Owner Claim even if the Secret remains**. Wrong code 403, unconfigured Secret 503, already used 410. The preexisting CI admin bootstrap endpoint is inert after its Worker Secret is removed.

Local tests: [verify-invite-sample.mjs](verify-invite-sample.mjs) PASS, including wrong code, 20 simultaneous Owner claims (1 success / 19 used), post-Claim fixture, missing secret, and the existing invite/JST tests. HTTP smoke PASS. [Cloudflare live run](https://github.com/nyannko619xxx-oss/-blind-face-select/actions/runs/36404185554) PASS: after the existing invite/API tests, temporary Worker Secrets were registered within CI, wrong Owner code rejected, 20 simultaneous Owner Claims yielded 1 success / 19 used, protected fixture accessible to the winner, repeat Claim refused. The temporary Owner row was deleted after testing to leave the one-time human slot unused. Both CI-only `OWNER_BOOTSTRAP_CODE` and `ADMIN_SECRET` Worker Secrets were deleted at the end of the run, and plaintext temporary files were erased. An earlier run got 1 success / 18 used / 1 other error under 20-way contention; the Worker now checks the committed unique marker after a transient D1 insert error and returns 410 only when another Claim actually won. The successful rerun is the deployed version. No human code has been set and no human Owner Session has been created.

**Human action gate:** On the user's iPad Safari, open [the Test URL](https://blind-face-select-invite-test-v01.nyannko619xxx.workers.dev/), tap 「初回Owner設定」 then 「コードをコピー」. In a separate tab, open Cloudflare Dashboard → Workers & Pages → `blind-face-select-invite-test-v01` → Settings → Variables and Secrets → Add. Name `OWNER_BOOTSTRAP_CODE`, type **Secret**, paste the browser-generated code and Deploy. Return to the same Safari tab and tap 「Ownerとして開始」. Success is five fictional FACE cards and 「招待する」 with a remaining daily quota. Do not put the code into Chat, GitHub, a URL, or a screenshot. If the tab reloads before Claim, sessionStorage should retain the same code; confirm it matches the Secret, and do not generate a different one. Dashboard exact visual labels and iPad Safari behavior are still UNVERIFIED until the user performs this step. Secret registration is a human-only credential action. If the Owner Secret has been set and Claim fails, investigate without sharing the value.

The public Test URL was opened in a clean cloud browser: the fixture UI and 「初回Owner設定」 appeared with no session. This is a desktop browser smoke, **not** iPad Safari QA. Next human steps after Owner Claim: issue an invite; inspect native Share Sheet / Copy Link on iPad; open the link in another browser/device; Claim once; verify fixture and recipient re-invite. Recipient identity and share destination are not collected. The production engine, public Pages, R2, and real candidate data remain untouched. Phase 2 NOT PASS; Retrospective Trigger UNADOPTED; image rights UNVERIFIED.

---

# Anonymous Invite Cloud Test activation — 2026-09-28

**Cloud Test backend DEPLOYED / live API VERIFIED; human browser use UNVERIFIED.** The repository Secret `CLOUDFLARE_API_TOKEN` was used only in branch-scoped GitHub Actions. A discovery run resolved exactly one Cloudflare account and exactly one named dedicated D1 without logging their IDs or the token. [Discovery run](https://github.com/nyannko619xxx-oss/-blind-face-select/actions/runs/36401891557): PASS. No Account ID / Database ID was requested from the user.

The isolated [deploy workflow](https://github.com/nyannko619xxx-oss/-blind-face-select/blob/checkpoint/anonymous-invite-sample-v0.1/.github/workflows/deploy-invite-test.yml) applies `invite-sample-schema.sql` only to `blind-face-select-invite-test-v01`, deploys Worker `blind-face-select-invite-test-v01` and two fictional-label UI assets, binds only `INVITE_DB`, and registers a randomly generated `ADMIN_SECRET` as a Cloudflare Worker Secret. The ephemeral plaintext is erased from the CI runner after verification and is never put in Git, logs, or artifact. No R2 binding, real candidate Master, official image, Pages deployment, or BOATRACE resource was used. The generated account ID, D1 ID, and Wrangler config remain runner-local. The endpoint is [https://blind-face-select-invite-test-v01.nyannko619xxx.workers.dev/index.html](https://blind-face-select-invite-test-v01.nyannko619xxx.workers.dev/index.html).

[Live run](https://github.com/nyannko619xxx-oss/-blind-face-select/actions/runs/36402368785): PASS. In real Cloudflare D1: static UI served; unauthorized fixture/bootstrap returned 401; foreign Origin 403; authorized Owner bootstrap 201; fixture returned five fictional FACE labels; issue quota returned 409 on a second same-day issue; 20 simultaneous Claims yielded **1 success / 19 used**; repeat used Claim 410; recipient session accessed fixture and issued its own invite; modified and database-expired invites returned 410; database-expired session returned 401. The first deployment run had an immediately-following non-JSON response after deploy and stopped before API assertions; the subsequent run waited five seconds for propagation and passed. This is endpoint verification, not a Safari visual or OS Share Sheet test.

**Owner access handoff remains blocked.** The live verification created only disposable owner/recipient sessions within the runner. Their tokens were not exported. The generated administrator secret is stored in the Worker and is intentionally unrecoverable from GitHub Actions. Therefore the public URL is reachable, but a human has no invite/owner credential yet. A secure owner credential or one-time owner invite must be delivered by a user-controlled private channel before human test. Do not publish a bearer invite in a public repository, Action log, artifact, or chat. Current implementation has no secure owner delivery route. Do not represent the UI as ready for human invite testing until that route is established.

State: Phase 2 NOT PASS; Retrospective Trigger UNADOPTED; Production Selection Engine and public Pages UNCHANGED. Cloud Test is fixture-only. Image rights UNVERIFIED. Test account Plan/Billing was not independently read by Work; user previously reported D1 creation without payment/upgrade. No payment or R2 activation was performed.

---

# Cloud Test deployment-path audit — 2026-09-28

**STOP: no authenticated Cloudflare deployment path.** User reports a dedicated empty D1 named `blind-face-select-invite-test-v01` was created without subscription, upgrade or payment request. Work cannot independently read its account/database ID or billing state. Environment audit found no Cloudflare connector, Wrangler executable/session, Cloudflare token/account-ID environment names, local Wrangler authentication, or pre-existing repository deploy workflow. GitHub connector can update this repository but grants no Cloudflare deployment permission. Earlier Cloud Browser access to the Dashboard remained at a Cloudflare verification loop; that blocked path was not retried or bypassed. No D1 schema migration, Worker, binding, secret, public Test URL or real endpoint test was performed.

The isolated Sample source and local tests remain intact. Minimum next credential boundary: an authenticated deployment channel scoped to the **dedicated test Worker and test D1**, with the Cloudflare account ID and D1 database ID supplied through a secure deployment environment (never chat or Git source). Before execution, confirm account Plan/Billing and that no payment, upgrade or R2 activation is required. Cloudflare documents that noninteractive Wrangler CI needs an API token and account ID; the token must permit Worker deployment and D1 writes. A broad credential that could mutate existing boatrace resources should not be silently reused. Public main/Pages and both Production engines remain unchanged. Phase 2 NOT PASS; Retrospective Trigger UNADOPTED.

# Cloud Browser activation attempt — 2026-09-28

**BLOCKED before login and billing inspection.** With explicit authorization to use Cloud Browser, opened `https://dash.cloudflare.com/`. Cloudflare displayed its “セキュリティ検証の実行” page (“しばらくお待ちください…”). After one allowed reload, the same verification page remained and the dashboard did not load. This was reported as a challenge loop. No account identity, Workers/R2 plan, billing state, or payment requirements could be observed. No CAPTCHA was solved and no credential was entered.

Cloudflare R2 bucket/Worker/binding/secrets/upload/issuer invite/live endpoint: NOT CREATED / NOT VERIFIED. No public deployment. Existing private staging and checkpoint code are preserved. Public main remains `00b39fd5f7794fba44333cff1d183a6ecfa90931`; Phase 2 NOT PASS; Retrospective Trigger UNADOPTED. Next continuation requires a Cloudflare access path that can reach the authenticated dashboard; billing must be inspected before account mutations. Browser-specific limitation: https://help.openai.com/articles/20001280-using-cloud-browser-in-chatgpt#when-a-website-blocks-the-task

# Cloudflare real-environment activation gate — 2026-09-28

**Status: BLOCKED before account operations; no live endpoint verification.** The access-controlled Worker/client checkpoint remains on a separate branch. The private 263-person staged master and metadata-only manifest are present outside Git; `wrangler.example.jsonc` fixes the Pages origin and metadata hash while leaving the private bucket name unresolved. JSONC/template metadata parsing passed locally. No Cloudflare connector, authenticated Wrangler session, or API credential was available in the Work environment, so no bucket, Worker, binding, secret, invite, live request, or public deployment was performed. The exact remaining activation and live test sequence is in `CLOUDFLARE_ACTIVATION.md`.

Public `main`/Pages: unchanged. Production Selection Engine: unchanged. Phase 2: NOT PASS. Retrospective Trigger: UNADOPTED. Rights and Safari image loading: UNVERIFIED. Existing local harness results are preserved; they do not count as real-endpoint or iPad Safari verification.

# Verification ledger — 2026-09-27

The repository and GitHub Pages are the implementation baseline. `app.html` is the integrated flow. The original `index.html` Safari v0.3 tutorial remains available.

| Area | Implemented | Verified | Remaining |
|---|---|---|---|
| Selection engine | Five up to two; four up to two; late three or four choose one; recovery; up to two TOP9 boundary matches; direct player ranking; capacity raised to 300 | 5,400 deterministic simulated sessions across 9–263 candidates, 500 preference-order runs; 140-candidate walkthrough and 135-photo run in cloud Chrome | **Phase 2 is not PASS:** stable-preference simulations exposed TOP9 omissions; human preference quality and iPad Safari operation |
| Candidate catalog | 105 official STARTO personal cards plus 158 official Junior cards inventoried; three separate set definitions and a 263-person private master | No overlap in normalized names, IDs, profile URLs or image URLs; 41 official grouped Juniors mapped; all 263 images loaded in ALL preliminary on public Pages in cloud Chrome | Individual visual crop audit, rights and distribution decision |
| Blind selection and reveal | Faces without name/group text or identity-bearing candidate ID during play; TOP9 revealed from ninth to first with official source links | Three public Pages cloud Chrome runs: STARTO 105 in 53, Junior 158 in 64, All 263 in 92 screens; each had nine reveals and official source links | iPad Safari visual/interaction check |
| Analysis | Full choice history, uncertainty flag, selection/nonselection/reappearance counts, direct/borderline path | Populated in completed 263-photo run | Interpretation with genuine player choices |
| Players and persistence | Separate profiles, age as metadata, progress autosave, latest and archived sessions; frozen selection snapshot with set/version/time/visual mode | Three mode results under one player; reloaded after temporarily changing current Master name/group and the earlier ALL result retained its original name/group; archive and resume verified on Pages | Safari storage retention and multi-session usability |
| Share | Result data in URL fragment; 1/6/24/72/168/custom hours; expired message | Opened valid link in another tab; expired link showed exact required Japanese message | Safari recipient check; client clock is not access control |

## Automated engine checks

`selection-engine.js` has no beauty model or identity inference. It uses player selections to determine survivors and pairwise player decisions for the order. Support counts and hesitation only choose additional opponents. Reproduce the checks with `node verify-engine.mjs`. The 5,400-session run covered candidate counts 9, 20, 40, 105, 135, 140, 150, 158, and 263, two late sizes, three choice patterns, and 100 seeds each. Each run terminated with nine unique finalists; maximum observed candidate appearance was 10 in this suite. A separate set of 500 consistent-preference simulations produced the expected pairwise order **among finalists**, but recovered on average only 6.32 of the true nine preferred candidates (minimum four, exact nine in zero runs), at 72.588 screens on average for 140. The maximum across all sizes and patterns was 126 screens. For 263 with the four-person late variant, all-one/all-two scripts used 92/118 screens. This is a concrete failure of selection recall, especially when several strong faces collide in a late question. Phase 2 remains implemented and structurally verified, not quality-PASS.

An unpublished second-chance experiment took rejected late-round candidates through extra four-face groups and challenged the current ninth place. On the same 500 stable-preference seeds, a one-survivor recheck recovered 8.174 of nine on average at 90.548 screens; two survivors recovered 8.59 at 97.544 screens. A separate 140-person all-two-choice pattern took 105 screens even with the one-survivor version. These variants materially improved recall but violated the stated ordinary 50–70-screen goal and were **not deployed**. A human product tradeoff is needed before choosing this longer path, a player-flagged uncertainty path, or a redesigned interaction. No algorithm can identify an unchosen third face as a close contender when the player supplied only a two-person choice in that group.

## Image architecture and scope decision

The public repository contains no real-person image files and no real-person name-to-image manifest. The master with all three sets can be imported once per device into IndexedDB; images then load directly from official HTTPS origins through `<img>`. The 263-photo cloud Chrome run established current technical reachability, not reuse permission, future URL stability, consistent visual quality, or iPad Safari reachability. Explicit image caching in Cache API/IndexedDB is not implemented; browser HTTP caching may occur. A broken image blocks the next choice so that the candidate cannot silently disappear.

Candidate scope is now fixed by three official-list sets: STARTO 105, Junior 158, All 263. Future updates create new set versions without rewriting historical snapshots. Two product decisions and one consolidated Safari check remain:

1. Selection quality versus number of questions: keep the short current path with measured omissions, allow a longer second-chance path, or redesign the input to express close unchosen faces. The second option was exploratory and requires implementation and verification if selected.
2. Distribution and rights: publish the name/image URL mapping in the public repository (no image files, but public linkage and external embedding); privately transfer a one-time JSON to each device (extra setup); or use a separately configured access-controlled host after assessing image reuse terms (new service and setup). The app currently supports the private one-time setup path as a technical fallback, not as the desired final workflow.

The iPad Safari check on the actual Pages URL should cover landscape and portrait five/four/three faces (four-face late variant for ALL), photo loading, start/resume, ninth-to-first reveal, a second player, archived result, and valid/expired link on another device. This is a consolidated human check after Work-side tests.

No rights inference follows from an official URL, a successful hotlink, or personal intent. See [ASSET_ARCHITECTURE.md](ASSET_ARCHITECTURE.md).

## Selection quality checkpoint — 2026-09-27

Phase 2 remains **NOT PASS**. The existing optional 「この比較は迷った」 control already records a per-question uncertainty flag. The new engine accepts opt-in `recheckMode: 'declared'` and `'secondChance'`, but the deployed app still uses default `baseline`. No image or Safari work was part of this checkpoint.

Run `node verify-quality.mjs`: 500 paired seeds per candidate count and policy; stable deterministic preference, choose the top one or two visible, declare hesitation when the score gap across the choice cut is at most 10% of candidate count. The truth is the global top nine by the same synthetic score. Boundary recovery measures how many of true ranks 8 and 9 appear in the final nine (maximum 2). P95 is nearest-rank. These are simulated signals, **not empirical player behavior**. A separate 50-seed test confirms that with no declaration, declared mode has exactly the same screens and ranking as baseline. `node verify-engine.mjs` still passes 5,400 structural runs and retains the prior no-signal mean 6.32/9 for 140.

| Pool | Policy | Mean screens | P95 screens | Mean true TOP9 / 9 | Exact / 500 | True ranks 8–9 / 2 | Max appearances |
|---|---|---:|---:|---:|---:|---:|---:|
| 140 | Baseline | 72.738 | 74 | 6.306 | 0 | 0.934 | 12 |
| 140 | Fixed second chance | 104.718 | 106 | 7.198 | 22 | 1.026 | 17 |
| 140 | Declared hesitation | 84.752 | 86 | 6.934 | 4 | 1.044 | 15 |
| 263 | Baseline | 116.096 | 118 | 5.716 | 0 | 0.796 | 13 |
| 263 | Fixed second chance | 148.060 | 150 | 6.800 | 6 | 0.992 | 17 |
| 263 | Declared hesitation | 128.036 | 130 | 6.320 | 2 | 0.876 | 16 |

The baseline rows include declaration flags for a paired comparison, though the baseline policy does not create an extra queue; the flag already affects its two existing boundary matches. Fixed second chance checks up to 32 preliminary rejects. Declared mode checks only rejected faces shown in a declared comparison, capped at 12, then uses the original two boundary matches. All additional ranking decisions remain player choices. The fixed mode tested here is a defined new queue policy, not the earlier unpublished two-survivor experiment (reported around 90–100 screens); those numbers should not be equated.

The result separates the tradeoff: declared hesitation saves about 20 screens versus this fixed second chance, but still misses roughly two of nine true favorites at 140, and more at 263. Some high-ranked faces lost in an unmarked preliminary group cannot enter the declared queue. The simulation's deterministic close-score flag also marked ranking comparisons, inflating the logged declaration count without adding recheck candidates. Further work should test sparse/imperfect human declarations, compare preliminary cut alternatives, and improve recall before enabling an opt-in policy in the app. No Phase 2 PASS claim follows from these data.

## Preliminary information-loss checkpoint — 2026-09-27

**Phase 2 remains NOT PASS.** This is a separate experiment module (`selection-engine-experiment.js`); the deployed `app.js` continues to import `selection-engine.js` and retains the existing selection path. Run `node verify-preliminary.mjs`; machine-readable paired results are in `preliminary-results.jsonl`.

Each row uses the same 500 seeded candidate shuffles and stable, fully ordered synthetic preferences. The simulated player takes the best two shown in five-person Preliminary (A/B/D), or best three (C/E); takes two in Main and one in Late/Rescue/Boundary, and always orders finalists by that same preference. C/E support zero through three selections in the experimental engine, but the quality run always chooses three; the zero-choice control completed one 40-candidate structural run. Hesitation is declared when the preference-score gap around the chosen/unselected cut is at most 10% of pool size. These scores and true ranks are used by the **simulation only**, never by the selection algorithm.

B retains omitted faces from Preliminary but chooses at most six groups for rescue, prioritizing groups whose selected faces survived Main; D/E additionally prioritize declared groups. It interleaves omitted faces from different groups into three-face questions, selecting one to join Late. It does not recheck every Preliminary reject. D/E also use the previous declared boundary queue. This is one explicit, falsifiable rescue rule, not proof that all rescue designs fail. Each group with a top-two choice has no recorded numeric selection gap; the rescue rule cannot know how close third place was without an additional player input.

| Pool | Policy | Mean screens | P95 | True TOP9 / 9 | Exact 9/9 / 500 | True ranks 8–12 / 5 | Max shown | Lost at Preliminary | Lost at Main | Rescued Preliminary TOP9 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 140 | A baseline | 72.738 | 74 | 6.306 | 0 | 1.880 | 12 | 0.046 | 0.196 | 0 |
| 140 | B rescue | 81.786 | 84 | 5.956 | 1 | 1.748 | 13 | 0.046 | 0.196 | 0.014 |
| 140 | C max3 | 87.120 | 89 | 5.854 | 1 | 1.672 | 13 | 0 | 0.066 | 0 |
| 140 | D rescue + declared | 93.918 | 96 | 6.810 | 8 | 2.002 | 15 | 0.046 | 0.196 | 0.014 |
| 140 | E max3 + rescue + declared | 105.090 | 107 | 6.580 | 4 | 1.942 | 15 | 0 | 0.066 | 0 |
| 263 | A baseline | 116.096 | 118 | 5.716 | 0 | 1.634 | 13 | 0.010 | 0.060 | 0 |
| 263 | B rescue | 123.920 | 126 | 5.170 | 0 | 1.442 | 13 | 0.010 | 0.060 | 0.002 |
| 263 | C max3 | 137.968 | 139 | 5.500 | 0 | 1.508 | 13 | 0 | 0.022 | 0 |
| 263 | D rescue + declared | 136.098 | 138 | 6.106 | 1 | 1.760 | 15 | 0.010 | 0.060 | 0.008 |
| 263 | E max3 + rescue + declared | 155.290 | 157 | 6.086 | 0 | 1.776 | 15 | 0 | 0.022 | 0 |

All loss/recovery values are mean people per run; “lost at Main” counts true TOP9 who survived Preliminary but did not survive Main. “Rescued” counts originally omitted true TOP9 who entered via the explicit Rescue phase **and finished in TOP9**. The rank 8–12 measure is how many of those five true candidates finished in the nine slots, not a five-position ordered-rank score. Max shown is the maximum over all runs, rather than a mean.

In this stable-preference model, limiting Preliminary to two loses only 0.046 true TOP9 people per 140-person run (0.010 at 263). Taking three removes that particular loss but shifts more faces into Main/Late and lowers end-to-end recovery. B's small rescue queue restores 0.014/0.002 true TOP9 per run yet can displace stronger finalists later, so overall recovery drops. D improves on A, but its declared boundary queue accounts for most of the gain: compared with the prior declared-only result (140: 6.934 at 84.752 screens; 263: 6.320 at 128.036), D is slower and less accurate. The largest loss is downstream, especially Late; simply increasing Preliminary throughput cannot solve it with the existing narrowing rule.

The 140-person ideal of 50–70 screens is exceeded even by A in this all-top-two preference simulation. Results depend on stable cardinal score spacing, always taking the maximum number of favorites, and a perfect hesitation oracle for near ties. Real players may choose fewer than the maximum, hesitate for other reasons, or have nontransitive preferences. Do not enable B/C/D/E in the public app on these results. The next quality investigation should focus on Late/near-boundary elimination, using paired seeds and player-only choices, before selecting an implementation.

## Screening / Finalist Pool checkpoint — 2026-09-27

**Phase 2 remains NOT PASS.** The earlier hypothesis that Preliminary's two-person limit is the principal loss source is set aside for this fixed-preference model. This study changes no deployed app or production selection engine. Run `node verify-finalist-pool.mjs` to reproduce 500 paired seeds per pool/policy; `finalist-results.jsonl` contains the full results, including stage classification for each true rank 1–9. `node verify-engine.mjs` still passes 5,400 existing structural sessions.

All four policies use the same seeded shuffle, Preliminary 5→2 and Main 4→2. Synthetic preference scores determine **only simulated player choices and evaluation**. Candidate scheduling and ranking consume the simulated choices, never the underlying scores. A is the actual current engine without declared hesitation; it includes its two existing boundary comparisons. Thus A's 72.588-screen result corresponds to the original no-signal baseline, while the earlier 72.738 included declared flags that affected boundary ordering.

- **A Baseline:** rotating Late groups of three (four for 263), one winner, then existing boundary and direct rank.
- **B Finalist Pool:** after Main, repeat 4→3 screening only until 18–24 remain (21 at 140, 24 at 263). Pairwise insert the first nine into an ordered list; each later challenger first meets the current ninth face and is inserted by binary comparison only if the player chooses the challenger. This focuses work at the TOP9 boundary; there is no full round robin.
- **C Protected Late:** retain the existing Late rotation, but let the player explicitly tag the runner-up when close to the winner. Tagged faces (mean 7.584 at 140; 13.466 at 263) join the nine survivors for the same player-driven pairwise TOP9 ranking. Every Late entrant was chosen in Preliminary and Main. The simulated optional close signal is score gap ≤10% of pool range; that score is unavailable to the engine.
- **D Finalist + Protected:** B's 4→3 screen, plus at most six omitted faces explicitly tagged by the simulated player as close to the third retained face. Their mean finalist pools are 25.786/30, above B's 18–24 target due to protection. The subsequent pairwise boundary/ranking is the same as B.

| Pool | Policy | Mean screens | P95 | True TOP9 / 9 | Exact 9/9 / 500 | True ranks 8–12 / 5 | Max appearances | Late loss | Added screen loss | Finalist TOP9 reached |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 140 | A | 72.588 | 74 | 6.320 | 0 | 1.880 | 13 | 2.612 | 0 | 6.320 |
| 140 | B | 102.324 | 113 | 8.696 | 366 | 2.112 | 20 | 0 | 0.062 | 8.696 |
| 140 | C | 90.538 | 99 | 8.484 | 284 | 2.220 | 18 | 0.274 | 0 | 8.484 |
| 140 | D | 107.334 | 118 | 8.758 | 388 | 2.092 | 25 | 0 | 0 | 8.758 |
| 263 | A | 115.914 | 117 | 5.712 | 0 | 1.610 | 13 | 3.568 | 0 | 5.712 |
| 263 | B | 168.182 | 179 | 8.846 | 432 | 2.062 | 25 | 0 | 0.084 | 8.846 |
| 263 | C | 146.870 | 156 | 8.298 | 223 | 2.360 | 22 | 0.632 | 0 | 8.298 |
| 263 | D | 174.220 | 185 | 8.858 | 436 | 2.060 | 31 | 0 | 0.072 | 8.858 |

Each loss/reach value is mean people per run. A Late loss is measured **before** the existing boundary recheck, which recovers some; this is why A Late loss plus earlier losses differs from final misses. B/D have no Late elimination, but the extra screening loses some. C Late loss counts faces not retained or tagged. The result pool contains 9 in A; 21/24 in B; mean 16.584/22.466 in C; mean 25.786/30 in D. Pairwise TOP9 ranking recovered 100% of true TOP9 *that reached its pool* in this deterministic transitive model. This ratio is a consequence of a stable simulated order and exact binary insertion, **not** a forecast for people with inconsistent or evolving preferences.

| Pool | True rank | A: stage loss / final recovery | B: stage loss / final recovery | C: stage loss / final recovery | D: stage loss / final recovery |
|---|---:|---|---|---|---|
| 140 | 5 | Preliminary 1, Main 5, Late 151 / 343 | Preliminary 1, Main 5, screen 2 / 492 | Preliminary 1, Main 5, Late 14 / 480 | Preliminary 1, Main 5 / 494 |
| 140 | 9 | Preliminary 12, Main 27, Late 249 / 212 | Preliminary 12, Main 27, screen 9 / 452 | Preliminary 12, Main 27, Late 34 / 427 | Preliminary 12, Main 27 / 461 |
| 263 | 5 | Preliminary 1, Late 210 / 289 | Preliminary 1 / 499 | Preliminary 1, Late 38 / 461 | Preliminary 1 / 499 |
| 263 | 9 | Preliminary 1, Main 5, Late 308 / 186 | Preliminary 1, Main 5, screen 19 / 475 | Preliminary 1, Main 5, Late 71 / 423 | Preliminary 1, Main 5, screen 18 / 476 |

Counts in the rank table are out of 500. Rank 1 survived all policies in all runs. The JSONL file provides the same breakdown for ranks 1–9. Even when A's existing boundary recheck restores a late loser, the Late-loss event is counted; its rank stage classification reports final recovery if restored.

The tradeoff is material: at 140, B gains 2.376 true TOP9 people over A for 29.736 more screens; C gains 2.164 for 17.950 more screens. At 263, B gains 3.134 for 52.268 more screens; C gains 2.586 for 30.956 more screens. D's marginal improvement over B costs 5.010/6.038 more screens and raises maximum reappearances. None meets the preferred 50–70 screens at 140 or avoids very long ALL sessions. Stable-score exact 9/9 is a diagnostic, not a product pass target; real preferences may drift, and selecting a runner-up or tagging a close fourth adds cognitive effort even without a new screen. The measured screen count omits time per screen and fatigue.

**Conclusion for this checkpoint:** Stage loss is dominated by Late's forced one-of-three/four cut, particularly around rank 5 and 9. The two-stage architecture and protection warrant further budget/fatigue work, but no policy is selected or deployed. Structural checks assert nine unique, preference-consistent finalists in the paired runs; human preference quality and Safari remain unverified.

### Follow-up control: Late winners with Pairwise ranking only

A fifth condition was added after the table above to separate protection from the act of replacing the final ranking procedure. **E Late rank control** keeps Preliminary/Main and the forced Late winners, does **not** protect any runner-up, omits A's two boundary rescue matches, and uses C's pairwise insertion solely to order the nine Late winners. It does not add any face back, so Pairwise ranking alone cannot improve TOP9 membership.

| Pool | E mean screens | E P95 | E true TOP9 | E Exact / 500 | E ranks 8–12 / 5 | E max appearances | E Late loss |
|---|---:|---:|---:|---:|---:|---:|---:|
| 140 | 70.732 | 72 | 6.146 | 0 | 1.834 | 11 | 2.612 |
| 263 | 114.148 | 116 | 5.362 | 0 | 1.542 | 11 | 3.568 |

Against this matched Late+Pairwise control, C's protected runner-ups increase recovery by **2.338 people at 140** for **19.806 additional screens**, and **2.936 at 263** for **32.722 additional screens**. A versus C changes both protection and the terminal ranking/boundary path, so its difference alone was not a causal estimate of protection. A's original two boundary rescue matches account for A's higher recovery than E (0.174/0.350 people), at about 1.856/1.766 extra screens.

The full 1–9 rank-by-stage counts for E are in `finalist-results.jsonl`. This control strengthens the stage-loss diagnosis but does not make C a deployment choice: the simulated near-tie signal is idealized, extra tagging adds interaction effort, and human preference stability is unverified. The app and production engine remain unchanged; Phase 2 stays **NOT PASS**.

## B/D finalist boundary follow-up — 2026-09-27

**Phase 2 remains NOT PASS; the public app and production selection engine were not changed.** The stored `finalist-results.jsonl` provided the existing target-24 aggregate reference, but lacked per-seed candidate/stage records. `verify-finalist-boundary.mjs` therefore reruns only B/D with the same 500 seeds and simulated player; target-24 rows reproduce the stored B/D mean screen and recovery figures exactly. `finalist-boundary-results.jsonl` stores all summaries and per-rank stage counts. No A/C/E rerun was needed.

A threshold is checked after each complete 4→3 screening pass. Consequently, requested thresholds may result in the same actual pool size (e.g. 140: target 21/24 both yield 21; 263: target 24/28/30 yield 24). Extra protection tags are the simulated player's optional close-call on an omitted fourth face, capped at six; they enlarge D's ranking pool. The simulation uses a deterministic stable preference order. Scores control the simulated player's choices/tags and evaluation, never algorithmic ranking. Ranking compares each challenger first against the current ninth face, then binary-inserts on a player win, without all-pairs comparisons.

### Where B/D misses occur at target 24

| Pool | Policy | Preliminary | Main | Extra screening | In Finalist Pool but missed in Ranking | Total misses |
|---|---|---:|---:|---:|---:|---:|
| 140 | B | 0.046 | 0.196 | 0.062 | 0 | 0.304 |
| 140 | D | 0.046 | 0.196 | 0 | 0 | 0.242 |
| 263 | B | 0.010 | 0.060 | 0.084 | 0 | 0.154 |
| 263 | D | 0.010 | 0.060 | 0.072 | 0 | 0.142 |

Values are mean people per run; 500 runs per row. Ranking loss zero is expected for a stable transitive simulated preference with exact pairwise insertion; it must not be extrapolated to fluctuating human choices. At 140, B and D miss the same candidate in 121 of 4,500 true-TOP9 opportunities; D restores 31 B misses and creates zero new misses. At 263 the corresponding counts are 71 common misses and six restored, zero new. The “same candidate” means the same synthetic ID in the paired seed, not a real person. No single synthetic ID repeatedly dominates: the highest miss frequency is three of 500 seeds. Misses are concentrated near the boundary: at 140, B loses true ranks 8 and 9 in 47 and 48 of 500 runs (D: 36 and 39); ranks 1–3 are never missed. At 263, B loses ranks 8/9 in 20/25 (D: 16/24). The full rank 1–9 stage matrix is in the JSONL.

### Pool position and screen tradeoff

| Pool | Policy | Actual screened pool → ranking pool | Mean screens | P95 | Mean true TOP9 | Exact / 500 | Mean extra 4→3 screens | Mean pairwise/boundary screens | Mean tag taps |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| 140 | B compact | 16 → 16 | 94.136 | 101 | 8.492 | 289 | 13 | 39.136 | 0 |
| 140 | D compact | 16 → 21.992 | 100.680 | 108 | 8.628 | 334 | 13 | 45.680 | 5.992 |
| 140 | B reference | 21 → 21 | 102.324 | 113 | 8.696 | 366 | 7 | 53.324 | 0 |
| 140 | D reference | 21 → 25.786 | 107.334 | 118 | 8.758 | 388 | 7 | 58.334 | 4.786 |
| 140 | B no extra screen | 28 → 28 | 112.898 | 126 | 8.758 | 388 | 0 | 70.898 | 0 |
| 263 | B compact | 18 → 18 | 159.478 | 168 | 8.688 | 367 | 39 | 40.478 | 0 |
| 263 | D compact | 18 → 24 | 165.522 | 174 | 8.700 | 369 | 39 | 46.522 | 6 |
| 263 | B reference | 24 → 24 | 168.182 | 179 | 8.846 | 432 | 33 | 55.182 | 0 |
| 263 | D reference | 24 → 30 | 174.220 | 185 | 8.858 | 436 | 33 | 61.220 | 6 |
| 263 | B larger | 31 → 31 | 176.760 | 190 | 8.888 | 449 | 25 | 71.760 | 0 |
| 263 | B largest tested | 41 → 41 | 185.386 | 201 | 8.914 | 461 | 14 | 91.386 | 0 |

The 140 “no extra screen” option preserves all 28 Main survivors and uses only player-driven pairwise boundary ranking. Its 8.758 mean is the ceiling imposed by Preliminary/Main under this stable model; beyond that point a larger Finalist Pool cannot restore earlier omissions. At 263, the largest tested screened pool was 41 because the Main pool was 54 and a complete 4→3 pass yielded 41; the threshold itself does not directly set an exact size.

**Marginal Protection cost:** at the reference boundary, D over B gains 0.062 true TOP9 per 140-person session (31 extra recovered candidates over 500 runs) for 5.010 more screens and 4.786 optional tags per session. At 263 it gains 0.012 (six extra recoveries) for 6.038 more screens and six tags. Under this simulation, D's 140 result matches B's 28-person no-screen pool while using 5.564 fewer screens but requiring 4.786 tags. At 263, D's marginal gain is small relative to its interaction burden. The tags are additional decisions on existing screens, so screen count alone understates player fatigue.

The results support keeping a sufficiently broad pool through the screening/ranking boundary. They do not choose a deployed policy: stable scores overstate exact ranking consistency, image-based fatigue and human hesitation have not been measured, and ALL SELECT still takes substantially more than the desired ordinary session. No round-robin comparison was used. The next useful test is a small human pilot or a nontransitive/noisy-choice simulation before changing the public app.

## Local screening elimination analysis — 2026-09-27

**Phase 2 remains NOT PASS. No public app or production engine change.** The saved B/D summaries have no losing-group histories. `analyze-screening-events.mjs` minimally replays the existing 140-person B, target-21 screening path on the same 500 seeds, stopping before Ranking. `screening-event-results.json` stores rank distributions, group winners, reconstructed cutoffs, pre-decision history, and D tag accounting. This is a diagnostic replay of existing policy, not a new selection policy or full simulation sweep.

| B lost true TOP9 stage | Rank 1–7 | Rank 8 | Rank 9 | Total |
|---|---:|---:|---:|---:|
| Preliminary 5→2 | 4 | 7 | 12 | 23 |
| Main 4→2 | 42 | 29 | 27 | 98 |
| Extra screen 4→3 | 11 | 11 | 9 | 31 |
| Total | 57 | 47 | 48 | 152 |

The stage-by-rank row is generated and checked in the machine-readable JSON; the extra-screen row is exactly ranks 5:2, 6:3, 7:6, 8:11, 9:9. Every lost true TOP9 face was omitted while **all selected faces on that screen were themselves stronger true TOP9 faces**. No true TOP9 loss was caused by a selected outsider under this stable preference model. In the extra-screen 31 cases, the selected trio's reconstructed least-preferred member had true rank 3–7 and was 1–6 preference-score positions ahead of the omitted face. The UI receives only the chosen set; it does not know this internal order or numerical gap.

Every one of the 31 extra-screen losses had been chosen in Preliminary and Main (two prior wins, zero prior losses). The three selected peers also each had two prior wins. Previously defeated faces had the same observable selection pattern across these entrants: three zero-win Preliminary omissions and two one-win Main omissions. Thus a simple prior win/loss count or selected-peer win count cannot distinguish the 31 from the 3,469 other extra-screen omissions. One weaker existing signal, whether a Preliminary co-winner also survived Main, was true in 17/31 losses versus 1,543/3,469 other omissions; it is insufficient by itself to identify a narrow rescue queue.

D protected **all 31** lost true TOP9 faces in this paired stable model. It required 2,393 optional close tags across 500 sessions (4.786/session); **2,362** tags were on faces outside the true TOP9. The close-call score gap was 1–6 in all 31 lost TOP9 cases, but 1,318 outside-TOP9 omissions also had a gap ≤6. Closeness alone has low precision here and the cardinal gap is unavailable to the algorithm without player declaration. D therefore trades many extra decisions and Ranking comparisons for 31 saved events.

Candidate identity did not explain the failures in these synthetic seeds: no single synthetic ID was lost more than three times in 500 runs; the vulnerable *rank band* and crowded group arrangement repeat. This does not establish anything about actual faces.

**Minimal change candidates for later tests, neither adopted:**

1. Preserve all 28 Main survivors and skip this seven-screen 4→3 cut. Earlier paired results show recovery 8.758/9 at 112.898 screens versus B's 8.696/9 at 102.324, recovering the 31 extra-screen losses for 10.574 additional screens on average, with no extra tag taps.
2. Let the player optionally reserve the fourth face for a limited later comparison, as in experimental D. It recovered those 31 at 107.334 screens (5.010 above B), but added 4.786 tags/session and 2,362 tags on outside-TOP9 faces. This is an interaction burden, not a chosen implementation.
3. A future **retrospective** trigger could reconsider the omitted fourth face only if its three selected peers later rank highly by player choices. In this synthetic evaluation, all 31 lost true TOP9 were beaten by three true TOP9 peers, while 292 of the 3,469 outside-TOP9 omissions also had three true TOP9 peers. The actual trigger using later player Ranking, its question cost, and behavior with inconsistent preference have **not** been simulated; these figures are diagnostic only.

The local cause is a crowded 4→3 comparison of already twice-selected candidates. No currently observed binary selection count separates the boundary face from other omitted faces. The smallest credible targeted change needs either an explicit player signal or evidence from later player comparisons; its screen and fatigue cost must be tested before adoption.

## Retrospective Trigger diagnostic — 2026-09-28

**Experimental Simulation only. Phase 2 NOT PASS; public app and production selection engine unchanged.** `node verify-retrospective-trigger.mjs` replays B with 140 synthetic candidates, Finalist Pool 21, and the identical 500 seeds (0–499). The script asserts that its B baseline exactly matches the saved B21 mean screens 102.324, true TOP9 recovery 8.696, and exact-nine 366/500. D21 is read from the saved paired result and **not rerun**.

The B final Ranking is frozen before trigger evaluation. For each omitted fourth face at the seven 4→3 screens, a trigger sees only the final player-comparison position of the *three selected peers*. Triggered fourth faces challenge the current ninth place by one player pairwise decision; on a win, binary insertion uses further player pairwise decisions and evicts the then-ninth face. No true rank, synthetic score, analytical cutoff gap, or identity enters the trigger or rescue decision. Synthetic scores drive the simulated player's answers and are used afterward to grade outcomes. One pairwise decision is one added screen; no round-robin is used.

| Policy / trigger | Triggered fourth faces | True TOP9 among triggers | False alarms | Accepted outside TOP9 | Extra screens / player pairwise decisions, total (mean/run) | Mean total screens (p95) | Mean true TOP9 | Exact 9/9 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| B21 reference | — | — | — | — | 0 | 102.324 (113) | 8.696 | 366/500 |
| D21 reference, optional prior tags | 2,393 tags | 31 protected | 2,362 tags outside TOP9 | — | +5.010 screens (plus 4.786 taps/run) | 107.334 (118) | 8.758 | 388/500 |
| All three selected peers final TOP9 | 350 | 31 | 319 | 3 | 462 (0.924) | 103.248 (114) | 8.758 | 388/500 |
| At least two peers final TOP9 | 1,406 | 31 | 1,375 | 3 | 1,518 (3.036) | 105.360 (116) | 8.758 | 388/500 |
| All three peers final TOP6 | 111 | 26 | 85 | 2 | 205 (0.410) | 102.734 (114) | 8.748 | 383/500 |

A false alarm is a triggered candidate whose synthetic true rank is outside nine; an **accepted outside-TOP9** face actually wins its boundary challenge and enters the result (three instances for either TOP9 trigger, two for TOP6). These are distinct counts. All-three-TOP9 triggered in 304/500 sessions; at-least-two triggered in all 500; TOP6 in 109. The all-three-TOP9 trigger caught all 31 B extra-screen true TOP9 losses for 462 comparisons, versus D's 2,393 optional tags and 2,505 additional Ranking screens across 500 runs. The remaining 121 B losses were in Preliminary/Main and cannot be recovered by these seven retrospective triggers.

No variant displaced a **previously included true TOP9** face (zero across all three conditions); under the fixed transitive preference model, a worse fourth face cannot beat a stronger current ninth. Some accepted outsiders can displace another outsider because true TOP9 faces have already been lost in earlier Screening. The apparent equality of all-three-TOP9 and D recovery is specific to these same 500 stable-preference simulations, not a human quality result. The TOP9 condition still fires 319 extra pairwise checks for outside-TOP9 faces, and post-Ranking comparison flow, hesitation, nontransitive choices, photo availability, and iPad Safari behavior are unverified. This diagnostic does not select or deploy a new policy.

## Retrospective Trigger robustness — 2026-09-28

**Experimental Simulation only; Phase 2 NOT PASS; production Selection Engine and public app unchanged.** Run `node verify-retrospective-robustness.mjs > retrospective-robustness-results.json`. The committed JSON contains every aggregate metric; this section highlights the paired comparison. The stable control exactly reproduces B21 (102.324 screens, 8.696/9, exact 366/500), D21 (107.334, 8.758/9, 388/500), and retrospective B21+trigger (103.248, 8.758/9, 388/500) on seeds 0–499.

The simulation fixes a latent score ordering **only for evaluation**. The mock player supplies group selections, optional close-call tags to D, and binary answers to Ranking and retrospective challenges. B, D, and R use the same seed and the same initial screening groups. A deterministic hash creates reproducible, bounded judgment variations. R's only trigger is that **all three selected peers from a 4→3 screen occur in B's frozen final TOP9**; a triggered omitted face challenges the current ninth place, with binary insertion on a win. The trigger has no access to latent rank or score. D receives only the simulated player's optional tag; the tag is based on that player's perceived margin, capped at six, never an algorithm-visible score.

Noise models (level 1 / level 2): near-boundary flips at 6% / 18% for close pair answers involving ranks 6–14 (group perception jitter ±2 / ±5); close-choice contextual jitter ±2 / ±5 on each displayed face and close pair; deterministic nontransitive three-way cycles at latent ranks 8–10 / at 5–7, 8–10, 11–13; and early-to-late preference drift of up to ±2 / ±4 score units per candidate. These are controlled sensitivity tests, not calibrated estimates of human behavior. The latent TOP9 is the common scoring reference; with drift or cycles it is not uniquely the player's final “true” preference.

| Scenario | B recovery / exact | D recovery / exact | R recovery / exact | D added screens | R added screens | R triggers / false | R admitted outside latent TOP9 | B latent TOP9 displaced by R |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Stable | 8.696 / 366 | 8.758 / 388 | 8.758 / 388 | 5.010 | 0.924 | 350 / 319 | 3 | 0 |
| Near flip L1 | 8.524 / 292 | 8.568 / 304 | 8.564 / 302 | 5.046 | 0.948 | 349 / 318 | 13 | 5 |
| Near flip L2 | 8.128 / 146 | 8.180 / 157 | 8.164 / 154 | 5.278 | 1.030 | 347 / 314 | 29 | 8 |
| Close jitter L1 | 8.444 / 245 | 8.486 / 259 | 8.478 / 254 | 4.922 | 1.000 | 357 / 326 | 18 | 8 |
| Close jitter L2 | 7.998 / 114 | 8.030 / 122 | 8.022 / 117 | 5.244 | 0.978 | 336 / 304 | 25 | 12 |
| Cycle L1 | 8.314 / 175 | 8.344 / 181 | 8.344 / 181 | 4.942 | 0.882 | 362 / 331 | 3 | 5 |
| Cycle L2 | 8.314 / 175 | 8.344 / 181 | 8.344 / 181 | 4.936 | 0.868 | 358 / 327 | 5 | 5 |
| Drift L1 | 8.382 / 214 | 8.434 / 231 | 8.440 / 233 | 5.058 | 0.938 | 351 / 320 | 5 | 2 |
| Drift L2 | 8.112 / 118 | 8.132 / 123 | 8.152 / 130 | 5.126 | 0.952 | 356 / 325 | 12 | 6 |

Exact is count out of 500, and added screens are paired means versus B in each scenario. Each added screen is one player pairwise comparison. R's mean total screens range 102.450–103.704 under perturbed models (p95 113–114), and triggered comparisons total 434–515 per 500 runs, depending on scenario. False triggers are omitted candidates **outside the anchored latent TOP9** who still receive a comparison; actual acceptance outside that TOP9 is lower (3–29). D's optional tags remain approximately 4.6–4.8 per run and its added screens approximately 4.9–5.3. These quantities include no prompt or navigation cost to return to an earlier omitted face.

Across R scenarios, per-session **maximum candidate displays** average 14.17–14.40 (stable 14.25), p95 17–18, observed absolute maximum 20–22; D's per-session maxima average about 16.1–16.9, p95 21. The result JSON also records total repeat displays and all maxima. Under noisy answers, R **can** displace a previously included latent TOP9 face: 2–12 such events per 500 runs (D likewise 4–19). Thus the stable model's zero-displacement property does not generalize. R improves average recovery over B in every tested scenario, but the gain shrinks to +0.024/9 under strong close jitter (Exact 117 vs 114/500). It is slightly behind D in near-flip and jitter cases; no method consistently protects the boundary under perturbed choices.

Ranking inconsistency is reported in three distinct ways in the JSON: repeated pair answers that reversed within a session (R: 3 near-flip sessions, 87/133 close-jitter sessions; none in the cycle and drift models, whose pair answers are deterministic), observed player comparison edges contrary to the final TOP9 order (zero here, as insertion rarely compares the same final pair after a reversal), and an **offline audit** of all final TOP9 pairs against the mock player's modeled pair preference (mean 0.032–4.314 discordant pairs depending on model; stable zero). The offline audit is evaluation only; it is not a proposed all-pairs player interaction. Nontransitive cycles can create discordance even with no reversed repeat answer.

For drift, anchored early versus late ideal TOP9 overlap averages 8.568 (L1) or 8.184 (L2); R matches the late ideal 8.728 or 8.664 on average, respectively. This is why the anchored recovery score alone should not be read as a human satisfaction measure. No policy was adopted or deployed. Human comparative play, preference instability, and the cost of post-Ranking return remain open; no new Preliminary/Main rescue design was started.

## Retrospective Trigger failure mechanism — 2026-09-28

**Diagnostic replay only. Phase 2 remains NOT PASS; Retrospective is unadopted; production/public app and all prior simulation evidence remain unchanged.** `node analyze-retrospective-failures.mjs > retrospective-failure-analysis.json` replays the exact 500 seeds and nine conditions of the robustness study. Assertions match the saved B/D/R screen means, TOP9 recovery, exact-nine counts, and R trigger/false/accepted/displacement counts for every condition. The new JSON stores all 51 individual event traces and counterfactuals. No new selection policy is run.

### Correct interpretation of “displaced true TOP9”

The previous aggregate `evictedBaselineTrue` counted 51 removals of a latent-TOP9 face that had been in B's result, across the eight noisy conditions (4,000 scenario-runs). It is **not** a count of 51 harmful substitutions:

- **34** substitutions brought in a *higher* latent-ranked TOP9 face (rank gap rescued minus evicted = −1:16, −2:5, −3:9, −4:4). Each removed a lower-ranked TOP9 face but did not reduce the number of TOP9 faces. Their B result often had a misplaced boundary due to earlier Ranking order.
- **17** substitutions brought in a *lower* latent-ranked face (rank gap +1:6, +2:7, +3:2, +4:2; mean +2). **15** admitted rank 10–13 in place of rank 7–9, reducing anchored TOP9 recall; **2** exchanged two latent-TOP9 faces in the wrong direction without reducing the count.
- Stable control produced zero such substitutions.

| Noise condition | B TOP9 faces displaced | Lower-ranked substitution | Actual TOP9-count loss | Lower-ranked rate per 500 runs |
|---|---:|---:|---:|---:|
| Near-boundary flip L1 / L2 | 5 / 8 | 4 / 6 | 4 / 6 | 0.8% / 1.2% |
| Close-choice jitter L1 / L2 | 8 / 12 | 3 / 4 | 3 / 2 | 0.6% / 0.8% |
| Nontransitive cycle L1 / L2 | 5 / 5 | 0 / 0 | 0 / 0 | 0% / 0% |
| Early/late drift L1 / L2 | 2 / 6 | 0 / 0 | 0 / 0 | 0% / 0% |

These rates describe this bounded synthetic model, not measured human failure probabilities. The initial latent rank is the grading reference even when a modeled preference later drifts or cycles.

### Stage attribution and counterfactuals

For each case the trace records seed, condition, 4→3 group and chosen three, omitted fourth, trigger/peer positions, current ninth and binary answer, all insertion decisions, TOP9 before/after, evicted face, both latent ranks, and first observed path departure from the stable seed. A **same-group** noise-free 4→3 choice (A) and a noise-free Ranking of the *same noisy finalist pool* for peer membership (B) are diagnostic comparators, not inputs to the policy. **F** is an extra category for a boundary already misplaced by B's Ranking: the current ninth is not the weakest latent face in the displayed nine. C and D audit the actual boundary and insertion decisions against the latent preference. Categories overlap.

| Category among 17 lower-ranked substitutions | Count | Interpretation |
|---|---:|---|
| A: 4→3 choice changed in the same group | 1 | Also B, C and F |
| B: trigger peer membership differs with noise-free Ranking of same pool | 1 | Also A, C and F |
| C: fourth-vs-current-ninth answer reversed | **17** | Present in every lower-ranked substitution |
| D: at least one insertion answer reversed | 16 | Always overlaps C; no D-only case |
| F: prior B boundary placement inconsistent with latent order | 7 | Overlaps C |
| E: two or more flags | 17 | C+D:10, C+D+F:6, A+B+C+F:1 |

Local first anomalous stage among these cases is A:1, F:6, C:10; these labels describe temporal precursors, **not independent causal proof**. The full-path first departure from the stable seed was Preliminary selection/set/order in 10, Main order in 2, extra screen order in 3, and Ranking answer in 2; set/order changes can change later comparison pair order without indicating an incorrect choice. All 17 harmful paths ultimately required a reversed boundary answer in the observed run.

Three **single-component analyst counterfactuals** replayed each full noisy path independently, freezing only one component to the evaluation oracle. The oracle is deliberately unavailable to the production algorithm:

| Frozen component | Earlier B latent-TOP9 face retained, of 17 |
|---|---:|
| Trigger membership from noise-free Ranking of the same pool; keep noisy boundary/insertion | 1 |
| Fourth-vs-current-ninth boundary answer from latent order; keep noisy trigger/insertion | **17** |
| Insertion answers from latent order; keep noisy trigger/boundary | 15 |

The counts overlap and must not be added. The insertion-only counterfactual can reject an incorrectly accepted fourth face by inserting it beyond ninth, but fails in two cases with pre-existing Ranking order issues. The boundary-only counterfactual prevents all 17 because all 17 fourth faces are weaker than the current ninth in the anchored latent order. It is an **oracle sensitivity test**, not a feasible engine instruction.

Example: near-flip L1 seed 312 selected three peers in the extra screen and all three reached B's TOP9; the omitted latent rank-10 face challenged rank 9. The first decisive reversal was the boundary answer in favor of rank 10; a later insertion comparison also reversed, and rank 10 replaced rank 9. Noise-free trigger membership would still fire; the boundary-only counterfactual keeps rank 9. The full trace appears in `retrospective-failure-analysis.json`.

**Hypothesis assessment for this model:** H1 trigger condition as main cause is not supported (1/17), H2 noisy single boundary decision is strongly supported (17/17 and 17/17 boundary-only prevention), H3 insertion as primary independent cause is not supported (no D-only harmful case), and H4 overlapping anomalies occur (17/17) but do not erase C's necessary role in these cases. This does not prove that a human player will give a stable answer when asked again. A possible **Improvement Candidate**, not implemented, is to evaluate the reliability and interaction cost of boundary evidence in a separate future decision. Do not infer that a latent-rank oracle, majority rule, or repeated question should be added.

**Limitations:** deterministic hashed noise, a fixed scoring reference, same-seed diagnostics rather than human trials, and only 17 lower-ranked substitutions. The 34 higher-ranked substitutions are not failures by the latent pairwise preference but could still affect human satisfaction. The first stable-path departure is descriptive; earlier order changes do not establish causality. No Preliminary/Main rescue study, new Rule, or Production implementation follows from this analysis.

## Boundary evidence reliability / interaction cost — 2026-09-28

**Experimental study complete, no adoption or public-app change. Phase 2 remains NOT PASS.** [BOUNDARY_EVIDENCE_STUDY.md](BOUNDARY_EVIDENCE_STUDY.md) compares single Boundary answer, unconditional same-pair repeat, challenger-win-only repeat, optional player hesitation, and changed-format confirmation. The exact nine saved noise conditions and 500 seeds are replayed, with assertions matching prior single-answer aggregates and the previous 17 harmful cases. See [boundary-evidence-results.json](boundary-evidence-results.json) for all per-condition screen p95s, per-candidate displays, comparisons, taps, false acceptances, recall and exact-nine metrics. Reproduce with `node study-boundary-evidence.mjs > boundary-evidence-results.json`.

In the four stochastic conditions (2,000 paired runs), the single-answer path had 17 lower-latent-rank substitutions. Conservative challenger-win-only confirmation yielded 5 with independent repeat answers and 14 with 75% answer stickiness; it asked 185–186 extra confirmations versus 1,389 for repeating every Trigger, while producing identical final TOP9 results in every tested paired run. It also rejected some warranted rescues (137 initially correct challenger wins versus 113 or 131 kept). A changed-format half-noise model yielded two harmful substitutions, but its reduced noise is an **untested assumption**. Player-declared hesitation and repeated-answer correlation require human calibration. Gross repeated questions, net screens, taps and cognitive burden are kept separate in the study. No new Rule was selected or implemented.

## Human Boundary Reliability Pilot v0.1 — 2026-09-28

**Experimental UI and machine-readable logging IMPLEMENTED; Human Test and iPad Safari verification UNVERIFIED.** `human-boundary-pilot.html` and `human-boundary-pilot.mjs` provide three equally allocated arms: single first judgment, delayed same-pair repeat, and delayed left/right-reversed confirmation. The schedule guarantees at least 12 intervening other displays, without image editing. JSON export records pair/condition, choices, agreement, sides, timing, order and timestamps. `node verify-human-boundary-pilot.mjs` checks 400 synthetic scheduling configurations and schema behavior; no human choice is simulated or interpreted. Details, private Pair manifest format and manual checks: [HUMAN_BOUNDARY_PILOT.md](HUMAN_BOUNDARY_PILOT.md). The older synthetic traces do not justify selecting 20–30 real-photo boundary pairs, so Pair provenance remains UNVERIFIED. Production Selection, app, Retrospective adoption and Phase 2 state are unchanged.

## Human Pilot Pair Selection Rule v0.1 — evidence audit, 2026-09-28

**UNVERIFIED / STOP; no private manifest generated.** The private master has 263 mapped persons, but no preference history. The public repository contains synthetic runs and scripted UI walkthroughs, while Production's genuine selection history resides in each player's browser storage and no authentic catalog session export was found in accessible project files or Work browser. Consequently zero real Boundary events and zero clear Control events are available for reproducible selection of 18+6 pairs. [HUMAN_PAIR_SELECTION_AUDIT.md](HUMAN_PAIR_SELECTION_AUDIT.md) records the checked sources, event fields available if a genuine session is supplied, why current fields cannot define close/clear contrasts yet, and the missing evidence. No person IDs or photo mapping are published; Production, Pilot responses and Phase state are unchanged.

## Private selection history export v0.1 — 2026-09-28

**Independent export IMPLEMENTED; automated projection VERIFIED; iPad Safari run UNVERIFIED.** Existing result UI has no full-history JSON export. [private-history-export.html](private-history-export.html) reads completed catalog sessions from the existing localStorage key and archive on the same origin, downloads a reduced JSON containing frozen set/version/candidate IDs, event sequence with shown/chosen/uncertainty, `boundary`/`rank` events and final TOP9. Names, image URLs, nickname and age are omitted, but the file remains private preference data. `node verify-private-history-export.mjs` checks projection, archive, redaction and read-only behavior. [PRIVATE_HISTORY_EXPORT.md](PRIVATE_HISTORY_EXPORT.md) gives schema, iPad steps, privacy limits and a consolidated Safari QA checklist. `app.js`, `selection-engine.js`, selection behavior, Retrospective status and Phase 2 state remain unchanged.

## Private/Family Candidate Lifecycle v0.1 — 2026-09-28

**Portable frozen Master IMPLEMENTED; structural checks VERIFIED; iPad Safari real-image run UNVERIFIED.** A new private 2026-09-28 JSON edition is held outside the public repository, preserving the earlier 2026-09-27 file. The live official individual listings showed STARTO 105 and Junior 158; normalized official profile IDs, names and image URLs matched all 263 previously captured records (STARTO FNV-1a UTF-16 digest 1082778364, Junior 2098392701, sorted `profile numeric ID|display name|absolute image URL` rows). Search snippet reporting 156 Junior records was superseded by the loaded official page showing 158. The Junior group listing still showed six groups; individual group assignments were not reaudited and retain their prior observation provenance.

The private schema v3 adds a permanent `identity_id` equal to the existing person ID, official source aliases, current affiliation with separate category/group evidence, an empty `affiliation_history` ready for documented future transitions, image-source evidence, and frozen set dates/source URLs. No joining/debut dates were inferred. STARTO/JUNIOR/ALL versions are `starto-105-2026-09-28`, `junior-158-2026-09-28`, `all-263-2026-09-28`; all partition the same 263 identities. `node validate-private-master.mjs /private/path/master.json` passed: 263 unique, 105/158/263 partitions, no duplicate identity, evidence schema present. Neither names, image URLs, nor private JSON are committed.

`catalog.html` retains its existing one-time IndexedDB import and adds a private JSON backup download and an app entry link. `node verify-catalog-transfer.mjs` passed synthetic import validation and byte-equivalent JSON projection for backup. After commit `8549d66`, the updated import/backup UI and app link were visibly served by GitHub Pages in the cloud browser. A full headless import/download browser test was attempted but the local Playwright browser executable is absent; Safari download, official hotlink display on iPad, rights/usage clearance and family-device transfer remain UNVERIFIED. [CANDIDATE_LIFECYCLE.md](CANDIDATE_LIFECYCLE.md) specifies migration, immutable editions, evidence semantics and a separate future read-only monthly diff/report → human approval → new version boundary. No monthly automation runs. Production `app.js` and `selection-engine.js` hashes are unchanged from the prior commit, and prior sessions remain bound to their frozen `selectionSnapshot`. Phase 2 remains NOT PASS; Retrospective Trigger is unadopted.

Resume check (same day): remote `main=6f7760b`, Pages displayed the updated catalog controls, and the existing catalog import validator accepted the actual private schema v3 JSON with 263 records in a read-only local invocation. No extra production selection run or human response was generated. The next meaningful check is the participant's iPad Safari import, images, genuine selection, reveal and private history export.

## Unified Reveal v0.1 — 2026-09-28

**Presentation IMPLEMENTED; structural test VERIFIED; physical Safari visual QA UNVERIFIED.** The result now reserves all nine ranks on one fixed 3×3 board (`9/8/7`, `3/1/2`, `6/5/4`), unveils 9→1 without switching screens, and leaves that same board as the final result. A completed saved session opens immediately in final state. Detail cards show frozen rank/name/affiliation and official source. Shared result also uses this board with a first-view reveal and a later **自分も選んでみる** link. Reduced motion, skip and replay are included. `node verify-reveal-board.mjs` checks position order, initial blindness and completion; `node verify-private-history-export.mjs` still passes. See [UNIFIED_REVEAL.md](UNIFIED_REVEAL.md). `selection-engine.js` is unchanged, Phase 2 is NOT PASS and Retrospective Trigger remains unadopted.

GitHub Pages cloud-browser smoke verification (synthetic nine-person shared payload, no real identity/image): first view displayed nine masked, disabled positions; after unveiling the board retained the exact fixed order and revealed the play link. Opening rank 1 displayed its detail dialog and closing returned to the same board. Replay reset all nine to masked state and completed on the same board. The initial deployment exposed stale CSS due to browser cache; `app.html` now references `app.css?v=6`, and the updated style rendered on Pages. This verifies the served desktop browser flow, not actual iPad Safari, real-image fit, or smartphone portrait one-screen fit. Those remain UNVERIFIED pending physical visual QA.

## Candidate Auto-Provisioning checkpoint — 2026-09-28

**Review branch IMPLEMENTED, synthetic transport VERIFIED, distribution/physical QA BLOCKED. Public main and Pages unchanged.** The normal Setup removes the synthetic 140 option and exposes STARTO/JUNIOR/ALL only after a valid catalog. Versioned manifest + SHA-256 + schema/partition checks precede IndexedDB storage; same-version cache avoids another full master download, an old requested shared version can be restored from a retained edition, and a missing source gives an explicit retry instead of silent demo fallback. Shared **自分も選んでみる** transfers only set/version. Frozen sessions remain untouched. The private 2026-09-28 263-person master passed the new validator (105/158/263), and `node verify-candidate-provision.mjs`, reveal-board and private-history tests pass. The public distribution pointer is intentionally unconfigured: deciding whether to expose the name/ID/image-URL mapping publicly or configure an access-controlled service requires human review. See [AUTO_PROVISIONING.md](AUTO_PROVISIONING.md). No person mapping or image binary was committed. Phase 2 remains NOT PASS; Retrospective Trigger is unadopted.

## Access-controlled distribution checkpoint — 2026-09-28

**Local implementation/verification complete; live service and Pages activation NOT VERIFIED.** The newer decision rejects unrestricted public JSON. A Worker contract serves a metadata-only manifest, checks HMAC-signed read/issuer Capability scope/version/expiry, and reads master bytes from a private R2 binding. Pages client uses the Worker endpoint pointer, sends Bearer only in an Authorization header, verifies SHA-256/schema/partition, and caches by master version. A sender's issuer token mints a read-only, version-specific recipient token for a result link; Shared Result → **自分も選んでみる** → invite fragment → fresh player preserves only set/master/set versions and authorization. The invite fragment is removed from the browser address on entry. Synthetic Setup remains removed. Existing session snapshots and `selection-engine.js` remain unchanged.

`BFS_PRIVATE_MASTER=/private/path/master.json node verify-capability-distribution.mjs` passed with the actual 2026-09-28 263-person private bytes: STARTO 105, Junior 158, ALL 263, clean-store fetch, same-version no re-download, share-to-play set/version transfer, read-only token inability to mint, tampered/expired token rejection, wrong Origin rejection and no person mapping in the public manifest. The test also passes with an 18-person synthetic fixture without the private file. `node verify-candidate-provision.mjs`, reveal-board and private-history-export tests pass. The actual private R2 object and metadata manifest were staged outside Git; no upload occurred. A plain URL on a brand-new device cannot obtain a private master without an invite; see [CAPABILITY_DISTRIBUTION.md](CAPABILITY_DISTRIBUTION.md) for the bootstrap and security limits. Human R2/Worker configuration, live endpoint, iPad/iPhone Safari, AirDrop and image-rights/hotlink checks remain UNVERIFIED. Public main/Pages stay unchanged; Phase 2 is NOT PASS; Retrospective Trigger remains unadopted.
# Anonymous Invite Sample v0.1 — 2026-09-28

**IMPLEMENTED / LOCAL API VERIFIED; REMOTE/HUMAN UNVERIFIED.** Separate experimental Worker, D1-compatible schema, static UI, loopback-only local server and two automated tests. Fixture has five fictional FACE labels and no candidate mapping or image binaries. Recipient explicitly presses **招待を受け取る** so page previews do not consume the invite. `node verify-invite-sample.mjs` passed: JST midnight issue reset, one/session/day, 30 concurrent claims yielded exactly one recipient, re-invite by recipient, unauthorized and expiry checks. `node verify-invite-sample-http.mjs` passed the local HTTP flow and static asset access. No production Selection Engine or public main/Pages change. See `ANONYMOUS_INVITE_SAMPLE.md` for run instructions, mechanism, and limits.

Cloudflare D1, browser Share Sheet, iPad Safari, human test, real Candidate Master access and account billing remain UNVERIFIED. No R2 subscription, Worker or D1 creation, payment method, or public deploy occurred. Phase 2 NOT PASS; Retrospective Trigger UNADOPTED.
