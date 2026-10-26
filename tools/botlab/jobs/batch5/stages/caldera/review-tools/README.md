# The independent reviewer's probes (copied by the lead, 2026-10-26)
These are the measures the reviews are judged by. Run them the way the review JSON's evidence says (page tests through
tools/botlab/run.sh with PRE= / PAGE= as each file's header states) and quote their numbers in the report — the builder's own
counts are not comparable unless they come from these files. probe-bare.js: the bare-piece count on review 1's 812-piece basis.
probe-props*.js: loose / ghost dressing on walkable floors and in lava. probe-cover.js (if present): paintable floor area
coplanar with or covered by dressing, and paintable wall area under opaque skins. inkmetric.py + ink-pre.js: the share of
background pixels at least as saturated as the ink, lower two thirds of the frame. tile.py: contact sheets.
