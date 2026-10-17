#!/bin/bash
# Bluestone fix round 3 (scratch): the cover maps per era and Halyard's from the page runs' logs (cover-map.py), each as a
# JPEG and the four on one sheet.   fix3-covermaps.sh <run dir> <out dir>
D="$1"; O="$2"
jpg() { sips -Z 1400 -s format jpeg -s formatOptions 70 "$1" --out "$2" > /dev/null; [ "$(stat -f %z "$2")" -gt 300000 ] && sips -s format jpeg -s formatOptions 50 "$1" -Z 1400 --out "$2" > /dev/null; return 0; }
for e in 1 2 3; do python3 tools/botlab/cover-map.py "$D/cover-map$e.log" "$D/cover$e.png" "Bluestone Junction, era $e (fix round 3): distance to cover (cover-map.js)" > /dev/null && jpg "$D/cover$e.png" "$O/r3-era$e-cover-map.jpg"; done
python3 tools/botlab/cover-map.py "$D/cover-mapH.log" "$D/coverH.png" "Halyard Marina (the bar): distance to cover (cover-map.js)" > /dev/null
python3 - "$D" "$O" <<'PY'
import sys
from PIL import Image
D, O = sys.argv[1], sys.argv[2]
ims = [Image.open(f'{D}/cover{e}.png') for e in ('1', '2', '3', 'H')]
h = 900; ims = [im.resize((int(im.width * h / im.height), h)) for im in ims]
sheet = Image.new('RGB', (sum(i.width for i in ims) + 50, h + 20), (20, 20, 24)); x = 10
for im in ims: sheet.paste(im, (x, 10)); x += im.width + 10
sheet.thumbnail((2000, 2000)); sheet.save(f'{O}/r3-cover-maps-eras-and-halyard.jpg', quality=72); print('ok')
PY
ls -la "$O" | grep r3-.*cover
