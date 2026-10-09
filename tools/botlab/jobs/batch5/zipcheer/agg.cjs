// [b5-zipcheer] Summary of tools/botlab/jobs/batch5/zipcheer/balance.sh: node agg.cjs <outdir> [cfg …]
// Per mode and config, the FORCED team (the side in the file name; base: Alpha) against the other, means per match:
// wins, turf share Δ, K/D, its special's uses and splats, how its uses ended (per use), and the zipcheer counters
// (src/game/sp-cheer.js ZC_STATS — the new code only).
const fs = require('fs'), path = require('path');
const dir = process.argv[2], only = process.argv.slice(3);
const runs = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
  const [mode, map, cfg, side, i] = path.basename(f, '.json').split('-');
  try { return { mode, map, cfg, t: +side, i, r: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }; } catch (e) { return null; }
}).filter(Boolean);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sd = (xs) => { const m = mean(xs); return xs.length > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)) : 0; };
const spOf = (c) => (c.startsWith('zip') ? 'zipcaster' : c.startsWith('orb') ? 'booyah' : c.startsWith('bub') ? 'bubbler' : null);
const cfgs = [...new Set(runs.map((x) => x.cfg))].filter((c) => !only.length || only.includes(c)).sort();
const f1 = (x) => x.toFixed(1), f2 = (x) => x.toFixed(2), pc = (x) => (x * 100).toFixed(0) + '%';
for (const mode of ['turf', 'zones']) {
  const M = runs.filter((x) => x.mode === mode);
  if (!M.length) continue;
  console.log(`\n=== ${mode} (${M.length} matches; the forced team vs the other, means per match ± sd)`);
  for (const cfg of cfgs) {
    const g = M.filter((x) => x.cfg === cfg);
    if (!g.length) continue;
    const sp = spOf(cfg);
    const win = g.map((x) => { const t = x.t, r = x.r; if (mode === 'zones') return r.winner === t ? 1 : r.winner === 1 - t ? 0 : 0.5; return r.cov[t] > r.cov[1 - t] ? 1 : r.cov[t] < r.cov[1 - t] ? 0 : 0.5; });
    const dturf = g.map((x) => x.r.cov[x.t] - x.r.cov[1 - x.t]);
    const kd = g.map((x) => { const T = x.r.teamKD[x.t]; return T.k / Math.max(1, T.d); });
    const uses = g.map((x) => (x.r.spUses ? (sp ? x.r.spUses[x.t][sp] || 0 : Object.values(x.r.spUses[x.t]).reduce((a, b) => a + b, 0)) : 0));
    const kills = g.map((x) => (sp ? (x.r.teamKD[1 - x.t].by || {})[sp] || 0 : 0));
    const sides = [0, 1].map((t) => { const gt = g.filter((x) => x.t === t); return gt.length ? `${'AB'[t]} ${pc(mean(gt.map((x) => win[g.indexOf(x)])))} (n ${gt.length})` : null; }).filter(Boolean).join(', ');
    console.log(`  ${cfg}${g[0].r.tune ? ' [TUNE ' + g[0].r.tune + ']' : ''} n=${g.length}: wins ${pc(mean(win))} [${sides}] | turf Δ ${f1(mean(dturf))} ±${f1(sd(dturf))} | K/D ${f2(mean(kd))} ±${f2(sd(kd))} | splats ${f1(mean(g.map((x) => x.r.splats)))}`);
    if (!sp) continue;
    // how its uses ended (per use) and what it did
    const ends = {}; let n = 0;
    for (const x of g) { const E = (x.r.spEnds || [{}, {}])[x.t][sp] || {}; for (const k in E) { ends[k] = (ends[k] || 0) + E[k]; n += E[k]; } }
    const endTxt = Object.entries(ends).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pc(v / Math.max(1, n))}`).join(', ');
    console.log(`      ${sp}: used ${f1(mean(uses))}/match, splats by it ${f2(mean(kills))}/match (${f2(mean(kills) / Math.max(0.01, mean(uses)))} per use) | ended: ${endTxt || '—'} (n ${n})`);
    const Z = g.map((x) => x.r.zipcheer).filter(Boolean);
    if (Z.length) {
      const S = (k) => Z.reduce((a, z) => a + (z[k] || 0), 0), u = Math.max(1, S(sp === 'booyah' ? 'orbs' : 'zipUses'));
      if (sp === 'booyah') console.log(`      per orb: lifted ${f2(S('lifted') / u)} (avg ${f2(S('liftM') / Math.max(1, S('lifted')))} m), cheers ${f2(S('cheers') / u)} (helping ${f2(S('helped') / u)}), orb charge from cheers ${f2(S('orbCharge') / u)}, gauge gains ${f2(S('gains') / u)} (${f1(S('gainPts') / u)} pts), splatted while held up ${f2(S('splatHeld') / u)}, damage taken held up ${f1(S('dmgHeld') / u)}`);
      else console.log(`      per use: zips ${f2(S('zips') / u)}, hits taken mid-zip ${f2(S('zipHits') / u)} (${f1(S('zipSaved') / u)} damage saved)`);
    }
  }
  const all = M.map((x) => x.r);
  console.log(`  all: stuck ${f2(mean(all.map((r) => r.stuckPct)))}% | splats ${f1(mean(all.map((r) => r.splats)))} | matches with console warnings ${all.filter((r) => r.consoleLines > 0).length} · frame errors ${all.filter((r) => r.frameErr && r.frameErr.n).length}`);
}
