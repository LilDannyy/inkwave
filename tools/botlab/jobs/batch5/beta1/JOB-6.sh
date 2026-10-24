#!/bin/bash
# kind: tests
# Beta fix round 1, JOB-6: the round's proof on its final code (after JOB-5: the Bazookarp refill spot honours
# _refillBad, the mid-hop start kept off lava stages, the stranded bot's super jump out of the Great Tank).
#  1. bot-stuck.js (aquarium: step, bobber, refill, tank) and its halyard karpspot check.
#  2. The stuck set again, 2+ matches per stage and mode the issue log names (Bazookarp halyard ×4 with DIAG=2, aquarium
#     ×4, bluestone, lockgate ×2; Zone Control aquarium, bluestone ×2; Tower Command, Turf War on bluestone ×2).
#  3. Page tests: karp-bots ×2, lava-bots ×2, lava ×2 (F10's whole line), bot-climb ×2 (the forced climbs' whole line),
#     holds, pipes, eras-world, sub-bobber, issue-log.
#  4. The same bot-climb and lava F10 on 1378ceb2 + d3e4f164's issueLog.js (this round before any bots.js change: a git
#     archive into $JOB_OUT):
#     are JOB-4/5's 'charger mid' and F10 this round's or the base's?
#  5. The tank watch (probes/tankwatch.js) in 3 live aquarium Bazookarp matches: how a bot gets onto the Great Tank's
#     sand bed (inside its glass) — every entry with its last 2.5 s.
set -u
J=${JOB_OUT:-.botlab/beta1-job6}
PAR=${PAR:-3}
mkdir -p "$J/logs"
echo "### beta1 JOB-6 head ${JOB_SHA:-?}"
summ() { grep -E '^== |^   stuck |^      plan |^   STUCK|^   DIAG|^CONSOLE|^  \[|^RESULT|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^PASS|^FAIL|^   fast fuse|^   carrier-stuck' "$1" | cut -c1-420 | head -150; }
pt() { local n=$1; shift
  env WATCHDOG=1500000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/pt-$n.log" 2>&1
  grep -E '^FAIL|^RESULT|^WATCHDOG|HARNESS' "$J/logs/pt-$n.log" | cut -c1-300 | sed "s/^/[$n] /"; grep -E '^PASS|^FAIL|^RESULT' "$J/logs/pt-$n.log" | cut -c1-300 | head -60 > "$J/pt-$n.txt"; }
# 1.
pt bot-stuck MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js
pt bot-stuck-karpspot MAP=halyard MODE=bazookarp PAGE_ARGS='only=karpspot' PAGE=tools/botlab/tests/bot-stuck.js
# 2.
run() { local n=$1; shift
  ( env WATCHDOG=1200000 "$@" > "$J/logs/$n.log" 2>&1; summ "$J/logs/$n.log" > "$J/$n.txt"
    grep -h -E '^RESULT karp|^   stuck [0-9.]+%|bots stuck|^   STUCK|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^CONSOLE' "$J/logs/$n.log" | cut -c1-260 | sed "s/^/[$n] /" ) & }
i=0; step() { i=$((i + 1)); if (( i % PAR == 0 )); then wait; fi; }
for k in 1 2 3 4; do run "karp-halyard-$k" MAP=halyard DIAG=2 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done
for k in 1 2 3 4; do run "karp-aquarium-$k" MAP=aquarium DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done
for s in bluestone lockgate; do for k in 1 2; do run "karp-$s-$k" MAP=$s DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done; done
for s in aquarium bluestone; do for k in 1 2; do run "zones-$s-$k" MAP=$s MODE=zones DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done; done
for k in 1 2; do run "tower-bluestone-$k" MAP=bluestone DIAG=1 tools/botlab/run.sh tools/botlab/tower-match.cjs; step; done
for k in 1 2; do run "turf-bluestone-$k" MAP=bluestone MODE=turf SECS=180 DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done
wait
# 3.
pt karp-bots MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
pt karp-bots-2 MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
pt lava-bots MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js
pt lava-bots-2 MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js
pt lava MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava.js
pt lava-2 MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava.js
pt bot-climb MAP=lockgate MODE=turf PAGE=tools/botlab/tests/bot-climb.js
pt bot-climb-2 MAP=lockgate MODE=turf PAGE=tools/botlab/tests/bot-climb.js
pt holds MAP=testbox MODE=turf PAGE=tools/botlab/tests/holds.js
pt pipes MAP=aquarium PAGE=tools/botlab/tests/pipes.js
pt eras-world MAP=bluestone PAGE=tools/botlab/tests/eras-world.js
pt sub-bobber MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-bobber.js
pt issue-log MAP=halyard PAGE=tools/botlab/tests/issue-log.js
{ for n in lava lava-2; do grep -h -E '^(PASS|FAIL) F10' "$J/logs/pt-$n.log" | cut -c1-1600 | sed "s/^/[$n] /"; done
  for n in bot-climb bot-climb-2; do grep -h -E '^(PASS|FAIL) forced climbs' "$J/logs/pt-$n.log" | cut -c1-1600 | sed "s/^/[$n] /"; done; } > "$J/f10-forced.txt"
# 4. the base (1378ceb2): bot-climb (forced) and lava (F10), from a plain copy of that tree
# (with d3e4f164's issueLog.js fix on top — the caldera issue log's IPC clone error — as this Mac's own base worktree has)
mkdir -p "$J/base" && git archive 1378ceb2 | tar -x -C "$J/base" && ln -s "$PWD/node_modules" "$J/base/node_modules"
git show d3e4f164 -- src/core/issueLog.js | (cd "$J/base" && patch -p1 -s) && echo "## base: 1378ceb2 + d3e4f164 issueLog.js"
( cd "$J/base" && for k in 1 2; do env WATCHDOG=1500000 MAP=lockgate MODE=turf PAGE_ARGS='only=forced' PAGE=tools/botlab/tests/bot-climb.js tools/botlab/run.sh tools/botlab/page.cjs > "../logs/base-bot-climb-$k.log" 2>&1; done
  for k in 1 2; do env WATCHDOG=1500000 MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava.js tools/botlab/run.sh tools/botlab/page.cjs > "../logs/base-lava-$k.log" 2>&1; done )
{ for k in 1 2; do grep -h -E '^(PASS|FAIL) forced climbs|^RESULT' "$J/logs/base-bot-climb-$k.log" | cut -c1-1600 | sed "s/^/[base-bot-climb-$k] /"; done
  for k in 1 2; do grep -h -E '^(PASS|FAIL) F10|^RESULT' "$J/logs/base-lava-$k.log" | cut -c1-1600 | sed "s/^/[base-lava-$k] /"; done; } > "$J/base.txt"
grep -h -E 'RESULT|^\[base-[a-z-]*[0-9]\] FAIL' "$J/base.txt" | cut -c1-300
# 5. the tank watch
for k in 1 2 3; do
  env WATCHDOG=1500000 MAP=aquarium MODE=bazookarp PAGE_ARGS='secs=300' PAGE=tools/botlab/jobs/batch5/beta1/probes/tankwatch.js tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/tank-$k.log" 2>&1
  grep -h -E '^(PASS|FAIL) tank' "$J/logs/tank-$k.log" | cut -c1-6000 | sed "s/^/[tank-$k] /" >> "$J/tank.txt"
done
grep -h -o '^\[tank-[0-9]\] [A-Z]* tank: [^[]*' "$J/tank.txt"
echo "### done"
