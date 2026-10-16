#!/bin/bash
# kind: tests
# [b5-aquarium] the lead's like-for-like performance measure (the Mac mini helper, 2026-10-17): the reviewer's fixed-view
# probe tools/botlab/jobs/batch5/stages/aquarium/tools/perf6.js (8 fixed views: 2 per spawn, 4 eye-level views of mid;
# the average draw calls, triangles and cpuRender ms) on aquarium and halyard, day and dusk, 3 runs each with the stages
# alternating, ONE Electron at a time, on the source at botlab-b5-aquarium-src cc989bd0 (git archive into $JOB_OUT).
# Profiles: a fresh one (BOTLAB_OUT inside $JOB_OUT, SLOTS=1), so the game's defaults hold — quality high, shadows on,
# fov 82 — never a slot profile with saved settings. The probe as written sets fov 75 for its views itself: run A is the
# probe as written; run B is the same probe with that line swapped for a record of the profile's fov (82), so both
# readings exist. shoot.cjs with SHOTS='[]' (no pictures), 1600×900. Tables → $JOB_OUT/perf.txt.
set -u
H="$JOB_OUT/code"; mkdir -p "$H" "$JOB_OUT/runs"; git archive cc989bd0 | tar -x -C "$H"; ln -s "$PWD/node_modules" "$H/node_modules"
P=tools/botlab/jobs/batch5/stages/aquarium/tools/perf6.js
cp "$H/$P" "$JOB_OUT/perf6-A.js"
sed 's/ g\.settings\.fov = 75;/ window.__fov0 = g.settings.fov;/' "$H/$P" > "$JOB_OUT/perf6-B.js"
grep -c '__fov0 = g.settings.fov' "$JOB_OUT/perf6-B.js" | sed 's/^/# probe B patched lines: /'
for V in A B; do
  for r in 1 2 3; do for T in day dusk; do for M in aquarium halyard; do
    n="$V-$M-$T-$r"; echo "# $n load $(sysctl -n vm.loadavg)"
    (cd "$H" && BOTLAB_OUT="$JOB_OUT/bo-$V" SLOTS=1 MAP=$M TIME=$T MODE=turf SHOTS='[]' OUT="$JOB_OUT/runs" PRE="$JOB_OUT/perf6-$V.js" tools/botlab/run.sh tools/botlab/shoot.cjs > "$JOB_OUT/runs/$n.log" 2>&1)
    echo "== $n: $(grep -E '^PRE ' "$JOB_OUT/runs/$n.log" | grep -oE '"avg":\{[^}]*\}|"quality":"[a-z]+"|"pr":[0-9.]+|"fov0":[0-9.]+' | tr '\n' ' ') $(grep -E 'WATCHDOG|HARNESS|PRE failed|Error' "$JOB_OUT/runs/$n.log" | head -2 | tr '\n' ' ' | cut -c1-200)"
  done; done; done
done
node -e '
const fs = require("fs"), d = process.argv[1] + "/runs", R = {};
for (const f of fs.readdirSync(d).filter((f) => f.endsWith(".log"))) { const [V, M, T, r] = f.slice(0, -4).split("-"); const m = /^PRE (\{.*\})\s*$/m.exec(fs.readFileSync(d + "/" + f, "utf8")); if (!m) continue; const o = JSON.parse(m[1]); (R[V + "|" + T + "|" + M] = R[V + "|" + T + "|" + M] || []).push({ r: +r, ...o.avg, q: o.quality, sh: o.shadows, pr: o.pr, fov0: o.fov0 }); }
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; }, f = (v, k) => (k === "ms" ? v.toFixed(2) : String(Math.round(v)));
for (const V of ["A", "B"]) { console.log(`probe ${V}${V === "A" ? " (as written: fov 75 for its views)" : " (the profile fov, default 82)"}: medians of 3 runs (the runs in brackets); aquarium ÷ halyard`);
  for (const T of ["day", "dusk"]) { const a = R[V + "|" + T + "|aquarium"] || [], h = R[V + "|" + T + "|halyard"] || [];
    const row = (L) => ["calls", "tris", "ms"].map((k) => `${k} ${f(med(L.map((x) => x[k])), k)} [${L.sort((x, y) => x.r - y.r).map((x) => f(x[k], k)).join(", ")}]`).join(" | ");
    console.log(`  ${T.padEnd(4)} aquarium: ${row(a)}`); console.log(`  ${T.padEnd(4)} halyard:  ${row(h)}`);
    console.log(`  ${T.padEnd(4)} ratio:    calls ×${(med(a.map((x) => x.calls)) / med(h.map((x) => x.calls))).toFixed(2)} | tris ×${(med(a.map((x) => x.tris)) / med(h.map((x) => x.tris))).toFixed(2)} | cpuRender ×${(med(a.map((x) => x.ms)) / med(h.map((x) => x.ms))).toFixed(2)}   (settings seen: ${[...new Set([...a, ...h].map((x) => `quality ${x.q}, shadows ${x.sh}, pr ${x.pr}${x.fov0 != null ? ", fov " + x.fov0 : ""}`))].join(" / ")})`); } }
' "$JOB_OUT" | tee "$JOB_OUT/perf.txt"
rm -r "$H"
