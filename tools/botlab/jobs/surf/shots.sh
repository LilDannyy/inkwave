#!/bin/bash
# Surf N' Turf pictures (tools/botlab/scenes/surf.js): PNGs to $PNG, then JPEG into ./out/ (each under 300 KB)
#   BOTLAB_OUT=… SLOTS=4 tools/botlab/jobs/surf/shots.sh [scene …]     (no args: all of them; ≤ 3 Electrons at once)
# The results screen with assists: results.sh (hud-shots.cjs).
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../../.." && pwd)"; cd "$ROOT"
PNG="${PNG:-${BOTLAB_OUT:-$ROOT/.botlab}/shots-surf}"; mkdir -p "$PNG" "$HERE/out"
PRE=tools/botlab/scenes/surf.js
shoot() {   # scene shots-json [pre-args]
  local sc=$1 shots=$2 args=${3:-$1}
  rm -rf "$PNG/$sc"
  OUT="$PNG/$sc" MAP=testbox MODE=turf PLAY=1 ACTORS=1 PRE=$PRE PRE_ARGS=$args SHOTS="$shots" tools/botlab/run.sh tools/botlab/shoot.cjs 2>&1 | grep -E "^PRE|shot |CONSOLE|ERROR|  \[" | sed "s/^/[$sc] /"
}
want() { [ ${#ARGS[@]} -eq 0 ] && return 0; for a in "${ARGS[@]}"; do [ "$a" = "$1" ] && return 0; done; return 1; }
seq5() { local n=$1 from=$2 look=$3 fov=$4 s='['; for i in $(seq 1 "$n"); do s="$s{\"name\":\"f$i\",\"from\":$from,\"look\":$look,\"fov\":$fov}"; [ "$i" -lt "$n" ] && s="$s,"; done; echo "$s]"; }
ARGS=("$@")
{ want hold && shoot hold '[{"name":"back","from":[1.1,2.2,-9.6],"look":[-0.2,1.2,-3.5],"fov":55},{"name":"left","from":[2.7,1.7,-4.6],"look":[0,1.4,-6.3],"fov":50},{"name":"right","from":[-2.7,1.7,-4.6],"look":[0,1.4,-6.3],"fov":50}]'
  want deployed && shoot deployed '[{"name":"close","from":[2.4,1.5,-2.9],"look":[0,0.65,-6],"fov":52},{"name":"low","from":[3.6,0.5,-8.8],"look":[0,0.7,-6],"fov":55}]'
  want turf && shoot turf '[{"name":"top","from":[0,50,-5.98],"look":[0,0,-6],"fov":62}]'; } &
{ want rings && shoot rings-top "$(seq5 4 '[0,15,-26]' '[0,0,-4]' 62)" 'rings fast=3.2'
  want rings && shoot rings-ground "$(seq5 4 '[7.5,0.85,-0.5]' '[0,0.45,-6]' 62)" 'rings fast=3.2'; } &
{ want mark && shoot mark "$(seq5 5 '[3.4,1.8,2.4]' '[0.1,1.0,-2.2]' 55)"
  want dodge && shoot dodge '[{"name":"view","from":[4.4,1.25,1.4],"look":[0.3,0.95,-1.8],"fov":55}]'
  want wall && shoot wall '[{"name":"view","from":[3.2,3.4,-7.5],"look":[13,0.3,0],"fov":62}]'; } &
wait
for f in "$PNG"/*/*.png; do
  sc=$(basename "$(dirname "$f")"); [ ${#ARGS[@]} -gt 0 ] && ! want "${sc%%-*}" && continue
  n=$(basename "$f" .png); n=${n#testbox-day-}
  o="$HERE/out/$sc-$n.jpg"
  sips -s format jpeg -s formatOptions 80 "$f" --out "$o" >/dev/null 2>&1
  [ "$(stat -f %z "$o")" -gt 290000 ] && sips -Z 1280 -s format jpeg -s formatOptions 72 "$f" --out "$o" >/dev/null 2>&1
done
ls -la "$HERE/out" | tail -n +2
