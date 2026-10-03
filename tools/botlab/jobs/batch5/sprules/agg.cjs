// [b5-sprules] Summary of tools/botlab/jobs/batch5/sprules/balance.sh: node agg.cjs <outdir>
// Per mode and config, the FORCED team (the side in the file name; base: Alpha) against the other, means per match:
// wins (turf: more turf; zones: the winner; a tie ½), turf share Δ, K/D, splats by its barrage, its special's uses; per
// stage wins; the barrages' throws per bomb kind (the Mystery's spread), console warnings / frame errors.
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const runs = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
  const [mode, map, cfg, side, i] = path.basename(f, '.json').split('-');
  try { return { f, mode, map, cfg, t: +side, i, r: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }; } catch (e) { return null; }
}).filter(Boolean);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sd = (xs) => { const m = mean(xs); return xs.length > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)) : 0; };
const NAME = { wad: 'Waddle Bomb Barrage forced', mys: 'Mystery Bomb Barrage forced', bar: 'Splat Bomb Barrage forced (reference)', base: 'random rolls (baseline)' };
const winOf = (mode, x) => { const t = x.t, r = x.r; if (mode === 'zones') return r.winner === t ? 1 : r.winner === 1 - t ? 0 : 0.5; return r.cov[t] > r.cov[1 - t] ? 1 : r.cov[t] < r.cov[1 - t] ? 0 : 0.5; };
for (const mode of ['turf', 'zones']) {
  const M = runs.filter((x) => x.mode === mode);
  if (!M.length) continue;
  console.log(`\n=== ${mode} (${M.length} matches; the forced team vs the other, means per match ± sd)`);
  for (const cfg of Object.keys(NAME)) {
    const g = M.filter((x) => x.cfg === cfg);
    if (!g.length) continue;
    const win = g.map((x) => winOf(mode, x));
    const dturf = g.map((x) => x.r.cov[x.t] - x.r.cov[1 - x.t]);
    const kd = g.map((x) => { const T = x.r.teamKD[x.t]; return T.k / Math.max(1, T.d); });
    const bySp = g.map((x) => ((x.r.teamKD[1 - x.t].by || {}).barrage || 0));   // the other team splatted by a barrage
    const uses = g.map((x) => (cfg === 'base' ? Object.values(x.r.spUses[x.t]).reduce((a, b) => a + b, 0) : (x.r.spUses[x.t].barrage || 0)));
    const oth = g.map((x) => Object.values(x.r.spUses[1 - x.t]).reduce((a, b) => a + b, 0));
    const sides = [0, 1].map((t) => { const gt = g.filter((x) => x.t === t); return gt.length ? `${'AB'[t]} ${(mean(gt.map((x) => winOf(mode, x))) * 100).toFixed(0)}% (n ${gt.length})` : null; }).filter(Boolean).join(', ');
    console.log(`  ${NAME[cfg]} n=${g.length}: wins ${(mean(win) * 100).toFixed(0)}% [${sides}] | turf Δ ${mean(dturf).toFixed(1)} ±${sd(dturf).toFixed(1)} | K/D ${mean(kd).toFixed(2)} ±${sd(kd).toFixed(2)} | foes splatted by barrages ${mean(bySp).toFixed(1)}/match | special used ${mean(uses).toFixed(1)}/match (theirs ${mean(oth).toFixed(1)})`);
    const st = [...new Set(g.map((x) => x.map))].map((s) => { const gs = g.filter((x) => x.map === s); return `${s} ${(mean(gs.map((x) => winOf(mode, x))) * 100).toFixed(0)}% (${gs.length})`; }).join(' · ');
    console.log(`      per stage: ${st}`);
    if (cfg === 'wad' || cfg === 'mys') {
      const T = {}; for (const x of g) for (const [k, v] of Object.entries((x.r.barrage && x.r.barrage.throws) || {})) T[k] = (T[k] || 0) + v;
      const n = Object.values(T).reduce((a, b) => a + b, 0) || 1;
      console.log(`      throws (all barrages in these matches, incl. the other team's random ones): ${Object.entries(T).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v} (${(100 * v / n).toFixed(0)}%)`).join(', ')}`);
    }
  }
  const all = M.map((x) => x.r);
  const warn = M.filter((x) => x.r.consoleLines > 0).map((x) => x.f), ferr = M.filter((x) => x.r.frameErr && x.r.frameErr.n).map((x) => x.f);
  console.log(`  all: stuck ${mean(all.map((r) => r.stuckPct)).toFixed(2)}% | splats ${mean(all.map((r) => r.splats)).toFixed(1)} | matches with console warnings ${warn.length}${warn.length ? ' ' + warn.slice(0, 6).join(' ') : ''} · frame errors ${ferr.length}${ferr.length ? ' ' + ferr.slice(0, 6).join(' ') : ''}`);
}
