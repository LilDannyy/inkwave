// Bluestone Junction's era engine — the HUD, the minimap and the thumbnail (tools/botlab/jobs/batch5/stages/bluestone/
// ENGINE.md §6 step 9; H14, H15, H19), on the stage itself:
//   MAP=bluestone PAGE=tools/botlab/tests/eras-hud.js tools/botlab/run.sh tools/botlab/page.cjs
// The era chip under the clock (the three names, the current one lit; a bar to the next jump; the small "TODAY in 20"
// from the pre-bell; the big countdown J − 10 … J − 1 with Tartar's phone); the callouts (the warning, the era's name
// at the jump, "NEW ROUTES OPEN" / "NEW AREAS!" at done); the minimap's base per era (a pixel hash of each), the
// outlines of what changes from the warning to done in the layout's neutral colours (white-gold dashes, warm-grey
// hatching: never a team ink's cyan or amber); the stage-select thumbnail (era 1 solid, later eras dashed).
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
  // the callouts as the HUD draws them (its own _callout: the DOM element is read back right after each call)
  const calls = [], H = __G.hud, co = H._callout.bind(H);
  H._callout = (text, sub, big) => { co(text, sub, big); const el = document.querySelector('.iw-call'); calls.push({ k: `${el?.querySelector('.iw-call__txt')?.textContent}|${el?.querySelector('.iw-call__sub')?.textContent || ''}|${!!el?.classList.contains('is-big')}`, t: +E.S.clock.t.toFixed(2) }); };
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
  const J2 = E.debugJump(3, { inS: 0.2 });
  tAt(J2.doneAt + 0.4);
  R('step 9: and at jump 2: "3000s" at the jump, "NEW AREAS!" at done', has(/^3000s\|TIME JUMP\|true$/) && has(/^NEW AREAS!\|3000s\|false$/) && lit() === '3000s', calls.slice(-4));

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
  // the thumbnail
  const svg = layoutThumbSVG(L.layout, 'day');
  const later = D.eraPieces(L.layout).filter((p) => !D.hasEra(p.mask, 1) && !p.hidden).length;
  const dashed = (svg.match(/stroke-dasharray="3 2"/g) || []).length, col = (svg.match(/fill="#f4e9c8" fill-opacity=".45" stroke="#a9a49a"/g) || []).length;
  R('step 9: the stage-select thumbnail draws era 1 as usual and every later piece dashed in the layout\'s neutral colours (white-gold fill, warm-grey dashes)', dashed === later && col === later && later > 50,
    { later, dashed, col, bytes: svg.length });
  H._callout = co;
  E.debugJump(1, { instant: true });
  return out;
})()
