#!/bin/bash
# kind: tests
# after: JOB-24
# Bluestone fix round 2 (the art builder), JOB-25: everything fix round 2 could have broken, at its head: the engine's suite
# and the frozen geometry (art-tests.sh: eras-static, eras-world, eras-look with part 5 (g), eras-jump a-e and frames, eras-hud,
# eras-modes, stage-mods, world-build, check-maps, climb-audit / cover-map / spawn-mid / tower-check per era), eras-jump
# 'frames' x3 more and 'first' (the static / full program swap at the warning: nothing compiled mid-jump, every FAIL line in
# full), eras-bake and stage-audit (the lightmaps still applied), net-eras and its lagged run, perf6 against Halyard.
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/t" "$J/runs"
echo "### bluestone JOB-25 (fix round 2) head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
bash tools/botlab/jobs/batch5/bluestone/art-tests.sh "$J/art" > "$J/art-tests.txt" 2>&1
grep -E '^== ' "$J/art-tests.txt" | cut -c1-500
for f in "$J"/art/*.log; do grep -lE '^FAIL' "$f" >/dev/null 2>&1 && { echo "# FAIL lines in $(basename "$f"):"; grep -E '^FAIL' "$f" | cut -c1-1200; }; done
grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$J/art/eras-jump-d.log" | head -1 | sed 's/^/# art-tests frames worst /'
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/$n.log") FAIL"; grep -E '^FAIL' "$J/t/$n.log" | cut -c1-1500; }
for k in 1 2 3; do pg frames-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames'; grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$J/t/frames-$k.log" | head -1 | sed "s/^/# frames-$k jump worst /"; done
pg first-1 MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=first'
pg eras-bake MAP=bluestone PAGE=tools/botlab/tests/eras-bake.js
for e in 1 2 3; do for M in turf zones tower; do
  MAP=bluestone MODE=$M ERA=$e WATCHDOG=900000 PAGE=tools/botlab/tests/stage-audit.js $R tools/botlab/page.cjs > "$J/t/audit-$M-$e.log" 2>&1
  echo "== stage-audit $M e$e: $(grep -E 'lightmap|^RESULT|WATCHDOG' "$J/t/audit-$M-$e.log" | tr '\n' ' ' | cut -c1-300)"
done; done
MAP=bluestone MODE=boss ERA=2 WATCHDOG=900000 PAGE=tools/botlab/tests/stage-audit.js $R tools/botlab/page.cjs > "$J/t/audit-boss-2.log" 2>&1
echo "== stage-audit boss e2: $(grep -E 'lightmap|^RESULT|WATCHDOG' "$J/t/audit-boss-2.log" | tr '\n' ' ' | cut -c1-300)"
CLIENTS=2 URLQ=wipstages WIPSTAGES=1 NET=tools/botlab/tests/net-eras.cjs WATCHDOG=1200000 $R tools/botlab/netpage.cjs > "$J/t/net-eras.log" 2>&1
echo "== net-eras: $(grep -E '^RESULT|HARNESS' "$J/t/net-eras.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/net-eras.log") FAIL"; grep -E '^FAIL' "$J/t/net-eras.log" | cut -c1-700
CLIENTS=2 URLQ='wipstages&netlag=150&netjitter=50' WIPSTAGES=1 NET=tools/botlab/tests/net-eras.cjs NET_ARGS='only=turf' WATCHDOG=1200000 $R tools/botlab/netpage.cjs > "$J/t/net-eras-lag.log" 2>&1
echo "== net-eras lagged: $(grep -E '^RESULT|HARNESS' "$J/t/net-eras-lag.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/net-eras-lag.log") FAIL"; grep -E '^FAIL' "$J/t/net-eras-lag.log" | cut -c1-700
P=tools/botlab/jobs/batch5/stages/aquarium/tools/perf6.js
for r in 1 2 3; do for T in day dusk; do for M in bluestone:1 bluestone:2 bluestone:3 halyard:0; do
  map=${M%%:*}; e=${M##*:}; n="$map$e-$T-$r"; EA=""; [ "$e" != 0 ] && EA="ERA=$e"
  env BOTLAB_OUT="$J/bo" SLOTS=1 $EA MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/runs" PRE="$P" $R tools/botlab/shoot.cjs > "$J/runs/$n.log" 2>&1
done; done; done
node -e '
const fs = require("fs"), d = process.argv[1] + "/runs", R = {};
for (const f of fs.readdirSync(d).filter((f) => f.endsWith(".log"))) { const [M, T, r] = f.slice(0, -4).split("-"); const m = /^PRE (\{.*\})\s*$/m.exec(fs.readFileSync(d + "/" + f, "utf8")); if (!m) continue; const o = JSON.parse(m[1]); (R[T + "|" + M] = R[T + "|" + M] || []).push({ r: +r, ...o.avg }); }
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
console.log("perf6 medians of 3 runs; each Bluestone era / Halyard");
for (const T of ["day", "dusk"]) { const h = R[T + "|halyard0"] || [];
  for (const e of [1, 2, 3]) { const a = R[T + "|bluestone" + e] || [];
    console.log(`  ${T.padEnd(4)} e${e}: calls ${med(a.map((x) => x.calls)).toFixed(0)} / ${med(h.map((x) => x.calls)).toFixed(0)} x${(med(a.map((x) => x.calls)) / med(h.map((x) => x.calls))).toFixed(2)} | tris x${(med(a.map((x) => x.tris)) / med(h.map((x) => x.tris))).toFixed(2)} | cpuRender ${med(a.map((x) => x.ms)).toFixed(2)} / ${med(h.map((x) => x.ms)).toFixed(2)} x${(med(a.map((x) => x.ms)) / med(h.map((x) => x.ms))).toFixed(2)}`); } }
' "$J" | tee "$J/perf.txt"
echo "### done"
