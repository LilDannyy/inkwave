#!/bin/bash
# bow-paint pictures (tools/botlab/scenes/bow-paint.js): a dummy kid draws the Tideline Bow on testbox and looses one
# volley over the clean deck; PNGs to $PNG, then JPEG into ./out/ (or $DEST), each kept under 300 KB.
#   BOTLAB_OUT=… SLOTS=4 tools/botlab/jobs/bow-paint/shots.sh [scene …]       (scenes: full ring tap three; no args: all)
#   TAG=before … names the files <scene>-<camera>-<TAG>.jpg (default: after); XARGS='tune=dropScale:0.6' a what-if
# The cameras are the lead's reference ones (ref/bow-now-*.jpg): 'archer' just behind the kid at (0, 0, −32) looking down
# the flight, 'top' straight down over it, 'view' from the side; 'three' gets a wider top-down and view.
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../../.." && pwd)"; cd "$ROOT"
PNG="${PNG:-$ROOT/.botlab/shots-bow-paint}"; DEST="${DEST:-$HERE/out}"; TAG="${TAG:-after}"; mkdir -p "$PNG" "$DEST"
PRE=tools/botlab/scenes/bow-paint.js
CAMS='[{"name":"archer","from":[0,1.5,-35],"look":[0,0.5,-20],"fov":60},{"name":"top","from":[0.01,28,-18.5],"look":[0,0,-18.5],"fov":55},{"name":"view","from":[6,8,-37],"look":[0,0,-20],"fov":60}]'
WIDE='[{"name":"top","from":[0.01,30,-20],"look":[0,0,-20],"fov":60},{"name":"view","from":[16,11,-38],"look":[0,0,-19],"fov":62}]'
shoot() {   # scene shots-json
  local sc=$1 shots=$2
  rm -rf "$PNG/$sc-$TAG"
  OUT="$PNG/$sc-$TAG" MAP=testbox MODE=turf PLAY=1 PRE=$PRE PRE_ARGS="$sc $XARGS" SHOTS="$shots" tools/botlab/run.sh tools/botlab/shoot.cjs 2>&1 | grep -E "^PRE|shot |CONSOLE|ERROR|  \[" | sed "s/^/[$sc] /"
}
ARGS=("$@"); [ ${#ARGS[@]} -eq 0 ] && ARGS=(full ring tap three)
one() { if [ "$1" = three ]; then shoot three "$WIDE"; else shoot "$1" "$CAMS"; fi; }
# (two at a time — the botlab's slots are shared with other runs: the even-numbered scenes in one queue, the odd in another)
{ i=0; for sc in "${ARGS[@]}"; do [ $((i % 2)) -eq 0 ] && one "$sc"; i=$((i + 1)); done; } &
{ i=0; for sc in "${ARGS[@]}"; do [ $((i % 2)) -eq 1 ] && one "$sc"; i=$((i + 1)); done; } &
wait
for d in "$PNG"/*-"$TAG"; do
  sc=$(basename "$d"); sc=${sc%-$TAG}
  for f in "$d"/*.png; do
    [ -f "$f" ] || continue
    n=$(basename "$f" .png); n=${n#testbox-day-}
    o="$DEST/$sc-$n-$TAG.jpg"
    sips -s format jpeg -s formatOptions 78 "$f" --out "$o" >/dev/null 2>&1
    [ "$(stat -f %z "$o")" -gt 290000 ] && sips -Z 1280 -s format jpeg -s formatOptions 70 "$f" --out "$o" >/dev/null 2>&1
  done
done
ls -la "$DEST" | grep -- "-$TAG.jpg"
