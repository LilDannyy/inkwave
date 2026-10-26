#!/bin/bash
# kind: tests
# Bluestone art phase, JOB-8: the fixed-view performance probe against Halyard per era (LEAD-NOTES art item 5: calls and
# cpuRender level, triangles within +15 %). The reviewer's probe tools/botlab/jobs/batch5/stages/aquarium/tools/perf6.js
# (8 fixed views: 2 per spawn pad, 4 eye-level views of mid from 15 m; average draw calls, triangles, cpuRender ms) on
# bluestone ERA=1, 2, 3 and halyard, day and dusk, 3 runs each with the four alternating, ONE Electron at a time, a fresh
# profile (BOTLAB_OUT inside $JOB_OUT, SLOTS=1: the game's defaults — quality high, shadows on), shoot.cjs with no
# pictures, 1600×900. Tables → $JOB_OUT/perf.txt.
set -u
P=tools/botlab/jobs/batch5/stages/aquarium/tools/perf6.js
mkdir -p "$JOB_OUT/runs"
echo "### bluestone JOB-8 head ${JOB_SHA:-?}"
for r in 1 2 3; do for T in day dusk; do for M in bluestone:1 bluestone:2 bluestone:3 halyard:0; do
  map=${M%%:*}; e=${M##*:}; n="$map$e-$T-$r"
  echo "# $n load $(sysctl -n vm.loadavg)"
  if [ "$e" = 0 ]; then
    BOTLAB_OUT="$JOB_OUT/bo" SLOTS=1 MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$JOB_OUT/runs" PRE="$P" tools/botlab/run.sh tools/botlab/shoot.cjs > "$JOB_OUT/runs/$n.log" 2>&1
  else
    BOTLAB_OUT="$JOB_OUT/bo" SLOTS=1 ERA=$e MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$JOB_OUT/runs" PRE="$P" tools/botlab/run.sh tools/botlab/shoot.cjs > "$JOB_OUT/runs/$n.log" 2>&1
  fi
  echo "== $n: $(grep -E '^PRE ' "$JOB_OUT/runs/$n.log" | grep -oE '"avg":\{[^}]*\}|"quality":"[a-z]+"' | tr '\n' ' ') $(grep -E 'WATCHDOG|HARNESS|PRE failed|Error' "$JOB_OUT/runs/$n.log" | head -2 | tr '\n' ' ' | cut -c1-200)"
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
' "$JOB_OUT" | tee "$JOB_OUT/perf.txt"
echo "### done"
