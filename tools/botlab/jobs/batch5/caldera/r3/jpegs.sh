#!/bin/bash
# Highmark Foundry r3: the shot PNGs → JPEGs under 300 KB in tools/botlab/jobs/batch5/stages/caldera/out/blockout/r3-*.jpg
cd "$(dirname "$0")/../../../../../.."
S=${SHOTDIR:-/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/cal-r3/shots}
O=tools/botlab/jobs/batch5/stages/caldera/out/blockout; mkdir -p "$O"
j() { local src=$1 dst=$2 size=${3:-1600}; [ -f "$src" ] || { echo "missing $src"; return; }
  for q in 82 74 66 58 50; do sips -Z $size -s format jpeg -s formatOptions $q "$src" --out "$O/$dst" >/dev/null; [ $(stat -f%z "$O/$dst") -lt 295000 ] && break; done; echo "$dst $(stat -f%z "$O/$dst")"; }
j $S/low/caldera-day-top.png r3-top-low.jpg
j $S/high/caldera-day-top.png r3-top-high.jpg
j $S/low/caldera-zones-day-top.png r3-top-zones.jpg
j $S/low/caldera-tower-day-top.png r3-top-tower.jpg
for m in mid1 mid2 mid3 slump arm; do j $S/low/caldera-day-$m.png r3-$m-low.jpg; j $S/high/caldera-day-$m.png r3-$m-high.jpg; done
j $S/high/caldera-day-lookout.png r3-organ-lookout-high.jpg
j $S/low/caldera-day-play.png r3-play-alpha.jpg
j $S/low/caldera-day-aerialA.png r3-aerial-a.jpg; j $S/low/caldera-day-aerialB.png r3-aerial-b.jpg; j $S/high/caldera-day-aerialA.png r3-aerial-a-high.jpg
j $S/low/caldera-day-sideL.png r3-side-l.jpg; j $S/low/caldera-day-sideR.png r3-side-r.jpg
for m in yard terrace rim; do j $S/low/caldera-day-$m.png r3-$m-eye.jpg; done
j $S/ink/caldera-day-top.png r3-ink-play20-top.jpg; j $S/ink/caldera-day-mid.png r3-ink-play20-mid.jpg
