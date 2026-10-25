#!/bin/bash
# kind: tests
# Bluestone art review 3 (the independent reviewer), JOB-27, at fix round 2's head: the whole proof re-run by the reviewer on
# a quiet machine. art-tests.sh (eras-static, eras-world and eras-jump in their parts, eras-look, eras-hud, eras-modes,
# stage-mods, world-build, check-maps every era, climb-audit / cover-map / spawn-mid / tower-check per era); eras-jump
# 'frames' x2 more and 'first'; eras-bake and stage-audit turf / zones / tower x e1-e3 and boss e2 (the lightmap applied);
# net-eras and its lagged run; perf6 against Halyard x3 (calls, tris, cpuRender per era, day and dusk); the GPU gate's
# method C (gpu-sustained.js 'Cdone': 30 renders back to back + a fence) Halyard and Bluestone e1-e3, day and dusk, 2 rounds.
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/t" "$J/runs" "$J/g"
echo "### bluestone JOB-27 (art review 3) head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
bash tools/botlab/jobs/batch5/bluestone/art-tests.sh "$J/art" > "$J/art-tests.txt" 2>&1
grep -E '^== ' "$J/art-tests.txt" | cut -c1-500
for f in "$J"/art/*.log; do grep -lE '^FAIL' "$f" >/dev/null 2>&1 && { echo "# FAIL lines in $(basename "$f"):"; grep -E '^FAIL' "$f" | cut -c1-1200; }; done
grep -E '^bluestone' "$J/art/check-maps-all.log" | sed 's/^/# check-maps /' | cut -c1-400
for e in 1 2 3; do grep -E 'climbs|barred|floor|within|open circle|RESULT' "$J/art/climb-audit-e$e.log" "$J/art/cover-map-e$e.log" | grep -vE '^\s*$' | head -8 | sed "s/^/# e$e /" | cut -c1-300; done
grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$J/art/eras-jump-d.log" | head -1 | sed 's/^/# art-tests frames worst /'
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/$n.log") FAIL"; grep -E '^FAIL' "$J/t/$n.log" | cut -c1-1500; }
for k in 1 2; do pg frames-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames'; grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$J/t/frames-$k.log" | head -1 | sed "s/^/# frames-$k jump worst /"; done
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
    console.log(`  ${T.padEnd(4)} e${e}: calls ${med(a.map((x) => x.calls)).toFixed(0)} / ${med(h.map((x) => x.calls)).toFixed(0)} x${(med(a.map((x) => x.calls)) / med(h.map((x) => x.calls))).toFixed(2)} | tris ${med(a.map((x) => x.tris)).toFixed(0)} / ${med(h.map((x) => x.tris)).toFixed(0)} x${(med(a.map((x) => x.tris)) / med(h.map((x) => x.tris))).toFixed(2)} | cpuRender ${med(a.map((x) => x.ms)).toFixed(2)} / ${med(h.map((x) => x.ms)).toFixed(2)} x${(med(a.map((x) => x.ms)) / med(h.map((x) => x.ms))).toFixed(2)}`); } }
' "$J" | tee "$J/perf.txt"
PS=tools/botlab/jobs/batch5/bluestone/gpu-sustained.js; H=tools/botlab/jobs/batch5/bluestone/gshoot.cjs
one() { local map=$1 e=$2 T=$3 r=$4 f="$J/g/$1$2-$3-r$4.log"; local EA=""; [ "$e" != 0 ] && EA="ERA=$e"
  env BOTLAB_OUT="$J/bo" SLOTS=1 $EA MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$PS" WATCHDOG=600000 $R "$H" > "$f" 2>&1
  echo "== sus $map e$e $T r$r: $(grep -E '^PRE ' "$f" | grep -oE '"A":[0-9.]+(,"A2":[0-9.]+)?,"B":[0-9.]+,"Bwall":[0-9.]+,"Cissue":[0-9.]+,"Cdone":[0-9.]+') $(grep -E 'WATCHDOG|PRE ERROR' "$f" | head -1 | cut -c1-160)"; }
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
