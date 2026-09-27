# Verification ledger — 2026-09-27

The repository and GitHub Pages are the implementation baseline. `app.html` is the integrated flow. The original `index.html` Safari v0.3 tutorial remains available.

| Area | Implemented | Verified | Remaining |
|---|---|---|---|
| Selection engine | Five up to two; four up to two; late three choose one; recovery; up to two TOP9 boundary matches; direct player ranking | 4,200 deterministic simulated sessions across 9–150 candidates, 500 preference-order runs; 140-candidate walkthrough and 135-photo run in cloud Chrome | Human preference quality and iPad Safari operation |
| Candidate catalog | 105 official STARTO personal cards plus 158 official Junior cards inventoried; provisional 135-person review set has source URLs and required provenance fields | Names and image URLs extracted from the same official cards; all 135 images loaded during preliminary in cloud Chrome | Scope approval, individual image visual audit, rights and distribution decision |
| Blind selection and reveal | Faces without name/group text or identity-bearing candidate ID during play; TOP9 revealed from ninth to first with official source links | 135-photo Pages run: 59 screens, all nine reveals and result images loaded in cloud Chrome | iPad Safari visual/interaction check |
| Analysis | Full choice history, uncertainty flag, selection/nonselection/reappearance counts, direct/borderline path | Populated in completed 135-photo run | Interpretation with genuine player choices |
| Players and persistence | Separate profiles, age as metadata, progress autosave, latest and archived sessions | Resume after reload and two player records in cloud Chrome; archived 135-photo result reopened and 140-ID session resumed at screen two on Pages | Safari storage retention and multi-session usability |
| Share | Result data in URL fragment; 1/6/24/72/168/custom hours; expired message | Opened valid link in another tab; expired link showed exact required Japanese message | Safari recipient check; client clock is not access control |

## Automated engine checks

`selection-engine.js` has no beauty model or identity inference. It uses player selections to determine survivors and pairwise player decisions for the order. Support counts and hesitation only choose additional opponents. The 4,200-session run covered candidate counts 9, 20, 40, 105, 135, 140, and 150, two late sizes, three choice patterns, and 100 seeds each. Each run terminated with nine unique finalists and no candidate appeared more than 20 times. A separate set of 500 consistent-preference simulations produced the expected pairwise order. A 140-candidate instance used 58–73 screens depending on choice pattern and late size. These checks do not prove that a real person's TOP9 is stable or that 73 screens feels acceptable.

## Image architecture and scope decision

The public repository contains no real-person image files and no real-person name-to-image manifest. The review catalog can be imported once per device into IndexedDB; images then load directly from official HTTPS origins through `<img>`. The 135-photo cloud Chrome run established current technical reachability, not reuse permission, future URL stability, or iPad Safari reachability. Explicit image caching in Cache API/IndexedDB is not implemented; browser HTTP caching may occur. A broken image blocks the next choice so that the candidate cannot silently disappear.

Three choices require human direction before making the review catalog the default on both devices:

1. Candidate scope: 105 STARTO personal artists; provisional 135 with five Junior groups; or another defined subset of the 263 observed individual cards (engine currently supports up to 150 per catalog).
2. Distribution and rights: publish the 135 name/image URL mapping in the public repository (no image files, but public linkage and external embedding); privately transfer a one-time JSON to each device (extra setup); or use a separately configured access-controlled host after assessing image reuse terms (new service and setup). The app currently supports the private one-time setup path as a technical fallback, not as the desired final workflow.
3. iPad Safari test on the actual Pages URL: landscape and portrait five/four/three faces, photo loading, start/resume, ninth-to-first reveal, a second player, archived result, and valid/expired link on another device. This is a consolidated human check after Work-side tests.

No rights inference follows from an official URL, a successful hotlink, or personal intent. See [ASSET_ARCHITECTURE.md](ASSET_ARCHITECTURE.md).
