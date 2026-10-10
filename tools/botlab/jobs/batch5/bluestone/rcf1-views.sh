#!/bin/bash
# Bluestone round C fix 1 (scratch): the pictures of what this round changes, one Electron run per (era, mode) through
# the shared slot lock (the Mac mini is unavailable).   rcf1-views.sh <out dir> <work dir> "<sets>"
#   z1 z3   era 1 / 3, Zone Control: the top (the zones) and the knee side zone from the circus, Swimston, Prow Place, high
#   k1 k3   era 1 / 3, Turf War: the customs dock (the reviewer's knee-pocket views, the dock from the apron and from on it,
#           high) and the knee flight (from the knee, from the balcony; era 3: the flight → the hotel stair → the Halo)
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
ZV='{"name":"sidezone-from-circus","from":[-11,2.2,-7],"look":[-26,0.5,-19.5],"fov":75},{"name":"sidezone-from-swimston","from":[-20.5,1.75,-38],"look":[-26,0.5,-19],"fov":75},{"name":"sidezone-from-prow","from":[-35,2.75,-26],"look":[-22,0.5,-17],"fov":75},{"name":"sidezone-high","from":[-6,17,-34],"look":[-26,0,-19.5],"fov":70}'
KV='{"name":"knee-pocket","from":[-35,1.6,-3],"look":[-27,0.8,15],"fov":75},{"name":"knee-pocket-high","from":[-52,18,-16],"look":[-27,0,6],"fov":70},{"name":"dock-from-apron","from":[-21,1.75,1],"look":[-31,1.6,9],"fov":75},{"name":"dock-from-on-it","from":[-31.5,2.95,9.5],"look":[-12,1.5,4],"fov":75},{"name":"dock-to-boathouse","from":[-33,2.95,4],"look":[-18,2.4,18],"fov":75},{"name":"knee-flight","from":[-25,1.75,-24],"look":[-14,2.2,-17],"fov":75},{"name":"knee-flight-top","from":[-14.6,4.3,-17.4],"look":[-6,1.5,-4],"fov":75}'
K3='{"name":"knee-flight-to-halo","from":[-23,1.75,-24],"look":[-14.5,4.5,-9],"fov":75},{"name":"hotel-stair-from-flight","from":[-15,4.1,-17.6],"look":[-15.2,5.4,-6],"fov":75}'
for e in 1 3; do has z$e && { shot $e zones r4-era$e-zones "top,[$ZV]"; mv -f "$O/r4-era$e-zones-top.jpg" "$O/r4-era$e-top-zones.jpg" 2>/dev/null; }; done
has k1 && shot 1 turf r4-era1 "[$KV]"
has k3 && shot 3 turf r4-era3 "[$KV,$K3]"
echo "### done"
