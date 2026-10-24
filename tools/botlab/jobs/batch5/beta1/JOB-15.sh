#!/bin/bash
# kind: tests
# Beta fix round 1, review 1, JOB-15: the slow first frames, proven the cold way, against the shipped code; the page tests
# the review's fixes touch. (JOB-16: the matches, the gates, the online and audio tests.)
#  1. first-frames-cold.sh (each stage in its own Electron, the GPU shader disk cache off; per stage: frames and waits
#     under 100 ms, no shader program compiled in them with a Mitts punch and a flood forced, none in 20 s more of play
#     with every special charged) on the 16 stages: this branch, then b0cc406c (the shipped code) with the same harness.
#  2. bot-stuck ×3 (aquarium), its pocket (bluestone) and karpspot (halyard Bazookarp); karp-bots ×3 and ×3 on the
#     shipped code alternating (B(b2), H: their base rate); issue-log, issue-host.
#  3. the regression page tests of the warm's stand-ins and early builds, the refill / pinned changes and the boot compile.
set -u
J=${JOB_OUT:-.botlab/beta1-job15}
mkdir -p "$J/logs" "$J/base"; J=$(cd "$J" && pwd)
echo "### beta1 JOB-15 head ${JOB_SHA:-?}"
git archive b0cc406c | tar -x -C "$J/base" && ln -s "$PWD/node_modules" "$J/base/node_modules" && cp tools/botlab/first-frames.cjs tools/botlab/first-frames-cold.sh tools/botlab/match.cjs "$J/base/tools/botlab/" && echo "## base: b0cc406c + this branch's first-frames.cjs / first-frames-cold.sh / match.cjs"
# 1. first frames, cold, 16 stages each
ff() { local n=$1 dir=$2
  local t0=$(date +%s)
  ( cd "$dir" && env WATCHDOG=900000 tools/botlab/first-frames-cold.sh ) > "$J/logs/$n.log" 2>&1
  echo "## $n $(( $(date +%s) - t0 )) s"
  grep -E '^RESULT' "$J/logs/$n.log" | sed "s/^/[$n] /"
  grep -E '^FAIL' "$J/logs/$n.log" | cut -c1-330 | sed "s/^/[$n] /"
  grep -E '^== |^(PASS|FAIL)|^RESULT|^   lineup|^   frame @|^   between frames @[0-9]|FRAME ERRORS|HARNESS|WATCHDOG' "$J/logs/$n.log" | cut -c1-300 | head -150 > "$J/$n.txt"
  # (one line a stage: load, worst frame / gap, programs in the first frames and later)
  grep -E '^== ' "$J/logs/$n.log" | sed -E 's/^== ([a-z]+) .*load ([0-9]+) ms.*worst intro ([0-9.]+) ms.*worst play ([0-9.]+) ms.*worst gap between frames ([0-9.]+) ms.*/\1 load \2 | intro \3 | play \4 | gap \5/' > "$J/$n-stages.txt"
  grep -oE '^(PASS|FAIL) [a-z]+ no shader program compiled in the first frames[^{]*\{"programs":[0-9]+' "$J/logs/$n.log" | sed -E 's/^(PASS|FAIL) ([a-z]+) .*"programs":([0-9]+)/\2 first-frames programs \3 \1/' >> "$J/$n-stages.txt"
  grep -oE '^(PASS|FAIL) [a-z]+ no shader program compiled in 20 s more[^{]*\{"programs":[0-9]+' "$J/logs/$n.log" | sed -E 's/^(PASS|FAIL) ([a-z]+) .*"programs":([0-9]+)/\2 first-use programs \3 \1/' >> "$J/$n-stages.txt"; }
