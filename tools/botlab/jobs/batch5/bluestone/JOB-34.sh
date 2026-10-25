#!/bin/bash
# kind: tests
# [b5-bluestone] JOB-34 (the lead's, written by the Mac mini helper): the record for review 4 on the MERGED tree, new-stages
# 6fbfaeb6 (Bluestone's art merged at c0864291) — the runs the builder did not repeat at its final code. The tree is pinned
# (git archive 6fbfaeb6 into $JOB_OUT/m), one Electron at a time, fresh profiles:
#   1. net-eras and its lagged run (netlag 150 / jitter 50, turf)
#   2. the GPU gate by method C (gpu-sustained.js 'Cdone': 30 renders back to back + a fence), Bluestone e1-e3 and Halyard,
#      day and dusk, 2 rounds
#   3. perf6 (calls / triangles / cpuRender) against Halyard, e1-e3, day and dusk, 3 runs alternating
#   4. eras-world (its three parts), eras-hud, eras-modes
#   5. first-frames-cold.sh for Bluestone and Halyard (the cold load time, the shader disk cache off; fix round 3's warm-up)
#   6. menu-hitch.cjs (this branch's): the game booted to its MENU with the backdrop on Bluestone / Halyard at day and dusk,
#      cold — rAF intervals in real time for 15 s after the api is up (does the backdrop's warm-up hitch the menu?)
set -u
J="$JOB_OUT"; M="$J/m"; mkdir -p "$M" "$J/t" "$J/runs" "$J/g"
git archive 6fbfaeb6 | tar -x -C "$M"; ln -s "$PWD/node_modules" "$M/node_modules"
cp tools/botlab/jobs/batch5/bluestone/menu-hitch.cjs "$M/tools/botlab/jobs/batch5/bluestone/menu-hitch.cjs"
R=tools/botlab/run.sh
cd "$M" || exit 1
echo "### bluestone JOB-34 on new-stages $(git -C "$OLDPWD" rev-parse --short 6fbfaeb6) (pinned) load $(sysctl -n vm.loadavg)"
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/$n.log") FAIL"; grep -E '^FAIL' "$J/t/$n.log" | cut -c1-900; }
# 1. online
CLIENTS=2 URLQ=wipstages WIPSTAGES=1 NET=tools/botlab/tests/net-eras.cjs WATCHDOG=1200000 $R tools/botlab/netpage.cjs > "$J/t/net-eras.log" 2>&1
echo "== net-eras: $(grep -E '^RESULT|HARNESS' "$J/t/net-eras.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/net-eras.log") FAIL"; grep -E '^FAIL' "$J/t/net-eras.log" | cut -c1-700
CLIENTS=2 URLQ='wipstages&netlag=150&netjitter=50' WIPSTAGES=1 NET=tools/botlab/tests/net-eras.cjs NET_ARGS='only=turf' WATCHDOG=1200000 $R tools/botlab/netpage.cjs > "$J/t/net-eras-lag.log" 2>&1
echo "== net-eras lagged: $(grep -E '^RESULT|HARNESS' "$J/t/net-eras-lag.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/net-eras-lag.log") FAIL"; grep -E '^FAIL' "$J/t/net-eras-lag.log" | cut -c1-700
# 4. the engine's page tests
pg eras-world-12 MAP=bluestone PAGE=tools/botlab/tests/eras-world.js PAGE_ARGS='only=1,2'
pg eras-world-34 MAP=bluestone PAGE=tools/botlab/tests/eras-world.js PAGE_ARGS='only=3,4'
pg eras-world-5 MAP=bluestone PAGE=tools/botlab/tests/eras-world.js PAGE_ARGS='only=5'
pg eras-hud MAP=bluestone PAGE=tools/botlab/tests/eras-hud.js
pg eras-modes MAP=bluestone PAGE=tools/botlab/tests/eras-modes.js
# 5. cold first frames and load time
STAGES=bluestone,halyard BOTLAB_OUT="$J/bo-ff" SLOTS=1 bash tools/botlab/first-frames-cold.sh > "$J/ffcold.txt" 2>&1
echo "== first-frames-cold: $(grep -E '^RESULT' "$J/ffcold.txt" | tail -1)"; grep -E '^(PASS|FAIL)|load' "$J/ffcold.txt" | cut -c1-300 | head -24
# 6. the menu backdrop, cold
for M2 in bluestone halyard; do for T in day dusk; do
  BOTLAB_OUT="$J/bo-mh" SLOTS=1 MAP=$M2 TIME=$T SECS=15 $R --disable-gpu-shader-disk-cache tools/botlab/jobs/batch5/bluestone/menu-hitch.cjs > "$J/t/menu-$M2-$T.log" 2>&1
  grep -E '^MENU|WATCHDOG|^CONSOLE' "$J/t/menu-$M2-$T.log" | cut -c1-900
