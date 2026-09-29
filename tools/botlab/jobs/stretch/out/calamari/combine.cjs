// Scratch: glue several page scripts (each an async IIFE returning [{ name, ok, info }]) into one PAGE for page.cjs.
//   node tools/botlab/jobs/stretch/out/calamari/combine.cjs out.js a.js b.js …
const fs = require('fs');
const [outF, ...ins] = process.argv.slice(2);
const srcs = ins.map((f) => fs.readFileSync(f, 'utf8'));
fs.writeFileSync(outF, `(async () => { const all = []; for (const src of ${JSON.stringify(srcs)}) { try { all.push(...await (0, eval)(src)); } catch (e) { all.push({ name: 'script error', ok: false, info: String(e && e.message) }); } } return all; })()`);