ff ffcold-new "$PWD"
ff ffcold-base "$J/base"
# 2. + 3. page tests, one at a time
pt() { local n=$1 dir=$2; shift 2
  ( cd "$dir" && env WATCHDOG=1500000 "$@" tools/botlab/run.sh tools/botlab/page.cjs ) > "$J/logs/pt-$n.log" 2>&1
  echo "[$n] $(grep -E '^RESULT' "$J/logs/pt-$n.log" | tail -1) $(grep -cE '^FAIL' "$J/logs/pt-$n.log") failed $(grep -E 'WATCHDOG|HARNESS|^console errors: [^n]' "$J/logs/pt-$n.log" | head -1 | cut -c1-160)"
  grep -E '^FAIL' "$J/logs/pt-$n.log" | cut -c1-360 | sed "s/^/[$n] /"
  grep -E '^PASS|^FAIL|^RESULT' "$J/logs/pt-$n.log" | cut -c1-380 | head -60 > "$J/pt-$n.txt"; }
N=$PWD B=$J/base
for k in 1 2 3; do pt bot-stuck-$k $N MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js; done
pt bot-stuck-pocket $N MAP=bluestone MODE=turf PAGE_ARGS='only=pocket' PAGE=tools/botlab/tests/bot-stuck.js
pt bot-stuck-karpspot $N MAP=halyard MODE=bazookarp PAGE_ARGS='only=karpspot' PAGE=tools/botlab/tests/bot-stuck.js
for k in 1 2 3; do
  pt karp-bots-$k $N MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
  pt karp-bots-base-$k $B MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
  grep -hoE '^(PASS|FAIL) (B\(b2\)|H) [^{]*\{"maxR":[0-9.]+,"minR":[0-9.]+|^(PASS|FAIL) H a bot standing[^:]*: [0-9]+ of 20' "$J/logs/pt-karp-bots-$k.log" "$J/logs/pt-karp-bots-base-$k.log" | cut -c1-200 | sed "s/^/[karp-bots $k] /"
done
pt issue-log $N MAP=halyard PAGE=tools/botlab/tests/issue-log.js
echo "[issue-host] $(node tools/botlab/tests/issue-host.cjs 2>&1 | tail -1)"
pt lightmaps $N MAP=halyard PAGE=tools/botlab/tests/lightmaps.js
pt stage-mods $N MAP=testbox PAGE=tools/botlab/tests/stage-mods.js
pt world-build $N MAP=halyard PAGE=tools/botlab/tests/world-build.js
pt eras-world $N MAP=bluestone PAGE=tools/botlab/tests/eras-world.js
pt eras-modes $N MAP=bluestone PAGE=tools/botlab/tests/eras-modes.js
pt pipes $N MAP=aquarium PAGE=tools/botlab/tests/pipes.js
pt holds $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/holds.js
pt loadout-picker $N MAP=testbox PAGE=tools/botlab/tests/loadout-picker.js
pt sub-bobber $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-bobber.js
pt sub-dash $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-dash.js
pt sub-glide $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-glide.js
pt sub-sentry $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-sentry.js
pt sub-tweaks2 $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-tweaks2.js
pt deployables $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/deployables.js
pt bow-paint $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/bow-paint.js
pt surf $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/surf.js
pt drainbow $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/drainbow.js
pt sp-rules $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/sp-rules.js
pt zipcheer $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/zipcheer.js
pt ink-wipe $N MAP=halyard PAGE=tools/botlab/tests/ink-wipe.js
pt karp-loop $N MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-loop.js
pt bazookarp-rules $N MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/bazookarp-rules.js
pt hud-karp $N MAP=testbox MODE=bazookarp PAGE=tools/botlab/tests/hud-karp.js
pt tower-rules $N MAP=testbox MODE=tower PAGE=tools/botlab/tests/tower-rules.js
pt tower-ink $N MAP=testbox MODE=tower PAGE=tools/botlab/tests/tower-ink.js
pt lava $N MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava.js
pt bot-climb $N MAP=lockgate MODE=turf PAGE=tools/botlab/tests/bot-climb.js
pt bot-specials $N MAP=testbox MODE=turf PAGE=tools/botlab/tests/bot-specials.js
pt beta-content $N MAP=bluestone PAGE=tools/botlab/tests/beta-content.js
echo "### done"
