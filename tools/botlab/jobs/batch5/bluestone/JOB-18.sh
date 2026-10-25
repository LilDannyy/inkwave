#!/bin/bash
# kind: tests
# Bluestone art review 2 (the independent reviewer, not the builder), at the builder's final head 8188097a, quiet machine:
#   1. the art phase's GPU gate (LEAD-NOTES "GPU time is a gate": within 1.2x Halyard in every era, day and dusk, by
#      JOB-15's timer): gpu-time.sh, Halyard + eras 1-3, day and dusk, 3 rounds
#   2. where the time goes (for the fix): gpu-views.js on copies of this head with one part switched off (no level art;
#      no rooms behind the glass; no era re-skin loop; no front-cut discard), Bluestone e2 by day, 2 rounds, Halyard
#      alongside; gpu-attr.js (scene parts hidden in turn) on Bluestone e2 and Halyard
#   3. perf6 (calls / triangles / cpuRender) against Halyard, eras 1-3, day and dusk, 3 runs alternating, fresh profile
#   4. eras-jump 'first' x2 and 'frames' x3 (every FAIL line in full); net-eras (two clients + a late joiner) and lagged
#   5. the engine's suite and the frozen geometry (art-tests.sh), eras-bake, stage-audit turf / zones / tower per era,
#      boss in era 2
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/t" "$J/runs" "$J/v"
echo "### bluestone JOB-18 (art review 2) head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"

# 1. the gate
SETS="halyard:0 bluestone:1 bluestone:2 bluestone:3" TIMES="day dusk" ROUNDS=3 bash tools/botlab/jobs/batch5/bluestone/gpu-time.sh > "$J/t/gpu-time.log" 2>&1
grep -E '^###|ms \[|GPU ms' "$J/t/gpu-time.log" | head -20

