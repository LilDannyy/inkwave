#!/bin/bash
# kind: tests
# Bluestone fix round 3 (the art builder), JOB-28: review 3's major (a real jump applies the new era's lights: env.applyLights,
# the tiled cloud bake in the pre-bell, the sky's cross-fade) at its head — everything it could have broken. art-tests.sh
# (eras-static, eras-world and eras-jump in their parts incl. the corrected 'sky', eras-look incl. the new (i) real-jump test,
# eras-hud, eras-modes, stage-mods MAP=testbox, world-build halyard / bluestone, check-maps every stage, climb-audit /
# cover-map / spawn-mid / tower-check per era); eras-look (i) alone x2 more (it runs a dusk match through both jumps);
# eras-jump 'frames' x2 more and 'first' x2 (the bake runs in the pre-bell: nothing compiled, no frame over 50 ms);
# eras-bake and stage-audit turf / zones / tower x e1-e3, boss e2 (lightmap applied, not stale); net-eras and its lagged run
# (the known 2-cell Iron Bridge divergence is beta round 2's, not chased); the GPU gate by method C (gpu-sustained.js:
# Halyard and Bluestone e1-e3, day and dusk, 2 rounds) — the sky shader's new uniform-gated second cloud sample.
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/t" "$J/g"
echo "### bluestone JOB-28 (fix round 3, the major) head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
bash tools/botlab/jobs/batch5/bluestone/art-tests.sh "$J/art" > "$J/art-tests.txt" 2>&1
grep -E '^== ' "$J/art-tests.txt" | cut -c1-500
for f in "$J"/art/*.log; do grep -lE '^FAIL' "$f" >/dev/null 2>&1 && { echo "# FAIL lines in $(basename "$f"):"; grep -E '^FAIL' "$f" | cut -c1-1500; }; done
grep -E '^bluestone' "$J/art/check-maps-all.log" | sed 's/^/# check-maps /' | cut -c1-400
node build/check-maps.mjs bluestone bluestone.tower bluestone.zones bluestone.bazookarp bluestone.boss 2>&1 | grep -E '^bluestone' | sed 's/^/# check-maps variants /'
for e in 1 2 3; do grep -hoE '"climbs":[0-9]+,"bad":\[[^]]*\]|"floorCells":[0-9]+,"within5m_pct":[0-9.]+,"largestOpenRadius_m":[0-9.]+' "$J/art/climb-audit-e$e.log" "$J/art/cover-map-e$e.log" | sed "s/^/# e$e /"; done
grep -E 'art phase \(i\)|12c' "$J/art/eras-look.log" "$J/art/eras-jump-e.log" | grep -oE '^[^ ]+ [^{]{0,90}|"real(2|3)":\{[^}]*\}|"realDonePlus2":\{.{0,240}|"mid":\{[^}]*\}' | sed 's/^/# /' | cut -c1-400
grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$J/art/eras-jump-d.log" | head -3 | sed 's/^/# art-tests frames worst /'
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/$n.log") FAIL"; grep -E '^FAIL' "$J/t/$n.log" | cut -c1-1500; }
for k in 1 2; do pg look-i-$k MAP=bluestone PAGE=tools/botlab/tests/eras-look.js PAGE_ARGS='only=6'; grep -oE '"realDonePlus4_5":\{.{0,200}' "$J/t/look-i-$k.log" | head -1 | sed "s/^/# look-i-$k /"; done
for k in 1 2; do pg frames-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames'; grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$J/t/frames-$k.log" | head -3 | sed "s/^/# frames-$k worst /"; done
for k in 1 2; do pg first-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=first'; done
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
PS=tools/botlab/jobs/batch5/bluestone/gpu-sustained.js; H=tools/botlab/jobs/batch5/bluestone/gshoot.cjs
one() { local map=$1 e=$2 T=$3 r=$4 f="$J/g/$1$2-$3-r$4.log"; local EA=""; [ "$e" != 0 ] && EA="ERA=$e"
  env BOTLAB_OUT="$J/bo" SLOTS=1 $EA MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$PS" WATCHDOG=600000 $R "$H" > "$f" 2>&1
  echo "== sus $map e$e $T r$r: $(grep -E '^PRE ' "$f" | grep -oE '"Cissue":[0-9.]+,"Cdone":[0-9.]+') $(grep -E 'WATCHDOG|PRE ERROR' "$f" | head -1 | cut -c1-160)"; }
for r in 1 2; do for T in day dusk; do one halyard 0 $T $r; for e in 1 2 3; do one bluestone $e $T $r; done; done; done | tee "$J/sus.txt"
node -e '
const L = require("fs").readFileSync(process.argv[1], "utf8").split("\n"), R = {};
for (const l of L) { const m = /^== sus (\S+) e(\d) (\S+) r\d+: .*"Cissue":([\d.]+),"Cdone":([\d.]+)/.exec(l); if (!m) continue;
  const k = [m[1] + (m[2] !== "0" ? " e" + m[2] : ""), m[3]].join("|"); (R[k] = R[k] || []).push({ Ci: +m[4], C: +m[5] }); }
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log("SUMMARY method C (the gate): GPU throughput ms per frame, mean of 2 rounds | / halyard (same time of day)");
for (const k of Object.keys(R).sort()) { const [map, T] = k.split("|"), a = R[k], h = R[["halyard", T].join("|")];
  const C = mean(a.map((x) => x.C)), hC = mean(h.map((x) => x.C));
  console.log(`  ${map.padEnd(14)} ${T.padEnd(4)} C ${C.toFixed(2)} (x${(C / hC).toFixed(2)}) issue ${mean(a.map((x) => x.Ci)).toFixed(2)}`); }
' "$J/sus.txt" | tee "$J/sus-summary.txt"
echo "### done load $(sysctl -n vm.loadavg)"
