#!/bin/bash
# kind: tests
# after: JOB-7
# Beta fix round 1, JOB-8: the last two bots.js changes (aba7dbf5: stranded = no start node within 3 m at or below, so
# mid-bed too; fcbefa25: a refilling roller / brush taps instead of holding) — the bot page tests and the stuck set again,
# and the tank watch with each entry's super jump (its target, where it lands) one line per sample.
set -u
J=${JOB_OUT:-.botlab/beta1-job8}
PAR=${PAR:-3}
mkdir -p "$J/logs"
echo "### beta1 JOB-8 head ${JOB_SHA:-?}"
summ() { grep -E '^== |^   stuck |^      plan |^   STUCK|^   DIAG|^CONSOLE|^RESULT|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^PASS|^FAIL|^   fast fuse' "$1" | cut -c1-420 | head -150; }
pt() { local n=$1; shift
  env WATCHDOG=1500000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/pt-$n.log" 2>&1
  grep -E '^FAIL|^RESULT|^WATCHDOG|HARNESS' "$J/logs/pt-$n.log" | cut -c1-300 | sed "s/^/[$n] /"; grep -E '^PASS|^FAIL|^RESULT' "$J/logs/pt-$n.log" | cut -c1-390 | head -60 > "$J/pt-$n.txt"; }
pt bot-stuck MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js
pt bot-stuck-2 MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js
pt bot-stuck-karpspot MAP=halyard MODE=bazookarp PAGE_ARGS='only=karpspot' PAGE=tools/botlab/tests/bot-stuck.js
pt karp-bots MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
pt karp-bots-2 MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
pt holds MAP=testbox MODE=turf PAGE=tools/botlab/tests/holds.js
pt pipes MAP=aquarium PAGE=tools/botlab/tests/pipes.js
pt sub-bobber MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-bobber.js
pt lava-bots MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js
pt lava-bots-2 MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js
pt issue-log MAP=halyard PAGE=tools/botlab/tests/issue-log.js
run() { local n=$1; shift
  ( env WATCHDOG=1200000 "$@" > "$J/logs/$n.log" 2>&1; summ "$J/logs/$n.log" > "$J/$n.txt"
    grep -h -E '^RESULT karp|^   stuck [0-9.]+%|bots stuck|^   STUCK|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^CONSOLE' "$J/logs/$n.log" | sed -E 's/fast fuse.*bots stuck/bots stuck/' | cut -c1-260 | sed "s/^/[$n] /" ) & }
i=0; step() { i=$((i + 1)); if (( i % PAR == 0 )); then wait; fi; }
for k in 1 2 3 4; do run "karp-halyard-$k" MAP=halyard DIAG=2 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done
for k in 1 2 3 4; do run "karp-aquarium-$k" MAP=aquarium DIAG=2 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done
for s in bluestone lockgate; do for k in 1 2; do run "karp-$s-$k" MAP=$s DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done; done
for s in aquarium bluestone; do for k in 1 2; do run "zones-$s-$k" MAP=$s MODE=zones DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done; done
for k in 1 2; do run "tower-bluestone-$k" MAP=bluestone DIAG=1 tools/botlab/run.sh tools/botlab/tower-match.cjs; step; done
for k in 1 2; do run "turf-bluestone-$k" MAP=bluestone MODE=turf SECS=180 DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done
wait
for k in 1 2 3 4; do
  env WATCHDOG=1500000 MAP=aquarium MODE=bazookarp PAGE_ARGS='secs=300' PAGE=tools/botlab/jobs/batch5/beta1/probes/tankwatch.js tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/tank-$k.log" 2>&1
  grep -h -E '^(PASS|FAIL) tank' "$J/logs/tank-$k.log" | cut -c1-120 | sed "s/^/[tank-$k] /"
  # (each entry: who, when, then its last samples one per line — the runner keeps 400 characters a line)
  grep -h -E '^(PASS|FAIL) tank' "$J/logs/tank-$k.log" | sed -E 's/^[A-Z]+ [^[]*//' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{let a=[];try{a=JSON.parse(s.trim()||"[]")}catch(e){console.log("(unparsed)");return}for(const e of a){console.log("entry "+e.who+" t "+e.t+" dur "+e.dur+" left "+e.left);for(const l of e.trail||[])console.log("  "+l.slice(0,380))}})' | sed "s/^/[tank-$k] /" >> "$J/tank.txt"
done
cat "$J/tank.txt" 2>/dev/null | head -60
echo "### done"
