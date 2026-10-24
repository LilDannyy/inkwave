#!/bin/bash
# Bluestone art phase (scratch): the local proof run, one Electron at a time (BOTLAB_OUT / SLOTS from the caller), logs into
# $1 (default .botlab/bs-art-tests): the engine's tests (eras-world and eras-jump in their parts, eras-look, eras-hud,
# eras-modes, eras-static, stage-mods, world-build), check-maps every era and variant, and the frozen geometry (climb-audit,
# cover-map, spawn-mid and tower-check per era). Prints one line per run.
set -u
L=${1:-.botlab/bs-art-tests}; mkdir -p "$L"
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 tools/botlab/run.sh tools/botlab/page.cjs > "$L/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$L/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$L/$n.log") FAIL"; }
node build/check-maps.mjs > "$L/check-maps-all.log" 2>&1; echo "== check-maps (every stage): $(grep -cE ' ok$' "$L/check-maps-all.log") ok lines, $(grep -E 'pieces' "$L/check-maps-all.log" | grep -vc ' ok$') not ok; $(grep -E '^bluestone' "$L/check-maps-all.log" | tr '\n' ';')"
node tools/botlab/tests/eras-static.mjs > "$L/eras-static.log" 2>&1; echo "== eras-static: $(grep -E '^RESULT' "$L/eras-static.log")"
pg eras-world-12 MAP=bluestone PAGE=tools/botlab/tests/eras-world.js PAGE_ARGS='only=1,2'
pg eras-world-34 MAP=bluestone PAGE=tools/botlab/tests/eras-world.js PAGE_ARGS='only=3,4'
pg eras-world-5 MAP=bluestone PAGE=tools/botlab/tests/eras-world.js PAGE_ARGS='only=5'
pg eras-look MAP=bluestone PAGE=tools/botlab/tests/eras-look.js
pg eras-jump-first MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=first'
pg eras-jump-a MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=sched,flip,fall,shove'
pg eras-jump-b MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=rescue,sjland,device,zip'
pg eras-jump-c MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=guard,fx'
pg eras-jump-d MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames'
pg eras-jump-e MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=sky,freeze,modes'
pg eras-hud MAP=bluestone PAGE=tools/botlab/tests/eras-hud.js
pg eras-modes MAP=bluestone PAGE=tools/botlab/tests/eras-modes.js
pg stage-mods MAP=testbox PAGE=tools/botlab/tests/stage-mods.js
pg world-build-halyard MAP=halyard PAGE=tools/botlab/tests/world-build.js
pg world-build-bluestone MAP=bluestone PAGE=tools/botlab/tests/world-build.js
for e in 1 2 3; do
  pg climb-audit-e$e MAP=bluestone ERA=$e PAGE=tools/botlab/tests/climb-audit.js
  pg cover-map-e$e MAP=bluestone ERA=$e PAGE=tools/botlab/tests/cover-map.js
  pg spawn-mid-e$e MAP=bluestone ERA=$e PAGE=tools/botlab/tests/spawn-mid.js
  MAP=bluestone ERA=$e SHOTS=0 tools/botlab/run.sh tools/botlab/tower-check.cjs > "$L/tower-check-e$e.log" 2>&1; echo "== tower-check e$e: $(grep -E 'ERA|holes|length|clearance|RESULT|WATCHDOG|ride' "$L/tower-check-e$e.log" | head -6 | tr '\n' ' ' | cut -c1-400)"
done
echo "== done"
