// (fix round 9) lava-audit rule 47's parts in a few lines each, for a job's summary:
//   node tools/botlab/jobs/batch5/caldera/sum47.cjs <log>
const fs = require('fs');
const pick = (v, ks) => Object.fromEntries(ks.filter((k) => v[k] !== undefined && v[k] !== null).map((k) => [k, v[k]]));
const KS = ['weapon', 'roofBlocks', 'reachBy', 'unreachable', 'tops', 'feet', 'byMode', 'trials', 'touched', 'died', 'flung', 'perched', 'held', 'rescued', 'rescueFar', 'rescueMaxH', 'rescueMaxM', 'unreachRescue', 'badBy'];
for (const l of fs.readFileSync(process.argv[2], 'utf8').split('\n')) {
  const m = /^(PASS|FAIL) rule 47/.exec(l); if (!m) continue;
  const k = l.indexOf('  {'); let j = null; try { j = JSON.parse(l.slice(k + 2)); } catch (e) { console.log('## rule 47 ' + m[1] + ' (unparsed)'); continue; }
  console.log(`## rule 47 ${m[1]}`);
  for (const part of ['a', 'b', 'c', 'd', 'e']) {
    const P = j[part]; if (!P) continue;
    const items = Array.isArray(P) ? P.map((x) => [x.level, x]) : Object.entries(P);
    for (const [lv, v] of items) {
      if (!v || typeof v !== 'object') { console.log(`##  ${part} ${lv} ${JSON.stringify(v)}`); continue; }
      if (part === 'c' && lv === 'holders') { console.log(`##  c holders ${JSON.stringify(v).slice(0, 300)}`); continue; }
      console.log(`##  ${part} ${lv} ${JSON.stringify(pick(v, KS))}`);
      if (v.steered) console.log(`##    steered (listed) ${JSON.stringify(v.steered).slice(0, 300)}`);
      if (v.rescueMaxAt) console.log(`##    farthest ${JSON.stringify(v.rescueMaxAt).slice(0, 300)}`);
      for (const e of (v.eg || []).slice(0, 3)) console.log(`##    eg ${JSON.stringify(e).slice(0, 300)}`);
    }
  }
  console.log(`##  total ${JSON.stringify(j.total)}`);
}
