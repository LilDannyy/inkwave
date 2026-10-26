#!/bin/bash
# kind: tests
# after: JOB-25
# Bluestone fix round 2 (the art builder), JOB-26: the round's GPU work in the GPU's real terms, and the bloom-off anomaly.
# gpu-sustained.js (A = the gate's timer, A2 = the same timer round the render alone with no sim step, C = the GPU's throughput:
# 30 back-to-back renders and a fence) on Bluestone e2 by day and at dusk: as built; 'live' (the full level program at rest and
# no prepass: the round's static programs and prepass off); 'noprepass'; 'nobloom'; and Halyard as built and 'nobloom';
# 2 rounds alternating, a fresh profile, one Electron at a time. Also the timer with an idle gap before each frame (idle.js).
set -u
J="$JOB_OUT"; mkdir -p "$J/g"
P=tools/botlab/jobs/batch5/bluestone/gpu-sustained.js; H=tools/botlab/jobs/batch5/bluestone/gshoot.cjs
echo "### bluestone JOB-26 (fix round 2) head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
one() { local map=$1 e=$2 T=$3 A=$4 r=$5 f="$J/g/$1$2-$3-${4:-asis}-r$5.log"; local EA=""; [ "$e" != 0 ] && EA="ERA=$e"
  env BOTLAB_OUT="$J/bo" SLOTS=1 $EA MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$P" PRE_ARGS="$A" WATCHDOG=600000 tools/botlab/run.sh "$H" > "$f" 2>&1
  echo "== sus $map e$e $T ${A:-asis} r$r: $(grep -E '^PRE ' "$f" | grep -oE '"A":[0-9.]+,"A2":[0-9.]+,"B":[0-9.]+,"Bwall":[0-9.]+,"Cissue":[0-9.]+,"Cdone":[0-9.]+') $(grep -E 'WATCHDOG|PRE ERROR' "$f" | head -1 | cut -c1-160)"; }
for r in 1 2; do for T in day dusk; do
  one halyard 0 $T '' $r; one halyard 0 $T nobloom $r
  for A in '' live noprepass nobloom; do one bluestone 2 $T "$A" $r; done
done; done | tee "$J/sus.txt"
node -e '
const L = require("fs").readFileSync(process.argv[1], "utf8").split("\n"), R = {};
for (const l of L) { const m = /^== sus (\S+) e(\d) (\S+) (\S+) r\d+: "A":([\d.]+),"A2":([\d.]+),"B":[\d.]+,"Bwall":[\d.]+,"Cissue":([\d.]+),"Cdone":([\d.]+)/.exec(l); if (!m) continue;
  const k = [m[1] + (m[2] !== "0" ? " e" + m[2] : ""), m[3], m[4]].join("|"); (R[k] = R[k] || []).push({ A: +m[5], A2: +m[6], C: +m[8] }); }
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log("mean of 2 rounds: A the gate timer | A2 its render alone | C the GPU throughput ms per frame | ÷ halyard as is (same time)");
for (const k of Object.keys(R).sort()) { const [map, T, v] = k.split("|"), a = R[k], h = R[["halyard", T, "asis"].join("|")];
  const f = (x) => mean(a.map((o) => o[x])), hf = (x) => mean(h.map((o) => o[x]));
  console.log(`  ${(map + " " + v).padEnd(26)} ${T.padEnd(4)} A ${f("A").toFixed(2).padStart(6)} (x${(f("A") / hf("A")).toFixed(2)}) | A2 ${f("A2").toFixed(2).padStart(6)} (x${(f("A2") / hf("A2")).toFixed(2)}) | C ${f("C").toFixed(2).padStart(5)} (x${(f("C") / hf("C")).toFixed(2)})`); }
' "$J/sus.txt" | tee "$J/sus-summary.txt"
for M in bluestone:2 halyard:0; do map=${M%%:*}; e=${M##*:}; EA=""; [ "$e" != 0 ] && EA="ERA=$e"
  env BOTLAB_OUT="$J/bo" SLOTS=1 $EA MAP=$map TIME=day MODE=turf SHOTS='[]' OUT="$J/g" PRE=tools/botlab/jobs/batch5/bluestone/idle.js WATCHDOG=300000 tools/botlab/run.sh "$H" > "$J/g/idle-$map.log" 2>&1
  echo "== idle $map: $(grep -E '^PRE ' "$J/g/idle-$map.log" | cut -c1-300)"
done | tee "$J/idle.txt"
echo "### done"
