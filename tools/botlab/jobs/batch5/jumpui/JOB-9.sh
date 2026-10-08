#!/bin/bash
# kind: tests
# JOB-9 — jumpui, fix round 1 taken over (2026-10-09). The game code is JOB-7's (4e7a6f9); since then only jump-ui.js
# changed (its crowd scene reads the top HUD from the page, not from hud-jumps.js's cache).
# 1. The proof the review asked for: today's jump-ui test against the REVIEWED code (bd58a8e's src/ui/hud-jumps.js and
#    styles/hud-jumps.css swapped in, everything else at HEAD), in the configurations the review named. These must FAIL:
#    Zone Control 960x600 (stack, pins, size), Tower Command and Boss Battle at the window's size (stack), Turf War
#    960x600 (stack, size). The files go straight back (the tree is printed after).
# 2. The whole regress list at HEAD (regress.sh: the 12-cell jump-ui matrix — every mode at 1512x945 / 1280x720 /
#    960x600 — and the regressions), then the matrix once more.
# 3. bot-specials: 5 more runs at HEAD and 6 at the base (7ee5ad5, a copy with no jumpui code): its single flaky checks
#    (JOB-5 Bubble Blower, JOB-7 Mega Stamp, JOB-8 Crab Rig) are not this package's.
# Summary -> $JOB_OUT/summary.txt; every FAIL line -> $JOB_OUT/fails.txt.
set -u
T=tools/botlab/tests; RUN=tools/botlab/run.sh
O=${JOB_OUT:-.botlab/jumpui-j9-out}; L=.botlab/jumpui-j9; mkdir -p "$O" "$L"
S="$O/summary.txt"; FL="$O/fails.txt"
export T RUN L
one() {   # name env… harness
  local name=$1; shift
  env WATCHDOG=900000 "$@" > "$L/$name.log" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$L/$name.log" | tail -1) $(grep -c '^FAIL' "$L/$name.log") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|MAP MISMATCH|console errors: [^n]' "$L/$name.log" | cut -c1-260
}
export -f one
par() { xargs -P "${PAR:-3}" -L 1 bash -c 'one "$@"' _; }
fails() { for n in "$@"; do grep -E '^FAIL|HARNESS' "$L/$n.log" 2>/dev/null | sed "s|^|$n: |" | cut -c1-900; done >> "$FL"; }
restore() { git checkout HEAD -- src/ui/hud-jumps.js styles/hud-jumps.css 2>/dev/null; }
trap restore EXIT

echo "### JOB-9 @ ${JOB_SHA:-$(git rev-parse --short HEAD)}" | tee -a "$S"
echo "### 1. the reviewed code (bd58a8e hud-jumps.js + .css) under today's test: must FAIL" | tee -a "$S"
git show bd58a8e:src/ui/hud-jumps.js > src/ui/hud-jumps.js
git show bd58a8e:styles/hud-jumps.css > styles/hud-jumps.css
echo "# swapped in: $(git status --short src styles | tr '\n' ' ')" | tee -a "$S"
printf '%s\n' \
  "old-zones-960 MAP=testbox MODE=zones W=960 H=600 PAGE_ARGS=only=stack,pins,size PAGE=$T/jump-ui.js $RUN tools/botlab/page.cjs" \
  "old-tower MAP=testbox MODE=tower PAGE_ARGS=only=stack PAGE=$T/jump-ui.js $RUN tools/botlab/page.cjs" \
  "old-boss MAP=testbox MODE=boss PAGE_ARGS=only=stack PAGE=$T/jump-ui.js $RUN tools/botlab/page.cjs" \
  "old-turf-960 MAP=testbox MODE=turf W=960 H=600 PAGE_ARGS=only=stack,size PAGE=$T/jump-ui.js $RUN tools/botlab/page.cjs" | par | tee -a "$S"
restore
echo "# tree after the swap (must be empty): [$(git status --short src styles | tr '\n' ' ')]" | tee -a "$S"
fails old-zones-960 old-tower old-boss old-turf-960

echo "### 2a. the whole regress list at HEAD" | tee -a "$S"
PAR=${PAR:-3} LOG=$L/r1 tools/botlab/jobs/batch5/jumpui/regress.sh | tee -a "$S"
echo "### 2b. the jump-ui matrix again (every mode x 1512x945 / 1280x720 / 960x600)" | tee -a "$S"
ONLY=jump-ui-all PAR=${PAR:-3} LOG=$L/r2 tools/botlab/jobs/batch5/jumpui/regress.sh | tee -a "$S"
for f in "$L"/r1/*.log "$L"/r2/*.log; do grep -E '^FAIL|HARNESS' "$f" | sed "s|^|$(basename "$(dirname "$f")")/$(basename "$f" .log): |" | cut -c1-900; done >> "$FL"

echo "### 3. bot-specials: 5 more at HEAD, 6 at the base 7ee5ad5 (no jumpui code)" | tee -a "$S"
B=.botlab/jumpui-j9-base; mkdir -p "$B"
git archive 7ee5ad5 | tar -x -C "$B" && ln -sfn "$(cd node_modules && pwd -P)" "$B/node_modules"
echo "# base copy: $(ls "$B" | wc -l | tr -d ' ') entries, node_modules -> $(readlink "$B/node_modules")" | tee -a "$S"
{
  for i in 1 2 3 4 5; do echo "bs-head-$i MAP=testbox MODE=turf PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs"; done
  # (the copy's run.sh cds into the copy: PAGE and the harness resolve there)
  for i in 1 2 3 4 5 6; do echo "bs-base-$i MAP=testbox MODE=turf PAGE=$T/bot-specials.js $B/$RUN tools/botlab/page.cjs"; done
} | par | tee -a "$S"
fails bs-head-1 bs-head-2 bs-head-3 bs-head-4 bs-head-5 bs-base-1 bs-base-2 bs-base-3 bs-base-4 bs-base-5 bs-base-6
echo "### done" | tee -a "$S"
