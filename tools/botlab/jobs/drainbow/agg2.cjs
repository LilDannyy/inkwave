// Summary of tools/botlab/jobs/drainbow/balance2.sh: node agg2.cjs <outdir>
// Per mode and config, the FORCED team (the side in the file name; base: Alpha) against the other, means per match:
// wins, turf share Δ, K/D, its special's uses; the Drainbow's counters (per match and per bubble).
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const runs = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
  const [mode, map, cfg, side, i] = path.basename(f, '.json').split('-');
  try { return { mode, map, cfg, t: +side, i, r: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }; } catch (e) { return null; }
}).filter(Boolean);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sd = (xs) => { const m = mean(xs); return xs.length > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)) : 0; };
const NAME = { db: 'drainbow (as shipped)', dbnh: 'drainbow, bots don\'t hold inside', dbnp: 'drainbow, no footprint ink', dbv2: 'drainbow v2 (bigger / longer / stronger drain)', bub: 'bubble guard', base: 'random rolls' };
const spOf = (c) => (c.startsWith('db') ? 'drainbow' : c === 'bub' ? 'bubbler' : null);
for (const mode of ['turf', 'zones']) {
  const M = runs.filter((x) => x.mode === mode);
  if (!M.length) continue;
  console.log(`\n=== ${mode} (${M.length} matches; the forced team vs the other, means per match ± sd)`);
  for (const cfg of Object.keys(NAME)) {
    const g = M.filter((x) => x.cfg === cfg);
    if (!g.length) continue;
    const win = g.map((x) => { const t = x.t, r = x.r; if (mode === 'zones') return r.winner === t ? 1 : r.winner === 1 - t ? 0 : 0.5; return r.cov[t] > r.cov[1 - t] ? 1 : r.cov[t] < r.cov[1 - t] ? 0 : 0.5; });
    const dturf = g.map((x) => x.r.cov[x.t] - x.r.cov[1 - x.t]);
    const kd = g.map((x) => { const T = x.r.teamKD[x.t]; return T.k / Math.max(1, T.d); });
    const uses = g.map((x) => (x.r.spUses ? (spOf(cfg) ? x.r.spUses[x.t][spOf(cfg)] || 0 : Object.values(x.r.spUses[x.t]).reduce((a, b) => a + b, 0)) : 0));
    const oth = g.map((x) => (x.r.spUses ? Object.values(x.r.spUses[1 - x.t]).reduce((a, b) => a + b, 0) : 0));
    const sides = [0, 1].map((t) => { const gt = g.filter((x) => x.t === t); return gt.length ? `${'AB'[t]} ${(mean(gt.map((x, j) => win[g.indexOf(x)])) * 100).toFixed(0)}% (n ${gt.length})` : null; }).filter(Boolean).join(', ');
    console.log(`  ${NAME[cfg]} n=${g.length}: wins ${(mean(win) * 100).toFixed(0)}% [${sides}] | turf Δ ${mean(dturf).toFixed(1)} ±${sd(dturf).toFixed(1)} | K/D ${mean(kd).toFixed(2)} ±${sd(kd).toFixed(2)} | special used ${mean(uses).toFixed(1)}/match (theirs ${mean(oth).toFixed(1)})`);
    if (cfg.startsWith('db')) {
      const D = g.map((x) => x.r.drainbow || {}), u = D.reduce((a, d) => a + (d.placed || 0), 0) || 1;
      const per = (k) => (D.reduce((a, d) => a + (d[k] || 0), 0) / u);
      console.log(`      per bubble: shots halved ${per('cuts').toFixed(1)}, crossings ${per('crossings').toFixed(1)}, life added ${per('extended').toFixed(2)} s, bot-frames held inside ${per('holds').toFixed(0)}`);
    }
  }
  const all = M.map((x) => x.r);
  console.log(`  all: stuck ${mean(all.map((r) => r.stuckPct)).toFixed(2)}% | splats ${mean(all.map((r) => r.splats)).toFixed(1)} | matches with console warnings ${all.filter((r) => r.consoleLines > 0).length} · frame errors ${all.filter((r) => r.frameErr && r.frameErr.n).length}`);
}
