#!/bin/bash
# kind: tests
# batch5 tuning JOB-4 (fix round 1, the autonomous runner's protocol): (1) the package's tests ×3 — tuning.js on Turf War
# and on Zone Control, weapon-names.cjs (now with the card icon / name overlap and paint-order checks); (2) the proof runs,
# each on files swapped in and put straight back: zones.js and ui.css as they were at bbade3e (the reviewed head: the
# horn and icon checks must FAIL there), the old values (PAGE_ARGS=old) and the old UI (7ee5ad5's menus.js + ui.css);
# (3) the regressions; (4) three 90 s Zone Control bot matches (the horn and overtime under the new _controls) for
# errors. Summary → $JOB_OUT/summary.txt; the FAIL lines of every run → $JOB_OUT/fails.txt.
set -u
echo "### tuning JOB-4 at $(git rev-parse --short HEAD)"
T=tools/botlab/tests; RUN=tools/botlab/run.sh; LOG="$JOB_OUT/logs"; mkdir -p "$LOG"
export T RUN LOG
one() {   # name env… harness
  local name=$1; shift
  env WATCHDOG=900000 "$@" > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$LOG/$name.log" | tail -1) $(grep -c '^FAIL' "$LOG/$name.log") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|MAP MISMATCH|console errors: [^n]|c0 console: [^n]|c1 console: [^n]|uncaught' "$LOG/$name.log" | cut -c1-500
}
match() {   # name env…: a 90 s all-bot Zone Control match: its result and its console warnings / errors
  local name=$1; shift
  env WATCHDOG=900000 SECS=90 MODE=zones "$@" $RUN tools/botlab/match.cjs > "$LOG/$name.log" 2>&1
  echo "== $name: $(grep -cE '^RESULT_JSON' "$LOG/$name.log") result line(s)"
  grep -E '^== |FRAME ERRORS|^CONSOLE|^  \[|WATCHDOG|HARNESS|MAP MISMATCH' "$LOG/$name.log" | cut -c1-400 | head -12
}
export -f one match
par() { xargs -P 3 -L 1 bash -c 'one "$@"' _; }
NAMES="CLIENTS=1 Q0=netmock=1&mockauto=0 NET=$T/weapon-names.cjs"
{
echo "## 1. own tests ×3"
for i in 1 2 3; do
  echo "tuning-turf-$i MAP=testbox MODE=turf PAGE=$T/tuning.js $RUN tools/botlab/page.cjs"
  echo "tuning-zones-$i MAP=testbox MODE=zones PAGE=$T/tuning.js $RUN tools/botlab/page.cjs"
  echo "names-$i $NAMES $RUN tools/botlab/netpage.cjs"
done | par

echo "## 2a. the reviewed head's zones.js and ui.css (bbade3e): the horn checks and the icon checks must FAIL"
git show bbade3e:src/game/zones.js > src/game/zones.js
git show bbade3e:styles/ui.css > styles/ui.css
printf '%s\n' \
  "head-zones MAP=testbox MODE=zones PAGE=$T/tuning.js $RUN tools/botlab/page.cjs" \
  "head-names-icons $NAMES NET_ARGS=only=icons $RUN tools/botlab/netpage.cjs" | par
git checkout HEAD -- src/game/zones.js styles/ui.css

echo "## 2b. the old values (PAGE_ARGS=old): the rule checks must FAIL"
printf '%s\n' \
  "old-tuning-turf MAP=testbox MODE=turf PAGE=$T/tuning.js PAGE_ARGS=old $RUN tools/botlab/page.cjs" \
  "old-tuning-zones MAP=testbox MODE=zones PAGE=$T/tuning.js PAGE_ARGS=old $RUN tools/botlab/page.cjs" | par

echo "## 2c. the old UI (7ee5ad5's menus.js + ui.css): the name checks must FAIL"
git checkout 7ee5ad5 -- src/ui/menus.js styles/ui.css
one old-names $NAMES NET_ARGS=only=main,setup,loadout,hub,lobby,kits,icons $RUN tools/botlab/netpage.cjs
git checkout HEAD -- src/ui/menus.js styles/ui.css
echo "# tree after the swaps (must be empty): [$(git status --short src styles | tr '\n' ' ')]"

echo "## 3. regressions"
printf '%s\n' \
  "hud-lead-turf MAP=testbox MODE=turf PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs" \
  "hud-lead-zones MAP=testbox MODE=zones PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs" \
  "hud-lead-tower MAP=testbox MODE=tower PAGE=$T/hud-lead.js $RUN tools/botlab/page.cjs" \
  "loadout-picker MAP=testbox PAGE=$T/loadout-picker.js $RUN tools/botlab/page.cjs" \
  "input-swim MAP=testbox PAGE=$T/input-swim.js $RUN tools/botlab/page.cjs" \
  "bot-sight MAP=testbox MODE=turf PAGE=$T/bot-sight.js $RUN tools/botlab/page.cjs" | par
one net-mock CLIENTS=1 Q0='netmock=1&mockauto=0' NET=$T/net-mock.cjs $RUN tools/botlab/netpage.cjs
one net-lobbykit CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-lobbykit.cjs $RUN tools/botlab/netpage.cjs
one net-picker CLIENTS=2 Q0=autopilot Q1=autopilot NET=$T/net-picker.cjs $RUN tools/botlab/netpage.cjs

echo "## 4. Zone Control bot matches, 90 s (the horn under the new _controls)"
match zones-halyard MAP=halyard &
match zones-saltpan MAP=saltpan &
match zones-crossmarket MAP=crossmarket &
wait
} 2>&1 | tee "$JOB_OUT/summary.txt"
for f in "$LOG"/*.log; do
  if grep -q '^FAIL' "$f"; then echo "--- $(basename "$f" .log)"; grep '^FAIL' "$f" | cut -c1-400; fi
done > "$JOB_OUT/fails.txt"
echo "SUMMARY $(grep -c '^== ' "$JOB_OUT/summary.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/summary.txt") FAIL lines (the 2a / 2b / 2c runs are meant to fail)"
