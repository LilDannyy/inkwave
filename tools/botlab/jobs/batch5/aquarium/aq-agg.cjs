// [b5-aquarium] the pipes on / off tables (JOB-4, the Mac mini helper): node aq-agg.cjs <dir>
// <dir> holds <mode>-<on|off>-<i>.log / .json from match-aq.cjs with PAGEQ=pipestats. Camping (DESIGN.md §6.2(d)):
// deaths within 2 s of a touchdown per landing ÷ the base rate (deaths per 2 s per actor); pooled = Σ deaths ≤ 2 s ÷ Σ
// landings, over Σ deaths ÷ Σ (play time / 2 s) ÷ actors. High ground (§6.2(e)): arrivals at mid's high ground by pipe.
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const P = (s, n) => String(s).padEnd(n), f1 = (v) => (Number.isFinite(v) ? (Math.round(v * 10) / 10).toFixed(1) : '-'), f2 = (v) => (Number.isFinite(v) ? v.toFixed(2) : '-'), f3 = (v) => (Number.isFinite(v) ? v.toFixed(3) : '-');
const mean = (a) => { const b = a.filter(Number.isFinite); return b.length ? b.reduce((s, x) => s + x, 0) / b.length : NaN; };
const runs = fs.readdirSync(dir).filter((f) => /^(turf|zones)-(on|off)-\d+\.log$/.test(f)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).map((f) => {
  const [mode, sw, i] = f.slice(0, -4).split('-'), log = fs.readFileSync(path.join(dir, f), 'utf8');
  let r = null; try { r = JSON.parse(fs.readFileSync(path.join(dir, f.replace(/\.log$/, '.json')), 'utf8')); } catch (e) { /* no result */ }
  const st = {}; for (const m of log.matchAll(/\[pipes\] STATS (\w+)[^{]*(\{.*\})/g)) { try { st[m[1]] = JSON.parse(m[2]); } catch (e) { /* cut at 300 */ } }
  const pipesOff = /^PIPES \{"off":true/m.test(log), other = (r?.consoleLines || 0) - Object.keys(st).length - (/\[pipes\] STATS tide/.test(log) ? 1 : 0);
  return { mode, sw, i, r, st, pipesOff, other: Math.max(0, other), frame: r?.frameErr?.n || 0, maxStuck: r?.eps?.[0]?.dur || 0 };
});
const ACT = 8;
for (const mode of ['turf', 'zones']) for (const sw of ['on', 'off']) {
  const L = runs.filter((x) => x.mode === mode && x.sw === sw); if (!L.length) continue;
  console.log(`== ${mode}, pipes ${sw.toUpperCase()} (match.pipes.off ${L.map((x) => (x.pipesOff ? 1 : 0)).join('')})`);
  console.log('  # | turf % A / B | splats | lead ch. | stuck % (longest s) | rides (per bot-min) | landings | deaths ≤2 s after one | per landing | base /2 s/actor | ×base | high ground: by pipe / arrivals | other console / frame');
  for (const x of L) { const r = x.r, c = x.st.camping || {}, rd = x.st.rides || {}, hg = x.st.highground || {};
    if (!r) { console.log(`  ${x.i} NO RESULT`); continue; }
    console.log(`  ${P(x.i, 2)} ${P(r.cov.join(' / '), 12)} ${P(r.splats, 4)} ${P(r.leadChanges ?? '-', 3)} ${P(r.stuckPct + ' (' + x.maxStuck + ')', 10)} ${P((rd.total ?? '-') + ' (' + f2(rd.perBotMin) + ')', 11)} ${P(c.landings ?? '-', 4)} ${P(c.deathsWithin2sOfTouchdown ?? '-', 3)} ${P(f3(c.perLanding), 6)} ${P(f3(c.basePer2sPerActor), 6)} ${P(c.landings ? f2(c.perLanding / c.basePer2sPerActor) : '-', 5)} ${P((hg.byPipe ?? '-') + ' / ' + (hg.arrivals ?? '-'), 9)} ${x.other} / ${x.frame}`); }
  const ok = L.filter((x) => x.r && x.st.camping), S = (f) => ok.reduce((s, x) => s + (f(x) || 0), 0);
  const land = S((x) => x.st.camping.landings), dl = S((x) => x.st.camping.deathsWithin2sOfTouchdown), deaths = S((x) => x.st.camping.deaths), slots = S((x) => (x.st.rides.mins * 60) / 2);
  const base = deaths / Math.max(1, slots) / ACT, perL = dl / Math.max(1, land);
  console.log(`  POOLED (n ${ok.length}): turf ${f1(mean(ok.map((x) => x.r.cov[0] + x.r.cov[1])))} % inked | splats ${f1(mean(ok.map((x) => x.r.splats)))} | lead changes ${f2(mean(ok.map((x) => x.r.leadChanges)))} | stuck ${f2(mean(ok.map((x) => x.r.stuckPct)))} % (longest ${Math.max(0, ...ok.map((x) => x.maxStuck))} s) | rides per bot-minute ${f2(mean(ok.map((x) => x.st.rides.perBotMin)))}`);
  console.log(`    camping: ${dl} deaths within 2 s of ${land} touchdowns = ${f3(perL)} per landing; base ${f3(base)} per 2 s per actor (${deaths} deaths) → ${land ? f2(perL / base) + '× the base rate' : '- (no landings)'} (DESIGN §6.2(d) cap: 2×)`);
  const hgA = S((x) => x.st.highground?.arrivals), hgP = S((x) => x.st.highground?.byPipe);
  console.log(`    high ground: ${hgP} of ${hgA} arrivals by pipe = ${f1((100 * hgP) / Math.max(1, hgA))} % (§6.2(e): 10–35 %)`);
  if (land) { const E = {}; for (const x of ok) for (const [k, v] of Object.entries(x.st.perExit || {})) { const o = E[k] || (E[k] = [0, 0]); o[0] += v[0]; o[1] += v[1]; }
    console.log('    per exit (landings, deaths ≤ 2 s, ×base): ' + Object.entries(E).sort().map(([k, v]) => `${k} ${v[0]}/${v[1]} ${v[0] ? f2(v[1] / v[0] / base) : '-'}×`).join(' · ')); }
  console.log(`    other console lines ${S((x) => x.other)}, frame errors ${S((x) => x.frame)}, results ${ok.length}/${L.length}`);
}
