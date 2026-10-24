#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const files = process.argv.slice(2);
if (!files.length) { console.error('Usage: node tools/botlab/issues-summary.cjs <issues.log> [...]'); process.exit(2); }
const rows = [];
for (const f of files) {
  const p = path.resolve(f);
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { if (!line.trim()) continue; try { rows.push({ ...JSON.parse(line), _file: p }); } catch { /* rotated/truncated tail */ } }
}
const map = new Map();
for (const r of rows) {
  const key = [r.kind || 'unknown', r.stage || '-', r.mode || '-'].join('\0');
  let v = map.get(key); if (!v) map.set(key, v = { kind: r.kind || 'unknown', stage: r.stage || '-', mode: r.mode || '-', count: 0, first: r.at || '-', last: r.at || '-', example: r.message || '', file: r._file, longest: '-' });
  v.count++;
  // [b5-beta1] stuck-bot rows: the longest episode (a 'stuck-bot-end' row carries an episode's whole length)
  if (Number.isFinite(r.duration) && (v.longest === '-' || r.duration > v.longest)) { v.longest = r.duration; v.example = r.message || v.example; } if (r.at && r.at < v.first) v.first = r.at; if (r.at && r.at > v.last) v.last = r.at;
}
const data = [...map.values()].sort((a,b) => b.count-a.count);
const cols = [['COUNT', 'count'], ['KIND', 'kind'], ['STAGE', 'stage'], ['MODE', 'mode'], ['LONGEST S', 'longest'], ['FIRST SEEN', 'first'], ['LAST SEEN', 'last'], ['EXAMPLE', 'example']];
const widths = cols.map(([h,k]) => Math.min(54, Math.max(h.length, ...data.map(x => String(x[k]).length))));
const line = (x) => cols.map(([,k],i) => String(x[k]).replace(/[\r\n\t]/g,' ').slice(0,widths[i]).padEnd(widths[i])).join(' | ');
console.log(line(Object.fromEntries(cols.map(([h,k]) => [k,h]))));
console.log(widths.map(w => '-'.repeat(w)).join('-+-'));
for (const r of data) console.log(line(r));
console.log(`${rows.length} entries across ${files.length} log(s)`);
