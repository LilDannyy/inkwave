#!/bin/bash
# round B pictures, one Electron instance at a time (waits for the checks to finish first)
S=/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/rb1
until grep -q "RESULT checks done" $S/logs/checks2.out; do sleep 5; done
SHAPE='{"name":"shape","from":[-0.02,250,0],"look":[0,0,0],"fov":35}'
MIDS='{"name":"mid1","from":[1.5,2.9,-10.8],"look":[-1,3.5,4],"fov":80},{"name":"mid2","from":[11.5,2.9,8.5],"look":[-4,2.2,-5],"fov":80},{"name":"mid3","from":[-12.5,4.0,-1.0],"look":[6,2.0,-1],"fov":80}'
COMMON='{"name":"slump","from":[-13.2,2.8,-5.5],"look":[-27,0.4,-9],"fov":80},{"name":"bay","from":[8,9,-21],"look":[6,0,-42],"fov":75},{"name":"tail","from":[-24,4.0,1.5],"look":[-24,2.6,25],"fov":75},{"name":"alphahalf","from":[-0.02,95,-36],"look":[0,0,-36],"fov":50},{"name":"midob","from":[-22,16,-34],"look":[0,1.5,0],"fov":55}'
LOWONLY='{"name":"horn","from":[20.4,4.1,-16.4],"look":[24.6,2.8,-29.5],"fov":75},{"name":"ridge","from":[-30,5.4,-4],"look":[-22,3,22],"fov":75},{"name":"yard","from":[-17,5.6,-54],"look":[-14,3.6,-40],"fov":80},{"name":"terrace","from":[-4,4.0,-33.5],"look":[-22,2.6,-34],"fov":80},{"name":"rim","from":[-31,6.0,-36],"look":[-18,2.0,-20],"fov":80}'
HIGHONLY='{"name":"race2","from":[-26,2.9,1.6],"look":[-12,1.8,1.4],"fov":75},{"name":"lookout","from":[-10,6.3,-12.8],"look":[0,2.0,2],"fov":80}'
cd $S
./shoot.sh low low turf "top,play,aerialA,aerialB,sideL,sideR,[$SHAPE,$MIDS,$COMMON,$LOWONLY]"
./shoot.sh high high turf "top,aerialA,[$SHAPE,$MIDS,$COMMON,$HIGHONLY]"
./shoot.sh zones low zones "top"
./shoot.sh tower low tower "top"
./shoot.sh ink low turf "top,mid" PLAY=20
cd /Users/danielosling/Desktop/1/st-b5-caldera && BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3 MAP=halyard TIME=day MODE=turf OUT=$S/shots/perf SHOTS='top' tools/botlab/run.sh tools/botlab/shoot.cjs > $S/logs/shoot-perf-halyard.log 2>&1; echo "== halyard $(grep -E '^REPORT' $S/logs/shoot-perf-halyard.log | cut -c1-300)"
echo "RESULT pics done"
