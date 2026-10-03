// Summary of tools/botlab/jobs/drainbow/balance.sh: node agg.cjs <outdir>
// Per mode and config, the FORCED team (db0 / bub0: Alpha, db1 / bub1: Bravo; base: Alpha) against the other, means per
// match: wins, turf share difference, K/D, splats, its special's uses, splats caused by it; the Drainbow's own counters
// (placed, shots it halved, crossings, life added). Mirrored sides pooled (dbX = db0 + db1).
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const runs = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
  const [mode, map, cfg, i] = path.basename(f, '.json').split('-');
  try { return { mode, map, cfg, i, r: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }; } catch (e) { return null; }
}).filter(Boolean);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sd = (xs) => { const m = mean(xs); return xs.length > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)) : 0; };
const ft = (x) => (x.cfg === 'db1' || x.cfg === 'bub1' ? 1 : 0);
const sp = (x) => (x.cfg.startsWith('db') ? 'drainbow' : x.cfg.startsWith('bub') ? 'bubbler' : null);
for (const mode of ['turf', 'zones']) {
  const M = runs.filter((x) => x.mode === mode);
  if (!M.length) continue;
  console.log(`\n=== ${mode} (${M.length} matches; the forced team vs the other, means per match ± sd)`);
  const groups = { 'drainbow (db0+db1)': M.filter((x) => x.cfg.startsWith('db')), 'bubble guard (bub0+bub1)': M.filter((x) => x.cfg.startsWith('bub')), 'random rolls (base, Alpha)': M.filter((x) => x.cfg === 'base') };
  for (const [name, g] of Object.entries(groups)) {
    if (!g.length) continue;
    const win = g.map((x) => { const t = ft(x), r = x.r; if (mode === 'zones') return r.winner === t ? 1 : r.winner === 1 - t ? 0 : 0.5; return r.cov[t] > r.cov[1 - t] ? 1 : r.cov[t] < r.cov[1 - t] ? 0 : 0.5; });
    const dturf = g.map((x) => x.r.cov[ft(x)] - x.r.cov[1 - ft(x)]);
    const kd = g.map((x) => { const T = x.r.teamKD[ft(x)]; return T.k / Math.max(1, T.d); });
    const kills = g.map((x) => x.r.teamKD[ft(x)].k), deaths = g.map((x) => x.r.teamKD[ft(x)].d);
    const uses = g.map((x) => (sp(x) && x.r.spUses ? x.r.spUses[ft(x)][sp(x)] || 0 : x.r.spUses ? Object.values(x.r.spUses[ft(x)]).reduce((a, b) => a + b, 0) : 0));
    const otherUses = g.map((x) => (x.r.spUses ? Object.values(x.r.spUses[1 - ft(x)]).reduce((a, b) => a + b, 0) : 0));
    const spK = g.map((x) => (x.r.teamKD[1 - ft(x)].by || {})[sp(x)] || 0);
    console.log(`  ${name} n=${g.length}`);
    console.log(`    wins ${(mean(win) * 100).toFixed(0)}% | turf share Δ ${mean(dturf).toFixed(1)} ±${sd(dturf).toFixed(1)} pts | K/D ${mean(kd).toFixed(2)} ±${sd(kd).toFixed(2)} (splats ${mean(kills).toFixed(1)} / deaths ${mean(deaths).toFixed(1)})`);
    console.log(`    its special used ${mean(uses).toFixed(2)} / match (the other team's specials ${mean(otherUses).toFixed(2)}) | splats it caused directly ${mean(spK).toFixed(2)}`);
    if (name.startsWith('drainbow')) {
      const D = g.map((x) => x.r.drainbow || {});
      const f = (k) => mean(D.map((d) => d[k] || 0));
      const per = (k) => { const u = D.reduce((a, d) => a + (d.placed || 0), 0); return u ? D.reduce((a, d) => a + (d[k] || 0), 0) / u : 0; };
      console.log(`    per match: placed ${f('placed').toFixed(2)}, shots it halved ${f('cuts').toFixed(1)}, crossings ${f('crossings').toFixed(1)}, life added ${f('extended').toFixed(1)} s`);
      console.log(`    per bubble: shots halved ${per('cuts').toFixed(1)}, crossings ${per('crossings').toFixed(1)}, life added ${per('extended').toFixed(2)} s`);
      for (const t of [0, 1]) {
        const gt = g.filter((x) => ft(x) === t);
        if (gt.length) console.log(`    (as ${'AB'[t]}: n=${gt.length}, wins ${(mean(gt.map((x) => (mode === 'zones' ? (x.r.winner === t ? 1 : 0) : x.r.cov[t] > x.r.cov[1 - t] ? 1 : 0))) * 100).toFixed(0)}%)`);
      }
    }
  }
  const all = M.map((x) => x.r);
  console.log(`  all: stuck ${mean(all.map((r) => r.stuckPct)).toFixed(2)}% | splats ${mean(all.map((r) => r.splats)).toFixed(1)} | specials ${mean(all.map((r) => r.specials)).toFixed(1)} | matches with console warnings ${all.filter((r) => r.consoleLines > 0).length} · frame errors ${all.filter((r) => r.frameErr && r.frameErr.n).length}`);
}
