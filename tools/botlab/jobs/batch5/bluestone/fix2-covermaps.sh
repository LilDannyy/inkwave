#!/bin/bash
# Bluestone fix round 2 (scratch): the cover maps per era from the page runs' logs (cover-map.py), and one sheet of the
# three.   fix2-covermaps.sh <runD dir> <out dir>
D="$1"; O="$2"
for e in 1 2 3; do python3 tools/botlab/cover-map.py "$D/cover-map$e.log" "$D/cover$e.png" "Bluestone Junction, era $e (fix round 2): distance to cover (cover-map.js)" > /dev/null && sips -Z 1400 -s format jpeg -s formatOptions 70 "$D/cover$e.png" --out "$O/era$e-cover-map.jpg" > /dev/null; done
python3 - "$D" "$O" <<'PY'
import sys
from PIL import Image
D, O = sys.argv[1], sys.argv[2]
ims = [Image.open(f'{D}/cover{e}.png') for e in (1, 2, 3)]
h = 900; ims = [im.resize((int(im.width * h / im.height), h)) for im in ims]
sheet = Image.new('RGB', (sum(i.width for i in ims) + 40, h + 20), (20, 20, 24)); x = 10
for im in ims: sheet.paste(im, (x, 10)); x += im.width + 10
sheet.thumbnail((2000, 2000)); sheet.save(f'{O}/fix2-cover-maps-eras.jpg', quality=72); print('ok')
PY
