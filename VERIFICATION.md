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
