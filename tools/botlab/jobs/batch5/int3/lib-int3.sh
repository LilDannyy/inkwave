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
