#!/bin/bash
# kind: tests
# Bluestone fix round 2 (the art builder), JOB-22: is the gate's GPU timer the GPU's time? gpu-sustained.js at perf6's eight
# views (the gate's settings) three ways — A: gpu-views.js's own method (a timer query round each frame, gl.finish after
# every one), B: 24 frames back to back each in its own query, C: the game's render 30 times back to back with no query and
# a fence after the last (the GPU's real throughput: 'Cdone' ms per frame; 'Cissue' the CPU's issue time per frame, so
# Cdone >> Cissue means the GPU is the bottleneck). Halyard and Bluestone e1-e3, day and dusk, this head (2d4f7a6b's
# programs + the art since) and review 2's src (2310eed9), 2 rounds alternating. Then gpu-ab.js over a PLAIN level (pre=plain)
# on Bluestone e2 and Halyard by day: what the stage costs outside the level material, part by part.
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/g"
echo "### bluestone JOB-22 (fix round 2) head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
P=tools/botlab/jobs/batch5/bluestone/gpu-sustained.js; H=tools/botlab/jobs/batch5/bluestone/gshoot.cjs
cp "$P" "$J/gpu-sustained.js"; cp "$H" "$J/gshoot.cjs"
mkdir -p "$J/base"; git archive 2310eed9 | tar -x -C "$J/base"; ln -s "$PWD/node_modules" "$J/base/node_modules"; rm -r "$J/base/tools/botlab"; cp -R tools/botlab "$J/base/tools/botlab"
one() { local tag=$1 root=$2 map=$3 e=$4 T=$5 r=$6 f="$J/g/$1-$3$4-$5-r$6.log"; local EA=""; [ "$e" != 0 ] && EA="ERA=$e"
  (cd "$root" && env BOTLAB_OUT="$J/bo" SLOTS=1 $EA MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$J/gpu-sustained.js" WATCHDOG=600000 tools/botlab/run.sh "$J/gshoot.cjs" > "$f" 2>&1)
  echo "== sus $tag $map e$e $T r$r: $(grep -E '^PRE ' "$f" | grep -oE '"A":[0-9.]+,"B":[0-9.]+,"Bwall":[0-9.]+,"Cissue":[0-9.]+,"Cdone":[0-9.]+') $(grep -E 'WATCHDOG|PRE ERROR' "$f" | head -1 | cut -c1-160)"; }
for r in 1 2; do for T in day dusk; do
  one head "$PWD" halyard 0 $T $r
  for e in 1 2 3; do one head "$PWD" bluestone $e $T $r; one base "$J/base" bluestone $e $T $r; done
done; done | tee "$J/sus.txt"
rm -rf "$J/base"
node -e '
const L = require("fs").readFileSync(process.argv[1], "utf8").split("\n"), R = {};
for (const l of L) { const m = /^== sus (\S+) (\S+) e(\d) (\S+) r\d+: "A":([\d.]+),"B":([\d.]+),"Bwall":([\d.]+),"Cissue":([\d.]+),"Cdone":([\d.]+)/.exec(l); if (!m) continue;
  const k = [m[1], m[2] + (m[3] !== "0" ? " e" + m[3] : ""), m[4]].join("|"); (R[k] = R[k] || []).push({ A: +m[5], C: +m[9], Ci: +m[8] }); }
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log("medians of the rounds (mean of the 2): A = the gate timer ms | C = GPU throughput ms per frame (Cissue) | ÷ halyard");
for (const k of Object.keys(R).sort()) { const [tag, map, T] = k.split("|"), a = R[k], h = R[["head", "halyard", T].join("|")];
  const A = mean(a.map((x) => x.A)), C = mean(a.map((x) => x.C)), Ci = mean(a.map((x) => x.Ci));
  const rA = h ? (A / mean(h.map((x) => x.A))).toFixed(2) : "-", rC = h ? (C / mean(h.map((x) => x.C))).toFixed(2) : "-";
  console.log(`  ${(tag + " " + map).padEnd(18)} ${T.padEnd(4)} A ${A.toFixed(2).padStart(6)} (x${rA}) | C ${C.toFixed(2).padStart(6)} (x${rC}) issue ${Ci.toFixed(2)}`); }
' "$J/sus.txt" | tee "$J/sus-summary.txt"
PA=tools/botlab/jobs/batch5/bluestone/gpu-ab.js
ab() { local map=$1 e=$2 T=$3 V=$4 f="$J/g/ab-$1$2-$3.log"; local EA=""; [ "$e" != 0 ] && EA="ERA=$e"
  env BOTLAB_OUT="$J/bo" SLOTS=1 $EA MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$PA" PRE_ARGS="$V" WATCHDOG=1500000 $R "$H" > "$f" 2>&1
  echo "== ab $map e$e $T: $(grep -E '^PRE ' "$f" | grep -oE '"base":[0-9.]+,"delta":\{[^}]*\}') $(grep -E 'WATCHDOG|PRE ERROR' "$f" | head -2 | cut -c1-200)"; }
{ ab bluestone 2 day 'propsplain,noeraprops,backplain,noback,nosea,nosky,nodecor,noerafx,notransp,shadowheld,nolevel,empty;rounds=3;cover=0;pre=plain'
  ab halyard 0 day 'propsplain,backplain,noback,nosea,nosky,nodecor,notransp,shadowheld,nolevel,empty;rounds=3;cover=0;pre=plain'; } | tee "$J/ab-plain.txt"
echo "### done"
