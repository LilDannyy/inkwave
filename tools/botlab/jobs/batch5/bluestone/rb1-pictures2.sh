#!/bin/bash
# Bluestone blockout round B fix 1 (scratch): the whole picture set in the fewest Electron runs (the shared Mac is busy):
# per era ONE turf run with every camera (the standard set, mid, the round-3 views, the round-B views), then the zones
# top, the tower top and the ink after 20 s; Crossroads Market's mid; the sheets; tower-check's rail and the cover maps
# from rb1-local.sh's run dirs (RUNS).   rb1-pictures2.sh <out dir> <work dir>
O="$1"; W="$2"; R=tools/botlab/run.sh; J=tools/botlab/jobs/batch5/bluestone
cd "$(dirname "$0")/../../../../.." || exit 1
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
mkdir -p "$O" "$W"
jpg() { sips -Z 1400 -s format jpeg -s formatOptions 68 "$1" --out "$2" > /dev/null; [ "$(stat -f %z "$2")" -gt 300000 ] && sips -s format jpeg -s formatOptions 50 "$1" -Z 1400 --out "$2" > /dev/null; return 0; }
shot() { # era mode name-prefix cams
  local e=$1 m=$2 p=$3 c=$4
  ERA=$e MAP=bluestone TIME=day MODE=$m OUT="$W/$p" SHOTS="$c" WATCHDOG=900000 $R tools/botlab/shoot.cjs > "$W/$p.log" 2>&1
  echo "### $p"; grep -E '^REPORT|SHOT FAIL|WATCHDOG|MAP MISMATCH' "$W/$p.log" | cut -c1-200
  for f in "$W/$p"/*.png; do [ -f "$f" ] || continue; n=$(basename "$f" .png | sed -E 's/^bluestone-(zones-|tower-|boss-)?day-//'); jpg "$f" "$O/$p-$n.jpg"; done
}
MIDS='{"name":"mid-6oclock","from":[6.5,1.75,-17.5],"look":[0,2.8,0],"fov":75},{"name":"mid-8oclock","from":[-21,1.75,-9],"look":[0,2.8,0],"fov":75},{"name":"mid-4oclock","from":[16,1.75,-9],"look":[0,2.8,0],"fov":75}'
TIP='{"name":"tip-from-arm","from":[-30,3.2,-6],"look":[-50,1,-23],"fov":75},{"name":"tip-platform-down-the-arm","from":[-48.1,3.0,-15.2],"look":[-18,1.5,-6],"fov":75},{"name":"tip-high","from":[-36,16,-10],"look":[-49,0,-24],"fov":70},{"name":"tip-platform-to-prow","from":[-48.5,2.85,-16.5],"look":[-21,1.2,-22],"fov":75},{"name":"tip-sidings-from-turning","from":[-47.3,1.75,-28.7],"look":[-39.9,1.0,-18.6],"fov":75}'
GDN='{"name":"garden-from-arm","from":[-37,1.75,-16.5],"look":[-29,1.2,-28],"fov":75},{"name":"garden-from-prow","from":[-21,1.75,-22.5],"look":[-33,1.2,-29],"fov":75},{"name":"garden-from-alley","from":[-27,1.75,-39.5],"look":[-34,1.2,-25],"fov":75},{"name":"garden-high","from":[-18,15,-12],"look":[-31,0.5,-27],"fov":70}'
HTL='{"name":"hotel-stair-from-ring","from":[-5,1.75,-3],"look":[-15.5,3.5,-11.5],"fov":75},{"name":"hotel-stair-high","from":[-4,10,-1],"look":[-15,2.5,-11],"fov":70},{"name":"hotel-stair-from-arm-mouth","from":[-24,1.75,-9],"look":[-14,3,-12],"fov":75}'
HALO='{"name":"halo-walk","from":[-12.9,7.0,1.5],"look":[-5,5.4,-12.5],"fov":75},{"name":"halo-from-concourse","from":[0,3,-4],"look":[-8,6,-12],"fov":80}'
E1='{"name":"yard-high","from":[-18,15,-12],"look":[-31,0.5,-27],"fov":70},{"name":"cab-shelter-from-ring","from":[-5,1.75,-3],"look":[-15.5,2,-12.5],"fov":75}'
RB1='{"name":"west-corner-high","from":[-8,16,-60],"look":[-22,0,-45],"fov":70},{"name":"west-corner","from":[-13,1.75,-48.5],"look":[-25,1,-43],"fov":75},{"name":"quay-high","from":[6,15,-56],"look":[21,0,-41],"fov":70},{"name":"gpo-terrace","from":[-4.5,1.75,-41.5],"look":[-10,2.2,-31],"fov":75},{"name":"deck-back","from":[0,5.0,-64.5],"look":[0,4.2,-74],"fov":80}'
RB2='{"name":"river-works-high","from":[8,18,-38],"look":[28,0,-12],"fov":70},{"name":"bridge-deck","from":[23.4,1.15,-21.5],"look":[34,0.6,-3],"fov":75}'
RB3='{"name":"garden-ramp-prow","from":[-19.5,1.75,-21.5],"look":[-31,1.6,-22.5],"fov":75},{"name":"garden-ramp-hoki","from":[-20,1.75,-31.5],"look":[-31,1.6,-28.5],"fov":75},{"name":"garden-ramps-high","from":[-14,15,-27],"look":[-30,0.8,-27],"fov":70},{"name":"superstop-stair","from":[4,1.75,-31],"look":[0,2.5,-19],"fov":75}'
STD='top,aerialA,aerialB,sideL,sideR,play,mid'
shot 1 turf r3-era1 "$STD,[$MIDS,$TIP,$E1,$RB1]"
shot 2 turf r3-era2 "$STD,[$MIDS,$TIP,$GDN,$HTL,$RB2]"
shot 3 turf r3-era3 "$STD,[$MIDS,$TIP,$GDN,$HTL,$HALO,$RB3]"
for e in 1 2 3; do
  ERA=$e MAP=bluestone TIME=day MODE=zones OUT="$W/z$e" SHOTS='top' $R tools/botlab/shoot.cjs > "$W/z$e.log" 2>&1; [ -f "$W/z$e/bluestone-zones-day-top.png" ] && jpg "$W/z$e/bluestone-zones-day-top.png" "$O/r3-era$e-top-zones.jpg"
  ERA=$e MAP=bluestone TIME=day MODE=tower OUT="$W/w$e" SHOTS='top' $R tools/botlab/shoot.cjs > "$W/w$e.log" 2>&1; [ -f "$W/w$e/bluestone-tower-day-top.png" ] && jpg "$W/w$e/bluestone-tower-day-top.png" "$O/r3-era$e-top-tower.jpg"
  ERA=$e MAP=bluestone TIME=day MODE=turf PLAY=20 OUT="$W/p$e" SHOTS='top,aerialA' $R tools/botlab/shoot.cjs > "$W/p$e.log" 2>&1
  [ -f "$W/p$e/bluestone-day-top.png" ] && jpg "$W/p$e/bluestone-day-top.png" "$O/r3-era$e-ink-play20-top.jpg"
  [ -f "$W/p$e/bluestone-day-aerialA.png" ] && jpg "$W/p$e/bluestone-day-aerialA.png" "$O/r3-era$e-ink-play20-aerialA.jpg"
  for f in z w p; do echo "### era $e $f"; grep -E '^REPORT|WATCHDOG|SHOT FAIL' "$W/$f$e.log" | cut -c1-200; done
done
MAP=crossmarket TIME=day MODE=turf OUT="$W/cross" SHOTS='mid' $R tools/botlab/shoot.cjs > "$W/cross.log" 2>&1; echo "### crossmarket mid"
python3 - "$W" "$O" <<'EOF'
import sys
from PIL import Image, ImageDraw, ImageFont
W, O = sys.argv[1], sys.argv[2]
F = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 26)
ims = [('Crossroads Market: mid', f'{W}/cross/crossmarket-day-mid.png'), ('Bluestone Junction era 1: mid', f'{W}/r3-era1/bluestone-day-mid.png'),
       ('Bluestone era 2: mid', f'{W}/r3-era2/bluestone-day-mid.png'), ('Bluestone era 3: mid', f'{W}/r3-era3/bluestone-day-mid.png')]
ims = [(t, Image.open(p).resize((800, 450))) for t, p in ims]
sheet = Image.new('RGB', (1600, 900), (20, 20, 24))
for k, (t, im) in enumerate(ims):
    x, y = (k % 2) * 800, (k // 2) * 450; sheet.paste(im, (x, y)); d = ImageDraw.Draw(sheet); d.rectangle([x, y, x + 520, y + 40], fill=(20, 20, 24)); d.text((x + 10, y + 6), t, fill=(255, 255, 255), font=F)
sheet.save(f'{W}/mid-vs-crossmarket.png'); print('mid sheet ok')
EOF
jpg "$W/mid-vs-crossmarket.png" "$O/r3-mid-vs-crossmarket.jpg"; rm -f "$O"/r3-era?-mid.jpg
# tower-check's rail (its top picture) and the cover maps, from rb1-local.sh's run dirs (RUNS: oldest first)
for d in $RUNS; do for e in 1 2 3; do [ -f "$d/tc$e/bluestone-top.png" ] && jpg "$d/tc$e/bluestone-top.png" "$O/r3-era$e-tower-check-rail.jpg"
  [ -f "$d/cover-map$e.log" ] && python3 tools/botlab/cover-map.py "$d/cover-map$e.log" "$W/cover$e.png" "Bluestone Junction, era $e (round B fix 1): distance to cover (cover-map.js)" > /dev/null && jpg "$W/cover$e.png" "$O/r3-era$e-cover-map.jpg"; done
  [ -f "$d/cover-mapH.log" ] && python3 tools/botlab/cover-map.py "$d/cover-mapH.log" "$W/coverH.png" "Halyard Marina (the bar): distance to cover (cover-map.js)" > /dev/null; done
python3 - "$W" "$O" <<'PY'
import sys, os
from PIL import Image
W, O = sys.argv[1], sys.argv[2]
fs = [f'{W}/cover{e}.png' for e in ('1', '2', '3', 'H')]
if all(os.path.exists(f) for f in fs):
    ims = [Image.open(f) for f in fs]; h = 900; ims = [im.resize((int(im.width * h / im.height), h)) for im in ims]
    sheet = Image.new('RGB', (sum(i.width for i in ims) + 50, h + 20), (20, 20, 24)); x = 10
    for im in ims: sheet.paste(im, (x, 10)); x += im.width + 10
    sheet.thumbnail((2000, 2000)); sheet.save(f'{O}/r3-cover-maps-eras-and-halyard.jpg', quality=72); print('cover sheet ok')
PY
ls "$O" | grep -c '^r3-'; echo "PICS-DONE $(date)"
