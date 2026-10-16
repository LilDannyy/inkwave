// Bluestone Junction's era engine — the HUD, the minimap and the thumbnail (tools/botlab/jobs/batch5/stages/bluestone/
// ENGINE.md §6 step 9; H14, H15, H19), on the stage itself:
//   MAP=bluestone PAGE=tools/botlab/tests/eras-hud.js tools/botlab/run.sh tools/botlab/page.cjs
// The era chip under the clock (the three names, the current one lit; a bar to the next jump; the small "TODAY in 20"
// from the pre-bell; the big countdown J − 10 … J − 1 with Tartar's phone); the callouts (the warning, the era's name
// at the jump, "NEW ROUTES OPEN" / "NEW AREAS!" at done); the minimap's base per era (a pixel hash of each), the
// outlines of what changes from the warning to done in the layout's neutral colours (white-gold dashes, warm-grey
// hatching: never a team ink's cyan or amber), the done ping (the final review, issue 7: white-gold over what changed for
// 3 s, the opened floor outlined in the world through the 4 s pulse); the stage-select thumbnail (era 1 solid, later eras
// dashed).
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const { layoutThumbSVG } = await import('./src/world/mapThumb.js');
  const D = await import('./src/world/eras-data.js');
  const dbg = g.debug;
  dbg.freeze();
  for (const a of g.match.actors) { if (a.bot) a.bot.update = () => {}; if (a.intent) { a.intent.move?.set(0, 0, 0); a.intent.fire = false; } }
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const W = __G.eraWorld, E = g.match.eras, L = __G.level;
  const chip = document.querySelector('.er-chip');
  const lit = () => chip?.querySelector('.er-names b.is-on')?.textContent || null;
  const txt = (sel) => chip?.querySelector(sel)?.textContent || '';
  // the era's callouts as the module draws them (its own DOM, .er-call: read back right after each one), and any HUD
  // callout made meanwhile (an era callout must never go through the HUD's team-ink ribbon)
  const calls = [], hudCalls = [], H = __G.hud, co = H._callout.bind(H), say = E._say.bind(E);
  H._callout = (text, sub, big) => { hudCalls.push(text); co(text, sub, big); };
  const look = [];
  E._say = (text, sub, big) => {
    say(text, sub, big);
    const el = document.querySelector('.er-call');
    calls.push({ k: `${el?.querySelector('.er-call__txt')?.textContent}|${el?.querySelector('.er-call__sub')?.textContent || ''}|${!!el?.classList.contains('is-big')}`, t: +E.S.clock.t.toFixed(2) });
    if (el && look.length < 6) { const rb = getComputedStyle(el.querySelector('.er-call__ribbon')), tx = getComputedStyle(el.querySelector('.er-call__txt')); look.push({ text, anim: getComputedStyle(el).animationName, ribbon: rb.backgroundColor, ribbonImg: rb.backgroundImage.slice(0, 60), shadow: rb.boxShadow.slice(0, 40), color: tx.color, inHud: !!el.closest('.iw-hud') }); }
  };
  const tAt = (t) => step(Math.max(0, t - E.S.clock.t));

  // the chip per era
  const per = [];
  for (const e of [1, 2, 3]) { E.debugJump(e, { instant: true }); step(0.1); per.push({ e, lit: lit(), text: chip?.textContent }); }
  R('step 9: the era chip under the clock names the three eras and lights the one in force', !!chip && per.every((p) => p.lit === W.names[p.e - 1]) && W.names.every((n) => chip.textContent.includes(n)),
    { per, docked: chip?.classList.contains('is-docked'), parent: chip?.parentElement?.className });
  // a jump with its whole warning: pre-bell, countdown, callouts
  E.debugJump(1, { instant: true }); step(0.1);
  const bar0 = chip.querySelector('.er-bar i').style.width;
  const J = E.debugJump(2, { inS: 20.5 });
  step(0.8);
  const small = txt('.er-next'), countAtPre = txt('.er-count');
  const counts = [];
  for (let s = 10; s >= 1; s--) { tAt(J.at - s + 0.5); counts.push([s, txt('.er-count'), chip.classList.contains('is-warn')]); }
  tAt(J.at + 0.3);
  const atJump = { phase: E.phase, chipJump: chip.classList.contains('is-jump') };
  tAt(J.doneAt + 0.4);
  const afterDone = lit();
  R('step 9: from the pre-bell the chip says "TODAY in 20" in small type; in the warning the big countdown J − 10 … J − 1 (10, 9 … 1) with Tartar\'s phone ringing; the bar runs to the next jump',
    /^TODAY in (20|19)$/.test(small) && !countAtPre && counts.every(([s, c, w]) => c === String(s) && w) && atJump.chipJump && afterDone === 'TODAY' && bar0 !== '',
    { small, counts, atJump, afterDone, bar0 });
  const has = (re) => calls.some((c) => re.test(c.k));
  R('step 9: the callouts: "TIME JUMP" with "1880s → TODAY in 10" at the warning, Tartar\'s line at the pickup, the era\'s name ("TODAY", big) at the jump, "NEW ROUTES OPEN" at done',
    has(/^TIME JUMP\|1880s → TODAY in 10\|false$/) && has(/\|COMMANDER TARTAR\|/) && has(/^TODAY\|TIME JUMP\|true$/) && has(/^NEW ROUTES OPEN\|TODAY\|false$/), calls);
  // (layout boxes, vertical: the chip's rect; a callout centred on its container's top, its own height — the entry
  //  scale of the CSS animation left out; the band's move is a 0.18 s CSS transition, so measured after real time)
  const host = __G.hud.el, Hh = host.getBoundingClientRect().height;
  const boxOf = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.parentElement.getBoundingClientRect(); return [r.top - el.offsetHeight / 2, r.top + el.offsetHeight / 2]; };
  const chipBox = () => { const r = chip.getBoundingClientRect(); return [r.top, r.bottom]; };
  const apart = (a, b) => !a || !b || a[1] <= b[0] + 0.5 || b[1] <= a[0] + 0.5;
  const pct = (b) => b && +((((b[0] + b[1]) / 2 - host.getBoundingClientRect().top) / Hh) * 100).toFixed(1);
  const settle = () => new Promise((r) => setTimeout(r, 450));
  const J2 = E.debugJump(3, { inS: 0.2 });
  tAt(J2.at + 0.05); await settle();
  const bigBox = { era: boxOf('.er-call.is-big'), chip: chipBox(), text: document.querySelector('.er-call.is-big')?.textContent, top: document.querySelector('.er-calls')?.style.top };
  tAt(J2.doneAt + 0.4);
  R('step 9: and at jump 2: "3000s" at the jump, "NEW AREAS!" at done', has(/^3000s\|TIME JUMP\|true$/) && has(/^NEW AREAS!\|3000s\|false$/) && lit() === '3000s', calls.slice(-4));
  // the callouts' colours: white-gold on dark like the chip (LEAD-NOTES: never a team ink), and a gameplay callout on
  // screen when an era callout comes stays there
  {
    const hex = (c) => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(c || ''); return m ? [+m[1], +m[2], +m[3]] : null; };
    const team = [0, 1].map((t) => { const c = __G.teamColors?.[t]; return c ? [c.r, c.g, c.b].map((v) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055))) : null; });
    const far = (a, b) => !a || !b || Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 90;
    const near = (a, b) => a && Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 40;
    // text: white-gold #f4e9c8 (the big banner #fff6dc); band: dark (the big one a dark gradient over its dark colour)
    const okLook = look.length >= 4 && look.every((l) => l.inHud && l.anim === 'er-call' && (near(hex(l.color), [0xf4, 0xe9, 0xc8]) || near(hex(l.color), [0xff, 0xf6, 0xdc])))
      && look.every((l) => { const rb = hex(l.ribbon); return rb && rb[0] < 70 && rb[1] < 60 && rb[2] < 50 && team.every((t) => far(rb, t)) && team.every((t) => far(hex(l.color), t)); });
    // an era callout alone sits in the HUD's callout slot (27 %), or just under the chip where the chip reaches into it
    E.debugJump(1, { inS: 10.05 }); step(0.2); await settle();
    const alone = boxOf('.er-call'), cb = chipBox(), aloneOk = !!alone && apart(alone, cb) && (Math.abs(pct(alone) - 27) < 0.6 || alone[0] - cb[1] < Hh * 0.012 + 2);
    const bigOk = !!bigBox.era && apart(bigBox.era, bigBox.chip);
    tAt(E.next ? E.next.at + W.doneOff + 0.5 : E.S.clock.t);
    co('SPLATTED!', 'a gameplay callout', false);
    const game = document.querySelector('.iw-call');
    E.debugJump(2, { inS: 10.05 }); step(0.2); step(1 / 60); await settle();   // the warning: "TIME JUMP" (1880s → TODAY)
    const kept = !!game && game.isConnected && !!document.querySelector('.er-call');
    const both = { era: boxOf('.er-call'), game: boxOf('.iw-call'), chip: chipBox() };
    const bothOk = !!both.era && !!both.game && apart(both.era, both.game) && apart(both.era, both.chip) && both.era[0] >= both.game[1];
    R('step 9 (review fix 5): the era callouts are the module\'s own (white-gold text on a dark band, like the chip; not the HUD\'s team-ink ribbon, not routed through HUD._callout); alone one sits in the HUD\'s callout slot, clear of the chip (the big era banner too); with a gameplay callout on screen it leaves it there and moves below it, covering neither it nor the chip',
      okLook && kept && aloneOk && bigOk && bothOk && hudCalls.filter((t) => t !== 'SPLATTED!').length === 0,
      { look, team, kept, hudCalls, hostH: Math.round(Hh), big: { pct: pct(bigBox.era), era: bigBox.era?.map(Math.round), chip: bigBox.chip.map(Math.round), text: bigBox.text, top: bigBox.top }, alone: { pct: pct(alone), box: alone && alone.map(Math.round), chip: chipBox().map(Math.round) }, both: { eraPct: pct(both.era), gamePct: pct(both.game), era: both.era?.map(Math.round), game: both.game?.map(Math.round), chip: both.chip.map(Math.round) } });
    tAt(E.next ? E.next.at + W.doneOff + 0.5 : E.S.clock.t);
    // (review 2, issue 3) the band is laid out when a callout is said and when something it clears changes — a gameplay
    // callout coming or going (the HUD's callouts are watched), the chip changing state — never every frame: a whole
    // jump with its four era callouts lays it out a handful of times, and a gameplay callout arriving after an era
    // callout still pushes the band below it
    const C = E.chip, p0 = C.stats.places, s0 = calls.length;
    const Jp = E.debugJump(E.era === 3 ? 1 : E.era + 1, { inS: 10.05 });
    tAt(Jp.doneAt + 2.6);
    const places = C.stats.places - p0, said = calls.length - s0, frames = Math.round((Jp.doneAt + 2.6 - (Jp.at - 10.05)) * 60);
    for (let i = 0; i < 40 && document.querySelector('.iw-call'); i++) await new Promise((r) => setTimeout(r, 150));   // (the earlier gameplay callouts gone)
    E.debugJump(E.era === 3 ? 1 : E.era + 1, { inS: 10.05 }); step(0.2); await settle();
    const before = boxOf('.er-call'), gameBefore = !!document.querySelector('.iw-call');
    co('SPLATTED AGAIN!', 'a gameplay callout after the era\'s', false);
    await new Promise((r) => setTimeout(r, 0)); step(2 / 60); await settle();
    const after2 = { era: boxOf('.er-call'), game: boxOf('.iw-call') };
    R('step 9 (review 2, issue 3): the era band is laid out only when a callout is said or what it must clear changes (not every frame): a whole jump with its callouts lays it out a handful of times; a gameplay callout arriving after an era callout still pushes the band below it',
      said >= 3 && places <= 10 && !gameBefore && !!before && !!after2.era && !!after2.game && apart(after2.era, after2.game) && after2.era[0] >= after2.game[1] - 0.5 && after2.era[0] > before[0] + 2,
      { frames, said, places, gameBefore, before: before && before.map(Math.round), after: { era: after2.era?.map(Math.round), game: after2.game?.map(Math.round) } });
    tAt(E.next ? E.next.at + W.doneOff + 0.5 : E.S.clock.t);
    // the HUD's banners too: in a 3:00 Turf War "1 minute left!" comes at the very moment jump 2 starts (the "3000s"
    // banner): the era band moves below it
    for (let i = 0; i < 40 && document.querySelector('.er-call, .iw-call'); i++) await new Promise((r) => setTimeout(r, 150));
    __G.hud.banner('one_minute');
    E._say('3000s', 'TIME JUMP', true);
    await settle(); step(2 / 60); await settle();
    const bnEl = document.querySelector('.iw-banners .iw-bn'), bl = bnEl && bnEl.parentElement.getBoundingClientRect();
    const bn = bnEl ? [bl.top + bnEl.offsetTop - bnEl.offsetHeight / 2, bl.top + bnEl.offsetTop + bnEl.offsetHeight / 2] : null, eb = boxOf('.er-call');
    R('step 9 (HUD): the HUD\'s banners too — "1 minute left!" and the 3000s banner together (a 3:00 Turf War\'s jump 2): the era band sits below the HUD\'s banner, covering neither it nor the chip',
      !!bn && !!eb && apart(eb, bn) && eb[0] >= bn[1] - 0.5 && apart(eb, chipBox()), { banner: bn && bn.map(Math.round), era: eb && eb.map(Math.round), chip: chipBox().map(Math.round), text: bnEl?.textContent });
  }

  // the minimap: one base per era (pixel hash), outlines during the warning in the layout's colours
  const mm = g.minimap;
  const hash = (cv) => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 2166136261; for (let i = 0; i < d.length; i += 16) { h ^= d[i] + (d[i + 1] << 8) + (d[i + 2] << 16); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };
  const bases = [];
  for (const e of [1, 2, 3]) { E.debugJump(e, { instant: true }); step(0.1); bases.push({ e, key: mm.baseKey, hash: hash(mm.base) }); }
  R('step 9: the minimap\'s base per era (built once each, swapped at done): three different rasters', bases.every((b, i) => b.key === i + 1) && new Set(bases.map((b) => b.hash)).size === 3, bases);
  // outlines: draw the live layer during the warning and read its pixels at the outlines
  E.debugJump(2, { instant: true }); step(0.1);
  const J3 = E.debugJump(3, { inS: 9.5 });
  step(0.3);
  const ol = E.outlines();
  const c = document.createElement('canvas'); c.width = mm.w; c.height = mm.h;
  const ctx = c.getContext('2d');
  E.drawMap(ctx, mm, null, mm.s, null, 0);
  const img = ctx.getImageData(0, 0, c.width, c.height).data;
  const A = W.uniforms.uEraColA.value, V = W.uniforms.uEraColV.value;
  let nA = 0, nV = 0, nCyan = 0, nAmber = 0, n = 0;
  for (let i = 0; i < img.length; i += 4) {
    if (img[i + 3] < 30) continue;
    n++;
    const r = img[i] / 255, gg = img[i + 1] / 255, b = img[i + 2] / 255;   // (getImageData: straight, not premultiplied)
    const near = (C) => Math.abs(r - C.r) + Math.abs(gg - C.g) + Math.abs(b - C.b) < 0.18;
    // (canvas colours are sRGB; the uniforms' Color objects hold linear: compare with the hex the layout gave)
    if (near({ r: 0xf4 / 255, g: 0xe9 / 255, b: 0xc8 / 255 })) nA++; else if (near({ r: 0xa9 / 255, g: 0xa4 / 255, b: 0x9a / 255 })) nV++;
    if (b > 0.7 && gg > 0.6 && r < 0.4) nCyan++;
    if (r > 0.85 && gg > 0.45 && gg < 0.75 && b < 0.3) nAmber++;
  }
  const appearN = ol.filter((o) => o.appear).length, vanishN = ol.length - appearN;
  tAt(J3.doneAt + 0.5);
  const olAfter = E.outlines().length;
  R('step 9: from the warning to done the minimap outlines what changes — appearing pieces in white-gold dashes, vanishing ones in warm-grey hatching (never cyan or amber); none after done',
    appearN > 50 && vanishN > 5 && nA > 300 && nV > 50 && nCyan === 0 && nAmber === 0 && olAfter === 0, { appearN, vanishN, painted: n, whiteGold: nA, warmGrey: nV, cyan: nCyan, amber: nAmber, olAfter, colors: L.layout.eras.colors });
  // the done ping (DESIGN §3.4: "every new opening and piece pulses white-gold for 4 s and pings on the minimap"; the final
  // review, issue 7): for 3 s after done the live layer fills what changed in white-gold (the pieces that came, the
  // footprints that opened) and two rings run out of each changed group; nothing by done + 3. In the world, the floor
  // under each piece that went is outlined in white-gold for the 4 s pulse, then gone
  const drawCount = () => {
    const c2 = document.createElement('canvas'); c2.width = mm.w; c2.height = mm.h;
    const x2 = c2.getContext('2d'); E.drawMap(x2, mm, null, mm.s, null, E.tNow);
    const d2 = x2.getImageData(0, 0, c2.width, c2.height).data; let wg = 0, any = 0;
    for (let i = 0; i < d2.length; i += 4) { if (d2[i + 3] < 30) continue; any++; if (Math.abs(d2[i] - 0xf4) + Math.abs(d2[i + 1] - 0xe9) + Math.abs(d2[i + 2] - 0xc8) < 46) wg++; }
    return { any, whiteGold: wg };
  };
  const P0 = E.pings(), ping0 = drawCount(), FX = W.fx, fx0 = { lines: !!FX.opened?.[0]?.visible, fill: !!FX.opened?.[1]?.visible, rects: FX.stats.opened || 0, a: +(FX.opened?.[0]?.material.uniforms.uA.value || 0).toFixed(2) };
  tAt(J3.doneAt + 3.2);
  const P1 = E.pings(), ping1 = drawCount();
  tAt(J3.doneAt + 4.2);
  const fx1 = { opened: !!FX.opened };
  R('step 9 (final review, issue 7): at done the minimap pings what changed — every piece that came and every footprint that opened in white-gold, rings out of each changed group — for 3 s, then nothing; in the world the floor under each piece that went is outlined in white-gold through the 4 s pulse, then gone',
    !!P0 && P0.outlines.length === ol.length && P0.groups.length > 20 && ping0.whiteGold > 600 && !P1 && ping1.any === 0 && fx0.lines && fx0.fill && fx0.rects >= 4 && fx0.a > 0.3 && !fx1.opened,
    { at05: { pings: P0 && { outlines: P0.outlines.length, groups: P0.groups.length }, pixels: ping0, fx: fx0 }, at32: { pings: !!P1, pixels: ping1 }, at42: fx1 });
  // the thumbnail
  const svg = layoutThumbSVG(L.layout, 'day');
  const later = D.eraPieces(L.layout).filter((p) => !D.hasEra(p.mask, 1) && !p.hidden).length;
  const dashed = (svg.match(/stroke-dasharray="3 2"/g) || []).length, col = (svg.match(/fill="#f4e9c8" fill-opacity=".45" stroke="#a9a49a"/g) || []).length;
  R('step 9: the stage-select thumbnail draws era 1 as usual and every later piece dashed in the layout\'s neutral colours (white-gold fill, warm-grey dashes)', dashed === later && col === later && later > 50,
    { later, dashed, col, bytes: svg.length });
  H._callout = co; E._say = say;
  E.debugJump(1, { instant: true });
  return out;
})()
