#!/bin/bash
# Bluestone blockout fix round 2: the pictures, LOCALLY, one Electron at a time (scratch).  fix2-pictures.sh <out dir> <work dir>
#   the standard set per era (pictures.sh), the fix-round views (fix2-*), the boss at its closest to the balcony and to
#   veranda E1, the side zone in every era from the review's camera, Crossroads Market's mid beside Bluestone's
O="$1"; W="$2"; R=tools/botlab/run.sh; J=tools/botlab/jobs/batch5/bluestone
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
mkdir -p "$O" "$W"
jpg() { sips -Z 1400 -s format jpeg -s formatOptions 68 "$1" --out "$2" > /dev/null; [ "$(stat -f %z "$2")" -gt 300000 ] && sips -s format jpeg -s formatOptions 50 "$1" -Z 1400 --out "$2" > /dev/null; return 0; }
shot() { # era mode name-prefix cams [extra env...]
  local e=$1 m=$2 p=$3 c=$4; shift 4
  env "$@" ERA=$e MAP=bluestone TIME=day MODE=$m OUT="$W/$p" SHOTS="$c" $R tools/botlab/shoot.cjs > "$W/$p.log" 2>&1
  grep -E '^REPORT|SHOT FAIL|WATCHDOG|MAP MISMATCH|^PRE' "$W/$p.log" | cut -c1-300
  for f in "$W/$p"/*.png; do [ -f "$f" ] || continue; n=$(basename "$f" .png | sed -E 's/^bluestone-(zones-|tower-|boss-)?day-//'); jpg "$f" "$O/$p-$n.jpg"; done
}
SIDE='{"name":"sidezone-sw","from":[11.2,2.45,-41.5],"look":[15,0.3,-29],"fov":75}'
for e in 1 2 3; do bash $J/pictures.sh $e "$O" "$W/std$e"; done
# the zones from low in every era (review issue 6: the side zone from the review's own camera; the centre zone)
for e in 1 2 3; do
  ERA=$e MAP=bluestone TIME=day MODE=zones OUT="$W/zl$e" SHOTS='[{"name":"side","from":[11.2,2.45,-41.5],"look":[15,0.3,-29],"fov":75},{"name":"mid","from":[0,3.4,-17],"look":[0,1.5,0],"fov":75}]' $R tools/botlab/shoot.cjs > "$W/zl$e.log" 2>&1
  for n in side mid; do [ -f "$W/zl$e/bluestone-zones-day-$n.png" ] && jpg "$W/zl$e/bluestone-zones-day-$n.png" "$O/era$e-zones-$n.jpg"; done
done
shot 1 turf fix2-era1 "[{\"name\":\"yard-from-arm\",\"from\":[-37.5,1.6,-20.5],\"look\":[-23,1,-32],\"fov\":75},{\"name\":\"yard-from-hoki\",\"from\":[-21,1.6,-34.5],\"look\":[-37,1,-21],\"fov\":75},{\"name\":\"alley-from-arm\",\"from\":[-41.5,1.6,-23.5],\"look\":[-25,1,-41],\"fov\":75},{\"name\":\"alley-from-hoki\",\"from\":[-22.5,1.6,-41],\"look\":[-39,1,-25],\"fov\":75},{\"name\":\"sw-high\",\"from\":[-12,26,-8],\"look\":[-30,0,-30],\"fov\":70},{\"name\":\"arm-out\",\"from\":[-19,1.6,-8],\"look\":[-46,1,-21],\"fov\":75},{\"name\":\"base-high\",\"from\":[0,30,-30],\"look\":[0,0,-60],\"fov\":70},$SIDE]"
shot 2 turf fix2-era2 "[{\"name\":\"arm-bridge-landing\",\"from\":[-26,1.6,-10],\"look\":[-36,1,-6],\"fov\":75},{\"name\":\"sw-high\",\"from\":[-12,26,-8],\"look\":[-30,0,-30],\"fov\":70},$SIDE]"
shot 3 turf fix2-era3 "[{\"name\":\"garden-from-arm\",\"from\":[-39,1.6,-17],\"look\":[-28,2.6,-28],\"fov\":75},{\"name\":\"garden-from-hoki\",\"from\":[-21,1.6,-37],\"look\":[-29,2.6,-23],\"fov\":75},{\"name\":\"garden-lawn-eye-to-base\",\"from\":[-28.5,4.13,-28],\"look\":[-12,2,-62],\"fov\":75},{\"name\":\"garden-high\",\"from\":[-16,14,-12],\"look\":[-29,2,-27],\"fov\":70},{\"name\":\"sw-high\",\"from\":[-12,26,-8],\"look\":[-30,0,-30],\"fov\":70},{\"name\":\"halo-from-concourse\",\"from\":[0,3,-4],\"look\":[0,6,-14],\"fov\":80},$SIDE]"
shot 2 boss fix2-era2-boss-balcony '[{"name":"from-ring","from":[1.5,5.5,-4],"look":[-8,1.5,-15],"fov":75},{"name":"high","from":[4,16,-2],"look":[-7,0,-14],"fov":70}]' PRE=$J/pre-boss-balcony.js PRE_ARGS=balcony ACTORS=1
shot 2 boss fix2-era2-boss-veranda '[{"name":"from-ring","from":[-2,5.5,-6],"look":[6,1.5,-18],"fov":75}]' PRE=$J/pre-boss-balcony.js PRE_ARGS=veranda ACTORS=1
MAP=crossmarket TIME=day MODE=turf OUT="$W/cross" SHOTS='mid,top' $R tools/botlab/shoot.cjs > "$W/cross.log" 2>&1
ERA=1 MAP=bluestone TIME=day MODE=turf OUT="$W/bmid" SHOTS='mid' $R tools/botlab/shoot.cjs > "$W/bmid.log" 2>&1
for e in 2 3; do ERA=$e MAP=bluestone TIME=day MODE=turf OUT="$W/bmid$e" SHOTS='mid' $R tools/botlab/shoot.cjs > "$W/bmid$e.log" 2>&1; done
python3 - "$W" "$O" <<'EOF'
import sys
from PIL import Image, ImageDraw, ImageFont
W, O = sys.argv[1], sys.argv[2]
F = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 26)
ims = [('Crossroads Market: mid', f'{W}/cross/crossmarket-day-mid.png'), ('Bluestone Junction era 1: mid', f'{W}/bmid/bluestone-day-mid.png'),
       ('Bluestone era 2: mid', f'{W}/bmid2/bluestone-day-mid.png'), ('Bluestone era 3: mid', f'{W}/bmid3/bluestone-day-mid.png')]
ims = [(t, Image.open(p).resize((800, 450))) for t, p in ims]
sheet = Image.new('RGB', (1600, 900), (20, 20, 24))
for k, (t, im) in enumerate(ims):
    x, y = (k % 2) * 800, (k // 2) * 450; sheet.paste(im, (x, y)); d = ImageDraw.Draw(sheet); d.rectangle([x, y, x + 520, y + 40], fill=(20, 20, 24)); d.text((x + 10, y + 6), t, fill=(255, 255, 255), font=F)
sheet.save(f'{W}/mid-vs-crossmarket.png'); print('mid sheet ok')
EOF
jpg "$W/mid-vs-crossmarket.png" "$O/fix2-mid-vs-crossmarket.jpg"
ls -la "$O" | grep -c jpg
echo "### pictures done $(date)"
