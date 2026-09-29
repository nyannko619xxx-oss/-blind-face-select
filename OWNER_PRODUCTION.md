# Owner Real Play Production — 2026-09-29

## Environment

- Formal entrance: https://nyannko619xxx-oss.github.io/-blind-face-select/ redirects to the separate Production Worker origin https://blind-face-select-prod-v01.nyannko619xxx.workers.dev/ . The Worker origin is where Safari stores its private data. [Pages deployment](https://github.com/nyannko619xxx-oss/-blind-face-select/actions/runs/36556045124) PASS; a clean browser followed the formal URL to Production and showed the migration/Invite access screen with no v0.3 links.
- Separate Production Worker and D1 are named blind-face-select-prod-v01. The Test Worker/D1 remain blind-face-select-invite-test-v01. No R2, image binary, candidate mapping, name, image URL, player choice or history is uploaded to either Worker/D1.
- The former main root v0.3 menu is removed from normal navigation. Legacy app.html, phase1.html and phase2.html remain addressable for old links/developer use but are not presented at the formal entrance.
- Any older Pages-origin app.html session remains in Pages-origin storage and is still reachable through its direct URL. This migration covers the later Owner Test-origin records, not those legacy Pages records.
- Production serves Owner real modes STARTO 105, Junior 158 and ALL 263 from the Owner browser's frozen private Master. Non-Owner invite recipients see an explicit real-candidate preparation message; no fictional game is offered on the Production Home.
- The same Selection Engine source, Reveal board module and CSS as the Human QA Test build were copied byte-for-byte. No Retrospective Trigger or new ranking rule is active.

## Private one-time migration

1. On the **same Owner iPad Safari profile** that holds the Test Playable, open the formal entrance and tap 「以前の結果を引き継ぐ」. Safari opens the existing Test origin in a separate tab.
2. On that tab, tap 「引き継ぎを開始」. Its existing Owner bearer is checked by the Test Worker. The Production Worker independently validates that bearer via the Test session endpoint before issuing a new Production Owner session.
3. The Test tab reads the frozen Master and each of the three Owner progress records from its IndexedDB. It sends them only by exact-origin, nonce-bound browser postMessage to its opening Production tab. The Production tab validates versions, membership, IDs and history, writes its own IndexedDB records under the new session key, checks the new Owner session, then acknowledges success. No identity mapping, selection history or token is put in a URL, Git, D1 or log. Test data are not deleted.
4. Return to the Production tab. Existing completed TOP9 opens as a final board, in-progress selection shows 「続きから」, and replay starts concealed. Inspect both saved results before treating migration as Human PASS.

If Safari blocks the tab or either session has expired, the app shows a visible failure. The Test data remain intact. A retry reissues a single Production Owner session; it does not create another Owner. Production keeps the Owner bearer valid for 30 days and renews it on a visit during its final seven days. Returning only after it expires requires a recovery decision; automatic cross-device Owner restoration is not implemented.

## Production separation

- No Test quota reset workflow is bound to Production D1. The Test reset workflow targets the Test D1 name and fixed Test Owner record only.
- Production Worker has no fictional fixture endpoint, admin bootstrap, or browser Owner-code Claim route. Its migration endpoint requires the exact Test Origin and a currently valid Test Owner bearer; foreign Origin and non-Owner bearers are rejected.
- Existing Invite issue, single-use Claim, JST once-per-day quota and recipient re-invite route are retained. A recipient cannot access the private real Master and is told the real mode is preparing.
- The private Master remains local to the Owner device. A new Owner device still needs an explicit private transfer or separate distribution design. Official HTTPS image technical display does not verify image-use rights.

## Verification

- [Separate Production deploy and browser E2E](https://github.com/nyannko619xxx-oss/-blind-face-select/actions/runs/36555878224): PASS. Two independent D1 IDs resolved; Production D1 schema applied; Worker/static assets deployed. Automated browser transferred synthetic 263-person private Master plus saved STARTO TOP9 and Junior in-progress state across isolated origins, checked replay and reload, and confirmed original Test record remained. It used no genuine Owner token or identity mapping.
- Production live endpoint: unauthenticated session/invite denied; foreign/non-Test migration rejected; fixture/admin/Owner-code endpoints absent for authenticated temporary session; Invite issue, Claim, used-token rejection and recipient re-invite PASS. Temporary rows cleaned.
- Test origin after adding only the migration page: static bridge propagated, existing Test Home and auth gate still PASS. Existing Owner credential and D1 rows were not modified.
- Owner iPad actual migration, formal official-image loading, saved result parity, Safari popup and final Human Play remain **PENDING**. ALL 263 Human full play remains UNVERIFIED.

Phase 2 NOT PASS. Retrospective Trigger UNADOPTED. Image rights UNVERIFIED. No R2.
