#!/bin/bash
# [b5-beta1] first-frames.cjs the cold way (review 1): each stage in its own Electron — a fresh GPU process — with the GPU
# shader disk cache off, as on the player's first run after an update; one stage after another (one slot of the lock at
# a time). Same settings as first-frames.cjs (STAGES=a,b, MODE, BAR, PLAY, EXTRA, LINEUP, DEVSTAGE, BOTLAB_OUT, SLOTS);
# every PASS / FAIL line is kept, then one RESULT n/m over all stages.
#   tools/botlab/first-frames-cold.sh                       (every stage in MAPS)
#   STAGES=aquarium,bluestone tools/botlab/first-frames-cold.sh
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
if [ -z "$STAGES" ]; then
  STAGES=$(cd "$ROOT" && node --input-type=module -e "const C = await import('./src/config.js'); console.log(C.MAPS.filter((m) => process.env.DEVSTAGE === '1' || !m.onlineOnly).map((m) => m.id).join(','))")
fi
pass=0; total=0
for s in ${STAGES//,/ }; do
  out=$(STAGES="$s" WATCHDOG="${WATCHDOG:-900000}" "$HERE/run.sh" --disable-gpu-shader-disk-cache "$HERE/first-frames.cjs" 2>&1)
  echo "$out" | grep -v '^RESULT' | grep -v "^(electron)\|^INKWAVE issue log"
  r=$(echo "$out" | grep '^RESULT' | tail -1 | sed 's/RESULT //')
  if [ -n "$r" ]; then pass=$((pass + ${r%/*})); total=$((total + ${r#*/})); else echo "FAIL $s (no RESULT: the harness died)"; total=$((total + 1)); fi
done
echo "RESULT $pass/$total"
