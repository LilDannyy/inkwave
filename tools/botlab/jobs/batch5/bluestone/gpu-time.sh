#!/bin/bash
# [b5-bluestone] GPU time per frame — the reusable job (the Mac mini helper, from JOB-15). Call it from a JOB-<n>.sh
# (cwd = the repo root, as the runner runs every job):
#   bash tools/botlab/jobs/batch5/bluestone/gpu-time.sh                        # halyard + bluestone eras 1-3, day + dusk, 2 rounds
#   SETS="bluestone:1 bluestone:3" TIMES=dusk ROUNDS=3 bash tools/botlab/jobs/batch5/bluestone/gpu-time.sh
#   BASE=<sha> bash tools/botlab/jobs/batch5/bluestone/gpu-time.sh             # + that commit's Bluestone (before / after, alternating)
# SETS: map:era pairs (era 0 = a stage without eras; halyard:0 is the reference). Output: one '== gpu' line per run
# ($JOB_OUT/gpu-runs.txt) and a table of medians with each Bluestone row ÷ Halyard's at the same time of day ($JOB_OUT/gpu.txt).
#
# How it is measured (gpu-views.js, the probe JOB-15 used, unchanged): the game's DEFAULT_SETTINGS forced (quality high,
# shadows on …), then the fov set to 75 as perf6.js does; every actor hidden and the sim frozen (the stage alone); the
# camera at perf6's eight fixed views (behind and at each spawn pad looking at mid, four eye-level views of mid from 15 m);
# per view 20 warm-up frames, then 24 frames each wrapped in an EXT_disjoint_timer_query_webgl2 TIME_ELAPSED query round
# the game's render (the GPU's own time, gl.finish after each) — the view's number is the median of the 24; a run's 'gpu'
# is the mean of its eight views. shoot.cjs's window: 1600×900, pixel ratio 1, offscreen; ERA=n boots the page with ?era=n.
# A fresh profile (BOTLAB_OUT inside $JOB_OUT, SLOTS=1) and ONE Electron at a time; the runner runs one job at a time, so
# the machine is otherwise quiet (the 1-min load average is printed first). Compare numbers only within one job.
set -u
P=tools/botlab/jobs/batch5/bluestone/gpu-views.js
J="${JOB_OUT:-.botlab/gpu-time}"; mkdir -p "$J/g"
SETS=${SETS:-"halyard:0 bluestone:1 bluestone:2 bluestone:3"}; TIMES=${TIMES:-"day dusk"}; ROUNDS=${ROUNDS:-2}; BASE=${BASE:-}
cp "$P" "$J/gpu-views.js"
roots="head:$PWD"
if [ -n "$BASE" ]; then
  mkdir -p "$J/base"; git archive "$BASE" | tar -x -C "$J/base"; ln -s "$PWD/node_modules" "$J/base/node_modules"
  rm -r "$J/base/tools/botlab"; cp -R tools/botlab "$J/base/tools/botlab"   # (this head's harness on that commit's game)
  roots="base:$J/base head:$PWD"
fi
echo "### gpu-time at $(git rev-parse --short HEAD) load $(sysctl -n vm.loadavg) | sets [$SETS] times [$TIMES] rounds $ROUNDS base ${BASE:-none}"
one() {   # tag root map era time  (r: the round)
  local tag=$1 root=$2 map=$3 e=$4 T=$5; local f="$J/g/$tag-$map$e-$T-r$r.log"
  (cd "$root" && env BOTLAB_OUT="$J/bo" SLOTS=1 $( [ "$e" != 0 ] && echo ERA=$e ) MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$J/gpu-views.js" tools/botlab/run.sh tools/botlab/shoot.cjs > "$f" 2>&1)
  echo "== gpu $tag $map e$e $T r$r: $(grep -oE '"avg":\{[^}]*\}|"views":\[[^]]*\]' "$f" | tr '\n' ' ') $(grep -E 'WATCHDOG|PRE ERROR|"ext":false' "$f" | head -1 | cut -c1-120)"
}
for r in $(seq 1 "$ROUNDS"); do for T in $TIMES; do for s in $SETS; do
  map=${s%:*}; e=${s#*:}
  for rt in $roots; do tag=${rt%%:*}; root=${rt#*:}; [ "$tag" = base ] && [ "$map" = halyard ] && continue; one "$tag" "$root" "$map" "$e" "$T"; done
done; done; done | tee "$J/gpu-runs.txt"
node -e '
const L = require("fs").readFileSync(process.argv[1], "utf8").split("\n"), R = {};
for (const l of L) { const m = /^== gpu (\S+) (\S+) e(\d) (\S+) r\d+: .*"avg":\{"gpu":([\d.]+),"calls":([\d.]+),"tris":(\d+)\}/.exec(l); if (!m) continue;
  const k = [m[1], m[2], m[3], m[4]].join("|"); (R[k] = R[k] || []).push({ gpu: +m[5], calls: +m[6], tris: +m[7] }); }
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const row = (k) => { const a = R[k]; return a && { gpu: med(a.map((x) => x.gpu)), calls: med(a.map((x) => x.calls)), tris: med(a.map((x) => x.tris)), runs: a.map((x) => x.gpu).join(", ") }; };
console.log("GPU ms per frame (median of the runs; [each run]) | draw calls | triangles | ÷ halyard (same time of day)");
for (const k of Object.keys(R).sort()) { const [tag, map, e, T] = k.split("|"), o = row(k), h = row(["head", "halyard", "0", T].join("|"));
  console.log(`  ${(tag + " " + map + (e !== "0" ? " e" + e : "")).padEnd(20)} ${T.padEnd(4)} ${o.gpu.toFixed(2).padStart(6)} ms [${o.runs}] | ${o.calls} | ${o.tris} | ${h && map !== "halyard" ? "×" + (o.gpu / h.gpu).toFixed(2) : "-"}`); }
' "$J/gpu-runs.txt" | tee "$J/gpu.txt"
if [ -n "$BASE" ]; then rm -r "$J/base"; fi
