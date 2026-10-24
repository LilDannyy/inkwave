// (fix round 9) lava.js's F8c with its trails, one row a line, for a job's summary (the kit's state included):
//   node tools/botlab/jobs/batch5/caldera/f8c.cjs <log>
const fs = require('fs');
for (const l of fs.readFileSync(process.argv[2], 'utf8').split('\n')) {
  const m = /^(PASS|FAIL) F8c /.exec(l); if (!m) continue;
  const k = l.indexOf('  {'); let d = null; try { d = JSON.parse(l.slice(k + 2)); } catch (e) { continue; }
  console.log(`## F8c ${m[1]} ${JSON.stringify({ n: d.n, weapon: d.weapon, died: d.died, notUp: d.notUp, slowest: d.slowest, bad: d.bad })}`);
  for (const T of d.trails || []) {
    console.log(`##   trail ${T.sid} t0 ${T.t0} node ${JSON.stringify(T.node)} sl ${T.sl} start ${JSON.stringify(T.start)}`);
    for (const r of T.tr || []) console.log('##     ' + JSON.stringify(r));
  }
}
