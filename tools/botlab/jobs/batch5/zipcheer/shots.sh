#!/bin/bash
# [b5-zipcheer] pictures: the world ones (tools/botlab/scenes/zipcheer.js through shoot.cjs, testbox) and the HUD ones
# (tools/botlab/scenes/zipcheer-hud.js through hud-shots.cjs, halyard, at 1280×720 and 960×600). PNGs to $PNG, then JPEG
# into ./out/ (each under 300 KB).
#   BOTLAB_OUT=… SLOTS=3 tools/botlab/jobs/batch5/zipcheer/shots.sh [risen wisps zip hud]     (no args: all; one at a time)
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../../../.." && pwd)"; cd "$ROOT"
PNG="${PNG:-${BOTLAB_OUT:-$ROOT/.botlab}/shots-zipcheer}"; mkdir -p "$PNG" "$HERE/out"
PRE=tools/botlab/scenes/zipcheer.js
shoot() {   # scene shots-json
  local sc=$1 shots=$2
  rm -rf "$PNG/$sc"
  OUT="$PNG/$sc" MAP=testbox MODE=turf PLAY=1 ACTORS=1 W=1600 H=900 PRE=$PRE PRE_ARGS=$sc SHOTS="$shots" tools/botlab/run.sh tools/botlab/shoot.cjs 2>&1 | grep -E "^PRE|shot |CONSOLE|ERROR|  \[" | sed "s/^/[$sc] /"
}
hud() {   # w h
  local d="$PNG/hud-$1x$2"
  rm -rf "$d"
  OUT="$d" MAP=halyard MODE=turf TIME=day PLAY=4 W=$1 H=$2 SCENES=tools/botlab/scenes/zipcheer-hud.js tools/botlab/run.sh tools/botlab/hud-shots.cjs 2>&1 | grep -E "^shot|SCENE|CONSOLE|  \[" | sed "s/^/[hud $1x$2] /"
}
want() { [ ${#ARGS[@]} -eq 0 ] && return 0; for a in "${ARGS[@]}"; do [ "$a" = "$1" ] && return 0; done; return 1; }
seqn() { local n=$1 from=$2 look=$3 fov=$4 s='['; for i in $(seq 1 "$n"); do s="$s{\"name\":\"f$i\",\"from\":$from,\"look\":$look,\"fov\":$fov}"; [ "$i" -lt "$n" ] && s="$s,"; done; echo "$s]"; }
ARGS=("$@")
want risen && shoot risen '[{"name":"front","from":[3.6,2.3,0.6],"look":[0,3.0,-6],"fov":50},{"name":"side","from":[-7.8,0.9,-2.6],"look":[0,2.3,-6.4],"fov":48}]'
want wisps && shoot wisps "$(seqn 3 '[3.5,5.0,15]' '[0.2,2.6,-3]' 56)"
want zip && shoot zip "$(seqn 3 '[1.5,2.0,10.5]' '[3.5,1.2,0.8]' 62)"
want hud && { hud 1280 720; hud 960 600; }
for f in "$PNG"/*/*.png; do
  sc=$(basename "$(dirname "$f")"); [ ${#ARGS[@]} -gt 0 ] && ! want "${sc%%-*}" && continue
  n=$(basename "$f" .png); n=${n#testbox-day-}; n=${n#halyard-turf-day-}
  case "$n" in *-top) continue;; esac
  o="$HERE/out/$sc-$n.jpg"
  sips -s format jpeg -s formatOptions 80 "$f" --out "$o" >/dev/null 2>&1
  [ "$(stat -f %z "$o")" -gt 290000 ] && sips -Z 1280 -s format jpeg -s formatOptions 72 "$f" --out "$o" >/dev/null 2>&1
  echo "$o $(stat -f %z "$o")"
done
