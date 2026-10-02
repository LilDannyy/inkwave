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
{ want fly-orb && shoot fly-orb '[{"name":"f1","from":[5.5,2.4,-10.5],"look":[0.6,1.1,-6.6],"fov":55},{"name":"f2","from":[5.5,2.4,-10.5],"look":[0.6,1.1,-6.6],"fov":55},{"name":"f3","from":[5.5,2.4,-10.5],"look":[0.6,1.1,-6.6],"fov":55},{"name":"f4","from":[5.5,2.4,-10.5],"look":[0.6,1.1,-6.6],"fov":55},{"name":"f5","from":[5.5,2.4,-10.5],"look":[0.6,1.1,-6.6],"fov":55}]'
  want fly-tracer && shoot fly-tracer '[{"name":"f1","from":[4.6,2.0,-10.6],"look":[0,1.0,-8],"fov":55},{"name":"f2","from":[4.6,2.0,-10.6],"look":[0,1.0,-8],"fov":55},{"name":"f3","from":[4.6,2.0,-10.6],"look":[0,1.0,-8],"fov":55},{"name":"f4","from":[4.6,2.0,-10.6],"look":[0,1.0,-8],"fov":55},{"name":"f5","from":[4.6,2.0,-10.6],"look":[0,1.0,-8],"fov":55}]'; } &
{ want fly-mine && shoot fly-mine '[{"name":"f1","from":[-1.4,2.3,-1.8],"look":[-5.4,0.8,-6.6],"fov":58},{"name":"f2","from":[-1.4,2.3,-1.8],"look":[-5.4,0.8,-6.6],"fov":58},{"name":"f3","from":[-1.4,2.3,-1.8],"look":[-5.4,0.8,-6.6],"fov":58},{"name":"f4","from":[-1.4,2.3,-1.8],"look":[-5.4,0.8,-6.6],"fov":58},{"name":"f5","from":[-1.4,2.3,-1.8],"look":[-5.4,0.8,-6.6],"fov":58}]'
  want fly-sonar && shoot fly-sonar '[{"name":"f1","from":[0,5.5,-21],"look":[0,0.6,-6],"fov":60},{"name":"f2","from":[0,5.5,-21],"look":[0,0.6,-6],"fov":60},{"name":"f3","from":[0,5.5,-21],"look":[0,0.6,-6],"fov":60},{"name":"f4","from":[0,5.5,-21],"look":[0,0.6,-6],"fov":60},{"name":"f5","from":[0,5.5,-21],"look":[0,0.6,-6],"fov":60}]'; } &
{ want exit && shoot exit '[{"name":"f1","from":[2.6,1.9,-10.4],"look":[0,1.6,-6.2],"fov":60},{"name":"f2","from":[2.6,1.9,-10.4],"look":[0,1.6,-6.2],"fov":60},{"name":"f3","from":[2.6,1.9,-10.4],"look":[0,1.6,-6.2],"fov":60},{"name":"f4","from":[2.6,1.9,-10.4],"look":[0,1.6,-6.2],"fov":60}]'; } &
wait
# PNG → JPEG q78 (kept under 300 KB)
for f in "$PNG"/*/*.png; do
  sc=$(basename "$(dirname "$f")"); [ ${#ARGS[@]} -gt 0 ] && ! want "$sc" && continue
  n=$(basename "$f" .png); n=${n#testbox-day-}
  o="$HERE/out/$sc-$n.jpg"
  sips -s format jpeg -s formatOptions 78 "$f" --out "$o" >/dev/null 2>&1
  [ "$(stat -f %z "$o")" -gt 290000 ] && sips -Z 1280 -s format jpeg -s formatOptions 70 "$f" --out "$o" >/dev/null 2>&1
done
# a contact strip per sequence (its frames side by side)
for sc in fly-orb fly-tracer fly-mine fly-sonar exit; do
  ls "$HERE/out/$sc-f"*.jpg >/dev/null 2>&1 || continue
  python3 - "$HERE/out" "$sc" <<'PY'
import sys, glob
from PIL import Image
d, sc = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(f'{d}/{sc}-f*.jpg'))
ims = [Image.open(f).convert('RGB') for f in fs]
w = 520; ims = [im.resize((w, round(im.height * w / im.width))) for im in ims]
strip = Image.new('RGB', (w * len(ims) + 6 * (len(ims) - 1), ims[0].height), (20, 20, 24))
for i, im in enumerate(ims): strip.paste(im, (i * (w + 6), 0))
strip.save(f'{d}/{sc}-strip.jpg', quality=80)
PY
done
ls -la "$HERE/out"
