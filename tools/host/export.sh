#!/bin/bash
# INKWAVE — write a clean copy of just the web game (no tools, no history, no scratch) for tools/host/selfhost.cjs.
#   tools/host/export.sh <dir> [git-ref]      (default ref: HEAD; <dir> is replaced)
# Then: node tools/host/selfhost.cjs --root <dir>
set -euo pipefail
OUT="${1:?usage: tools/host/export.sh <dir> [git-ref]}"; REF="${2:-HEAD}"
cd "$(dirname "$0")/../.."
rm -rf "$OUT.tmp"; mkdir -p "$OUT.tmp"
git archive "$REF" index.html src assets vendor styles songs LICENSE | tar -x -C "$OUT.tmp"
rm -rf "$OUT"; mv "$OUT.tmp" "$OUT"
echo "exported $(git rev-parse --short "$REF") → $OUT ($(du -sh "$OUT" | cut -f1))"
