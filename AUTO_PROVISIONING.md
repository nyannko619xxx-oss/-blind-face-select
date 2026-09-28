# Candidate Auto-Provisioning checkpoint — 2026-09-28

## State and release gate

**Implementation on the review branch only. Public `main` and GitHub Pages remain unchanged.** The real 263-person 2026-09-28 master is private. No real-person ID/name/image-URL mapping or image binary is in this branch. `candidate-distribution.json` is a deliberately unconfigured placeholder. Publishing the private master would reverse the earlier private-mapping constraint, so automatic real-person access cannot be claimed until a distribution location and disclosure scope are chosen. Phase 2 remains NOT PASS; Retrospective Trigger remains unadopted. No Selection Engine or TOP9 semantics changed.

## Implemented client path

1. On normal entry, fetch a versioned manifest without cache. On shared-result entry, show the board without waiting for the master; **自分も選んでみる** opens a fresh setup URL carrying only `set` and `version`. It does not carry sender history, answers or uncertainty. A saved result still embeds its own frozen reveal snapshot.
2. For a valid manifest, use the stored edition if its version and SHA-256 match. Otherwise fetch the versioned master, compare SHA-256 over the exact received bytes, validate schema v3, permanent identity uniqueness and the STARTO/JUNIOR/ALL partition, and store in IndexedDB. The same version does not re-download the full master. A future `editions[]` manifest can resolve an old version requested by a shared link. A missing requested edition fails visibly rather than silently substituting the current one.
3. Start a new session from the selected set and copy the frozen candidate snapshot. Updating the active master does not touch prior session/archive snapshots. The old edition remains under `version:<master_version>`.
4. With no valid distributable master or local backup, Setup shows **候補データを取得できませんでした** and **再読み込み**. It does not start synthetic candidates. An already imported valid private master remains an emergency device-local fallback when the manifest is unavailable.

The master contains **metadata and remote official image URLs only**, no image files. Selection still blocks an unanswered screen if a required image fails to load. SHA-256 checks byte integrity against the manifest; it does not establish rights, official approval, source freshness, or protection if the public manifest itself is changed maliciously.

## Distribution choices requiring a human decision

| Route | Share-to-play and direct entry | Data visibility / work |
|---|---|---|
| Public versioned JSON on Pages or another public static host | No account or JSON import; same-origin current client can use it | Every visitor can download the full name/ID/profile/image-URL mapping. Public GitHub would additionally expose it in repository history. A private repository with public Pages does not make the published JSON private. It would supersede the previous private-mapping rule. No image binary need be stored. |
| Access-controlled family endpoint | Can serve a versioned JSON to authorized devices | Requires a separately configured service, cross-origin access policy or same-origin proxy, identity/session or capability mechanism, and recipient access. Current same-origin client adapter would need endpoint integration. Guest AirDrop recipient cannot use it unless access is granted. |
| Private per-device import | Already works as emergency fallback | Manual file action on each new device, so it does **not** meet the requested normal flow. |

The public app is on GitHub Pages, a static hosting service whose published sites are normally public. IndexedDB is a local browser cache and may be evicted; it does not distribute data to another device. A cross-origin authenticated fetch also needs an explicit CORS/auth design. Official URL display/hotlink behavior and image usage rights remain separate questions; no image binary was copied to the repository.

## Private staging and activation

`node build-candidate-distribution.mjs PRIVATE_MASTER.json PRIVATE_OUTPUT_DIR` creates a versioned JSON copy and SHA-256 manifest **outside the public repository**. The output contains real-person mapping. Do not commit or upload it without the distribution decision. If a public same-origin route is explicitly approved, publish both files and replace the placeholder manifest atomically or last, retaining old editions for existing shared links. An authenticated route requires a small client adapter and service setup first.

## Verification

`node verify-candidate-provision.mjs` checks a clean-device download, 105/158/263-style partition validation via the actual private master separately, cache reuse without full master download, new version retention, old version restoration, malformed/off-origin manifest rejection, integrity failure, no demo setup option and share set/version routing. `node verify-reveal-board.mjs` and `node verify-private-history-export.mjs` remain passing. These are synthetic transport tests, **not** actual AirDrop, iPad/iPhone Safari, or official-image tests. The existing Pages app is preserved pending the distribution decision.

## Physical QA after activation

Use an existing iPad with and without a stored edition; a fresh Safari device/profile; a real shared link followed by **自分も選んでみる**; then check three enabled sets, correct set/version, first images and failure message/retry with network unavailable. Complete a real session and reopen prior history after a version update. Do not mark these VERIFIED from the Node harness.
