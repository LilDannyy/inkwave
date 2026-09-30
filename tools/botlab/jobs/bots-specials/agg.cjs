// Summary of tools/botlab/jobs/bots-specials/ab.sh: node agg.cjs <outdir>
// Per mode, awareness off vs on (means per match): splats caused by each special (both teams' bots), all splats, water,
// turf inked, stuck %, Zone Control captures; the bots' SPECIAL_STATS; head to head: the aware team's K/D, special
// deaths, turf and wins against the old behaviour.
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const runs = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
  const [mode, map, ai, i] = path.basename(f, '.json').split('-');
  try { return { mode, map, ai, i, r: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }; } catch (e) { return null; }
}).filter(Boolean);
const SP = ['slam', 'storm', 'barrage', 'bubbler', 'sonar', 'strike', 'zooka', 'wail', 'kraken', 'blower', 'jetpack', 'stamp', 'booyah', 'zipcaster', 'crab'];
const f1 = (v) => (Math.round(v * 100) / 100).toFixed(2), mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sd = (xs) => { const m = mean(xs); return xs.length > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)) : 0; };
const spOf = (r) => r.teamKD[0].sp + r.teamKD[1].sp, byOf = (r, s) => (r.teamKD[0].by[s] || 0) + (r.teamKD[1].by[s] || 0);
for (const mode of ['turf', 'zones']) {
  const G = { 0: runs.filter((x) => x.mode === mode && x.ai === '0'), 1: runs.filter((x) => x.mode === mode && x.ai === '1') };
  if (!G[0].length && !G[1].length) continue;
  console.log(`\n=== ${mode}: off n=${G[0].length} · on n=${G[1].length} (means per match; ± sd)`);
  const row = (name, fn, d = 2) => { const a = G[0].map((x) => fn(x.r)), b = G[1].map((x) => fn(x.r)); const ma = mean(a), mb = mean(b);
    console.log(`  ${name.padEnd(26)} off ${ma.toFixed(d).padStart(7)} ±${sd(a).toFixed(d).padEnd(6)} on ${mb.toFixed(d).padStart(7)} ±${sd(b).toFixed(d).padEnd(6)} ${ma ? ((mb / ma - 1) * 100).toFixed(0).padStart(4) + '%' : ''}`); };
  row('splats by specials', spOf);
  for (const s of SP) { const t = [...G[0], ...G[1]].reduce((a, x) => a + byOf(x.r, s), 0); if (t) row('  ' + s, (r) => byOf(r, s)); }
  row('all splats', (r) => r.splats);
  row('  of which water', (r) => r.water);
  row('specials used', (r) => r.specials);
  row('turf inked % (both)', (r) => r.cov[0] + r.cov[1], 1);
  row('turf p per bot', (r) => r.per.turf, 0);
  row('stuck %', (r) => r.stuckPct, 2);
  if (mode === 'zones') { row('captures', (r) => r.captures || 0); row('bots in the zone %', (r) => r.zonePct || 0, 1); row('overtime (0/1)', (r) => (r.overtime ? 1 : 0)); }
  row('bots ms / sim s', (r) => r.botMsPerS, 2);
  const st = {}; for (const x of G[1]) for (const k in x.r.spStats || {}) if (typeof x.r.spStats[k] === 'number') st[k] = (st[k] || 0) + x.r.spStats[k];
  console.log('  on: SPECIAL_STATS per match ' + Object.entries(st).map(([k, v]) => `${k} ${f1(v / Math.max(1, G[1].length))}`).join(' · '));
  for (const map of [...new Set(runs.map((x) => x.map))]) {
    const a = G[0].filter((x) => x.map === map), b = G[1].filter((x) => x.map === map);
    if (a.length || b.length) console.log(`  ${map.padEnd(12)} special splats off ${f1(mean(a.map((x) => spOf(x.r))))} on ${f1(mean(b.map((x) => spOf(x.r))))} · splats off ${f1(mean(a.map((x) => x.r.splats)))} on ${f1(mean(b.map((x) => x.r.splats)))} · stuck off ${f1(mean(a.map((x) => x.r.stuckPct)))} on ${f1(mean(b.map((x) => x.r.stuckPct)))} (n ${a.length}/${b.length})`);
  }
}
const H = runs.filter((x) => x.ai === 'team0' || x.ai === 'team1');
if (H.length) {
  let k = 0, d = 0, kO = 0, dO = 0, spOn = 0, spOff = 0, tOn = 0, tOff = 0, wins = 0, ties = 0;
  const per = [];
  for (const x of H) {
    const on = x.ai === 'team0' ? 0 : 1, off = 1 - on, T = x.r.teamKD;
    k += T[on].k; d += T[on].d; kO += T[off].k; dO += T[off].d; spOn += T[on].sp; spOff += T[off].sp; tOn += x.r.cov[on]; tOff += x.r.cov[off];
    if (x.r.cov[on] > x.r.cov[off]) wins++; else if (x.r.cov[on] === x.r.cov[off]) ties++;
    per.push(T[on].k / Math.max(1, T[on].d));
  }
  console.log(`\n=== head to head (turf, one team aware, the other not): n=${H.length}`);
  console.log(`  aware team: K ${k} / D ${d} → K/D ${f1(k / Math.max(1, d))} (per-match mean ${f1(mean(per))} ±${f1(sd(per))}) · old-behaviour team K ${kO} / D ${dO}`);
  console.log(`  splatted by specials: aware ${spOn} (${f1(spOn / H.length)} / match) · old ${spOff} (${f1(spOff / H.length)} / match)`);
  console.log(`  turf inked: aware ${f1(tOn / H.length)} % · old ${f1(tOff / H.length)} % · aware team wins ${wins}/${H.length}${ties ? ` (${ties} ties)` : ''}`);
}
