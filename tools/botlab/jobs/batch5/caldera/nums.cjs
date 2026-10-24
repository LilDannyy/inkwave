// (fix round 8) compact numbers out of a lava-audit log for a job's summary: rule 44's gate row and rule 47's parts
//   node tools/botlab/jobs/batch5/caldera/nums.cjs <log>
const fs = require('fs');
const lines = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter((l) => /^(PASS|FAIL) /.test(l));
const info = (l) => { const k = l.indexOf('  {'); try { return JSON.parse(l.slice(k + 2)); } catch (e) { return null; } };
for (const l of lines) {
  const name = l.slice(5, 60), d = info(l);
  if (!d) continue;
  if (/^rule 44: a plain/.test(l.slice(5))) {
    console.log(`## rule 44 ${l.slice(0, 4)}: largest ${d.largestM} m, steered largest ${d.steerMax} m (low ${d.steeredMax?.low}, high ${d.steeredMax?.high}); flights (every take-off, cands/flights/fine) low ${JSON.stringify(d.steerFlights?.low)} high ${JSON.stringify(d.steerFlights?.high)}`);
    for (const t of (d.steerTop || []).slice(0, 4)) console.log('##   ' + JSON.stringify(t));
  } else if (/^rule 47:/.test(l.slice(5))) {
    console.log(`## rule 47 ${l.slice(0, 4)}: total ${JSON.stringify(d.total)}`);
    const K = ['trials', 'touched', 'died', 'flung', 'perched', 'held', 'rescued', 'rescueFar', 'rescueMaxM'];
    const row = (nm, v) => console.log(`##   ${nm}: ` + K.map((k) => `${k} ${v[k]}`).join(', ') + (v.unreachable !== undefined ? `, unreachable tops ${v.unreachable}` : '') + (v.eg && v.eg.length ? ` eg ${JSON.stringify(v.eg[0]).slice(0, 200)}` : ''));
    if (d.a) for (const lv of ['low', 'high']) row('a ' + lv, d.a[lv]);
    if (d.b) for (const [lv, v] of Object.entries(d.b)) if (typeof v === 'object') row('b ' + lv, v);
    if (d.c) { console.log('##   c holders: ' + d.c.holders.map((h) => h[0]).join(' ')); for (const k of ['mitts', 'run', 'swim', 'walk', 'rise']) row('c ' + k, d.c[k]); }
    if (d.d) for (const v of d.d) { row('d ' + v.level, v); console.log('##     tall tops: ' + (v.blocks || []).map((b) => `${b[0]} ${b[3]}/${b[2]} landed, ${b[4]} died`).join('; ')); }
  }
}
