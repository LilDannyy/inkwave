// [b5-aquarium] the Mac mini helper's harness for the pipes on / off set (JOB-4): writes <root>/tools/botlab/match-aq.cjs
// = match.cjs plus one switch, PIPESOFF=1: before the match starts, LAYOUT.pipes.modes[MODE] = 'off' (src/game/pipes.js:
// every leg shut, still drawn and solid — the module's own per-mode switch). The repo's harness is untouched.
//   node tools/botlab/jobs/batch5/aquarium/aq-match.cjs <root>
const fs = require('fs'), path = require('path');
const root = process.argv[2] || '.', src = path.join(root, 'tools/botlab/match.cjs');
let s = fs.readFileSync(src, 'utf8');
const anchor = "    await js(`window.__inkwave.api.startMatch(";
if (!s.includes(anchor)) throw new Error('anchor: the startMatch call');
s = s.replace(anchor, "    if (process.env.PIPESOFF === '1') { const ok = await js(`(async () => { const M = await import('./src/world/maps.js'); const P = M.MAP_LAYOUTS['${MAP}']?.pipes; if (!P) return false; P.modes = P.modes || {}; P.modes['${MODE}'] = 'off'; return true; })()`); console.log('PIPESOFF ' + (ok ? 'set' : 'no pipes on this stage')); }\n" + anchor);
// …and say what the match actually ran with (match.pipes.off)
const end = "    const uniq = [...new Set(logs)];";
if (!s.includes(end)) throw new Error('anchor: the console summary');
s = s.replace(end, "    console.log('PIPES ' + JSON.stringify(await js(`(() => { const P = window.__inkwave.match?.pipes; return P ? { off: !!P.off, legs: P.legs?.length } : null; })()`)));\n" + end);
fs.writeFileSync(path.join(root, 'tools/botlab/match-aq.cjs'), s);
console.log('wrote ' + path.join(root, 'tools/botlab/match-aq.cjs'));
