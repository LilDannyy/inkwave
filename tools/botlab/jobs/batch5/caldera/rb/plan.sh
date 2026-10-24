#!/bin/bash
# plan.sh tag : Node samples at both levels, gridded plans, footprint metrics
cd /Users/danielosling/Desktop/1/st-b5-caldera
S=/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/rb1
T=${1:-x}
export ROOT=/Users/danielosling/Desktop/1/st-b5-caldera/
for L in low high; do LAVA=$L MODE=${MODE:-turf} node --import ./tools/botlab/jobs/batch5/caldera/r3/reg.mjs $S/plan.mjs $S/plan-$L.json 0.5 > /dev/null & LAVA=$L node --import ./tools/botlab/jobs/batch5/caldera/r3/reg.mjs $S/floorgrid.mjs caldera $S/grid-$L.json >/dev/null & done; wait
cd $S && python3 gridplan.py plan-low.json $T-low.png "$T LOW" >/dev/null && python3 gridplan.py plan-high.json $T-high.png "$T HIGH" >/dev/null && python3 shape.py 2>&1 | grep -E "^cal|^halyard" | grep -v what-if | head -9
