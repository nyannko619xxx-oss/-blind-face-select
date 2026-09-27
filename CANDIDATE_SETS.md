# Candidate Sets and historical snapshots (2026-09-27)

The current official STARTO individual listing has 105 cards. The current Junior individual listing displays 158 cards. Normalized display names, candidate IDs, profile URLs and image URLs have no duplicates across the two captured lists. No candidate is excluded for subjective familiarity or television exposure. The six groups on the Junior official group listing (ACEes, KEY TO LIT, B＆ZAI, Howzit, AmBitious, Boys be) remain in JUNIOR SELECT. Their 41 members are mapped from those official group pages; the other 117 are labelled “ジュニア（公式グループ未掲載）” rather than inferring affiliation.

| Set | Membership | Frozen version |
|---|---|---|
| STARTO SELECT | 105 official STARTO personal cards | `starto-105-2026-09-27` |
| JUNIOR SELECT | 158 official Junior personal cards | `junior-158-2026-09-27` |
| ALL SELECT | Union of the two, 263 unique people | `all-263-2026-09-27` |

The private `candidate_master` records current official category, group, profile, image URL and checked date. It is **not** bundled in this public repository. The test catalog importer accepts one master with these three set definitions in local IndexedDB. The app filters the pool for a selected set and passes only IDs to the same selection engine.

Every newly started session freezes `selectionSnapshot`: candidate names, category, group, profile and image URL, along with selection timestamp, set ID/version and `visualMode=NORMAL`. Result and history read this snapshot, so a later change to the current master does not rewrite a historical JUNIOR result. Old saved sessions still load with their previous schema. A future master refresh can compare historical candidate IDs against current category to show “selected before debut”; that comparison is not implemented or asserted as a current fact.

Candidate Set and Visual Mode are independent dimensions. `FACE_ONLY` is reserved for a future presentation asset variant. A distinct session and TOP9 can be stored for each combination without modifying candidate IDs or historical NORMAL snapshots. No face-only image generation or modification has been performed; rights and modification conditions must be checked before making assets.

## Measured engine cost

With the same engine, deterministic 100-seed all-one/all-two walkthroughs used 53/62 screens for STARTO 105, 64/83 for Junior 158, and 92/118 for All 263 when All uses the supported four-face late variant. The All variant reduces screens compared with a three-face late round (93/126), but this is **not** quality approval: on 200 stable-preference seeds with all max-two choices, the resulting TOP9 contained on average 5.725 of the true nine for All. Early group collisions remain unresolved. The four-face late variant is declared as an explicit mode-specific test setting, not a hidden ranking weight.

Public Pages cloud Chrome end-to-end runs on the imported private master completed with one choice at each question: STARTO 53 screens, Junior 64, All 92. All candidate images appeared during preliminary, all three produced nine official-source reveal cards, and the same player's prior sessions remained in history. To test snapshot isolation, a temporary local master changed one revealed candidate's name and group; after importing it and reloading the app, the old ALL result still showed its original name/group. The original master was imported again after the test. These are technical browser observations, not Safari or image-use clearance.

Source listings: [STARTO individuals](https://starto.jp/s/p/search/artist?data=talent), [Junior individuals](https://jr-official.starto.jp/s/jr/page/persons), [Junior groups](https://jr-official.starto.jp/s/jr/page/groups). Official URL access does not grant reuse or modification permission.
