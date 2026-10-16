#!/bin/bash
# floor grids for caldera at both levels (Node, cover-map's floor rule), then the reviewer's shape metrics
cd /Users/danielosling/Desktop/1/st-b5-caldera
S=/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/rb1
for L in low high; do LAVA=$L node --import ./tools/botlab/jobs/batch5/caldera/r3/reg.mjs $S/floorgrid.mjs caldera $S/grid-$L.json & done; wait
cd $S && python3 shape.py 2>&1 | grep -v what-if | head -20
