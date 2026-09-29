# Formal Playable promotion gate — 2026-09-29

Status: **STOP before changing main / GitHub Pages or deploying a formal Worker.** Human QA passed the isolated Owner Playable and Reveal presentation. It did not test formal data migration or real-candidate play by an invited recipient.

## Measured state

| Surface | Measured behavior |
|---|---|
| Public main (00b39fd) / Pages | Root index.html is v0.3 with tutorial, five-photo test, 140 synthetic selection test and a separate app.html link. |
| checkpoint/tap-reveal (a37c35b) / isolated Worker | Owner Home offers STARTO 105 / Junior 158 / ALL 263. The 9→1 touch Reveal and medal presentation are Human QA PASS. |
| Invite recipient | Non-Owner sessions have only the fictional 55-person game. A shared link does not provision real candidates. |
| Private Master and progress | Master is imported once into the Test origin IndexedDB, bfs-owner-real-test-v01. Progress keys depend on the SHA-256 of the Test session bearer. Pages or a new Worker origin cannot read them. |
| Test quota reset | The reset-test-owner-quota workflow can mutate the dedicated Test D1 Owner's daily Invite row on explicit rerun. This must not control formal usage. |
| Formal distribution | candidate-distribution.json remains awaiting_private_distribution_endpoint. No private 263-person mapping or image binary is in public Git, Worker or D1. |

Publishing Test UI files on Pages alone loses access to the Owner browser's IndexedDB and session. Redirecting or framing Pages to the Test Worker preserves the Test D1/reset and fictional recipient game in the formal path. Neither is a completed production promotion.

## Decisions needed before release

1. **Formal origin and migration.** A separate formal Worker/D1 isolates Test reset. It requires one-time Owner authorization and explicit private transfer of frozen Master and saved progress. The Test origin cannot be read silently by Pages/new Worker. Do not place bearer or data in URL, repository, logs or artifacts. Existing Test invites remain Test-only unless a migration policy is chosen.
2. **Invited users' candidate scope.** Owner-only technical test authorization did not approve delivering identity/image URL mapping to invitees. A formal Home can present real modes to the Owner while invitees see a clearly labeled fictional trial; real recipient play requires a separate delivery and use-scope decision. Do not label unavailable modes playable.
3. **Official images.** Owner iPad technical display from official HTTPS origins is verified; image rights remain UNVERIFIED. Regular shared use or distribution of mappings to invitees is a distinct scope decision. No binary rehosting or R2 is needed for the measured Owner path.

| Release path | Effect |
|---|---|
| New formal Worker/D1, Owner-only real modes, recipients fictional trial | Isolates Test reset and avoids recipient mapping delivery. Requires Owner reauthorization and private progress migration plus judgment on intended formal image use. Old Test links stay on Test. |
| Keep existing Worker/D1 as regular entry through Pages | Preserves Owner browser storage immediately, but Test reset, fixed Owner marker, 30-day session and fictional recipient game stay coupled to regular use. |
| New formal Worker/D1 with real modes for invitees | Meets Share→Real Play, but requires access-controlled Master delivery and explicit image URL mapping/embedding scope decision. Owner migration still needed. |
| Keep Pages unchanged for now | Avoids a misleading formal launch; Human QA Playable remains on the isolated Test URL. |

## Verification after a release path is chosen

- Root Pages URL shows Playable Home; old tutorial and synthetic controls absent from normal navigation.
- STARTO 105 / Junior 158 / ALL 263 resolve against private frozen set on formal origin, with no synthetic fallback.
- Compare Owner saved TOP9 and in-progress session before/after migration: revealCount, frozen snapshot, engine history and session ownership. Preserve Test data until verified.
- Automated 5/4/3 selection, uncertainty, image failure stop/retry, resume, 9→1 touch Reveal, 3/2/1 temporary scale, equal final grid, Gold/Silver/Bronze, replay and legacy result compatibility.
- Invite issue/claim/re-invite, once/day JST and expiry on formal backend; Test reset has no formal credential, binding or path. Recipient UI reflects actual entitlement.
- Final Owner iPad Safari playtest on formal URL. Invited-user real-image QA remains a separate gate.

No production source, Worker, D1, Pages, Master, image binary or saved record was changed. Phase 2 NOT PASS; Retrospective Trigger UNADOPTED; image rights UNVERIFIED.
