#!/bin/bash
# sub-tweaks2 pictures (tools/botlab/scenes/sub-tweaks2.js): PNGs to $PNG, then JPEG q78 into ./out/
#   BOTLAB_OUT=… SLOTS=4 tools/botlab/jobs/sub-tweaks2/shots.sh [scene …]     (no args: all of them)
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../../.." && pwd)"; cd "$ROOT"
PNG="${PNG:-$ROOT/.botlab/shots-sub-tweaks2}"; mkdir -p "$PNG" "$HERE/out"
PRE=tools/botlab/scenes/sub-tweaks2.js
shoot() {   # scene map actors shots-json
  local sc=$1 map=$2 act=$3 shots=$4
  OUT="$PNG/$sc" MAP=$map MODE=turf PLAY=1 ACTORS=$act PRE=$PRE PRE_ARGS=$sc SHOTS="$shots" tools/botlab/run.sh tools/botlab/shoot.cjs 2>&1 | grep -E "^PRE|shot |CONSOLE|ERROR|  \[" | sed "s/^/[$sc] /"
}
want() { [ $# -eq 0 ] && return 0; for a in "${ARGS[@]}"; do [ "$a" = "$1" ] && return 0; done; return 1; }
ARGS=("$@")
BOW='[{"name":"view","from":[6,8,-37],"look":[0,0,-20],"fov":60},{"name":"top","from":[0.01,24,-20],"look":[0,0,-20],"fov":55}]'
WAIL='[{"name":"side","from":[6.5,3.6,-36.8],"look":[0,1.8,-40.2],"fov":55}]'
TRK='[{"name":"close","from":[1.7,1.55,-3.5],"look":[0,0.85,-6],"fov":50},{"name":"10m","from":[6,3,1.8],"look":[0,0.8,-6],"fov":50}]'
PATCH='[{"name":"floor","from":[-6,5.2,-0.6],"look":[-6,0,-6],"fov":55},{"name":"wall","from":[8.6,2.6,-0.6],"look":[14,1.3,-3],"fov":55}]'
{ want bow-old && shoot bow-old testbox "" "$BOW"
  want bow-new && shoot bow-new testbox "" "$BOW"
  want bow-full && shoot bow-full testbox "" "$BOW"; } &
{ want wail-ledge && shoot wail-ledge testbox 1 "$WAIL"
  want wail-ledge-old && shoot wail-ledge-old testbox 1 "$WAIL"
  want sprinkler-patch && shoot sprinkler-patch testbox "" "$PATCH"; } &
{ want poisoned && shoot poisoned testbox 1 "$TRK"
  want poisoned-self && shoot poisoned-self testbox 1 'play'; } &
wait
# halyard / calamari ledges: the camera from the spot the scene finds (first pass prints it)
for map in halyard calamari; do
  want wail-map || want "wail-$map" || continue
  sp=$(OUT="$PNG/probe" MAP=$map MODE=turf PLAY=1 ACTORS=1 PRE=$PRE PRE_ARGS=wail-map SHOTS='[{"name":"x","from":[0,30,0],"look":[0,0,1],"fov":40}]' tools/botlab/run.sh tools/botlab/shoot.cjs 2>&1 | grep '^PRE')
  cam=$(echo "$sp" | python3 -c 'import sys,json,math; d=json.loads(sys.stdin.read()[4:])["spot"]; x,y,z,w=d["x"],d["y"],d["z"],d["yaw"]; fx,fz=math.sin(w),math.cos(w); sx,sz=fz,-fx; print(json.dumps([{"name":"side","from":[x+sx*6.5+fx*2.5,y+1.6,z+sz*6.5+fz*2.5],"look":[x+fx*0.8,y-0.4,z+fz*0.8],"fov":60}]))')
  echo "[wail-$map] $sp"; shoot wail-map $map 1 "$cam"
done
# PNG → JPEG q78
for f in "$PNG"/*/*.png; do
  sc=$(basename "$(dirname "$f")"); [ "$sc" = probe ] && continue
  n=$(basename "$f" .png); n=${n#testbox-day-}
  o="$HERE/out/$sc-$n.jpg"
  [ "$sc" = wail-map ] && o="$HERE/out/wail-${n%%-day-side}-ledge.jpg"   # (halyard-day-side → wail-halyard-ledge)
  sips -s format jpeg -s formatOptions 78 "$f" --out "$o" >/dev/null 2>&1
  # (kept under 300 KB: a busy stage picture goes to 1280 wide, q70)
  [ "$(stat -f %z "$o")" -gt 290000 ] && sips -Z 1280 -s format jpeg -s formatOptions 70 "$f" --out "$o" >/dev/null 2>&1
done
ls -la "$HERE/out"
