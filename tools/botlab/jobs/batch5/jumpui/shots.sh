#!/bin/bash
# jump-ui pictures (tools/botlab/scenes/jump-ui.js through hud-shots.cjs: the HUD up): PNGs to $PNG, then JPEGs into
# ./out/ (kept under 300 KB): each scene's full frame, plus crops — the alert (top middle), the minimap (bottom left)
# and the world tag (around the screen middle).
#   BOTLAB_OUT=… SLOTS=3 [MODE=zones|tower|boss] [W=960 H=600] tools/botlab/jobs/batch5/jumpui/shots.sh [MAP] [TIME]
#   (default halyard day turf at 1600×900; another size adds -<W>x<H> to the names and shoots the alert scenes only)
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../../../.." && pwd)"; cd "$ROOT"
MAP="${1:-halyard}"; TIME="${2:-day}"; W=${W:-1600}; H=${H:-900}; SZ=""; [ "$W" != 1600 -o "$H" != 900 ] && SZ="${W}x${H}"
PNG="${PNG:-${BOTLAB_OUT:-$ROOT/.botlab}/shots-jumpui}/$MAP-$TIME${MODE:+-$MODE}${SZ:+-$SZ}"; mkdir -p "$PNG" "$HERE/out"; rm -f "$PNG"/*.png
SCENES=tools/botlab/scenes/jump-ui.js MAP=$MAP TIME=$TIME MODE=${MODE:-turf} PLAY=${PLAY:-8} OUT="$PNG" W=$W H=$H CROP=0,0,1,1 WATCHDOG=500000 tools/botlab/run.sh tools/botlab/hud-shots.cjs 2>&1 | grep -E "^shot|SCENE|CONSOLE|ERROR|  \[" | cut -c1-8000 | tee "$PNG/shots.log" | cut -c1-600
python3 - "$PNG" "$HERE/out" "$MAP-$TIME" "${MODE:-turf}" "$SZ" <<'PY'
import sys, glob, os, json, re
from PIL import Image
src, dst, tag, mode, sz = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
if mode != 'turf': tag += '-' + mode
if sz: tag += '-' + sz
# a scene may return { crop: [x, y, w, h] } (fractions of the frame): saved as <scene>-zoom at 2×
zoom = {}
for line in open(f'{src}/shots.log', errors='ignore'):
    m = re.match(r'^shot (\S+) (.*) \S+-top\.png$', line.strip())
    if not m: continue
    try: info = json.loads(m.group(2))
    except Exception: continue
    if isinstance(info, dict) and info.get('crop'): zoom[m.group(1)] = info['crop']
def save(im, path):
    q = 84
    while True:
        im.save(path, quality=q)
        if os.path.getsize(path) < 290_000 or q <= 50: break
        q -= 8
for f in sorted(glob.glob(f'{src}/*.png')):
    if f.endswith('-top.png'): continue
    n = os.path.basename(f)[:-4].split(f'-{mode}-')[-1].split('-', 1)[-1]   # <map>-<mode>-<time>-<scene> → <scene>
    im = Image.open(f).convert('RGB'); W, H = im.size
    save(im, f'{dst}/{tag}-{n}.jpg')
    # crops at 2×: the alert (top middle), the minimap (bottom left), the middle of the view
    crops = {'alert': (W * .18, 0, W * .82, H * .45), 'map': (0, H * .62, W * .27, H), 'mid': (W * .25, H * .18, W * .75, H * .72)}
    want = {'alert': ['alert', 'mid'], 'world': ['mid', 'map'], 'foe': ['mid', 'map'], 'inkjet': ['mid', 'map'], 'inkjet-home': ['mid'], 'zipline': ['mid', 'map'], 'tab': [],
            'stack-inkjet': ['mid', 'map'], 'stack-two': ['mid', 'map'], 'alert3-call': ['alert'], 'alert-tracked': ['alert']}
    if n in zoom:
        x, y, w, h = zoom[n]; cr = im.crop((round(x * W), round(y * H), round((x + w) * W), round((y + h) * H)))
        f2 = min(2, 1600 / cr.width); cr = cr.resize((round(cr.width * f2), round(cr.height * f2)), Image.LANCZOS)
        save(cr, f'{dst}/{tag}-{n}-zoom.jpg')
    for c in want.get(n, []):
        box = tuple(round(v) for v in crops[c]); cr = im.crop(box)
        cr = cr.resize((cr.width * 2 if cr.width < 800 else cr.width, cr.height * 2 if cr.width < 800 else cr.height), Image.LANCZOS)
        save(cr, f'{dst}/{tag}-{n}-{c}.jpg')
PY
ls -la "$HERE/out" | tail -40
