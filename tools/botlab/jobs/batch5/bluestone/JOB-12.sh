#!/bin/bash
# kind: tests
# Bluestone art fix round 1, JOB-12 (LEAD-REVIEW issue 6 and the re-runs of everything the round could break), on a quiet
# machine, at the round's head:
#   1. timing, alone: eras-jump 'first' x3 and 'frames' x3 (no frame over 50 ms from J − 0.5 to done + 1.5, stepped and the
#      Bravo / sunset-theme jumps split into era update / render / rest), each on a fresh page; the GPU probe (each frame of
#      jump 1 and of the kept world's 3 → 1 timed with gl.finish, as is and with the curtain / holograms / env rebuild off)
#   2. eras-hud x3 (the review's flaky layout checks)
#   3. perf6 against Halyard, day and dusk, eras 1-3, 3 runs alternating, a fresh default profile (as JOB-8)
#   4. the engine's suite and the frozen geometry (art-tests.sh), eras-bake, stage-audit turf per era (the lightmaps still
#      apply: no collider changed)
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"
mkdir -p "$J/t" "$J/runs"
echo "### bluestone JOB-12 head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/$n.log") FAIL"; grep -E '^FAIL' "$J/t/$n.log" | cut -c1-400; }
for k in a b c; do
  pg first-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=first'
  pg frames-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames'
  { echo "### first $k"; grep -E '^(PASS|FAIL)|^RESULT' "$J/t/first-$k.log" | cut -c1-700; echo "### frames $k"; grep -E '^(PASS|FAIL)|^RESULT' "$J/t/frames-$k.log" | cut -c1-900; } > "$J/timing-$k.txt"
done
pg probe-gpu MAP=bluestone PAGE=tools/botlab/jobs/batch5/bluestone/probe-gpu.js
grep -E '^(PASS|FAIL)|^RESULT' "$J/t/probe-gpu.log" | cut -c1-1500 > "$J/probe-gpu.txt"
for k in 1 2 3; do pg eras-hud-$k MAP=bluestone PAGE=tools/botlab/tests/eras-hud.js; done
P=tools/botlab/jobs/batch5/stages/aquarium/tools/perf6.js
for r in 1 2 3; do for T in day dusk; do for M in bluestone:1 bluestone:2 bluestone:3 halyard:0; do
  map=${M%%:*}; e=${M##*:}; n="$map$e-$T-$r"
  if [ "$e" = 0 ]; then BOTLAB_OUT="$J/bo" SLOTS=1 MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/runs" PRE="$P" $R tools/botlab/shoot.cjs > "$J/runs/$n.log" 2>&1
  else BOTLAB_OUT="$J/bo" SLOTS=1 ERA=$e MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/runs" PRE="$P" $R tools/botlab/shoot.cjs > "$J/runs/$n.log" 2>&1; fi
  echo "== perf $n: $(grep -E '^PRE ' "$J/runs/$n.log" | grep -oE '"avg":\{[^}]*\}|"quality":"[a-z]+"' | tr '\n' ' ') $(grep -E 'WATCHDOG|HARNESS|PRE failed|Error' "$J/runs/$n.log" | head -2 | tr '\n' ' ' | cut -c1-200)"
done; done; done
node -e '
const fs = require("fs"), d = process.argv[1] + "/runs", R = {};
for (const f of fs.readdirSync(d).filter((f) => f.endsWith(".log"))) { const [M, T, r] = f.slice(0, -4).split("-"); const m = /^PRE (\{.*\})\s*$/m.exec(fs.readFileSync(d + "/" + f, "utf8")); if (!m) continue; const o = JSON.parse(m[1]); (R[T + "|" + M] = R[T + "|" + M] || []).push({ r: +r, ...o.avg }); }
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; }, f = (v, k) => (k === "ms" ? v.toFixed(2) : String(Math.round(v)));
console.log("medians of 3 runs (the runs in brackets); each Bluestone era ÷ Halyard");
for (const T of ["day", "dusk"]) { const h = R[T + "|halyard0"] || [];
  const row = (L) => ["calls", "tris", "ms"].map((k) => `${k} ${f(med(L.map((x) => x[k])), k)} [${L.sort((x, y) => x.r - y.r).map((x) => f(x[k], k)).join(", ")}]`).join(" | ");
  console.log(`  ${T.padEnd(4)} halyard:      ${row(h)}`);
  for (const e of [1, 2, 3]) { const a = R[T + "|bluestone" + e] || [];
    console.log(`  ${T.padEnd(4)} bluestone e${e}: ${row(a)}`);
    console.log(`  ${T.padEnd(4)}   ratio e${e}:   calls ×${(med(a.map((x) => x.calls)) / med(h.map((x) => x.calls))).toFixed(2)} | tris ×${(med(a.map((x) => x.tris)) / med(h.map((x) => x.tris))).toFixed(2)} | cpuRender ×${(med(a.map((x) => x.ms)) / med(h.map((x) => x.ms))).toFixed(2)}`); } }
' "$J" | tee "$J/perf.txt"
bash tools/botlab/jobs/batch5/bluestone/art-tests.sh "$J/art" | tee "$J/art-tests.txt"
pg eras-bake MAP=bluestone PAGE=tools/botlab/tests/eras-bake.js
for e in 1 2 3; do MAP=bluestone MODE=turf ERA=$e WATCHDOG=900000 PAGE=tools/botlab/tests/stage-audit.js $R tools/botlab/page.cjs > "$J/t/audit-$e.log" 2>&1; echo "== stage-audit turf e$e: $(grep -E 'lightmap|^RESULT|WATCHDOG' "$J/t/audit-$e.log" | tr '\n' ' ' | cut -c1-300)"; done
echo "### done"
