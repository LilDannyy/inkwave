// [b5-karp] Bazookarp bot health on one stage (SPEC §10.3): an all-bot (autopilot) match stepped at a fixed 60 Hz (sim
// time), a full 5:00 (+ overtime). Reports what the SPEC's targets (§9.1) are judged on:
//   the result (winner, reason, knockout time, counts, best metres) · the shell (pops per team, time to the first pop,
//   burst splats, re-formed shells and their time to pop) · pick-ups, carries (count, duration, metres, how each ended)
//   · Carp Blasts (own / enemy half), resets by cause, moves off covered spots · weir plants, Gates opened · overtime
//   (start reason S38a / S38b / S38c, length, end, the pick-up windows) · the carrier's fast-fuse seconds (retreat /
//   zone) · carrier stuck episodes > 3 s, bots stuck %, carrierRetreatFallback, continuity-clamp rejections · Carp
//   Shots by charge tier, their hits and splats · specials, super jumps to the carrier, shared Bubble Guards on the
//   carrier and knockouts within 8 s of one · console warnings / errors, sim cost.
//   MAP=halyard tools/botlab/run.sh tools/botlab/karp-match.cjs
//   env: SUBS='all=bobber' · 'team0=…;team1=…' · per slot 'a,b,…' equips the subs ([b5-int3], as tower-match.cjs)
//   env: DUR=300  OTMAX=120 (a stalled overtime isn't simulated to its 300 s cap)  OUT=file.json  DIFF=easy|normal|hard
//        HUMAN=still|carry (Alpha's first kid: AFK at spawn / its own brain, never re-dealt)  KARP_DEF='two' | JSON (karpbox)
// Ends with `RESULT karp <id> win=A|B reason=… ko=… c=…/… pops=… carries=… blasts=… ot=…/<why>` and RESULT_JSON {…}.
// (The missing-lightmap warning of a stage's .bazookarp variant is expected until WP4b bakes it: listed, not counted.)
const { app } = require('electron');
const fs = require('fs');
require(process.env.S + '/offscreen-boot.cjs');
const { TEST_MAPS, defineTestMap } = require(process.env.S + '/testmaps.cjs');
const MAP = process.env.MAP || 'karpbox', DUR = +(process.env.DUR || 300), HUMAN = process.env.HUMAN || '', DIFF = process.env.DIFF || 'normal';
const OUT = process.env.OUT || '';
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); }, +(process.env.WATCHDOG || 590000));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let claimed = false;
app.on('browser-window-created', (_, win) => {
  if (claimed) return; claimed = true;
  win.webContents.setBackgroundThrottling(false);
  const logs = [];
  win.webContents.on('console-message', (e) => { const m = String(e.message); if (/error|warn/i.test(String(e.level)) && !/Security Warning|Autofill/.test(m)) logs.push(`[${e.level}] ${m.slice(0, 300)}`); });
  let started = false;
  win.webContents.on('did-finish-load', async () => {
    if (started) return; started = true;
    await win.loadURL('app://inkwave/index.html?autopilot');
    const js = (c) => win.webContents.executeJavaScript(c, true);
    for (let i = 0; i < 120; i++) { if (await js('!!window.__inkwave?.api')) break; await wait(250); }
    await js('window.__inkwave._onPointerUnlock = () => {}; 0');
    if (TEST_MAPS.includes(MAP)) await js(defineTestMap(MAP));
    await js(`window.__inkwave.api.startMatch({ mapId: '${MAP}', mode: 'bazookarp', duration: ${DUR}, difficulty: '${DIFF}' })`);
    { const got = await js(`(window.__inkwave.mapDef && window.__inkwave.mapDef.id) || null`); if (got !== MAP) { console.log(`MAP MISMATCH: asked for ${MAP}, the game built ${got}`); app.exit(3); return; } }
    for (let i = 0; i < 240; i++) { if (await js(`window.__inkwave.match?.state === 'playing'`)) break; await wait(250); }
    // [b5-int3] SUBS equips the subs as tower-match.cjs / match.cjs do ('all=sprinkler' · 'team0=beacon;team1=curtain' · per slot 'a,b,…')
    if (process.env.SUBS) console.log('   subs ' + await js(`(() => { const A = window.__inkwave.match.actors, spec = ${JSON.stringify(process.env.SUBS)};
      const S = spec.startsWith('all=') ? A.map(() => spec.slice(4)) : spec.includes('team') ? (() => { const t = {}; for (const p of spec.split(';')) { const [k, v] = p.split('='); t[+k.replace('team', '')] = v; } return A.map((a) => t[a.team] || null); })() : A.map((a, i) => spec.split(',')[i] || null);
      A.forEach((a, i) => { if (S[i]) a.setSub(S[i]); }); return A.map((a) => 'AB'[a.team] + ':' + (a.subId || '-')).join(' '); })()`));
    const t0 = Date.now();
    const r = await js(`(async () => {
      const g = window.__inkwave, m = g.match, Kp = m.karp;
      const { on } = await import('./src/core/ctx.js');
      const { BAZOOKARP } = await import('./src/config.js');
      const { KARP_BOT, KARP_AI, resetKarpStats } = await import('./src/game/botsKarp.js');
      const { SPECIAL_STATS, resetSpecialStats } = await import('./src/game/botSpecials.js');
      if (!Kp) return { err: 'no Bazookarp engine (mode ' + m.mode + ')' };
      resetKarpStats(); resetSpecialStats();   // [b5-karp-bots] (objects too: route shares, roles)
      KARP_AI.enabled = ${process.env.KARP_AI === '0' ? 'false' : 'true'};   // [b5-karp-bots] KARP_AI=0: WP1's minimal bots (the A/B baseline)
      const KG = window.__G.karpGun; KG.stats = { fired: [0, 0, 0], landed: 0, blasts: 0, hits: 0, splats: 0, kicks: 0 };
      const HUMAN = '${HUMAN}', me = m.local;
      if (HUMAN === 'still' && me) { me.bot = null; me.intent.move.set(0, 0, 0); me.intent.fire = me.intent.squid = me.intent.jump = me.intent.sub = me.intent.special = false; }
      g.debug.freeze();
      const clock = () => +(m.duration - m.time + (Kp.overtime ? Kp.overtimeT : 0)).toFixed(1);
      const X = { pops: [], pickups: [], carries: [], plants: [], gates: [], blasts: [], resets: [], moves: 0, drops: [], ot: null, end: null, specials: 0, jumps: 0, jumpsToCarrier: 0, bubbleOnCarrier: [], kos: [], splats: 0, burstSplats: 0, fuseSplats: 0 };
      let cur = null;   // the carry in progress
      const offs = [
        on('karp:burst', (e) => X.pops.push({ t: clock(), team: e.team })),
        on('karp:pickup', (e) => { X.pickups.push({ t: clock(), team: e.team, name: e.actor.name, w: e.actor.weaponId }); cur = { t0: clock(), team: e.team, name: e.actor.name, w: e.actor.weaponId, best0: Kp.bestM[e.team] }; }),
        on('karp:plant', (e) => { X.plants.push({ t: clock(), team: e.team, index: e.index }); if (cur) { cur.how = 'plant'; } }),
        on('karp:gate', (e) => X.gates.push({ t: clock(), team: e.team })),
        on('karp:explode', (e) => X.blasts.push({ t: clock(), own: !!e.own, team: e.actor?.team })),
        on('karp:reset', (e) => X.resets.push({ t: clock(), why: e.why })),
        on('karp:drop', (e) => { if (e.how === 'moved') X.moves++; else X.drops.push({ t: clock(), how: e.how }); }),
        on('karp:overtime', (e) => { X.ot = { t: clock(), losing: e.losing, why: e.why }; }),
        on('karp:end', (e) => { X.end = { t: clock(), winner: e.winner, reason: e.reason, counts: e.counts }; }),
        on('special:use', () => X.specials++),
        on('superjump', (e) => { if (e.phase === 'charge') { X.jumps++; const tg = e.actor.superJumpState && e.actor.superJumpState.target; if (tg && tg === Kp.holder) X.jumpsToCarrier++; } }),
        on('special:shield', (e) => { if (e.actor === Kp.holder) X.bubbleOnCarrier.push(clock()); }),
        on('splatted', (e) => { X.splats++; if (e.cause === 'karp-burst') X.burstSplats++; if (e.cause === 'karp-fuse') X.fuseSplats++; }),
        on('karp:rate', () => {}),
      ];
      const closeCarry = (how) => { if (!cur) return; cur.dur = +(clock() - cur.t0).toFixed(1); cur.m = +(Kp.bestM[cur.team] - cur.best0).toFixed(1); cur.how = cur.how || how; X.carries.push(cur); cur = null; };
      offs.push(on('karp:drop', (e) => { if (e.how !== 'moved') closeCarry(e.how); }), on('karp:reset', (e) => closeCarry(e.why === 'zone' ? 'splat' : e.why)), on('karp:plant', () => closeCarry('plant')), on('karp:end', (e) => { if (cur) closeCarry(e.reason === 'knockout' ? 'knockout' : 'end'); }));
      const hist = new Map(); let samples = 0, stuckS = 0, simT = 0, holdS = 0; const eps = [], open = new Map();
      let cStuck = 0; const cEps = []; let cHist = [];
      const frameErr = { n: 0, msg: '' };
      const DT = 1 / 60, CH = 15;
      const maxT = ${DUR} + Math.min(BAZOOKARP.overtimeMax, ${+(process.env.OTMAX || 120)}) + 1;
      let chunk = 0; const tSim0 = performance.now();
      while (m.state === 'playing' && simT < maxT) {
        const render = (chunk++ % 8) === 0;
        for (let k = 0; k < CH; k++) { g._skipRender = !(render && k === CH - 1); try { g._frame(DT); } catch (e) { frameErr.n++; if (!frameErr.msg) frameErr.msg = String(e && e.stack || e).slice(0, 400); } }
        g._skipRender = false;
        simT += CH * DT;
        if (m.state !== 'playing') continue;
        // bots stuck (as tower-match: < 1 m over 3 s while wanting to move; not while charging); the carrier's own episodes
        for (const a of m.actors) {
          if (!a.bot) continue;
          const h = hist.get(a) || []; hist.set(a, h);
          h.push({ t: simT, x: a.pos.x, z: a.pos.z });
          while (h.length && simT - h[0].t > 3) h.shift();
          // ([b5-karp-bots] a bot holding a spot on purpose doesn't count: a keeper, a breaker at the ring, the grabber's wait, a
          // perch — botsKarp's kHoldUntil — or a pod / hedge perch, as match.cjs)
          const holding = (a.bot.kHoldUntil || 0) > window.__G.time || (a.bot.perchUntil || 0) > a.bot.t;
          if (holding && a.alive) holdS += 0.25;
          const wants = a.alive && !a.superJumpState && !(a.weaponRunner && a.weaponRunner.charging) && !(a.carry && a.carry.gun && a.carry.gun.charging) && !holding;
          samples++;
          const span = h.length > 1 ? Math.max(...h.map((p) => Math.hypot(p.x - a.pos.x, p.z - a.pos.z))) : 99;
          const stuck = wants && h.length >= 11 && span < 1.0;
          if (stuck) {
            stuckS += 0.25;
            if (!open.has(a)) { const ep = { t: +simT.toFixed(1), name: a.name, w: a.weaponId, mode: a.bot.mode, role: a.bot.kRole || '-', carry: !!a.carry, pos: [+a.pos.x.toFixed(1), +a.pos.y.toFixed(2), +a.pos.z.toFixed(1)], dur: 0 }; open.set(a, ep); eps.push(ep); }
            open.get(a).dur += 0.25;
          } else open.delete(a);
        }
        // the carrier: stuck > 3 s (< 1 m in 3 s while carrying)
        const H = Kp.holder;
        if (H && H.alive) {
          cHist.push({ t: simT, x: H.pos.x, z: H.pos.z, a: H });
          cHist = cHist.filter((p) => p.a === H && simT - p.t <= 3);
          const span = Math.max(...cHist.map((p) => Math.hypot(p.x - H.pos.x, p.z - H.pos.z)));
          if (cHist.length >= 12 && span < 1.0) { cStuck += 0.25; if (!H._kStuck) { H._kStuck = { t: +simT.toFixed(1), name: H.name, pos: [+H.pos.x.toFixed(1), +H.pos.y.toFixed(2), +H.pos.z.toFixed(1)], dur: 0 }; cEps.push(H._kStuck); } H._kStuck.dur += 0.25; }
          else H._kStuck = null;
        } else cHist = [];
        if (chunk % 40 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      if (cur) closeCarry('end');
      const simMs = performance.now() - tSim0;
      offs.forEach((f) => f());
      const S = Kp.stats, st = Kp.state();
      const botS = Math.max(1, samples * 0.25);
      // knockouts within 8 s of a Bubble Guard reaching the carrier
      const koT = X.end && X.end.reason === 'knockout' ? X.end.t : null;
      const koBubble = koT != null && X.bubbleOnCarrier.some((t) => koT - t >= 0 && koT - t <= 8);
      const popAfterReform = [];
      return {
        simT: +simT.toFixed(1), simMs: Math.round(simMs), state: m.state, map: '${MAP}', placeholder: Kp.placeholder, L: Kp.L.map((x) => +x.toFixed(1)),
        winner: Kp.winner, reason: Kp.reason, koT: koT, counts: [...Kp.count], best: Kp.bestM.map((b) => +b.toFixed(1)),
        pops: S.pops, firstPop: S.firstPop, popT: S.popT, burstSplats: X.burstSplats, reforms: S.reforms, crushes: Kp.shell.stats.crushes,
        pickups: S.pickups, carries: X.carries, blasts: S.blasts, resets: S.resets, moves: S.moves, plants: X.plants, gates: X.gates,
        ot: X.ot ? { why: X.ot.why, losing: X.ot.losing, len: +((X.end ? X.end.t : clock()) - X.ot.t).toFixed(1), end: Kp.reason, windows: S.windows } : null,
        fastT: { retreat: +(S.fastT.retreat || 0).toFixed(1), zone: +(S.fastT.zone || 0).toFixed(1) },
        clamped: S.clamped, clampLog: S.clampLog || [], retreatFallback: KARP_BOT.stats.retreatFallback, carrierShots: KARP_BOT.stats.carrierShots, breakT: +KARP_BOT.stats.breakT.toFixed(0),
        stuckPct: +(100 * stuckS / botS).toFixed(1), holdPct: +(100 * holdS / botS).toFixed(1), eps: eps.sort((a, b) => b.dur - a.dur).slice(0, 6), carrierStuck: { s: cStuck, eps: cEps.filter((e) => e.dur > 3).slice(0, 6) },
        shots: KG.stats, splats: X.splats, fuseSplats: X.fuseSplats, specials: X.specials, jumps: X.jumps, jumpsToCarrier: X.jumpsToCarrier,
        bubbleOnCarrier: X.bubbleOnCarrier.length, koBubble, frameErr, grants: S.grants, refused: S.refused,
        fieldMs: Kp.field.stats.buildMs, fieldSplit: Kp.field.stats.ms, hops: Kp.field.stats.hops, gaps: Kp.field.stats.gaps,
        // [b5-karp-bots] route choice shares (by route name: a layout hint's, else short / alt), the bots' Carp Shot dangers
        // (noticed and escaped / caught), the carrier's shots by kind, roles (bot-seconds), keepers on their spot, interceptors on
        // the known carrier, super jumps to the carrier, specials by the karp rules
        routes: KARP_BOT.stats.routes, picks: KARP_BOT.stats.picks, caughtNoticed: (SPECIAL_STATS.bySrc || {}).karp || { caught: 0, evaded: 0 }, shellDanger: (SPECIAL_STATS.bySrc || {}).karpshell || null, fuseDanger: (SPECIAL_STATS.bySrc || {}).karpfuse || null,
        kShots: { push: KARP_BOT.stats.push, dodge: KARP_BOT.stats.dodges, splash: KARP_BOT.stats.splashes, ink: KARP_BOT.stats.routeInk }, roles: Object.fromEntries(Object.entries(KARP_BOT.stats.roles).map(([k, v]) => [k, Math.round(v)])),
        fbAt: KARP_BOT.stats.fbAt || [], keeperT: +KARP_BOT.stats.keeperT.toFixed(0), icptT: +KARP_BOT.stats.icptT.toFixed(0), botJumps: KARP_BOT.stats.jumps, kSpecials: KARP_BOT.stats.specials, ai: KARP_AI.enabled,
      };
    })()`);
    const wallS = ((Date.now() - t0) / 1000).toFixed(0);
    const lightmap = logs.filter((l) => /no lightmap for \S+\.bazookarp|no lightmap for karpbox/.test(l));
    const uniq = [...new Set(logs.filter((l) => !lightmap.includes(l)))];
    if (r.err) { console.log('HARNESS ' + r.err); app.exit(2); return; }
    const W = (t) => (t === 0 ? 'A' : t === 1 ? 'B' : '-');
    console.log(`== ${MAP} [bazookarp${r.placeholder ? ', placeholder data' : ''} L ${r.L.join('/')} m]: winner ${W(r.winner)} (${r.reason}) | counts ${r.counts.join(' vs ')} | best A ${r.best[0]} m B ${r.best[1]} m | ko ${r.koT ?? '-'} | OT ${r.ot ? r.ot.why + ' ' + r.ot.len + ' s → ' + r.ot.end : 'no'} | sim ${r.simT} s`);
    console.log(`   shell: pops A ${r.pops[0]} B ${r.pops[1]} | first pop ${r.firstPop ?? '-'} s | pops at ${JSON.stringify(r.popT)} | burst splats ${r.burstSplats} | re-formed ${r.reforms} | devices crushed ${r.crushes}`);
    console.log(`   pick-ups A ${r.pickups[0]} B ${r.pickups[1]} | carries ${r.carries.length}: ${r.carries.map((c) => `${W(c.team)}:${c.how}/${c.dur}s/${c.m}m`).join(' ')}`);
    console.log(`   plants ${JSON.stringify(r.plants)} | gates ${JSON.stringify(r.gates)} | Carp Blasts own ${r.blasts.own} enemy ${r.blasts.enemy} | resets ${JSON.stringify(r.resets)} | moved ${r.moves}`);
    console.log(`   fast fuse (s): retreat ${r.fastT.retreat} zone ${r.fastT.zone} | clamp rejections ${r.clamped} | carrierRetreatFallback ${r.retreatFallback} | carrier stuck ${r.carrierStuck.s} s (> 3 s episodes ${r.carrierStuck.eps.length}) | bots stuck ${r.stuckPct}% (holding on purpose ${r.holdPct}%)`);
    console.log(`   Carp Shots by tier [splash, burst, big] ${JSON.stringify(r.shots.fired)} landed ${r.shots.landed} blasts ${r.shots.blasts} hits ${r.shots.hits} splats ${r.shots.splats} | carrier shot decisions ${r.carrierShots} | breakers at the shell ${r.breakT} bot-s`);
    console.log(`   specials ${r.specials} | super jumps ${r.jumps} (to the carrier ${r.jumpsToCarrier}) | Bubble Guards on the carrier ${r.bubbleOnCarrier}, a knockout within 8 s of one: ${r.koBubble ? 'yes' : 'no'} | splats ${r.splats} (fuse ${r.fuseSplats}) | grants ${r.grants} refused ${r.refused}`);
    console.log(`   field: ${r.fieldMs} ms at load ${JSON.stringify(r.fieldSplit)}, hop edges ${r.hops}, gap edges ${r.gaps} | sim ${r.simT} s in ${(r.simMs / 1000).toFixed(0)} s (wall ${wallS} s)`);
    console.log(`   bots [${r.ai ? 'WP3' : 'WP1 minimal'} ${DIFF}]: route picks ${r.picks} shares ${JSON.stringify(r.routes)} | Carp Shots noticed: escaped ${r.caughtNoticed.evaded} caught ${r.caughtNoticed.caught} | carrier shots ${JSON.stringify(r.kShots)} | keepers on spot ${r.keeperT} s, interceptors on the carrier ${r.icptT} s | jumps to the carrier ${r.botJumps} | karp specials ${r.kSpecials}`);
    console.log(`   roles (bot-s): ${JSON.stringify(r.roles)} | shell danger ${JSON.stringify(r.shellDanger)} | fuse danger ${JSON.stringify(r.fuseDanger)}`);
    for (const e of r.clampLog) console.log('   clamp ' + JSON.stringify(e));
    if (r.fbAt && r.fbAt.length) console.log('   carrierRetreatFallback at [x, y, z, level] ' + JSON.stringify(r.fbAt));
    for (const e of r.eps) console.log('   stuck ' + JSON.stringify(e));
    for (const e of r.carrierStuck.eps) console.log('   carrier-stuck ' + JSON.stringify(e));
    if (r.frameErr.n) console.log(`   FRAME ERRORS ${r.frameErr.n}: ${r.frameErr.msg}`);
    if (lightmap.length) console.log(`   (expected: ${lightmap.length} missing-lightmap warning(s) — the .bazookarp variant is baked by WP4b)`);
    console.log(`CONSOLE ${uniq.length} unique warning/error line(s)`); for (const l of uniq.slice(0, 20)) console.log('  ' + l);
    const ot = r.ot ? `${r.ot.end}/${r.ot.why}` : 'no';
    console.log(`RESULT karp ${MAP} win=${W(r.winner)} reason=${r.reason} ko=${r.koT ?? '-'} c=${r.counts.join('/')} pops=${r.pops.join('/')} carries=${r.carries.length} blasts=${r.blasts.own + r.blasts.enemy} ot=${ot}`);
    const J = { ...r, console: uniq.length, lightmapWarnings: lightmap.length, wallS: +wallS, diff: DIFF, human: HUMAN || null };
    console.log('RESULT_JSON ' + JSON.stringify({ map: MAP, winner: r.winner, reason: r.reason, koT: r.koT, counts: r.counts, pops: r.pops, firstPop: r.firstPop, carries: r.carries.length, plants: r.plants.length, blasts: r.blasts, resets: r.resets, ot: r.ot, stuckPct: r.stuckPct, clamped: r.clamped, crushes: r.crushes, console: uniq.length, frameErrors: r.frameErr.n }));
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(J, null, 1));
    app.quit();
  });
});
