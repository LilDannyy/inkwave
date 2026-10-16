#!/bin/bash
# kind: balance
# after: JOB-4
# [b5-int3] the lead's set F: the Carp Field load budget (SPEC: ≤ 60 ms per state at match start) — karp-field.js's
# all-stages sweep three times, ONE AT A TIME (the runner runs one job at a time, so nothing else is on the machine),
# at b97b3eb. The per-stage warm-rebuild and match-start rows → $JOB_OUT/F.txt.
set -u
H="$JOB_OUT/head"; mkdir -p "$H"; git archive b97b3eb | tar -x -C "$H"; ln -s "$PWD/node_modules" "$H/node_modules"
for i in 1 2 3; do
  echo "### load average before run $i: $(sysctl -n vm.loadavg)"
  (cd "$H" && MAP=karpbox MODE=bazookarp WATCHDOG=3600000 PAGE=tools/botlab/tests/karp-field.js tools/botlab/run.sh tools/botlab/page.cjs > "$JOB_OUT/karp-$i.log" 2>&1)
  echo "== karp-field #$i: $(grep -E '^RESULT' "$JOB_OUT/karp-$i.log" | tail -1) $(grep -c '^FAIL' "$JOB_OUT/karp-$i.log") FAIL"
  grep -E '^FAIL' "$JOB_OUT/karp-$i.log" | cut -c1-300
done | tee "$JOB_OUT/runs.txt"
node -e '
const fs = require("fs"), d = process.argv[1], rows = {};
for (let i = 1; i <= 3; i++) { let L = ""; try { L = fs.readFileSync(d + "/karp-" + i + ".log", "utf8"); } catch (e) { continue; }
  for (const line of L.split("\n")) { const m = /^(PASS|FAIL) the (warm rebuild|build at match start) per state.*?  (\[.*\])\s*$/.exec(line); if (!m) continue;
    for (const r of JSON.parse(m[3])) { const o = rows[r.id] || (rows[r.id] = { states: r.states, warm: [], start: [] }); if (m[2] === "warm rebuild") o.warm.push(r.warm); else o.start.push(r.start); } } }
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : "-"; };
console.log("F: stage | states | warm rebuild ms/state (runs 1, 2, 3; median) | match-start build ms/state (runs 1, 2, 3; median) | over 60 at start");
for (const [id, o] of Object.entries(rows)) console.log(`  ${id.padEnd(12)} ${String(o.states).padEnd(3)} ${o.warm.join(", ").padEnd(20)} ${String(med(o.warm)).padEnd(6)} ${o.start.join(", ").padEnd(20)} ${String(med(o.start)).padEnd(6)} ${o.start.filter((x) => x > 60).length}/${o.start.length}`);
' "$JOB_OUT" | tee "$JOB_OUT/F.txt"
rm -r "$H"
