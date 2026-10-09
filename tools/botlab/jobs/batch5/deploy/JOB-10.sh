#!/bin/bash
# kind: tests
# deploy JOB-10 (fix round 1): JOB-9 at 542c932 failed once each: deployables' "a foe in sight comes first" (the bot never
# went back to the beacon: a parked foe to find, most likely — the scene now hides every other foe behind the wall and
# names what the bot did when it fails), surf's "a bot shoots an enemy buoy down" (now with a fresh brain and what the bot
# did in the check's name), sub-tweaks' sprinkler drop spread and sub-tweaks2's bow trail (not this package's code: repeats).
# Same code (src unchanged since 742d51b); tests only. 3 at a time:
#   deployables only=bots ×6, surf ×6, deployables (all) ×2, sub-tweaks ×3, sub-tweaks2 ×3, bot-specials ×3
set -u
mkdir -p "$JOB_OUT/x"
x() {   # name i env…
  local n=$1 i=$2; shift 2
  local L="$JOB_OUT/x/$n-$i.log"
  env WATCHDOG=900000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$L" 2>&1
  echo "== $n $i: $(grep -E '^RESULT' "$L" | tail -1)"
  grep -E '^FAIL' "$L" | cut -c1-390
}
export -f x; export JOB_OUT
T=tools/botlab/tests
echo "### deploy JOB-10 at $(git rev-parse --short HEAD)"
{ for i in 1 2 3 4 5 6; do echo "bots $i MAP=testbox MODE=turf PAGE=$T/deployables.js PAGE_ARGS=only=bots"; echo "surf $i MAP=testbox MODE=turf PAGE=$T/surf.js"; done
  for i in 1 2; do echo "deployables $i MAP=testbox MODE=turf PAGE=$T/deployables.js"; done
  for i in 1 2 3; do echo "sub-tweaks $i MAP=testbox MODE=turf PAGE=$T/sub-tweaks.js"; echo "sub-tweaks2 $i MAP=testbox MODE=turf PAGE=$T/sub-tweaks2.js"; echo "bot-specials $i MAP=testbox MODE=turf PAGE=$T/bot-specials.js"; done; } \
  | xargs -P 3 -L 1 bash -c 'x "$@"' _ | tee "$JOB_OUT/summary.txt"
echo "SUMMARY $(grep -c '^== ' "$JOB_OUT/summary.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/summary.txt") FAIL lines"
