# -blind-face-select
    Private blind face preference selector 

## Phase 1: local photo display test

Open `phase1.html` from GitHub Pages in Safari. Choose five photos from your device. The browser displays them with a 3:4 crop and local position controls, then walks through 5 / 4 / 3 face layouts. Photos stay in browser memory: there is no upload, storage, analytics, or URL serialization. Closing the page clears them. The v0.3 tutorial remains in `index.html`.

This phase checks layout and controls only. Its progression does not produce a ranking or TOP9. A public GitHub Pages URL cannot keep bundled photos private, so real photos must not be committed to this repository. A later share feature needs a separate decision about how recipients receive photos.

## Phase 2: selection logic experiment

Open `phase2.html` for a 140-ID walkthrough. This uses no real photos. `selection-engine.js` tracks every choice and resolves nine finalists through player comparisons. A 3-person or 4-person late comparison can be selected for an exploratory screen-count tradeoff; the UI also supports one-step undo. The image source comparison and open decisions are in [ASSET_ARCHITECTURE.md](ASSET_ARCHITECTURE.md). The production plan is to preassociate candidates with available official image sources; manual selection of ~140 photos per play is not the intended workflow.
