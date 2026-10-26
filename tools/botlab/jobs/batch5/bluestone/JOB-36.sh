#!/bin/bash
# kind: tests
# [b5-bluestone] JOB-36 (the lead's, written by the Mac mini helper): the engine record for Highmark Foundry's acceptance
# review on new-stages 8e78f191 (the art phase merged, beta badge kept), pinned (git archive into $JOB_OUT/m):
#   1. check-maps caldera / caldera.bazookarp / caldera.boss
#   2. lava.js x3; lava-audit: rules 14,21,22,25,38,42,45,46 | rule 44 at LOW and at HIGH | rule 47 in parts (b at LOW+HIGH,
#      r30+r60, r90+f50; e every level; a,c,d), as caldera JOB-19; lava-bots; lava-karp
#   3. stage-audit (lightmap applied, not stale) for turf / zones / tower / bazookarp / boss
#   4. two bot matches by lava-match.js: Turf War 3:00 and Zone Control 5:00 (lava deaths, sea falls, stuck tally)
#   5. alone: perf6 x3 (calls / tris / cpuRender), caldera LOW and HIGH (PAGEQ lava=low|high holds the level) / Halyard,
#      day and dusk; the GPU gate by method C (gpu-sustained.js 'Cdone': 30 renders + a fence), same cells, 2 rounds
set -u
J="$JOB_OUT"; M="$J/m"; mkdir -p "$M" "$J/t" "$J/runs" "$J/g"
git archive 8e78f191 | tar -x -C "$M"; ln -s "$PWD/node_modules" "$M/node_modules"
R=tools/botlab/run.sh
cd "$M" || exit 1
echo "### JOB-36 Highmark Foundry on new-stages $(git -C "$OLDPWD" rev-parse --short 8e78f191) (pinned) load $(sysctl -n vm.loadavg)"
pg() { # name page args [mode] [pageq]
  PAGEQ="${5:-}" MAP=caldera MODE=${4:-turf} PAGE=$2 PAGE_ARGS="$3" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$1.log" 2>&1
}
sm() { # name -> RESULT, the FAIL count and the first FAILs
  echo "== $1: $(grep -E '^RESULT|^WATCHDOG|HARNESS' "$J/t/$1.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/$1.log") FAIL $(grep -E 'console errors|FRAME ERRORS' "$J/t/$1.log" | head -1 | cut -c1-120)"
  grep -E '^FAIL' "$J/t/$1.log" | cut -c1-400 | head -6
}
A=tools/botlab/tests/lava-audit.js; C=tools/botlab/jobs/batch5/caldera
# 1. check-maps
for v in caldera caldera.bazookarp caldera.boss; do echo "== check-maps $v: $(node build/check-maps.mjs $v 2>&1 | grep -E "^caldera|rule|problem|FAIL|Error" | head -4 | tr '\n' ' ' | cut -c1-400)"; done
# 2. the lava engine's tests
pg lavajs-1 tools/botlab/tests/lava.js '' & pg lavajs-2 tools/botlab/tests/lava.js '' & pg lavajs-3 tools/botlab/tests/lava.js '' & wait
for n in lavajs-1 lavajs-2 lavajs-3; do sm $n; done
pg audit-rest $A 'rules=14,21,22,25,38,42,45,46' & pg r44-low $A 'rules=44;lv=low' & pg r44-high $A 'rules=44;lv=high' & wait
for n in audit-rest r44-low r44-high; do sm $n; grep -E '^(PASS|FAIL) rule 4[24]' "$J/t/$n.log" | grep -viE 'places' | cut -c1-300 | head -4; done
pg r47b1 $A 'rules=47;r47=b;r47lv=low,high' & pg r47b2 $A 'rules=47;r47=b;r47lv=r30,r60' & wait
pg r47b3 $A 'rules=47;r47=b;r47lv=r90,f50' & pg r47e $A 'rules=47;r47=e' & wait
pg r47acd $A 'rules=47;r47=a,c,d' & pg bots tools/botlab/tests/lava-bots.js '' & pg karp tools/botlab/tests/lava-karp.js '' bazookarp & wait
for n in r47b1 r47b2 r47b3 r47e r47acd; do sm $n; node $C/sum47.cjs "$J/t/$n.log" | grep -v '##    eg' | cut -c1-400 | head -8; done
for n in bots karp; do sm $n; done; grep -E '^(PASS|FAIL) the gate' "$J/t/bots.log" | cut -c1-400
# 3. stage-audit per mode
pg audit-turf tools/botlab/tests/stage-audit.js '' turf & pg audit-zones tools/botlab/tests/stage-audit.js '' zones & pg audit-tower tools/botlab/tests/stage-audit.js '' tower & wait
pg audit-bazookarp tools/botlab/tests/stage-audit.js '' bazookarp & pg audit-boss tools/botlab/tests/stage-audit.js '' boss & wait
for n in audit-turf audit-zones audit-tower audit-bazookarp audit-boss; do sm $n; grep -E '^(PASS|FAIL) lightmap applied' "$J/t/$n.log" | cut -c1-200; done
# 4. two bot matches
pg match-turf tools/botlab/tests/lava-match.js 'mode=turf;secs=180' & pg match-zones tools/botlab/tests/lava-match.js 'mode=zones' & wait
for n in match-turf match-zones; do sm $n; grep -E '^(PASS|FAIL) (turf|zones|no bot drowned|no falls|stuck|an Organ)' "$J/t/$n.log" | cut -c1-700; done
# 5. perf6 x3, alone
P=tools/botlab/jobs/batch5/stages/aquarium/tools/perf6.js
for r in 1 2 3; do for T in day dusk; do for X in caldera:low caldera:high halyard:0; do
  map=${X%%:*}; lv=${X##*:}; n="$map$lv-$T-$r"; Q=""; [ "$lv" != 0 ] && Q="lava=$lv"
  env BOTLAB_OUT="$J/bo" SLOTS=1 PAGEQ="$Q" MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/runs" PRE="$P" $R tools/botlab/shoot.cjs > "$J/runs/$n.log" 2>&1
done; done; done
node -e '
const fs = require("fs"), d = process.argv[1] + "/runs", R = {};
for (const f of fs.readdirSync(d).filter((f) => f.endsWith(".log"))) { const [X, T] = f.slice(0, -4).split("-"); const m = /^PRE (\{.*\})\s*$/m.exec(fs.readFileSync(d + "/" + f, "utf8")); if (!m) continue; const o = JSON.parse(m[1]); (R[T + "|" + X] = R[T + "|" + X] || []).push(o.avg); }
const med = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
console.log("perf6 medians of 3 runs; caldera / Halyard (runs found: " + Object.entries(R).map(([k, v]) => k + " " + v.length).join(", ") + ")");
for (const T of ["day", "dusk"]) { const h = R[T + "|halyard0"] || []; for (const lv of ["low", "high"]) { const a = R[T + "|caldera" + lv] || [];
  const r = (k) => `${k} ${med(a.map((x) => x[k])).toFixed(k === "ms" ? 2 : 0)} / ${med(h.map((x) => x[k])).toFixed(k === "ms" ? 2 : 0)} x${(med(a.map((x) => x[k])) / med(h.map((x) => x[k]))).toFixed(2)}`;
  console.log(`  ${T.padEnd(4)} ${lv.padEnd(4)}: ${r("calls")} | ${r("tris")} | cpuRender ${r("ms")}`); } }
' "$J" | tee "$J/perf.txt"
# the GPU gate, method C, alone
PS=tools/botlab/jobs/batch5/bluestone/gpu-sustained.js; GH=tools/botlab/jobs/batch5/bluestone/gshoot.cjs
one() { local map=$1 lv=$2 T=$3 r=$4 f="$J/g/$1$2-$3-r$4.log"; local Q=""; [ "$lv" != 0 ] && Q="lava=$lv"
  env BOTLAB_OUT="$J/bo" SLOTS=1 PAGEQ="$Q" MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$PS" WATCHDOG=600000 $R "$GH" > "$f" 2>&1
  echo "== sus $map $lv $T r$r: $(grep -E '^PRE ' "$f" | grep -oE '"Cissue":[0-9.]+,"Cdone":[0-9.]+') $(grep -E 'WATCHDOG|PRE ERROR' "$f" | head -1 | cut -c1-160)"; }
for r in 1 2; do for T in day dusk; do one halyard 0 $T $r; one caldera low $T $r; one caldera high $T $r; done; done > "$J/sus.txt"
node -e '
const L = require("fs").readFileSync(process.argv[1], "utf8").split("\n"), R = {};
for (const l of L) { const m = /^== sus (\S+) (\S+) (\S+) r\d+: .*"Cissue":([\d.]+),"Cdone":([\d.]+)/.exec(l); if (!m) continue;
  const k = [m[1] + (m[2] !== "0" ? " " + m[2].toUpperCase() : ""), m[3]].join("|"); (R[k] = R[k] || []).push({ Ci: +m[4], C: +m[5] }); }
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log("method C (the gate): GPU throughput ms per frame, mean of 2 rounds | / halyard (same time of day)");
for (const k of Object.keys(R).sort()) { const [map, T] = k.split("|"), a = R[k], h = R[["halyard", T].join("|")];
  const C = mean(a.map((x) => x.C)), hC = mean(h.map((x) => x.C));
  console.log(`  ${map.padEnd(14)} ${T.padEnd(4)} C ${C.toFixed(2)} (x${(C / hC).toFixed(2)}) issue ${mean(a.map((x) => x.Ci)).toFixed(2)} n ${a.length}`); }
' "$J/sus.txt" | tee "$J/gate-c.txt"
cd "$OLDPWD"; rm -r "$M"
echo "### done load $(sysctl -n vm.loadavg)"
