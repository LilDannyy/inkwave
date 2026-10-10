#!/bin/bash
# Bluestone round C fix 2 (scratch): the pictures of what this round changes, one Electron run per (era, mode) through
# the shared slot lock (the Mac mini is unavailable).   rcf2-views.sh <out dir> <work dir> "<sets>"
#   f1 f3   era 1 / 3, Turf War: the knee flight at 23.2° (from the knee, from its side, its top on the balcony, the landing;
#           era 3: the flight → the landing → the hotel stair → the Halo) and the punt crossing with its landing stage
#           (high, from the quay, from the landing west to the quay and north along the north leg to the Boathouse, the
#           reviewer's two punt-leg views)
#   f2      era 2, Turf War: the punt with the Iron Bridge
#   z1 z3   era 1 / 3, Zone Control: the top (the zones) and the knee side zone from the circus, Swimston, Prow Place, the
#           balcony (now from the knee flight's top), high
O="$1"; W="$2"; SETS="$3"; R=tools/botlab/run.sh
cd "$(dirname "$0")/../../../../.." || exit 1
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
mkdir -p "$O" "$W"
has() { case " $SETS " in *" $1 "*) return 0;; esac; return 1; }
jpg() { sips -Z 1400 -s format jpeg -s formatOptions 68 "$1" --out "$2" > /dev/null; [ "$(stat -f %z "$2")" -gt 300000 ] && sips -s format jpeg -s formatOptions 50 "$1" -Z 1400 --out "$2" > /dev/null; return 0; }
shot() { # era mode prefix cams
  local e=$1 m=$2 p=$3 c=$4
  ERA=$e MAP=bluestone TIME=day MODE=$m OUT="$W/$p" SHOTS="$c" WATCHDOG=900000 $R tools/botlab/shoot.cjs > "$W/$p.log" 2>&1
  echo "### $p"; grep -E '^REPORT|SHOT FAIL|bad shot|WATCHDOG|MAP MISMATCH' "$W/$p.log" | cut -c1-300
  for f in "$W/$p"/*.png; do [ -f "$f" ] || continue; n=$(basename "$f" .png | sed -E 's/^bluestone-(zones-|tower-|boss-)?day-//'); jpg "$f" "$O/$p-$n.jpg"; done
}
# the knee flight: x −17.8 (0) … −12.2 (2.4), z −18.5 … −15.5; the balcony from x −12.2; the landing x −14 … −11, z −15.5 … −12.5
FV='{"name":"knee-flight","from":[-25,1.75,-24],"look":[-14,2.2,-17],"fov":75},{"name":"knee-flight-side","from":[-21,1.75,-9],"look":[-14.5,1.2,-17],"fov":75},{"name":"knee-flight-top","from":[-11.8,3.9,-17.2],"look":[-6,1.5,-4],"fov":75},{"name":"knee-flight-down","from":[-11.8,3.9,-17.2],"look":[-19,0.6,-17.2],"fov":75},{"name":"knee-flight-landing","from":[-9.5,3.9,-17.4],"look":[-14,2.6,-13.5],"fov":75}'
F3='{"name":"knee-flight-to-halo","from":[-23,1.75,-24],"look":[-14.5,4.5,-9],"fov":75},{"name":"hotel-stair-from-flight","from":[-13.2,3.6,-16.8],"look":[-15.2,5.2,-8],"fov":75}'
# the punt: the east leg x −6 … 11, z −46 … −41; the landing stage x 11 … 18, z −48 … −41; the north leg x 11 … 16, z −41 … −20
PV='{"name":"river-corner-high","from":[-14,18,-52],"look":[4,0,-30],"fov":70},{"name":"punt-landing-high","from":[28,15,-58],"look":[10,0,-38],"fov":70},{"name":"quay-to-punt","from":[-8,1.75,-46],"look":[8,0.5,-42],"fov":75},{"name":"landing-to-quay","from":[16,1.1,-45],"look":[-6,0.6,-43.5],"fov":75},{"name":"landing-to-boathouse","from":[13.5,1.1,-46.6],"look":[14,1.4,-20],"fov":75},{"name":"punt-east-leg","from":[-4,1.1,-43.5],"look":[16,0.4,-44.5],"fov":75},{"name":"punt-north-leg","from":[13.5,1.1,-22],"look":[14,0.2,-46],"fov":75},{"name":"punt-to-mid","from":[12.5,1.4,-38],"look":[10,1.5,-12],"fov":75}'
ZV='{"name":"sidezone-from-circus","from":[-17.5,1.75,-3],"look":[-26,0.5,-19.5],"fov":75},{"name":"sidezone-from-swimston","from":[-17.5,2.0,-24.5],"look":[-27,0.5,-18],"fov":75},{"name":"sidezone-from-prow","from":[-35,2.75,-26],"look":[-22,0.5,-17],"fov":75},{"name":"sidezone-from-balcony","from":[-11.8,3.9,-17.2],"look":[-26,0.5,-19.5],"fov":75},{"name":"sidezone-high","from":[-6,17,-34],"look":[-26,0,-19.5],"fov":70}'
has f1 && shot 1 turf r4-era1 "[$FV,$PV]"
has f2 && shot 2 turf r4-era2 "[$PV]"
has f3 && shot 3 turf r4-era3 "[$FV,$F3,$PV]"
for e in 1 3; do has z$e && { shot $e zones r4-era$e-zones "top,[$ZV]"; mv -f "$O/r4-era$e-zones-top.jpg" "$O/r4-era$e-top-zones.jpg" 2>/dev/null; }; done
echo "### done"
