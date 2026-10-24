// (fix round 8) lava.js's F8b / F8c rows in full, one case per line, for a job's summary:
//   node tools/botlab/jobs/batch5/caldera/f8.cjs <log>
const fs = require('fs');
for (const l of fs.readFileSync(process.argv[2], 'utf8').split('\n')) {
  const m = /^(PASS|FAIL) (F8[bc]) /.exec(l); if (!m) continue;
  const k = l.indexOf('  {'); let d = null; try { d = JSON.parse(l.slice(k + 2)); } catch (e) { continue; }
  console.log(`## ${m[2]} ${m[1]} ${JSON.stringify({ ...d, cases: undefined, bad: undefined })}`);
  for (const c of d.cases || []) console.log('##   ' + JSON.stringify(c));
  for (const c of d.bad || []) console.log('##   bad ' + JSON.stringify(c));
}
