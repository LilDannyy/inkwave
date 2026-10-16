# [b5-int3] helpers for the Mac mini's measurement jobs (sourced by JOB-2 … JOB-4).
# pin <dir> <sha> [harness-dir]: that commit's tree in <dir> (+ node_modules); with a harness dir, its tools/botlab
# replaces the commit's own, so an older code reports the same numbers as the head.
pin() {
  mkdir -p "$1"; git archive "$2" | tar -x -C "$1"; ln -s "$PWD/node_modules" "$1/node_modules"
  if [ -n "${3:-}" ]; then rm -r "$1/tools/botlab"; cp -R "$3/tools/botlab" "$1/tools/botlab"; fi
}
# runs <file of lines "name dir ENV=… ENV=…">: match.cjs for each line, three at a time, bots at their default (normal),
# DIAG on; each writes $JOB_OUT/m/<name>.json and <name>.log, and prints one line
runs() {
  mkdir -p "$JOB_OUT/m"
  xargs -P 3 -L 1 bash -c 'n=$0; d=$1; shift; (cd "$d" && env "$@" DIAG=1 WATCHDOG=1500000 OUT="$JOB_OUT/m/$n.json" tools/botlab/run.sh tools/botlab/match.cjs > "$JOB_OUT/m/$n.log" 2>&1);
    echo "### $n: $(grep -E "^== " "$JOB_OUT/m/$n.log" | head -1 | cut -c1-160) | $(grep -E "^CONSOLE|FRAME ERRORS|WATCHDOG|HARNESS" "$JOB_OUT/m/$n.log" | tr "\n" " " | cut -c1-200)"' < "$1"
}
# patch_match <dir>: <dir>/tools/botlab/match-int3.cjs = that match.cjs plus two counters for JOB-6 (scratch, never the
# repo's harness): Zone Control's counts at 60 / 120 / 180 / 240 s (countAt) and, for every roller, its alive and rolling
# seconds, turf, splats and deaths (rollers)
patch_match() {
  perl -0pe '
    s{(      const eps = \[\]; let holdS = 0;)}{      const cT = {}; const rollT = new Map(); const rollSample = () => { for (const a of m.actors) { if (a.weaponId !== "roller") continue; const o = rollT.get(a) || { alive: 0, roll: 0 }; rollT.set(a, o); if (a.alive) { o.alive += 0.25; if (a.weaponRunner && a.weaponRunner.rolling) o.roll += 0.25; } } };\n$1} or die "anchor 1";
    s{(        if \(m\.state === .playing.\) sightSample\(\);)}{$1\n        if (m.state === "playing") { rollSample(); if (Z) for (const T of [60, 120, 180, 240]) if (cT[T] === undefined && simT >= T) cT[T] = [Math.ceil(Z.count[0] - 1e-6), Math.ceil(Z.count[1] - 1e-6)]; }} or die "anchor 2";
    s{(        simT: \+simT\.toFixed\(1\), simMs)}{        countAt: cT, rollers: [...rollT].map(([a, o]) => ({ i: m.actors.indexOf(a), team: a.team, turf: Math.round(a.stats.turf), splats: a.stats.splats, deaths: a.stats.deaths, aliveS: o.alive, rollS: o.roll })),\n$1} or die "anchor 3";
  ' "$1/tools/botlab/match.cjs" > "$1/tools/botlab/match-int3.cjs"
}
# runs2 <file>: as runs, with match-int3.cjs
runs2() {
  mkdir -p "$JOB_OUT/m"
  xargs -P 3 -L 1 bash -c 'n=$0; d=$1; shift; (cd "$d" && env "$@" DIAG=1 WATCHDOG=1500000 OUT="$JOB_OUT/m/$n.json" tools/botlab/run.sh tools/botlab/match-int3.cjs > "$JOB_OUT/m/$n.log" 2>&1);
    echo "### $n: $(grep -E "^== " "$JOB_OUT/m/$n.log" | head -1 | cut -c1-160) | $(grep -E "^CONSOLE|FRAME ERRORS|WATCHDOG|HARNESS" "$JOB_OUT/m/$n.log" | tr "\n" " " | cut -c1-200)"' < "$1"
}
# patch_match3 <dir>: on top of patch_match (run it first), for JOB-7: the counts every 30 s to the end (countAt30:
# [count A, count B, penalty A, penalty B] at each mark), a log of every take of the objective (flips: time, objective,
# taker, previous state, the last team that held it, the penalty its loser got, both counts then, and whether the taker
# was the leader, the trailer or level), and the time of the last lead change (lastLeadT)
patch_match3() {
  perl -0pi -e '
    s{(      const eps = \[\]; let holdS = 0;)}{      const cT30 = {}; const flipLog = []; let lastSeen = -1, pendPen = null;\n      offs.push(on("zones:penalty", (e) => { pendPen = { team: e.team, p: e.penalty }; }), on("zones:control", (e) => { if (e.owner < 0) return; const c0 = Math.ceil(Z.count[0] - 1e-6), c1 = Math.ceil(Z.count[1] - 1e-6), ld = c0 < c1 ? 0 : c1 < c0 ? 1 : -1; flipLog.push({ t: +simT.toFixed(2), obj: e.objective, to: e.owner, prev: e.prev, from: lastSeen, pen: pendPen && pendPen.team === 1 - e.owner ? pendPen.p : 0, c: [c0, c1], pn: [Math.round(Z.penalty[0]), Math.round(Z.penalty[1])], role: ld < 0 ? "level" : ld === e.owner ? "leader" : "trailer" }); pendPen = null; lastSeen = e.owner; }));\n$1} or die "anchor 3.1";
    s{(        if \(m\.state === "playing"\) \{ rollSample\(\);)}{        if (Z && m.state === "playing") { const T = 30 * Math.floor(simT / 30 + 1e-9); if (T >= 30 && cT30[T] === undefined) cT30[T] = [Math.ceil(Z.count[0] - 1e-6), Math.ceil(Z.count[1] - 1e-6), Math.round(Z.penalty[0]), Math.round(Z.penalty[1])]; }\n$1} or die "anchor 3.2";
    s{if \(zLead\.cur >= 0\) zLead\.changes\+\+;}{if (zLead.cur >= 0) { zLead.changes++; zLead.lastT = +simT.toFixed(1); }} or die "anchor 3.3";
    s{(        countAt: cT, rollers:)}{        countAt30: cT30, flips: flipLog, lastLeadT: zLead.lastT ?? null,\n$1} or die "anchor 3.4";
  ' "$1/tools/botlab/match-int3.cjs"
}
