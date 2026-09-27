# Private Selection History Export v0.1 — 2026-09-28

**Status: independent read-only export IMPLEMENTED. Automated projection VERIFIED; iPad Safari download UNVERIFIED.** Phase 2 remains NOT PASS. Neither `app.js` nor `selection-engine.js` was modified. This exports an existing completed *catalog* session; it does not generate new questions or infer a player's preference.

## Existing mechanism and minimum addition

The existing app stores its latest session by player in `localStorage` key `blind-face-select-v2` and earlier sessions in `archive[playerId]`. It displays history in the result UI but has **no JSON session-history download**. Result sharing exports only a nine-person reveal, so it is insufficient for Pair Selection Audit. The standalone `private-history-export.html` reads the same-origin localStorage and offers a JSON download. Its script calls `getItem` only, never `setItem`, `removeItem`, or an app/Selection Engine API. There is no network request carrying session data. No private mapping or history is committed.

## JSON projection

Schema `bfs-private-selection-history-v0.1`:

- `provenance`: existing storage key, latest/archive location, archive index, pseudonymous player ID, derived session reference, creation/completion/update timestamps, catalog session type.
- `selection_snapshot`: captured time, frozen set ID/version, master version, visual mode, **candidate IDs only** in frozen pool order.
- `events`: existing `state.history` in `event_sequence` order, each with `phase`, `shown_ids`, `chosen_ids`, and `uncertain`. This includes actual `boundary` and `rank` events as logged by Production.
- `final_ranking_ids`: existing ordered `state.ranking` TOP9.
- `event_time_note`: individual question timestamps do not exist in the current Production history; sequence is available, but per-event wall-clock timing is not.

Nickname, age bracket, candidate names/groups/profile URLs and image URLs are **omitted**. The IDs and player preference data are still private: a separately held candidate master can re-identify them. Do not place this JSON in Public GitHub, a public URL or a result share link. Send it to the intended analysis environment privately. The export alone can be parsed for candidate pairs and stages; joining with the private master is needed to display real photos in the eventual Pilot. It does not claim a session was genuinely human; that provenance must be confirmed by the participant, because a scripted test can produce the same storage format.

## iPad Safari steps

1. In iPad Safari, configure the private candidate master once on `catalog.html` if needed. On `app.html`, select STARTO/JUNIOR/ALL and make a genuine Blind Face Select run to completion. **Do not choose the 140-ID demo for this audit.**
2. In the same Safari browser, open `private-history-export.html`. Select the completed session by set/version/date. Tap **非公開JSONを保存**. Find the JSON in Safari downloads or the Files app. No Developer Tools are needed.
3. Keep the JSON private; provide it to the Pair Selection Audit only through a private file handoff. If multiple sessions exist, export each separately. A session with only a few direct comparisons may still be insufficient to produce 18 Boundary and 6 Control pairs.

Safari QA during this real run: portrait and landscape photo layout and cropping; all five/four/three-face stages as encountered (four-person Late may appear in ALL); image loading/error handling; selected highlight and 迷った flag; background/return resume; completed TOP9 and 9→1 reveal; exported set/version/date, event count, `boundary`/`rank` event contents and ranking against the session shown in the app. Do not use ChatGPT HTML preview as the test environment.

## Verification and limitations

`node verify-private-history-export.mjs` checks latest/archive selection, schema, boundary/rank preservation, omitted private fields, duplicate TOP9 rejection, and byte-for-byte non-mutation of the fixture. Source diff shows Production files unchanged. Browser download behavior and actual iPad Safari operation require a user run. Storage is origin/browser-local and may be cleared by Safari; the export cannot retrieve another device's sessions. No human choice, Pair manifest, Retrospective rule or Phase change was made.
