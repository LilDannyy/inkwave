#!/bin/bash
# Drainbow pictures (tools/botlab/scenes/drainbow.js through hud-shots.cjs: the HUD up): PNGs to $PNG, then JPEG into
# ./out/ (kept under 300 KB) and a contact strip per sequence.
#   BOTLAB_OUT=… SLOTS=4 tools/botlab/jobs/drainbow/shots.sh [MAP]      (default halyard)
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../../.." && pwd)"; cd "$ROOT"
MAP="${1:-halyard}"
PNG="${PNG:-${BOTLAB_OUT:-$ROOT/.botlab}/shots-drainbow}/$MAP"; mkdir -p "$PNG" "$HERE/out"
SCENES=tools/botlab/scenes/drainbow.js MAP=$MAP MODE=turf PLAY=${PLAY:-10} OUT="$PNG" WATCHDOG=500000 tools/botlab/run.sh tools/botlab/hud-shots.cjs 2>&1 | grep -E "^shot|SCENE|CONSOLE|ERROR|  \["
for f in "$PNG"/*.png; do
  case "$f" in *-top.png) continue;; esac
  n=$(basename "$f" .png); n=${n#$MAP-turf-day-}
  o="$HERE/out/$MAP-$n.jpg"
  sips -s format jpeg -s formatOptions 80 "$f" --out "$o" >/dev/null 2>&1
  [ "$(stat -f %z "$o")" -gt 290000 ] && sips -Z 1280 -s format jpeg -s formatOptions 72 "$f" --out "$o" >/dev/null 2>&1
done
for sc in ripple wave back pop; do
  ls "$HERE/out/$MAP-$sc-"*.jpg >/dev/null 2>&1 || continue
  python3 - "$HERE/out" "$MAP-$sc" <<'PY'
import sys, glob
from PIL import Image
d, sc = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(f'{d}/{sc}-[0-9].jpg'))
ims = [Image.open(f).convert('RGB') for f in fs]
w = 400; ims = [im.resize((w, round(im.height * w / im.width))) for im in ims]
strip = Image.new('RGB', (w * len(ims) + 6 * (len(ims) - 1), ims[0].height), (20, 20, 24))
for i, im in enumerate(ims): strip.paste(im, (i * (w + 6), 0))
strip.save(f'{d}/{sc}-strip.jpg', quality=80)
PY
done
ls -la "$HERE/out" | tail -30