# 2. attribution by elimination (copies of this head; the working tree is never edited)
cp tools/botlab/jobs/batch5/bluestone/gpu-views.js "$J/gpu-views.js"
mk() {   # name file from to : a copy of HEAD with one literal replacement (exactly one match, or the variant is dropped)
  local name=$1 file=$2 from=$3 to=$4 d="$J/v/$1"
  mkdir -p "$d"; git archive HEAD | tar -x -C "$d"; ln -s "$PWD/node_modules" "$d/node_modules"
  python3 -c '
import sys
p, a, b = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p).read(); n = s.count(a)
if n == 1: open(p, "w").write(s.replace(a, b))
print("# variant", sys.argv[4], "matches", n)
' "$d/$file" "$from" "$to" "$name"
}
mk noart src/game/eras.js 'const fn = this.layout?.levelArt;' 'const fn = null;'
mk norooms src/world/stages/bluestone/levelart.js '  if (m < 0.002) return vec3(0.0);' '  return vec3(0.0);'
mk noremap src/fx/eraFx.js 'for (int r = 0; r < 4; r++) {' 'for (int r = 0; r < 0; r++) {'
mk nodiscard src/fx/eraFx.js 'if (vEra.x < 6.5 && eraHasF(vEra.x, eb) < 0.5) discard;' 'if (vEra.x < -99.0) discard;'
vrun() { local tag=$1 root=$2 map=$3 e=$4 T=$5 r=$6 f="$J/v/$1-$3$4-$5-r$6.log"
  (cd "$root" && env BOTLAB_OUT="$J/bo" SLOTS=1 $( [ "$e" != 0 ] && echo ERA=$e ) MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/v" PRE="$J/gpu-views.js" tools/botlab/run.sh tools/botlab/shoot.cjs > "$f" 2>&1)
  echo "== gpuv $tag $map e$e $T r$r: $(grep -oE '"avg":\{[^}]*\}|"views":\[[^]]*\]' "$f" | tr '\n' ' ') $(grep -E 'WATCHDOG|PRE ERROR' "$f" | head -1 | cut -c1-160)"; }
for r in 1 2; do
  vrun head "$PWD" halyard 0 day $r
  vrun head "$PWD" bluestone 2 day $r
  for v in noart norooms noremap nodiscard; do vrun $v "$J/v/$v" bluestone 2 day $r; done
done | tee "$J/gpu-variants.txt"
for M in bluestone:2 halyard:0; do map=${M%%:*}; e=${M##*:}
  env BOTLAB_OUT="$J/bo" SLOTS=1 $( [ "$e" != 0 ] && echo ERA=$e ) MAP=$map TIME=day MODE=turf SHOTS='[]' OUT="$J/v" PRE=tools/botlab/jobs/batch5/bluestone/gpu-attr.js $R tools/botlab/shoot.cjs > "$J/v/attr-$map$e.log" 2>&1
  echo "== gpu-attr $map e$e: $(grep -E '^PRE ' "$J/v/attr-$map$e.log" | cut -c1-600)"
done | tee "$J/gpu-attr.txt"
for v in noart norooms noremap nodiscard; do rm -r "$J/v/$v"; done

# 3. perf6 against Halyard (as JOB-12)
P=tools/botlab/jobs/batch5/stages/aquarium/tools/perf6.js
for r in 1 2 3; do for T in day dusk; do for M in bluestone:1 bluestone:2 bluestone:3 halyard:0; do
  map=${M%%:*}; e=${M##*:}; n="$map$e-$T-$r"
  if [ "$e" = 0 ]; then BOTLAB_OUT="$J/bo" SLOTS=1 MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/runs" PRE="$P" $R tools/botlab/shoot.cjs > "$J/runs/$n.log" 2>&1
  else BOTLAB_OUT="$J/bo" SLOTS=1 ERA=$e MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/runs" PRE="$P" $R tools/botlab/shoot.cjs > "$J/runs/$n.log" 2>&1; fi
  echo "== perf $n: $(grep -E '^PRE ' "$J/runs/$n.log" | grep -oE '"avg":\{[^}]*\}|"quality":"[a-z]+"' | tr '\n' ' ') $(grep -E 'WATCHDOG|HARNESS|PRE failed|Error' "$J/runs/$n.log" | head -2 | tr '\n' ' ' | cut -c1-200)"
done; done; done > "$J/perf-runs.txt"
node -e '
const fs = require("fs"), d = process.argv[1] + "/runs", R = {};
for (const f of fs.readdirSync(d).filter((f) => f.endsWith(".log"))) { const [M, T, r] = f.slice(0, -4).split("-"); const m = /^PRE (\{.*\})\s*$/m.exec(fs.readFileSync(d + "/" + f, "utf8")); if (!m) continue; const o = JSON.parse(m[1]); (R[T + "|" + M] = R[T + "|" + M] || []).push({ r: +r, ...o.avg }); }
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; }, f = (v, k) => (k === "ms" ? v.toFixed(2) : String(Math.round(v)));
console.log("perf6 medians of 3 runs (the runs in brackets); each Bluestone era / Halyard");
for (const T of ["day", "dusk"]) { const h = R[T + "|halyard0"] || [];
  const row = (L) => ["calls", "tris", "ms"].map((k) => `${k} ${f(med(L.map((x) => x[k])), k)} [${L.sort((x, y) => x.r - y.r).map((x) => f(x[k], k)).join(", ")}]`).join(" | ");
  console.log(`  ${T.padEnd(4)} halyard:      ${row(h)}`);
  for (const e of [1, 2, 3]) { const a = R[T + "|bluestone" + e] || [];
    console.log(`  ${T.padEnd(4)} bluestone e${e}: ${row(a)}`);
    console.log(`  ${T.padEnd(4)}   ratio e${e}:   calls x${(med(a.map((x) => x.calls)) / med(h.map((x) => x.calls))).toFixed(2)} | tris x${(med(a.map((x) => x.tris)) / med(h.map((x) => x.tris))).toFixed(2)} | cpuRender x${(med(a.map((x) => x.ms)) / med(h.map((x) => x.ms))).toFixed(2)}`); } }
' "$J" | tee "$J/perf.txt"

# 4. the jump's frames, online
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/$n.log") FAIL"; grep -E '^FAIL' "$J/t/$n.log" | cut -c1-1400; }
for k in 1 2; do pg first-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=first'; done
for k in 1 2 3; do pg frames-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames'; grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$J/t/frames-$k.log" | head -1 | sed "s/^/# frames-$k jump worst /"; done
CLIENTS=2 URLQ=wipstages WIPSTAGES=1 NET=tools/botlab/tests/net-eras.cjs WATCHDOG=1200000 $R tools/botlab/netpage.cjs > "$J/t/net-eras.log" 2>&1
echo "== net-eras: $(grep -E '^RESULT|HARNESS' "$J/t/net-eras.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/net-eras.log") FAIL"; grep -E '^FAIL' "$J/t/net-eras.log" | cut -c1-700
CLIENTS=2 URLQ='wipstages&netlag=150&netjitter=50' WIPSTAGES=1 NET=tools/botlab/tests/net-eras.cjs NET_ARGS='only=turf' WATCHDOG=1200000 $R tools/botlab/netpage.cjs > "$J/t/net-eras-lag.log" 2>&1
echo "== net-eras lagged: $(grep -E '^RESULT|HARNESS' "$J/t/net-eras-lag.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/net-eras-lag.log") FAIL"; grep -E '^FAIL' "$J/t/net-eras-lag.log" | cut -c1-700

# 5. the suite, the frozen geometry, the bake
bash tools/botlab/jobs/batch5/bluestone/art-tests.sh "$J/art" > "$J/art-tests.txt" 2>&1
grep -E '^== ' "$J/art-tests.txt" | cut -c1-500
for f in "$J"/art/*.log; do grep -lE '^FAIL' "$f" >/dev/null 2>&1 && { echo "# FAIL lines in $(basename "$f"):"; grep -E '^FAIL' "$f" | cut -c1-900; }; done
grep -E '^bluestone' "$J/art/check-maps-all.log" | cut -c1-300 > "$J/check-maps-bluestone.txt"
pg eras-bake MAP=bluestone PAGE=tools/botlab/tests/eras-bake.js
for e in 1 2 3; do for M in turf zones tower; do
  MAP=bluestone MODE=$M ERA=$e WATCHDOG=900000 PAGE=tools/botlab/tests/stage-audit.js $R tools/botlab/page.cjs > "$J/t/audit-$M-$e.log" 2>&1
  echo "== stage-audit $M e$e: $(grep -E 'lightmap|^RESULT|WATCHDOG' "$J/t/audit-$M-$e.log" | tr '\n' ' ' | cut -c1-300)"
done; done
MAP=bluestone MODE=boss ERA=2 WATCHDOG=900000 PAGE=tools/botlab/tests/stage-audit.js $R tools/botlab/page.cjs > "$J/t/audit-boss-2.log" 2>&1
echo "== stage-audit boss e2: $(grep -E 'lightmap|^RESULT|WATCHDOG' "$J/t/audit-boss-2.log" | tr '\n' ' ' | cut -c1-300)"
echo "### done"