done; done | tee "$J/menu.txt"
# 3. perf6
P=tools/botlab/jobs/batch5/stages/aquarium/tools/perf6.js
for r in 1 2 3; do for T in day dusk; do for X in bluestone:1 bluestone:2 bluestone:3 halyard:0; do
  map=${X%%:*}; e=${X##*:}; n="$map$e-$T-$r"; EA=""; [ "$e" != 0 ] && EA="ERA=$e"
  env BOTLAB_OUT="$J/bo" SLOTS=1 $EA MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/runs" PRE="$P" $R tools/botlab/shoot.cjs > "$J/runs/$n.log" 2>&1
done; done; done
node -e '
const fs = require("fs"), d = process.argv[1] + "/runs", R = {};
for (const f of fs.readdirSync(d).filter((f) => f.endsWith(".log"))) { const [X, T] = f.slice(0, -4).split("-"); const m = /^PRE (\{.*\})\s*$/m.exec(fs.readFileSync(d + "/" + f, "utf8")); if (!m) continue; const o = JSON.parse(m[1]); (R[T + "|" + X] = R[T + "|" + X] || []).push(o.avg); }
const med = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
console.log("perf6 medians of 3 runs; each Bluestone era / Halyard");
for (const T of ["day", "dusk"]) { const h = R[T + "|halyard0"] || []; for (const e of [1, 2, 3]) { const a = R[T + "|bluestone" + e] || [];
  const r = (k) => `${k} ${med(a.map((x) => x[k])).toFixed(k === "ms" ? 2 : 0)} / ${med(h.map((x) => x[k])).toFixed(k === "ms" ? 2 : 0)} x${(med(a.map((x) => x[k])) / med(h.map((x) => x[k]))).toFixed(2)}`;
  console.log(`  ${T.padEnd(4)} e${e}: ${r("calls")} | ${r("tris")} | cpuRender ${r("ms")}`); } }
' "$J" | tee "$J/perf.txt"
# 2. the GPU gate, method C
PS=tools/botlab/jobs/batch5/bluestone/gpu-sustained.js; GH=tools/botlab/jobs/batch5/bluestone/gshoot.cjs
one() { local map=$1 e=$2 T=$3 r=$4 f="$J/g/$1$2-$3-r$4.log"; local EA=""; [ "$e" != 0 ] && EA="ERA=$e"
  env BOTLAB_OUT="$J/bo" SLOTS=1 $EA MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$PS" WATCHDOG=600000 $R "$GH" > "$f" 2>&1
  echo "== sus $map e$e $T r$r: $(grep -E '^PRE ' "$f" | grep -oE '"Cissue":[0-9.]+,"Cdone":[0-9.]+') $(grep -E 'WATCHDOG|PRE ERROR' "$f" | head -1 | cut -c1-160)"; }
for r in 1 2; do for T in day dusk; do one halyard 0 $T $r; for e in 1 2 3; do one bluestone $e $T $r; done; done; done > "$J/sus.txt"
node -e '
const L = require("fs").readFileSync(process.argv[1], "utf8").split("\n"), R = {};
for (const l of L) { const m = /^== sus (\S+) e(\d) (\S+) r\d+: .*"Cissue":([\d.]+),"Cdone":([\d.]+)/.exec(l); if (!m) continue;
  const k = [m[1] + (m[2] !== "0" ? " e" + m[2] : ""), m[3]].join("|"); (R[k] = R[k] || []).push({ Ci: +m[4], C: +m[5] }); }
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log("method C (the gate): GPU throughput ms per frame, mean of 2 rounds | / halyard (same time of day)");
for (const k of Object.keys(R).sort()) { const [map, T] = k.split("|"), a = R[k], h = R[["halyard", T].join("|")];
  const C = mean(a.map((x) => x.C)), hC = mean(h.map((x) => x.C));
  console.log(`  ${map.padEnd(14)} ${T.padEnd(4)} C ${C.toFixed(2)} (x${(C / hC).toFixed(2)}) issue ${mean(a.map((x) => x.Ci)).toFixed(2)}`); }
' "$J/sus.txt" | tee "$J/gate-c.txt"
cd "$OLDPWD"; rm -r "$M"
echo "### done load $(sysctl -n vm.loadavg)"
