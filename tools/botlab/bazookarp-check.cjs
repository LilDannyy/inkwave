// [b5-karp-checker] The Bazookarp stage checker (SPEC §4.4): a stage built in its Bazookarp variant, offscreen, checked
// against SPEC §9.1 — sixteen checks through the engine's own Carp Field, #16 with a kid's real jump, #11 with a
// scripted carrier — with a RESULT line, a JSON of every number and pictures. The checks themselves live in
// tools/botlab/karp-check-page.js (in the game page); this file boots the page, starts the matches, prints and writes.
//   MAP=halyard tools/botlab/run.sh tools/botlab/bazookarp-check.cjs        one stage
//   MAP=all tools/botlab/run.sh tools/botlab/bazookarp-check.cjs            every shipped stage in one go (WIP=1 adds
//                                                                           the stages under construction), then a table
//   MAPS=halyard,lockgate …                                                  some stages
//   KARP_SELFTEST=1 tools/botlab/run.sh tools/botlab/bazookarp-check.cjs    the self-test on karpbox (karp-check-box.js):
//                                                                           the clean box passes, each planted fault FAILs
//   env: OUT=dir (default .botlab/karp-check)   KARP_DEF='{…}' try data without editing bazookarp-data.js (one stage)
//        SHOTS=0 no pictures   CARRY=0 no carry walk   PHYS=0 skip #16's kid (quick iterations: a RESULT ok needs it)
//        DEVSTAGE=1 Cargo (noBots: the carry walk drives the scripted walker; MAP=all adds ?devstage for Cargo itself)
//        ERA=1|2|3, LAVA=low|high, KSTATE=<key>  one stage state (its key in G.match.stage.karpStates()); the page loads
//        with the module's audit switch (?era= / ?lava=, or the state's own `query`). Without one: every state in turn.
//        CASES=clean,f1,…  (self-test) some cases   FLAGSHOTS=n  pictures of the first n flagged places (default 8)
//        KITSHOTS=1  the kit up close too (a weir and a post, the Gate, a NO CARP sign, a carrierBlock's shimmer)
//        PROBE='[x, y, z, x, y, z]'  one move traced instead (#16's kid on the node pair nearest those points, every frame
//        of every trial): why a listed hopVeto edge or #7d candidate is or isn't made; PROBE='walk:<text>' one of #16's
//        walks (the one whose name holds <text>) again, every frame, with its path
// Prints one line per check (OK / WARN / FAIL / SKIP with numbers), then
//   RESULT <id> ok|fail L=… weir=… gate=… routes=… zones=… hops=…
// and writes <id>-karp.json (every number) and the pictures (JPEG < 300 KB) to OUT.
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
require(process.env.S + '/offscreen-boot.cjs');
const { defineTestMap } = require(process.env.S + '/testmaps.cjs');
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); setTimeout(() => process.exit(1), 3000); }, +(process.env.WATCHDOG || 3600000));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = process.env.BOTLAB_ROOT || path.resolve(__dirname, '../..');
const OUT = process.env.OUT || path.join(ROOT, '.botlab', 'karp-check');
const SHOTS = process.env.SHOTS !== '0', CARRY = process.env.CARRY !== '0', PHYS = process.env.PHYS !== '0', SELF = process.env.KARP_SELFTEST === '1';
const SHIPPED = ['tidewater', 'kelpline', 'halyard', 'saltpan', 'crossmarket', 'lockgate', 'terraces', 'nantai', 'craters', 'calamari', 'spirhalite', 'treehills', 'cargo'];
const WIPS = ['bluestone', 'aquarium', 'caldera'];
const MAP = SELF ? 'karpbox' : (process.env.MAP || 'halyard');
const IDS = SELF ? ['karpbox'] : MAP === 'all' ? [...SHIPPED, ...(process.env.WIP === '1' ? WIPS : [])] : (process.env.MAPS ? process.env.MAPS.split(',') : [MAP]);
const NAMES = { 1: 'Data', 2: 'Field', 3: 'Distances and counts', 4: 'Reachability', 5: 'Two routes', 6: 'Carry times', 7: 'No shortcut into a base', 8: 'Gate placement', 9: 'High ground and free zones', 10: 'Retreat sanity', 11: 'Carry walk', 12: 'Variant', 13: 'Deep spawns', 14: 'The Pond', 15: 'Weir room', 16: 'Hops and gaps, proved' };
let claimed = false;
app.on('browser-window-created', (_, win) => {
  if (claimed) return; claimed = true;
  win.webContents.setBackgroundThrottling(false);
  const errs = [];
  win.webContents.on('console-message', (e) => { const m = String(e.message); if (/error/i.test(String(e.level)) || /TypeError|ReferenceError/.test(m)) errs.push(m.slice(0, 300)); });
  let started = false;
  win.webContents.on('did-finish-load', async () => {
    if (started) return; started = true;
    const js = (c) => win.webContents.executeJavaScript(c, true);
    const mod = `import('./tools/botlab/karp-check-page.js')`;
    fs.mkdirSync(OUT, { recursive: true });
    // ------------------------------------------------------------------------------------------- page and matches
    let pageQ = null;
    const boot = async (q) => {
      await win.loadURL('app://inkwave/index.html?autopilot' + (q ? '&' + q : ''));
      for (let i = 0; i < 120; i++) { if (await js('!!window.__inkwave?.api')) break; await wait(250); }
      await js('window.__inkwave._onPointerUnlock = () => {}; 0');
      pageQ = q;
    };
    // define the stage's data (karpbox: the test stage; KARP_DEF: trial data; self-test: a case's box) and start
    const start = async (id, setup = null) => {
      if (setup) await js(setup);
      await js(`window.__inkwave.debug.unfreeze?.(); window.__inkwave.api.startMatch({ mapId: '${id}', duration: 300, mode: 'bazookarp', time: 'day' })`);
      const got = await js(`(window.__inkwave.mapDef && window.__inkwave.mapDef.id) || null`);
      if (got !== id) throw new Error(`MAP MISMATCH: asked for ${id}, the game built ${got}`);
      for (let i = 0; i < 400; i++) { if (await js(`window.__inkwave.match?.state === 'playing' && !!window.__inkwave.match.karp`)) break; await wait(150); }
      await js(`window.__inkwave.debug.freeze(); for (const a of window.__inkwave.match.actors) { if (a.bot) a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = false; } 0`);
    };
    const stageSetup = (id) => {
      if (id === 'karpbox') return defineTestMap('karpbox');
      if (process.env.KARP_DEF) return `(async () => { const { MAP_LAYOUTS } = await import('./src/world/maps.js'); MAP_LAYOUTS['${id}'].bazookarp = ${process.env.KARP_DEF}; return 1; })()`;
      return null;
    };
    // the page query a state needs (the module's audit switch), and the states the stage offers
    const stateQuery = (id, st) => [id === 'cargo' && process.env.DEVSTAGE !== '1' ? 'devstage' : '', st && st.query ? st.query : ''].filter(Boolean).join('&');
    const listStates = async () => js(`(() => { const F = window.__inkwave.match.karp.field; const S = (() => { try { return window.__inkwave.match.stage?.karpStates?.() || []; } catch { return []; } })(); return F.states.map((s, i) => ({ i, key: s.key, query: i ? (S.find((q) => String(q.key) === String(s.key))?.query || null) : null })); })()`);
    // ------------------------------------------------------------------------------------------- one stage, one state
    const checkOne = async (id, st, setup, tag, opts = {}) => {
      const o = { state: st.i, phys: PHYS && opts.phys !== false };
      if (process.env.KITSHOTS === '1' && st.i === 0) {   // the kit up close (a weir, a post, the Gate, a sign, a carrierBlock)
        const list = await js(`${mod}.then((m) => m.kitPictures())`);
        for (const s of list) { const name = (tag ? tag + '-' : '') + s.name; fs.writeFileSync(path.join(OUT, name), Buffer.from(s.url.split(',')[1], 'base64')); console.log(`  kit picture: ${name}`); }
      }
      const rep = await js(`${mod}.then((m) => m.runChecks(${JSON.stringify(o)}))`);
      const drop = await js(`${mod}.then((m) => m.dropCoverage(${JSON.stringify(o)}))`);
      const dropFlags = drop.bad.slice(0, 4).map((b) => ({ n: 11, at: b.at, what: `11: ${b.what}` }));
      const carry = [];
      if (CARRY && opts.carry !== false) for (const t of [0, 1]) { await start(id, setup); carry.push(await js(`${mod}.then((m) => m.carryWalk(${t}, ${JSON.stringify(o)}))`)); }
      // #11: the carry walk and the drop coverage
      const c11 = { n: 11, name: NAMES[11], flags: [] };
      const bad = [];
      if (drop.nBad) bad.push(`drop coverage: ${drop.nBad} of ${drop.samples} splats bad (${drop.pond} back to the Pond): ${drop.bad.slice(0, 3).map((b) => `${b.what} at ${JSON.stringify(b.at)} (${b.why})`).join('; ')}`);
      c11.flags.push(...dropFlags);
      for (const c of carry) for (const sa of (c.stuckAt || []).slice(0, 3)) c11.flags.push({ n: 11, at: sa.at, what: `11: team ${c.team}'s carry stuck (a ${sa.edge} edge)` });
      if (carry.length) for (const c of carry) {
        const W = c.walks || {};
        if (c.err) bad.push(`team ${c.team}: the walk threw: ${c.err.slice(0, 160)}`);
        if (!W.main?.ok) bad.push(`team ${c.team}: the carry ${W.main ? (W.main.why || `picked ${W.main.picked}, planted ${W.main.plant}, re-picked ${W.main.repicked}, knockout ${W.main.knockout}`) : 'did not run'}`);
        if (c.stuck) bad.push(`team ${c.team}: ${c.stuck} stuck episode(s)`);
        if (W.retreat?.ran && !W.retreat.ok) bad.push(`team ${c.team}: retreat ×3 on at ${W.retreat.on} m / off at ${W.retreat.off} m (8 / 3)`);
        if (W.zone?.ran && !W.zone.ok) bad.push(`team ${c.team}: in its own zone the fuse ran ×${W.zone.rate} (${W.zone.why})`);
        for (const f of W.falls || []) if (f.ran && !f.ok) bad.push(`team ${c.team}: a fall on the ${f.side} half → ${f.event}${f.side === 'enemy' ? ` rest ${JSON.stringify(f.rest)} (${f.dist} m)` : ''}`);
        for (const n of W.narrow || []) if (n.ran && !n.ok) bad.push(`team ${c.team}: a splat on the narrow walk by weir ${n.weir} rested on ${n.wide === false ? 'narrow' : 'no'} floor`);
      }
      // ([fix2] every FAIL with a place has a flag: where the carry stopped, where each failing walk ran)
      for (const c of carry) {
        const W = c.walks || {}, fl11 = (at, what) => { if (at) c11.flags.push({ n: 11, at, what: `11: team ${c.team}'s ${what}` }); };
        if (W.main && !W.main.ok) fl11(W.main.w2?.at || W.main.w1?.at || null, `carry stopped (${W.main.why || (W.main.plant ? 'no knockout' : 'no plant')})`);
        if (W.retreat?.ran && !W.retreat.ok) fl11(W.retreat.at, `retreat walk: ×3 on at ${W.retreat.on} / off at ${W.retreat.off} m`);
        if (W.zone?.ran && !W.zone.ok) fl11(W.zone.at, `zone visit ran ×${W.zone.rate}`);
        for (const f of W.falls || []) if (f.ran && !f.ok) fl11(f.at, `fall on the ${f.side} half → ${f.event}`);
        for (const n of W.narrow || []) if (n.ran && !n.ok) fl11(n.at, `narrow-walk splat rested on ${n.wide === false ? 'narrow' : 'no'} floor`);
      }
      const ran = carry.length > 0;
      c11.status = bad.length ? 'FAIL' : ran ? 'OK' : 'SKIP';
      c11.text = bad.length ? bad.join('; ') : (ran ? carry.map((c) => `team ${c.team}: knockout (weir ${c.walks.main.tWeir} s + Gate ${c.walks.main.tGate} s), stuck 0, retreat on ${c.walks.retreat?.on ?? '–'} / off ${c.walks.retreat?.off ?? '–'} m, zone ${c.walks.zone?.ran ? '×' + c.walks.zone.rate : 'n/a'}, falls ${(c.walks.falls || []).map((f) => (f.ran ? `${f.side} → ${f.event}` : `${f.side} n/a`)).join(', ')}, narrow → ${(c.walks.narrow || []).map((n) => (n.ran ? (n.wide ? 'wide' : 'narrow') : 'n/a')).join('/')}`).join(' | ') + ` · ` : 'CARRY=0: the walk not run (a RESULT ok needs it) · ') + `drop coverage ${drop.samples} splats ok (worst ${drop.worst} m)`;
      c11.nums = { drop, carry };
      rep.checks[11] = c11;
      // ([fix2] the pictures come after #11, so its flags — the drop coverage's, where a carry stopped, where a walk
      // failed — are numbered with the rest on the top-down and its key; the carry walks inked a fresh match, so the
      // pictures get a fresh one too. The page's own report takes #11 for its title and numbering)
      await js(`(() => { const kc = window.__karpCheck; kc.out.checks[11] = ${JSON.stringify({ n: 11, name: NAMES[11], status: c11.status, text: c11.text, flags: c11.flags })}; return 1; })()`);
      const shots = [];
      if (SHOTS && opts.shots !== false) {
        if (carry.length) await start(id, setup);
        const list = await js(`${mod}.then((m) => m.pictures({ state: ${st.i}, flagShots: ${+(process.env.FLAGSHOTS ?? 8)}, topOnly: ${!!opts.topOnly} }))`);
        for (const s of list) { const name = (tag ? tag + '-' : '') + s.name; fs.writeFileSync(path.join(OUT, name), Buffer.from(s.url.split(',')[1], 'base64')); shots.push(name); }
      }
      // print
      const all = Object.values(rep.checks).sort((a, b) => a.n - b.n);
      console.log(`== ${id}${rep.states.length > 1 ? ` state ${rep.key}` : ''}${rep.placeholder ? ' (PLACEHOLDER data)' : ''}${tag ? ' [' + tag + ']' : ''}`);
      for (const c of all) console.log(`  #${String(c.n).padEnd(2)} ${(c.name || NAMES[c.n]).padEnd(46)} ${c.status.padEnd(4)}  ${c.text}`);
      const fails = all.filter((c) => c.status === 'FAIL').map((c) => c.n), skips = all.filter((c) => c.status === 'SKIP').map((c) => c.n);
      const ok = !fails.length && !skips.length && all.length === 16;
      const w = rep.checks[3]?.nums?.teams?.[0], hops = rep.checks[2]?.nums;
      const zoneN = rep.checks[9]?.nums?.zones?.filter((z) => z.team === 1).length ?? 0;
      const rt = rep.checks[5]?.nums?.rows?.filter((r) => r.team === 0).map((r) => (r.r2 ? 2 : 1));
      console.log(`RESULT ${id}${rep.states.length > 1 ? '@' + rep.key : ''} ${ok ? 'ok' : 'fail'} L=${rep.L.join('/')} weir=${w?.weirs?.map((q) => q.count).join(',')} gate=${rep.checks[8]?.nums?.rows?.[0]?.dist} routes=${rt && rt.length ? Math.min(...rt) : 0}/2 zones=${zoneN} hops=${hops?.hops}+${hops?.gaps}${rep.checks[16]?.nums?.walkRoutes ? ` walks=${rep.checks[16].nums.walkRoutes.join('/')}+${rep.checks[16].nums.walkEntrances.join('/')}` : ''}${fails.length ? ' FAIL=' + fails.join(',') : ''}${skips.length ? ' SKIP=' + skips.join(',') : ''}`);
      if (shots.length) console.log(`  pictures (${OUT}): ${shots.join(', ')}`);
      // the flags, numbered as on the top-down (its discs and key) and in the -flag-<n> pictures; #11's carry places last
      const flags = await js(`${mod}.then((m) => m.numberFlags(window.__karpCheck.out.checks))`);
      if (flags.length) { console.log(`  flags (${flags.length}):`); for (const fg of flags) console.log(`    ${String(fg.i).padStart(3)} #${String(fg.check).padEnd(2)} (${fg.at.join(', ')})${fg.also ? ` +${fg.also}` : ''}: ${fg.what}`); }
      const json = { ...rep, flags, carry, drop, shots, result: ok ? 'ok' : 'fail', fails, skips };
      fs.writeFileSync(path.join(OUT, `${tag ? tag + '-' : ''}${id}${rep.states.length > 1 ? '-s' + rep.key : ''}-karp.json`), JSON.stringify(json, null, 1));
      return json;
    };
    // ------------------------------------------------------------------------------------------- the stages
    const table = [];
    try {
      if (process.env.PROBE) {
        // one move, traced (#16's kid on the pair of nodes nearest PROBE's two points): why it is or isn't made
        const id = IDS[0], setup = stageSetup(id);
        await boot(stateQuery(id, null)); await start(id, setup);
        if (process.env.PROBE.startsWith('walk:')) {
          // one of #16's walks again, traced (the checks run first: they build the walks)
          await js(`${mod}.then((m) => m.runChecks({ state: 0, phys: true }))`);
          const r = await js(`${mod}.then((m) => m.traceWalk(${JSON.stringify(process.env.PROBE.slice(5))}))`);
          if (r.err) console.log('PROBE ' + r.err);
          else {
            console.log(`PROBE ${id} walk "${r.what}" → ${r.result.ok ? 'WALKED' : 'NOT WALKED'} ${JSON.stringify(r.result.fail || {})}`);
            console.log('  path: ' + r.path.map((q) => `${q[0]}:(${q[1]}, ${q[2]}, ${q[3]})${q[4] ? ' ' + q[4] : ''}`).join(' '));
            for (const f of r.trace) if (Math.round(f[0] * 60) % 6 === 0 || !f[5] || f[6]) console.log(`    t ${f[0]} → #${f[1]} (${f[2]}, ${f[3]}, ${f[4]}) ${f[5] ? 'ground' : 'air'}${f[6] ? ' JUMP' : ''} [${f[7]}]`);
          }
          fs.writeFileSync(path.join(OUT, `${id}-probe-walk.json`), JSON.stringify(r, null, 1));
          throw Object.assign(new Error('probe done'), { quiet: true });
        }
        const pr = JSON.parse(process.env.PROBE);
        const r = await js(`${mod}.then((m) => m.probeEdge(${JSON.stringify(pr.slice(0, 3))}, ${JSON.stringify(pr.slice(3, 6))}))`);
        console.log(`PROBE ${id} ${r.kind} ${JSON.stringify(r.from)} → ${JSON.stringify(r.to)} (carrier-graph nodes: ${r.valid}) → ${r.made ? 'MADE' : 'NOT MADE'} in ${r.trials} trial(s)`);
        let last = -1; for (const f of r.trace) { if (f[0] !== last) { console.log(`  trial ${f[0]}`); last = f[0]; } if (f[1] % 6 === 0 || f[5] !== 1) console.log(`    f${String(f[1]).padStart(3)} (${f[2]}, ${f[3]}, ${f[4]}) ${f[5] ? 'ground' : 'air'}${f[6] ? ' JUMP' : ''}${f[7] ? '' : ' DEAD'}`); }
        for (const b of r.blocks) console.log(`  near where trial ${b.trial} stopped: ${b.tag} ${JSON.stringify(b.min)}–${JSON.stringify(b.max)}${b.roof ? ' roof' : ''}${b.hidden ? ' (prop collider)' : ''}${b.dynamic ? ' dynamic' : ''}`);
        fs.writeFileSync(path.join(OUT, `${id}-probe.json`), JSON.stringify(r, null, 1));
      } else if (SELF) {
        const box = `import('./tools/botlab/karp-check-box.js')`;
        await boot('');
        const cases = await js(`${box}.then((m) => m.CASES.map((c) => ({ id: c.id, check: c.check, what: c.what, expect: c.expect || null, notFail: c.notFail || null, expect16: c.expect16 || null, also: c.also || null, phys: !!c.phys, carry: !!c.carry, allStates: !!c.allStates, reach: !!c.reach })))`);
        const want = process.env.CASES ? process.env.CASES.split(',') : null;
        const res = [];
        for (const c of cases.filter((q) => !want || want.includes(q.id))) {
          await boot('');
          const setup = `${box}.then((m) => m.defineCase('${c.id}'))`;
          await start('karpbox', setup);
          const sts = await listStates();
          if (c.reach) {
            // [fix2] the windows' calibration: #16's kid on every REACH row, set against the probes' windows (reachCalib)
            const r = await js(`${box}.then((b) => b.reachRows()).then((rows) => ${mod}.then((m) => m.reachCalib(rows)))`);
            for (const q of r.byDy) console.log(`  REACH dy ${String(q.dy).padStart(4)}: made ${q.made}/${q.of}, last made air ${q.lastAir ?? '–'} m (first not made beyond it ${q.firstNot ?? '–'}), worst-aligned node flat ${q.worstFlat ?? '–'} m vs the windows ${q.winOn} (field) / ${q.winOff} (off-field) → ${q.inside && q.edgeOk ? 'inside' : q.inside ? 'BEYOND THE WINDOW (worst alignment)' : 'MADE OUTSIDE THE WINDOW'}`);
            for (const q of r.rows) if (q.err || (q.made && (q.flat > q.winOn || q.flat > q.winOff))) console.log(`    ${q.err ? 'ERROR ' + q.err : 'outside'}: dy ${q.dy} air ${q.air} ${JSON.stringify(q.from)} → ${JSON.stringify(q.to)} flat ${q.flat}${q.how ? ' (' + q.how + ')' : ''}`);
            res.push({ ...c, pass: r.pass, reachRows: r.rows, byDy: r.byDy });
            fs.writeFileSync(path.join(OUT, 'self-reach.json'), JSON.stringify(r, null, 1));
            console.log(`SELFTEST ${c.id.padEnd(10)} every made jump inside the probes' windows, each window's edge beyond the last made gap (worst grid alignment) → ${r.pass ? 'PASS' : 'FAIL'}`);
            continue;
          }
          if (c.allStates) {
            // every state the module offers (karpbox's own test state 1 comes first in the field's list), each world from
            // its query: #15 passes in the state as built and FAILs in the module's state 'w'
            const runs = [];
            for (const st of sts.filter((q) => q.i === 0 || q.query)) {
              if ((st.query || '') !== (pageQ || '')) { await boot(st.query || ''); await start('karpbox', setup); }
              const j = await checkOne('karpbox', st, setup, `self-${c.id}`, { carry: false, phys: false, shots: true, topOnly: true });
              runs.push({ key: j.key, query: st.query, c15: j.checks[15].status, fails: j.fails });
            }
            const s0 = runs.find((r) => String(r.key) === '0'), sw = runs.find((r) => String(r.key) === 'w');
            const pass = !!s0 && !!sw && s0.c15 === 'OK' && sw.c15 === 'FAIL' && sw.query === 'kcstate=w';
            res.push({ ...c, pass, runs, states: sts.map((q) => ({ key: q.key, query: q.query })) });
            console.log(`SELFTEST ${c.id.padEnd(10)} the module's states ${JSON.stringify(sts.map((q) => [q.key, q.query]))}: #15 ${runs.map((r) => `${r.key} ${r.c15}`).join(', ')} (state 'w' must FAIL, built from ?${sw?.query}) → ${pass ? 'PASS' : 'FAIL'}`);
            continue;
          }
          const j = await checkOne('karpbox', sts[0], setup, `self-${c.id}`, { carry: c.id === 'clean' || c.carry, phys: c.id === 'clean' || c.phys, shots: c.id === 'clean' || c.check || c.notFail ? true : false, topOnly: c.id !== 'clean' });
          const failing = j.fails;
          // (the target check must FAIL for the fault planted: its text matches the case's `expect`, not a knock-on;
          // a notFail case proves a false FAIL gone: none of those checks may fail, and #16's text may be asked to match)
          const why = c.expect ? new RegExp(c.expect).test(j.checks[c.check]?.text || '') : true;
          const why16 = c.expect16 ? new RegExp(c.expect16).test(j.checks[16]?.text || '') : true;
          // [fix2] (also: more checks that must FAIL for their own reason; flagged: the target check's FAIL has a place on
          // the pictures — a numbered flag — as every FAIL with a place must)
          const alsoOk = (c.also || []).every(([n, re]) => failing.includes(n) && new RegExp(re).test(j.checks[n]?.text || ''));
          const flagged = c.check == null || (j.flags || []).some((f) => f.check === c.check);
          const pass = c.id === 'clean' ? j.result === 'ok' : c.check == null ? (c.notFail || []).every((n) => !failing.includes(n)) && why16 : failing.includes(c.check) && why && alsoOk && flagged;
          res.push({ ...c, pass, failing, why, why16, alsoOk, flagged });
          const what = c.id === 'clean' ? 'clean karpbox: every check OK' : c.check == null ? `${(c.notFail || []).map((n) => '#' + n).join(' ')} must NOT fail (${c.what})${c.expect16 ? (why16 ? ', #16 as expected' : ', #16 NOT as expected: /' + c.expect16 + '/') : ''}` : `#${c.check} must FAIL (${c.what})${c.expect ? (why ? ', for that reason' : ', NOT for that reason: /' + c.expect + '/') : ''}${c.also ? (alsoOk ? `, and ${c.also.map(([n]) => '#' + n).join(' ')} for theirs` : `, NOT ${c.also.map(([n, re]) => `#${n} /${re}/`).join(' ')}`) : ''}${flagged ? '' : ', but its FAIL has NO FLAG (no place on the pictures)'}`;
          console.log(`SELFTEST ${c.id.padEnd(10)} ${what} → ${pass ? 'PASS' : 'FAIL'}${failing.length ? ' (failing: ' + failing.map((n) => '#' + n).join(' ') + ')' : ''}`);
        }
        console.log(`RESULT selftest ${res.filter((r) => r.pass).length}/${res.length}`);
        fs.writeFileSync(path.join(OUT, 'selftest.json'), JSON.stringify(res, null, 1));
      } else {
        for (const id of IDS) {
          try {
            const setup = stageSetup(id);
            const want = process.env.ERA ? 'era=' + process.env.ERA : process.env.LAVA ? 'lava=' + process.env.LAVA : null;
            const wantKey = process.env.ERA || process.env.LAVA || process.env.KSTATE || null;
            await boot(stateQuery(id, want ? { query: want } : null));
            await start(id, setup);
            let sts = await listStates();
            if (wantKey != null) sts = sts.filter((s) => String(s.key) === String(wantKey)).slice(0, 1).concat(sts.length && !sts.some((s) => String(s.key) === String(wantKey)) ? [] : []);
            if (wantKey != null && !sts.length) { console.log(`== ${id}: no state with key ${wantKey} (states: ${(await listStates()).map((s) => s.key).join(', ')})`); continue; }
            for (const st of sts) {
              const q = stateQuery(id, wantKey != null ? (want ? { query: want } : st) : st);
              if (q !== pageQ) { await boot(q); await start(id, setup); }
              const t0 = Date.now();
              const j = await checkOne(id, st, setup, '', { topOnly: MAP === 'all' && !['halyard', 'lockgate'].includes(id) });
              table.push({ id: id + (j.states.length > 1 ? '@' + j.key : ''), j, s: Math.round((Date.now() - t0) / 1000) });
              if (!st.query && st.i === 0 && sts.length > 1) await start(id, setup);
            }
          } catch (e) { console.log(`== ${id}: HARNESS ERROR ${e.message}`); table.push({ id, err: e.message }); }
        }
        if (table.length > 1) {
          console.log('\n== all stages');
          console.log('| stage | L (m) | weir counts | result | failing checks | hop + gap edges | #16 made / not made (hopVeto) | #16 walks: routes, entrances | beyond the rules made | rising gaps: tried / made | climbs ≤ 1.8 m hopped | #7d finds (gain > 10 m) | entrances A/B | s |');
          console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
          for (const r of table) {
            if (r.err) { console.log(`| ${r.id} | error: ${r.err} |`); continue; }
            const c = r.j.checks, n16 = c[16]?.nums || {}, n7 = c[7]?.nums || {};
            const finds = (n7.d || []).length, ents = (n7.teams || []).map((t) => t.entrances.length).join('/');
            console.log(`| ${r.id}${r.j.placeholder ? ' (placeholder)' : ''} | ${r.j.L.join(' / ')} | ${(c[3]?.nums?.teams?.[0]?.weirs || []).map((w) => w.count).join(', ')} | ${r.j.result} | ${r.j.fails.map((n) => '#' + n).join(' ')} | ${c[2]?.nums?.hops} + ${c[2]?.nums?.gaps} | ${n16.tried != null ? `${n16.tried - n16.failed} / ${n16.failed}${n16.failed ? ` (h ${n16.failedBy.hop}, g ${n16.failedBy.gapLevel}, g↓ ${n16.failedBy.gapDown})` : ''}` : '–'} | ${n16.walkRoutes ? `${n16.walkRoutes[0]}/${n16.walkRoutes[1]}, ${n16.walkEntrances[0]}/${n16.walkEntrances[1]}` : '–'} | ${n16.beyondMade ?? '–'} of ${n16.beyond ?? '–'} | ${n16.rise ? `${n16.rise.tried} / ${n16.rise.made}` : '–'} | ${n16.climbHops ? `${n16.climbHops.made} of ${n16.climbHops.tried}` : '–'} | ${finds}${finds ? ': ' + Object.entries((n7.d || []).reduce((m, f) => ({ ...m, [f.probe]: (m[f.probe] || 0) + 1 }), {})).map(([k, v]) => `${k} ${v}`).join(', ') : ''} | ${ents} | ${r.s} |`);
          }
          fs.writeFileSync(path.join(OUT, 'all-stages.json'), JSON.stringify(table.map((r) => ({ id: r.id, err: r.err, result: r.j?.result, fails: r.j?.fails, L: r.j?.L, s: r.s, c2: r.j?.checks?.[2]?.nums, c16: r.j?.checks?.[16]?.nums, c7: r.j?.checks?.[7]?.nums })), null, 1));
        }
      }
    } catch (e) { if (!e.quiet) console.log('HARNESS ERROR', e.message, e.stack); }
    console.log('console errors:', errs.length ? [...new Set(errs)].slice(0, 6).join(' || ') : 'none');
    app.quit();
  });
});
