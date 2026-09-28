# Real Candidate Gate — 2026-09-28

Status: **STOP before any real-candidate deploy.** This is a bounded finding, not a decision to change the invitation model or reject all real-image use.

## Testability repair

[Dedicated Test-only Owner quota workflow](.github/workflows/reset-test-owner-quota.yml) uses the GitHub repository Secret `CLOUDFLARE_API_TOKEN` to access only the exact Cloudflare Test D1 `blind-face-select-invite-test-v01`. It has no public Worker route, UI button, new Secret or change to the Worker invite logic. The first push dry-runs; an explicit rerun uses current JST day and the existing fixed one-time Owner marker to delete **only that Owner session's today's issued Invite row**. It refuses to reset a still-unclaimed Invite, protecting an outstanding link. A claimed recipient's anonymous Session row is untouched; other issuers and dates are untouched. Test reset permits repeated Owner issuance on the same day, solely in Test. The normal one/day, JST 0:00 and no-carryover rules remain intact.

[Initial dry-run and explicit rerun](https://github.com/nyannko619xxx-oss/-blind-face-select/actions/runs/36437654514) PASS: before reset, exact Owner today count 1, claimed 1; attempt 2 removed 1. Local SQLite verification proves other issuer and previous-day rows remain, repeated DELETE changes zero rows. The workflow does not print account/database/session IDs, token, Secret, or Invite URL. To use again after an Owner invite has been claimed: open the linked Actions run and choose **Re-run all jobs**; the job refuses an outstanding unclaimed Invite. The run is on the checkpoint branch; `workflow_dispatch` availability from that branch is not relied on. Do not use this mechanism to test daily limit itself.

## Private source inventory (no identity mapping published)

Private staged Master at `/workspace/scratch/f1b859526a55/private/bfs-private-candidate-master-263-20260928.json`: schema keys include `candidate_master`, `candidate_sets`, `identity_id`, `official_profile_url`, `image_source_url`, `image_evidence`, and frozen version `starto-junior-2026-09-28`. Count: STARTO 105, Junior 158. All 263 have `image_status=source-listed`; URLs and profile origins are only `starto.jp` (105) and `jr-official.starto.jp` (158). These are catalog references, not downloaded binaries or permission evidence. Nothing from this file was committed or added to D1/Worker; no real image binary was copied to Cloudflare or R2.

The limited Test URL `https://blind-face-select-invite-test-v01.nyannko619xxx.workers.dev/` is reachable without login. The v0.2 fixture and Invite UI are static, while the fixture API requires a valid anonymous bearer. Adding a real subset to a protected Worker/D1 endpoint would restrict catalog retrieval to invite holders, **but** the invite chain allows recipients to re-invite one person per JST day, and any invite holder could copy the delivered URLs and data. The static Test URL is not a private family-only network. Direct browser `<img>` loading from official HTTPS would avoid rehosting image binaries but still displays the copyrighted photos in an independently operated shared application. Browser hotlink success, Safari behavior and permission are distinct; live Worker-origin and iPad Safari real-image loads were not performed in this gate.

Official policies checked on 2026-09-28: [STARTO site policy](https://starto.jp/s/p/group/detail/sitepolicy) identifies copyright ownership and disallows use beyond legally recognized private use without prior rights-holder consent; the [Junior site policy](https://jr-official.starto.jp/s/jr/page/site_policy) likewise states the private-use limit. The STARTO policy also identifies performer likeness/name rights. Neither policy expressly grants third-party app embedding or onward distribution of URL mappings to invited users. The project's intended private/family use does not itself resolve whether a publicly reachable invite-chain Test app with official hotlinked images stays within that permitted scope. This is a rights/use-scope question requiring human judgment or permission, not merely a CORS problem. No legal conclusion is asserted.

## Choices and impact at the gate

| Choice | Impact |
|---|---|
| Keep v0.2 fixture while seeking specific authorization for this shared-image use | Preserves verified invite/game flow; delays real play, avoids distributing official images through the Test app in the meantime. |
| Constrain real-image evaluation to a personally controlled device and do not attach image URLs to the invite chain | Narrower exposure; would not yet validate Share→Real Play, and still needs a judgment about permitted image use. |
| Obtain permission or licensed images for an invited small subset | Enables controlled real-person E2E after terms are known; requires rights-holder interaction and time. |
| Proceed with a small protected URL subset based on a human determination of acceptable scope | Fastest real-play test; the public Test URL/invite chain and third-party embedding remain material rights and leakage risks. Technical reachability alone offers no permission. |

No option has been adopted here. The Selection Engine, v0.2 Invite chain and public main were not changed. Phase 2 NOT PASS, Retrospective Trigger UNADOPTED, image rights UNVERIFIED, R2 not activated.
