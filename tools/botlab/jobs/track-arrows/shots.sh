#!/bin/bash
# track-arrows pictures (tools/botlab/scenes/track-arrows.js): PNGs to $PNG, then JPEG q78 into ./out/
#   BOTLAB_OUT=… SLOTS=4 tools/botlab/jobs/track-arrows/shots.sh [scene …]     (no args: all of them)
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../../.." && pwd)"; cd "$ROOT"
PNG="${PNG:-${BOTLAB_OUT:-$ROOT/.botlab}/shots-track-arrows}"; mkdir -p "$PNG" "$HERE/out"
PRE=tools/botlab/scenes/track-arrows.js
shoot() {   # scene shots-json
  local sc=$1 shots=$2
  OUT="$PNG/$sc" MAP=testbox MODE=turf PLAY=1 ACTORS=1 PRE=$PRE PRE_ARGS=$sc SHOTS="$shots" tools/botlab/run.sh tools/botlab/shoot.cjs 2>&1 | grep -E "^PRE|shot |CONSOLE|ERROR|  \[" | sed "s/^/[$sc] /"
}
want() { [ ${#ARGS[@]} -eq 0 ] && return 0; for a in "${ARGS[@]}"; do [ "$a" = "$1" ] && return 0; done; return 1; }
ARGS=("$@")
{ want close && shoot close '[{"name":"view","from":[1.9,1.6,-9.6],"look":[0,0.85,-6],"fov":55}]'
  want far && shoot far '[{"name":"view","from":[0.8,2.2,-19.2],"look":[0,0.9,-6],"fov":60}]'
  want straight && shoot straight '[{"name":"view","from":[0,0.95,-3.9],"look":[0,0.85,-6],"fov":50}]'
  want head && shoot head '[{"name":"view","from":[0,0.9,-3.5],"look":[0,0.85,-6],"fov":40}]'; } &
{ want wall && shoot wall '[{"name":"view","from":[4.4,2.4,-3.8],"look":[17,1.0,0.3],"fov":60}]'
  want mate && shoot mate '[{"name":"view","from":[4.2,2.4,4.6],"look":[17,1.0,0.3],"fov":60}]'
  want charger && shoot charger '[{"name":"view","from":[3.6,2.0,-3.2],"look":[0,0.9,-6.4],"fov":50}]'; } &
{ want self && shoot self 'play'
  want behind && shoot behind '[{"name":"view","from":[11.8,2.3,5.6],"look":[4,0.9,0],"fov":60}]'
  want foemate && shoot foemate '[{"name":"view","from":[11.8,2.3,5.6],"look":[4,0.9,0],"fov":60}]'; } &
wait
# PNG → JPEG q78 (kept under 300 KB)
for f in "$PNG"/*/*.png; do
  sc=$(basename "$(dirname "$f")"); [ ${#ARGS[@]} -gt 0 ] && ! want "$sc" && continue
  n=$(basename "$f" .png); n=${n#testbox-day-}
  o="$HERE/out/$sc-$n.jpg"
  sips -s format jpeg -s formatOptions 78 "$f" --out "$o" >/dev/null 2>&1
  [ "$(stat -f %z "$o")" -gt 290000 ] && sips -Z 1280 -s format jpeg -s formatOptions 70 "$f" --out "$o" >/dev/null 2>&1
done
ls -la "$HERE/out"
