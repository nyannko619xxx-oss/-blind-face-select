# Human Boundary Reliability Pilot v0.1 — experimental only

**Status: IMPLEMENTED; automated schedule/log checks below. Human reliability and iPad Safari operation UNVERIFIED.** Phase 2 remains NOT PASS. This tool does not import `selection-engine.js`, change `app.js`, write production player/session keys, or decide a TOP9. Its local key is `blind-face-select-human-boundary-pilot-v0.1`. No human answers or real-person photo manifest are committed.

## Pair selection and run

Prior retrospective traces contain synthetic `cN` IDs and latent positions, not an official person-to-photo mapping. They **cannot establish 20–30 real boundary photo pairs**. Pair provenance, participant eligibility, and whether real official photos meet comparable visual criteria are UNVERIFIED. Do not infer a real human boundary from the synthetic rankings.

The pilot accepts a separately prepared private JSON manifest with 21, 24, 27, or 30 **distinct, preselected** pairs. For the actual test, first obtain candidate IDs from a locally held catalog and select pairs from observed human near-boundary choices, if available; otherwise document another defensible selection rule before interpreting results. Do not publish the mapping. The experimental page checks every ID against the same-origin local IndexedDB catalog, never displays names/groups/IDs during comparison, and never copies images into the repository. The browser requests images from the catalog's HTTPS URLs. A broken image stops progression.

Manifest format (replace example IDs with IDs in the locally installed candidate master, and include 21–30 pairs):

```json
{
  "version": "pilot-pairs-2026-09-28-v1",
  "pairs": [
    {"pair_id": "P001", "a_id": "PRIVATE_CANDIDATE_A", "b_id": "PRIVATE_CANDIDATE_B"}
  ]
}
```

1. On the same origin/browser, import the private candidate master once via `catalog.html` if absent. Open `human-boundary-pilot.html` through GitHub Pages (or a local HTTP server for technical QA; `file://` has different storage/origin behavior).
2. Import the private Pair manifest. Check that its 21–30 pairs truly match the intended human boundary sampling rule. Start. Tap one face per screen. After each image fully loads, timing begins; it stops at the first tap. Avoid browser back during the run.
3. The pilot allocates pairs equally to `single`, `same_repeat`, and `reframed_confirmation` by client cryptographic randomness. All first presentations precede confirmations. The full first-pass order is shuffled; confirmations revisit pairs in that order, yielding at least 13 intervening other displays at the minimum size. First left/right sides are balanced within each arm. Same repeat preserves side placement; reframe reverses it. Face pixels, crop, and styling are identical. Neither participant nor UI sees the arm or the repeat marker during play.
4. Save a partial JSON if interrupted; the session resumes from the device's separate localStorage key on reload. After completion, download the final JSON. Exported IDs are pseudonymous **only while the private master remains private**; the file can still reveal preferences if linked to that master. Store it privately. A new run clears the previous in-browser pilot only after explicit export reminder.

## Log and comparison

Schema `human-boundary-pilot-v0.1`: `pilot_id`, `manifest_version`, start/export timestamps, `completed`, `pair_count`, `sequence_count`, full `presentation_order` (pair, arm, pass, left/right candidate IDs), `responses` (sequence, pair, arm, pass, side and candidate chosen, left/right IDs, response milliseconds, ISO timestamp), and one `pairs` row per pair (first/confirmation choice, agreement/flip or `null` for single/unanswered, first/confirmation side, time, sequence and timestamp). Images, names, group and profile URLs are not exported. `single` is a no-confirmation arm and provides first-judgment response/side/time reference, **not an agreement measure**. Compare agreement/flip and response-time distributions for same/reframe, conditioning on first choice and side; examine side switching and repeat effects. Do not score human choices using synthetic latent rank. No PASS threshold is predefined.

The reframe changes only left/right position. This tests one narrow format intervention, not crop, face-only editing, or assumed independent error. The arms use different pairs, so pair difficulty may confound the comparison in a small sample. A later crossover or multiple participants may be needed, but is outside v0.1. Human repeat correlation, true preference, memory effects, official image reachability on iPad Safari, subjective fatigue, pair representativeness, and whether this predicts real TOP9 outcomes remain UNVERIFIED. Do not infer adoption of a Boundary Rule from this pilot alone.

## Verification

Run `node verify-human-boundary-pilot.mjs`. It checks the three-arm allocation, position balance, 12+ intervening screens, same/reversed position, pair validation, and export agreement/flip fields. Browser manual QA: import a *private test* catalog and manifest; check both iPad orientations, image load failure blocking, first/confirmation choices and response times in exported JSON, reload/resume, completion/export, and no names/IDs on the selection screen. Human preference data collection itself has **not** been performed by Work.
