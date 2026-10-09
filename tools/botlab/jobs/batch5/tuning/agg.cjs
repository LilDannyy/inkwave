// Summary of sweep.sh's matches: node tools/botlab/jobs/batch5/tuning/agg.cjs <outdir>
// zones: per config (and per stage) the means ± sd of lead changes, time to the first take, share of the match the live
//   objective sat neutral / contested (held, the other team at or over the HUD's warn line) / disputed (… over 25 %, the
//   same line for every config), knockouts, overtime, match length, control changes, and the best share a team reached
//   per activation (how close to full coverage the bots get).
// roller: per config (and per stage) the rollers' turf against the other players' in the same match, their splats and
//   deaths (K/D), and their turf per match.
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
if (!dir) { console.log('usage: agg.cjs <outdir>'); process.exit(1); }
const runs = [];
let failed = 0, warn = 0, ferr = 0;
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.log')) continue;
  const base = f.slice(0, -4), [kind, stage, cfg, i] = base.split('-');
  const j = path.join(dir, base + '.json');
  if (!fs.existsSync(j) || !fs.statSync(j).size) { failed++; continue; }
  const r = JSON.parse(fs.readFileSync(j, 'utf8'));
  if (r.consoleLines) warn++;
  if (r.frameErr && r.frameErr.n) ferr++;
  runs.push({ kind, stage, cfg, i: +i, r });
}
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const sd = (xs) => { if (xs.length < 2) return 0; const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '-'), f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '-');
const ms = (xs, d = 1) => `${(d === 2 ? f2 : f1)(mean(xs))} ±${(d === 2 ? f2 : f1)(sd(xs))}`;
const pct = (n, d) => (d ? Math.round((100 * n) / d) + '%' : '-');
console.log(`${runs.length} matches read | FAILED (no result) ${failed} | with console warnings ${warn} | with frame errors ${ferr}`);

const cfgOrder = (cs) => cs.sort((a, b) => ['old', 'before', 'A', 'B', 'C', 'new', 'after'].indexOf(a) - ['old', 'before', 'A', 'B', 'C', 'new', 'after'].indexOf(b));
const zoneRow = (L) => {
  const R = L.map((x) => x.r), T = R.map((r) => r.simT);
  const fc = R.map((r) => r.firstCapture).filter((v) => v != null);
  const ko = R.filter((r) => r.reason === 'knockout').length, ot = R.filter((r) => r.overtime).length;
  // best share per activation: "id@t0-t1s A82/B45+A70/B20 | …" → every zone's higher share
  const best = [];
  for (const r of R) for (const w of String(r.windows || '').split(' | ')) for (const m of w.matchAll(/A(\d+)\/B(\d+)/g)) best.push(Math.max(+m[1], +m[2]));
  const won = [0, 0]; for (const r of R) if (r.winner === 0 || r.winner === 1) won[r.winner]++;
  return `n ${L.length} | lead changes ${ms(R.map((r) => r.leadChanges ?? NaN))} | first take ${ms(fc)} s (never ${R.length - fc.length})`
    + ` | neutral ${ms(R.map((r) => (100 * r.neutral) / r.simT))} % | contested ${ms(R.map((r) => (100 * (r.contestedS ?? NaN)) / r.simT))} % (≥25 %: ${ms(R.map((r) => (100 * (r.disputeS ?? NaN)) / r.simT))} %)`
    + ` | knockouts ${ko}/${R.length} (${pct(ko, R.length)}) | overtime ${ot}/${R.length} | length ${ms(T)} s | control events ${ms(R.map((r) => r.controlEvents))} (takes ${ms(R.map((r) => r.captures))}, takeovers ${ms(R.map((r) => r.takeovers))})`
    + ` | a flip pending ${ms(R.map((r) => r.pendingS ?? 0))} s | best share / activation median ${best.length ? best.sort((a, b) => a - b)[best.length >> 1] : '-'} % (≥80: ${pct(best.filter((b) => b >= 80).length, best.length)}, ≥70: ${pct(best.filter((b) => b >= 70).length, best.length)})`
    + ` | wins A/B ${won[0]}/${won[1]} | final counts ${ms(R.map((r) => Math.min(...r.counts)))} / ${ms(R.map((r) => Math.max(...r.counts)))} | stuck ${ms(R.map((r) => r.stuckPct), 2)} %`;
};
const rollerRow = (L) => {
  const share = [], kd = [0, 0], turf = [], other = [];
  for (const { r } of L) {
    const W = r.byWeapon || {}, R = W.roller;
    if (!R) continue;
    const o = Object.entries(W).filter(([k]) => k !== 'roller');
    const on = o.reduce((s, [, v]) => s + v.n, 0), ot = o.reduce((s, [, v]) => s + v.turf * v.n, 0) / Math.max(1, on);
    share.push(R.turf / Math.max(1, ot)); turf.push(R.turf); other.push(ot);
    kd[0] += R.splats; kd[1] += R.deaths;
  }
  return `n ${L.length} | roller turf ${ms(turf, 1)} p vs the others' ${ms(other, 1)} p → ×${ms(share, 2)} | roller splats ${kd[0]} deaths ${kd[1]} → K/D ${f2(kd[0] / Math.max(1, kd[1]))} (${f2(kd[0] / L.length / 2)} / ${f2(kd[1] / L.length / 2)} per roller per match)`
    + ` | splats per match ${ms(L.map((x) => x.r.splats))} | stuck ${ms(L.map((x) => x.r.stuckPct), 2)} %`;
};
for (const kind of ['zones', 'roller']) {
  const K = runs.filter((x) => x.kind === kind);
  if (!K.length) continue;
  console.log(`\n=== ${kind} (${K.length} matches)`);
  const cfgs = cfgOrder([...new Set(K.map((x) => x.cfg))]), stages = [...new Set(K.map((x) => x.stage))].sort();
  const row = kind === 'zones' ? zoneRow : rollerRow;
  for (const c of cfgs) {
    const L = K.filter((x) => x.cfg === c);
    const tune = (L[0] && L[0].r.tune) || '(none)';
    console.log(`  ${c}  [${tune}]\n    all: ${row(L)}`);
    for (const s of stages) { const S = L.filter((x) => x.stage === s); if (S.length) console.log(`    ${s}: ${row(S)}`); }
  }
  // the bots' reach of the zones (zones only, from any one match per stage): reachable cells / all
  if (kind === 'zones') for (const s of stages) { const x = K.find((q) => q.stage === s && q.r.reach); if (x) console.log(`  reachable cells ${s}: ${x.r.reach}`); }
}
