# Boundary evidence reliability / interaction cost — 2026-09-28

**Status: experimental evidence, no policy adoption.** Phase 2 remains NOT PASS; production Selection Engine and public app are unchanged. This study holds the B21 finalist pool, 140 synthetic candidates, seeds 0–499 and all nine saved robustness conditions fixed. `study-boundary-evidence.mjs` asserts that the single-answer path reproduces the saved Retrospective screen count, TOP9 recovery, exact-nine, Trigger count, displaced-face count, and the 17 harmful substitutions by condition. Full 18 condition/correlation rows are in `boundary-evidence-results.json`.

## Question and scoring

All policies use the same condition: the three chosen faces from a 4→3 screen must be in the frozen final TOP9. Only the decision about the omitted fourth face versus the current ninth changes. The mock player generates all group selections, pair answers and optional hesitation taps. The policy sees only those inputs. Latent score is used afterward to grade whether an accepted fourth face is actually weaker than the displaced face; it is never available to the policy.

The comparison includes:

| Diagnostic policy | Extra evidence | Decision after first answer |
|---|---|---|
| Single | None | Challenger enters if its first boundary answer wins. |
| Double all | Ask the same pair a second time on every Trigger. | Challenger enters only if **both** answers favor it. Disagreement retains incumbent. |
| Positive only | Repeat the same pair only after a challenger win. | Challenger enters only if the confirmation agrees. |
| Hesitation | Simulated player may tap “迷った”; ask again only when tagged. | Untagged first win enters; tagged first win requires a confirming win. A tagged first loss remains a loss. |
| Reframed same | After a challenger win, show the pair in a different presentation and ask again. | Both must favor challenger. Modeled fresh transient noise has the **same** amplitude. |
| Reframed half | Same flow. | Fresh transient noise has **half** the amplitude, an optimistic and unverified effect of the changed presentation. |

The hesitation model signals with probabilities 65% when modeled late utility gap is ≤2, 30% when gap is 3–5, and 2% otherwise. The algorithm sees only the simulated user's yes/no tap. These rates are assumptions, not observations about a player. The altered format is a hypothetical two-face crop/order/spacing change; no photo editing, UI or human test was performed.

For a repeated identical presentation, the second answer receives a fresh transient shock with probability 1−ρ and copies the first answer with probability ρ. We test ρ=0 and ρ=.75. Stable choice, cycles and drift can remain systematic even with a fresh shock. The changed-format confirmation uses a separate shock in both regimes. The original first answers remain byte-for-byte compatible with the prior simulator; only **new** confirmation answers use a separately mixed random draw to avoid accidental correlation from adjacent hash suffixes.

## Noisy boundary conditions, 2,000 paired runs

This table pools the two near-boundary-flip and two close-jitter levels (500 seeds each). The cycle and drift models have no harmful substitution in the single-answer reference and are reported in the JSON. “Harmful” means a lower latent-ranked challenger displaced a higher latent-ranked incumbent. “Correct initial wins kept” measures the necessary trade-off: a conservative repeat can block a warranted entry as well. Confirmation counts are **gross** extra questions; net screen change includes pairwise insertion comparisons avoided after rejection. Exact means 9/9 sessions out of 2,000.

| Policy | ρ | Harmful / 2,000 | Correct initial wins kept / 137 | Mean true TOP9 | Exact / 2,000 | Confirmations / 2,000 | Net extra screens / session | Extra taps / 2,000 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Single | — | 17 | 137 | 8.307 | 827 | 0 | 0 | 0 |
| Double all | 0 | 5 | 113 | 8.308 | 833 | 1,389 | +0.604 | 0 |
| Positive only | 0 | 5 | 113 | 8.308 | 833 | 185 | +0.002 | 0 |
| Hesitation | 0 | 10 | 128 | 8.309 | 832 | 255 | +0.086 | 255 |
| Reframed same | independent | 4 | 116 | 8.310 | 835 | 186 | +0.010 | 0 |
| Reframed half | optimistic | 2 | 123 | 8.313 | 839 | 186 | +0.012 | 0 |
| Double all | .75 | 14 | 131 | 8.307 | 830 | 1,389 | +0.672 | 0 |
| Positive only | .75 | 14 | 131 | 8.307 | 830 | 186 | +0.070 | 0 |
| Hesitation | .75 | 13 | 136 | 8.309 | 832 | 255 | +0.114 | 255 |

The two repeat policies produced **identical TOP9 results in all 9,000 paired sessions** (nine noise conditions × two ρ assumptions × 500 seeds). This follows from their conservative rule: once the first answer favors the incumbent, a second answer cannot cause entry. Double all simply asks on more first-loss events. It is a dominance observation **within this rule definition**, not a general verdict on asking twice.

The single-answer Retrospective path already asks about 103 screens for 140 faces under these B21 experiments. Double all adds roughly .6–.7 net screens per session (about .69 gross repeated questions); positive-only asks .093 gross extra questions per session and may offset that cost by skipping insertion comparisons. A net screen change near zero **does not mean zero interruption**: a repeated face pair and a new decision are still required. Hesitation adds .128 tag taps and .128 confirmations per session in the four noisy conditions; its modeled tag signal missed several wrong first wins. Reframed confirmation also interrupts about .093 times per session and changes the visual task. These are screen/tap proxies; subjective fatigue, recognition from repetition, and interruption at the end of Ranking were not measured.

Across the four noisy conditions, the single path initially accepted 49 boundary wins that contradicted the anchored latent comparison. Independent positive-only confirmation kept 14 such wins; with ρ=.75 it kept 40. Its harmful substitutions changed 17→5 or 17→14 respectively, while keeping 113 or 131 of 137 initially warranted wins. The optimistic reframed-half model kept 9 wrong wins and 123 warranted wins, but that assumed error reduction has **no human evidence**. A different display could also increase recognition or bias; the simulator does not model that.

Under stable preference, all policies retain the same 8.758/9 and 388/500, but still ask extra questions: double all 350/500 (.700/session), positive-only 34/500 (.068/session), hesitation 75 confirmations and 75 taps/500, reframed 34/500. Deterministic cycle and drift conditions gain no harmful-substitution reduction from identical repetition. The p95 screens and per-candidate display maxima for every policy and condition are in the JSON; those metrics were computed, not inferred from mean cost.

## Decision boundary and limitations

**Single answer acceptable? UNVERIFIED for humans.** It produced 17 harmful substitutions in 2,000 bounded stochastic scenario-runs, but this rate is not a human error rate. It avoids repeat interruptions and retains every first warranted win. The user may value flexibility in changing preferences more than anchored-score consistency.

**Minimum sufficient additional evidence?** Conditional confirmation after an initial challenger win is a low-gross-cost candidate under the tested conservative acceptance rule. It has the same outcome as asking every Trigger twice while requesting far fewer repeats. Its benefit nearly vanishes when repeat answers are strongly correlated, and it blocks some warranted entries. It remains a **candidate**, not an adopted rule.

**Changed format?** Same-amplitude and optimistic half-amplitude models are sensitivity bounds. Their apparent improvement cannot be credited to a real UI until a human pilot tests whether format actually changes error correlation and choice quality. The “迷った” model is likewise uncalibrated and may undercount unreported hesitation.

A human test is needed to measure repeat-answer agreement, position/order bias, whether hesitation identifies unstable answers, tolerance for an end-of-play repeated face, and whether a changed display improves judgment without leaking identity cues. A small blinded pilot could log decisions and time without presuming a fixed true rank. No Boundary Rule, Production implementation, Preliminary/Main redesign, or Phase change was made.
