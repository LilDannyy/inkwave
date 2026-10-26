// [b5-bluestone] JOB-35's tally of karp-match.cjs logs (PLAN runs, several matches per log): per match the RESULT line and the
// stuck episodes over 5 s (who, where), then per stage the SPEC §9.1 table. node karp-agg.cjs <log> [<log> …]
const fs = require('fs');
const M = [];
for (const f of process.argv.slice(2)) {
  let cur = null;
  for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
    if (/^== \S+ \[bazookarp/.test(l)) { cur = { stuck: [], cstuck: [], src: f }; continue; }
    if (!cur) continue;
    let m;
    if ((m = l.match(/^   stuck (\{.*\})$/))) { const e = JSON.parse(m[1]); if (e.dur > 5) cur.stuck.push(e); }
    else if ((m = l.match(/^   carrier-stuck (\{.*\})$/))) cur.cstuck.push(JSON.parse(m[1]));
    else if (/^RESULT karp /.test(l)) cur.line = l.slice(7);
    else if ((m = l.match(/^RESULT_JSON (\{.*\})$/))) { cur.r = JSON.parse(m[1]); M.push(cur); cur = null; }
  }
}
const W = (w) => (w === 0 ? 'A' : w === 1 ? 'B' : '-');
const med = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
M.forEach((x, i) => {
  const s = x.stuck.map((e) => `${e.name}(${e.role}${e.carry ? ',carrying' : ''}) ${e.dur}s @[${e.pos.join(',')}] t${e.t}`);
  console.log(`M${i + 1} ${x.line}${x.r.over5 > 6 ? ` | over 5 s: ${x.r.over5} (6 longest listed)` : ''}`);
  console.log(`   stuck >5 s: ${x.r.over5}${s.length ? ' — ' + s.join('; ') : ''}${x.cstuck.length ? ' | carrier >3 s: ' + x.cstuck.map((e) => `${e.name} ${e.dur}s @[${e.pos.join(',')}]`).join('; ') : ''}`);
});
console.log('\nper stage: n | knockouts (before 1:30) | median ko s | no knockout {end reasons} | wins A/B | mean carries | mean pops A+B | stuck>5s eps');
for (const map of [...new Set(M.map((x) => x.r.map))]) {
  const R = M.filter((x) => x.r.map === map).map((x) => x.r), ko = R.filter((r) => r.reason === 'knockout'), kt = ko.map((r) => r.koT).filter((t) => t != null);
  const reasons = {}; for (const r of R) reasons[r.reason] = (reasons[r.reason] || 0) + 1;
  const timeouts = R.filter((r) => r.reason !== 'knockout').length;
  const wa = R.filter((r) => r.winner === 0).length, wb = R.filter((r) => r.winner === 1).length;
  console.log(`${map}: ${R.length} | ${ko.length} (${kt.filter((t) => t < 90).length}: ${kt.filter((t) => t < 90).sort((a, b) => a - b).join(' / ') || '-'}) | ${med(kt) ?? '-'} | ${timeouts} ${JSON.stringify(reasons)} | ${wa}/${wb}${R.length - wa - wb ? ` (${R.length - wa - wb} no winner)` : ''} | ${mean(R.map((r) => r.carries)).toFixed(1)} | ${mean(R.map((r) => r.pops[0] + r.pops[1])).toFixed(1)} | ${R.reduce((n, r) => n + r.over5, 0)}`);
  console.log(`   ko times: ${kt.sort((a, b) => a - b).join(' / ') || '-'} | OT: ${R.filter((r) => r.ot).map((r) => `${r.ot.why}->${r.ot.end} ${r.ot.len}s`).join(', ') || 'none'} | stuck%: ${R.map((r) => r.stuckPct).join(' ')}`);
}
