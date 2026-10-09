#!/bin/bash
# Bluestone round C (scratch): the composite pictures from rc-pictures.sh's and rc-local.sh's run dirs.
#   rc-sheets.sh <pictures work dir> <rc-local work dir> <out dir>
#   r4-shape-sheet.jpg     the three eras' tops beside crossmarket-top.webp and Halyard's top at one scale, and the
#                          walkable masks of Bluestone era 1 and Crossroads Market at the same scale
#   r4-mid-vs-crossmarket.jpg   Bluestone's mid (the ring camera at 7:30) per era beside Crossroads Market's mid
#   r4-eraN-cover-map.jpg, r4-cover-maps-eras-and-halyard.jpg   cover-map.js's maps
#   r4-eraN-tower-check-rail.jpg   tower-check's rail picture
W="$1"; L="$2"; O="$3"; J=tools/botlab/jobs/batch5/bluestone; ST=tools/botlab/jobs/batch5/stages/bluestone
cd "$(dirname "$0")/../../../../.." || exit 1
mkdir -p "$O" "$W/sheets"
jpg() { sips -Z ${3:-1400} -s format jpeg -s formatOptions 70 "$1" --out "$2" > /dev/null; [ "$(stat -f %z "$2")" -gt 300000 ] && sips -s format jpeg -s formatOptions 50 "$1" -Z ${3:-1400} --out "$2" > /dev/null; [ "$(stat -f %z "$2")" -gt 300000 ] && sips -s format jpeg -s formatOptions 40 "$1" -Z 1100 --out "$2" > /dev/null; return 0; }
B=-42,42,-80,80
COLS=2 python3 $J/rc-sheet.py "$W/sheets/tops.png" "Round C: Bluestone (the Z), Crossroads, Halyard - one scale" 3.2 \
  "$ST/crossmarket-top.webp=Crossroads Market (crossmarket-top.webp)=-31,31,-68,68" \
  "$L/perfH/halyard-day-top.png=Halyard Marina (the bar)=-24,24,-70,70" \
  "$W/r4-era1/bluestone-day-top.png=Bluestone era 1, the 1880s=$B" \
  "$W/r4-era2/bluestone-day-top.png=Bluestone era 2, today (+ Iron Bridge)=$B" \
  "$W/r4-era3/bluestone-day-top.png=Bluestone era 3, 3000s (+ garden, Halo)=$B"
CMF=$(grep -o '"floorCells":[0-9]*' "$L/cover-map-crossmarket.log" | head -1 | cut -d: -f2); BLF=$(grep -o '"floorCells":[0-9]*' "$L/cover-map1.log" | head -1 | cut -d: -f2)
(cd $J && ERA=1 node --import ./three-hook.mjs shape-sheet.mjs "$W/sheets/masks.json" crossmarket bluestone > /dev/null)
python3 $J/rc-masks.py "$W/sheets/masks.json" "$W/sheets/masks.png" 3.2 "Walkable floor, same scale" \
  "crossmarket=Crossroads: {n} m² (raster), $CMF floorCells" "bluestone=Bluestone era 1: {n} m² (raster), $BLF floorCells"
python3 - "$W/sheets" <<'PY'
import sys
from PIL import Image
D = sys.argv[1]; a = Image.open(f'{D}/tops.png'); b = Image.open(f'{D}/masks.png')
s = Image.new('RGB', (max(a.width, b.width), a.height + b.height), (22, 26, 32)); s.paste(a, (0, 0)); s.paste(b, (0, a.height)); s.save(f'{D}/shape-sheet.png')
PY
jpg "$W/sheets/shape-sheet.png" "$O/r4-shape-sheet.jpg" 2000
# mid beside Crossroads' mid
python3 - "$W" "$O" <<'PY'
import sys
from PIL import Image, ImageDraw, ImageFont
W, O = sys.argv[1], sys.argv[2]
F = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 22)
ims = [(f'Bluestone era {e}: the dome over the concourse from the ring at 7:30', f'{W}/r4-era{e}/bluestone-day-mid-from-ring-730.png') for e in (1, 2, 3)] + [('Crossroads Market: the Market Hall and its tram, the same height', f'{W}/cross/crossmarket-day-mid.png')]
tiles = []
for lab, p in ims:
    im = Image.open(p).convert('RGB'); im.thumbnail((900, 900)); t = Image.new('RGB', (im.width, im.height + 34), (22, 26, 32)); t.paste(im, (0, 34)); ImageDraw.Draw(t).text((8, 4), lab, fill=(240, 240, 240), font=F); tiles.append(t)
w, h = tiles[0].width, tiles[0].height
s = Image.new('RGB', (2 * w + 10, 2 * h + 10), (22, 26, 32))
for i, t in enumerate(tiles): s.paste(t, ((i % 2) * (w + 10), (i // 2) * (h + 10)))
s.save(f'{W}/sheets/mid-vs.png'); print('mid sheet', s.size)
PY
jpg "$W/sheets/mid-vs.png" "$O/r4-mid-vs-crossmarket.jpg" 1600
# cover maps
for e in 1 2 3; do python3 tools/botlab/cover-map.py "$L/cover-map$e.log" "$W/sheets/cover$e.png" "Bluestone Junction era $e (round C): distance to cover (cover-map.js)" > /dev/null && jpg "$W/sheets/cover$e.png" "$O/r4-era$e-cover-map.jpg"; done
python3 tools/botlab/cover-map.py "$L/cover-map-halyard.log" "$W/sheets/coverH.png" "Halyard Marina (the bar)" > /dev/null
python3 tools/botlab/cover-map.py "$L/cover-map-crossmarket.log" "$W/sheets/coverC.png" "Crossroads Market" > /dev/null
python3 - "$W/sheets" "$O" <<'PY'
import sys
from PIL import Image
D, O = sys.argv[1], sys.argv[2]
ims = [Image.open(f'{D}/cover{e}.png') for e in ('1', '2', '3', 'H', 'C')]
h = 900; ims = [im.resize((int(im.width * h / im.height), h)) for im in ims]
sheet = Image.new('RGB', (sum(i.width for i in ims) + 60, h + 20), (20, 20, 24)); x = 10
for im in ims: sheet.paste(im, (x, 10)); x += im.width + 10
sheet.thumbnail((2200, 2200)); sheet.save(f'{O}/r4-cover-maps-eras-and-halyard.jpg', quality=72); print('ok')
PY
for e in 1 2 3; do f=$(ls "$L/tc$e"/*rail*.png 2>/dev/null | head -1); [ -n "$f" ] && jpg "$f" "$O/r4-era$e-tower-check-rail.jpg"; done
ls -la "$O" | grep r4- | awk '{print $5, $9}'
