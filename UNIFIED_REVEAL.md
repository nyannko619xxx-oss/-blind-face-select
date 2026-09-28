# Unified Reveal v0.1 — 2026-09-28

Presentation-only change to `app.html`, `app.css`, `app.js` result handlers and `reveal-board.js`. The Production Selection Engine, question order, candidate survival, ranking and frozen session data are untouched. Phase 2 remains NOT PASS; Retrospective Trigger remains unadopted.

The same 3×3 board shows positions `9 | 8 | 7 / 3 | 1 | 2 / 6 | 5 | 4`. It starts with nine equal veiled slots; names and image elements are inserted only as ranks 9→1 are unveiled. The already decided `state.ranking[rank-1]` supplies each card. Rank 3 and 2 gain a mild scale/border emphasis after their reveal. Rank 1 has the longest pause and dwell; the finished board changes its center cell hierarchy in place. No second overview screen is created. The animation takes about 8–9 seconds in ordinary motion, with a short natural veil/fade; `prefers-reduced-motion` abbreviates it. The player can skip or replay it. A completed saved session opens directly in final state; a fresh completion runs the reveal.

Card activation opens a large dialog with rank, snapshot name/affiliation, portrait and official source. Closing returns to the same board. The shared-result path uses the same board; its first visit reveals automatically, then presents **自分も選んでみる**. A same-tab repeat visit is shown complete. Invalid or expired shares do not render the board. The share payload and expiry semantics are unchanged.

On phone portrait, the result header is hidden, the board remains three columns and three rows, and board height is constrained relative to the small viewport. The analysis and share controls are below the board. Exact iPhone/iPad Safari fit and visual crop remain for physical QA.

Verification: `node verify-reveal-board.mjs` checks all nine fixed positions, veil with no name/image before reveal, rank progression, detail callback and reduced-motion completion. `node verify-private-history-export.mjs` remains PASS. Git diff confirms `selection-engine.js` unchanged. Visual/browser QA on Pages and Safari is recorded separately in `VERIFICATION.md`.
