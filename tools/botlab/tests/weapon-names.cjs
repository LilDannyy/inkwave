// b5-tuning: every weapon's whole name readable wherever a weapon is picked or shown as picked (2026-10-04, the user:
// "make sure the full weapon name can be seen in the weapon select") — at 960×600, 1280×720 and 1920×1080, on:
//   main      the main menu's CURRENT LOADOUT card
//   setup     the match setup's WEAPON chip (PLAY › mode › setup)
//   loadout   LOADOUT: the weapon cards, the detail panel's name, the "vs <equipped>" badge — and the panel itself
//             inside the screen (it ran off the bottom at 16:9)
//   hub       ONLINE: the hub's WEAPON chip
//   lobby     a room's WEAPON chip, and its CHOOSE YOUR WEAPON drawer (the cards + the detail's name)
//   pause     Practice's pause panel (YOUR LOADOUT)
//   icons     LOADOUT's cards and the lobby drawer's: no icon drawn into its card's (two-line) name, at rest or focused
//             (__iconCheck: the shapes' outlines sampled to the screen), the name painted above the icon (__iconOrder:
//             the icon pushed onto it, elementsFromPoint), the drawer / the LOADOUT panel whole on screen with every card focused
// A name passes when its text is the whole name, it isn't wider / taller than its box (no ellipsis, no line clamp:
// scrollWidth ≤ clientWidth, scrollHeight ≤ clientHeight), nothing round it cuts it (every overflow-clipping ancestor
// holds it, and the window does) and its type is at least 9 px.
//   CLIENTS=1 Q0='netmock=1&mockauto=0' NET=tools/botlab/tests/weapon-names.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   NET_ARGS='shots' also saves pictures (OUT=tools/botlab/jobs/batch5/tuning/out): the loadout with Twinfire Pistols,
//   the lobby drawer and the setup chip, at each size; NET_ARGS='sizes=1280' / 'only=loadout,lobby' for a part
module.exports = async ({ clients: [A], R, wait, say, out, args }) => {
  const J = async (code) => JSON.parse(await A.js(`JSON.stringify(${code})`));
  const SIZES = [[960, 600], [1280, 720], [1920, 1080]].filter(([w]) => !/sizes=/.test(args) || new RegExp(`sizes=[\\d,]*\\b${w}\\b`).test(args));
  const ONLY = (/only=([\w,]+)/.exec(args || '') || [])[1];
  const want = (k) => !ONLY || ONLY.split(',').includes(k);
  const SHOTS = /shots/.test(args);
  const order = await A.js(`(async () => __inkwave.api.weaponOrder || (await import('./src/config.js')).WEAPON_ORDER)()`);
  const names = await J(`Object.fromEntries(Object.entries(__inkwave.api.weapons).map(([k, v]) => [k, v.name]))`);
  const ids = order.filter((id) => names[id]);
  const longest = [...ids].sort((a, b) => names[b].length - names[a].length)[0];
  say('weapons', ids.length, 'longest', names[longest]);
  // the page-side checker: every element matching sel (within root) against the names it should show
  await A.js(`window.__nameCheck = (sel, want) => {
    const out = [], els = [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null);
    for (const el of els) {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el), txt = el.textContent.trim(), bad = [];
      if (want && !want.includes(txt)) bad.push('text "' + txt + '"' + (want.length === 1 ? ' not "' + want[0] + '"' : ''));
      if (el.scrollWidth > el.clientWidth + 1) bad.push('width ' + el.scrollWidth + '>' + el.clientWidth);
      if (el.scrollHeight > el.clientHeight + 2) bad.push('height ' + el.scrollHeight + '>' + el.clientHeight);
      if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) bad.push('off-screen ' + [r.left, r.top, r.right, r.bottom].map(Math.round));
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ps = getComputedStyle(p);
        if (ps.overflowX === 'visible' && ps.overflowY === 'visible') continue;
        const q = p.getBoundingClientRect();
        if (r.left < q.left - 2 || r.right > q.right + 2 || r.top < q.top - 2 || r.bottom > q.bottom + 2) { bad.push('cut by .' + String(p.className).split(' ')[0]); break; }
      }
      const fs = parseFloat(cs.fontSize);
      if (fs < 9) bad.push('font ' + fs + 'px');
      out.push({ txt, fs: Math.round(fs * 10) / 10, lines: Math.round(el.clientHeight / (parseFloat(cs.lineHeight) || fs * 1.1)), bad });
    }
    return out;
  }; 1`);
  // the weapon cards' icons against their names (LOADOUT's grid, the lobby drawer): where the icon's DRAWING ends —
  // every painted shape's outline sampled along its length and taken to the screen through getScreenCTM (so the focused
  // card's tilt and scale and the icon's own rotate / scale count), plus half its stroke, no lower than the svg's own
  // clip box — against the top of the name's first line of text. ink > top + 0.5 px = the icon is drawn into the letters.
  await A.js(`window.__iconCheck = (sel) => [...document.querySelectorAll(sel)].filter((c) => c.offsetParent !== null).map((c) => {
    const s = c.querySelector('.iw-wcard__icon svg'), n = c.querySelector('.iw-wcard__name');
    let ink = -Infinity, rectInk = -Infinity;
    for (const e of s.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line')) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || (cs.fill === 'none' && cs.stroke === 'none') || !e.getTotalLength) continue;
      const M = e.getScreenCTM(), L = e.getTotalLength(); if (!M || !(L > 0)) continue;
      const sw = cs.stroke !== 'none' ? (parseFloat(cs.strokeWidth) || 0) / 2 * Math.sqrt(Math.abs(M.a * M.d - M.b * M.c)) : 0;
      const N = Math.min(400, Math.max(32, Math.ceil(L)));
      for (let i = 0; i <= N; i++) { const p = e.getPointAtLength(L * i / N); ink = Math.max(ink, M.b * p.x + M.d * p.y + M.f + sw); }
      rectInk = Math.max(rectInk, e.getBoundingClientRect().bottom);
    }
    const sv = s.getBoundingClientRect(); ink = Math.min(ink, sv.bottom);
    const rg = document.createRange(); rg.selectNodeContents(n); const lines = [...rg.getClientRects()].filter((r) => r.width > 0);
    const top = lines.length ? Math.min(...lines.map((r) => r.top)) : n.getBoundingClientRect().top;
    const r1 = (x) => Math.round(x * 10) / 10;
    return { name: n.textContent.trim(), focus: c.classList.contains('is-focus'), over: r1(ink - top), ink: r1(ink), rectInk: r1(rectInk), top: r1(top), svg: r1(sv.height), lines: lines.length };
  });
  // the name paints above its icon: each card's icon pushed down (translate) until its drawing's bottom reaches the
  // name's first line's bottom, then the name's lines probed on a grid (elementsFromPoint) — wherever a shape of the
  // icon is under the point, the topmost thing there must be the name. probes: how many points the drawing really
  // covered (the check has to have hit something); above: how many of those had the name on top.
  window.__iconOrder = (sel) => [...document.querySelectorAll(sel)].filter((c) => c.offsetParent !== null).map((c) => {
    const ic = c.querySelector('.iw-wcard__icon'), s = ic.querySelector('svg'), n = c.querySelector('.iw-wcard__name');
    const rg = document.createRange(); rg.selectNodeContents(n); const lines = [...rg.getClientRects()].filter((r) => r.width > 0);
    const first = lines.reduce((a, r) => (r.top < a.top ? r : a), lines[0]);
    const before = s.getBoundingClientRect().bottom;
    let inkB = -Infinity; for (const e of s.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line')) { const r = e.getBoundingClientRect(); if (r.width || r.height) inkB = Math.max(inkB, r.bottom); }
    const push = Math.max(0, first.bottom - Math.min(inkB, before));
    const keep = ic.style.translate; ic.style.translate = '0 ' + push + 'px';
    let probes = 0, above = 0;
    for (const r of lines) for (let j = 1; j <= 3; j++) for (let i = 1; i <= 15; i++) {
      const x = r.left + r.width * i / 16, y = r.top + r.height * j / 4, st = document.elementsFromPoint(x, y);
      if (!st.some((e) => e !== s && s.contains(e))) continue;
      probes++; if (st[0] === n || n.contains(st[0])) above++;
    }
    ic.style.translate = keep;
    return { name: n.textContent.trim(), push: Math.round(push * 10) / 10, probes, above };
  }); 1`);
  const fails = [], kfails = [];
  let sink = fails;   // (the sub / special names go to kfails: reported apart)
  const check = async (where, sel, want, need = 1) => {
    await settled();
    const res = await J(`__nameCheck(${JSON.stringify(sel)}, ${JSON.stringify(want)})`);
    const bad = res.filter((x) => x.bad.length);
    if (res.length < need) sink.push({ where, sel, missing: `${res.length} of ${need}` });
    for (const b of bad) sink.push({ where, ...b });
    return res;
  };
  const kits = await J(`(() => { const a = __inkwave.api, nm = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.name]));
    const own = Object.fromEntries(Object.entries(a.weapons).map(([k, w]) => [k, { sub: (a.subs[w.sub] || a.subs.bomb).name, special: (a.specials[w.special] || a.specials.slam).name }]));
    return { subOrder: a.subOrder.filter((id) => a.subs[id]), specialOrder: a.specialOrder.filter((id) => a.specials[id]), subs: nm(a.subs), specials: nm(a.specials), own }; })()`);
  const kitFails = {};
  const key = (code) => A.js(`(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${code}', bubbles: true })); return 1; })()`);
  // (every finite animation on the page done: the screens slide their panels in, staggered, for up to ~1 s; looped
  // decorations — drips, blobs — never end and don't count)
  const settled = () => A.until(`document.getAnimations().every((a) => a.playState !== 'running' || !Number.isFinite(a.effect && a.effect.getComputedTiming().endTime))`, 5000, 100).catch(() => say('(animations still running after 5 s)'));
  const show = async (name, ms = 1100) => { await A.js(`__inkwave.menus.show(${JSON.stringify(name)}, { force: true }); 1`); await A.until(`__inkwave.menus.current === ${JSON.stringify(name)}`, 8000); await wait(Math.min(ms, 500)); await settled(); };
  const equip = (id) => A.js(`__inkwave.api.setLoadout({ weapon: ${JSON.stringify(id)} }); 1`);
  const snap = async (file) => { await wait(900); await A.shot(file, { w: 1920, q: 84 }); await wait(500); return A.shot(file, { w: 1920, q: 84 }); };
  const startW = await A.js(`__inkwave.api.getLoadout().weapon`);
  await A.js(`__inkwave.menus.setInputMode && __inkwave.menus.setInputMode('kbm'); 1`);
  const all = ids.map((id) => names[id]);
  const per = {};
  // every card of a grid: measured with the screen's own focus, then with each card focused in turn (its worst at rest
  // and focused kept apart), then the paint-order probe
  const iconRes = {};
  const iconPass = async (where, root) => {
    const sel = JSON.stringify(`${root} .iw-wcard`), worst = {};
    // (the panel the grid sits in, on screen with every card focused: the detail below the grid changes with it)
    const panel = JSON.stringify(root === '.iw-ldr' ? '.iw-ldr__card' : '.iw-loadout .iw-wd'), box = { top: 1e9, bottom: -1e9, vh: 0 };
    const boxOf = async () => { const b = await J(`(() => { const r = document.querySelector(${panel}).getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; })()`); box.top = Math.min(box.top, b.top); box.bottom = Math.max(box.bottom, b.bottom); box.vh = b.vh; };
    const take = (res) => { for (const x of res) { const o = worst[x.name] || (worst[x.name] = { rest: -99, focus: -99, lines: x.lines, svg: x.svg }); const k = x.focus ? 'focus' : 'rest'; o[k] = Math.max(o[k], x.over); } };
    await settled(); take(await J(`__iconCheck(${sel})`));
    const n = await A.js(`document.querySelectorAll(${sel}).length`);
    for (let i = 0; i < n; i++) {
      await A.js(`(() => { __inkwave.menus._setFocus(document.querySelectorAll(${sel})[${i}], { snap: true }); return 1; })()`);
      await wait(120); await settled();
      take(await J(`__iconCheck(${sel})`)); await boxOf();
    }
    const order = await J(`__iconOrder(${sel})`);
    const bad = Object.entries(worst).filter(([, o]) => o.rest > 0.5 || o.focus > 0.5).map(([k, o]) => `${k}: ${o.rest > 0.5 ? '+' + o.rest + ' px' : 'clear'} at rest, ${o.focus > 0.5 ? '+' + o.focus + ' px' : 'clear'} focused`);
    const under = order.filter((x) => !x.probes || x.above < x.probes).map((x) => `${x.name}: the name on top at ${x.above} of ${x.probes} points`);
    if (box.top < 0 || box.bottom > box.vh) bad.push(`the panel runs off the screen with some card focused (${box.top}…${box.bottom} of ${box.vh})`);
    const top = Math.max(...Object.values(worst).map((o) => Math.max(o.rest, o.focus)));
    say(`== ${where}: ${n} cards, the deepest icon ${top > 0 ? '+' + top + ' px INTO' : Math.abs(top) + ' px clear of'} its name${bad.length ? ' — ' + bad.join(' | ') : ''}; the panel ${box.top}…${box.bottom} of ${box.vh} px; paint order ${under.length ? 'WRONG: ' + under.join(' | ') : `the name on top at every probed point (${order.reduce((s, x) => s + x.probes, 0)})`}`);
    return { n, bad, under, worst, order, box };
  };
  for (const [w, h] of SIZES) {
    A.win.setContentSize(w, h); await wait(900);
    const S = `${w}×${h}`, f0 = fails.length;
    // ---- the weapon cards' icons clear of their (two-line) names: LOADOUT and the lobby's CHOOSE YOUR WEAPON drawer
    if (want('icons')) {
      // (the longest sub and special picked: their chips in the detail at their widest — the drawer at its tallest)
      const lg = (o, ord) => ord.reduce((b, id) => (o[id].length > o[b].length ? id : b), ord[0]);
      const kitL = { sub: lg(kits.subs, kits.subOrder), special: lg(kits.specials, kits.specialOrder) };
      await A.js(`__inkwave.api.setLoadout(${JSON.stringify(kitL)}); 1`);
      await equip(longest); await show('loadout', 1300);
      const lo = await iconPass(`${S} LOADOUT`, '.iw-loadout');
      await show('online', 600);
      await A.until(`__G.net && __G.net.isMock`, 10000);
      if (!(await A.js(`!!(__G.net.lobby && __G.net.lobby.code)`))) await A.js(`__G.net.create('Mocky')`);
      await show('lobby', 1500);
      await A.js(`__G.net.setMe({ weapon: ${JSON.stringify(longest)}, sub: ${JSON.stringify(kitL.sub)}, special: ${JSON.stringify(kitL.special)} }); 1`); await wait(400);
      await A.js(`(() => { __inkwave.menus._setFocus(document.querySelector('.iw-lob__wchip'), { snap: true }); return 1; })()`); await wait(200);
      await key('Enter');
      await A.until(`!!document.querySelector('.iw-ldr .iw-wcard')`, 5000); await wait(900);
      const dr = await iconPass(`${S} lobby drawer`, '.iw-ldr');
      await key('Escape'); await wait(600);
      await A.js(`__inkwave.api.setLoadout({ sub: null, special: null }); __G.net.setMe({ sub: null, special: null }); 1`);
      iconRes[S] = { lo, dr };
    }
    // ---- main menu card · setup chip (each weapon equipped in turn)
    for (const id of ids) {
      await equip(id);
      if (want('main')) { await show('main', 900); await check(`${S} main`, '.iw-kitcard__name', [names[id]]); }
      if (want('setup')) { await show('setup', 900); await check(`${S} setup`, '.iw-ss__foot .iw-wchip:not(.iw-lchip) .iw-wchip__text b', [names[id]]); }
    }
    // ---- LOADOUT: the cards, the detail name (each focused), the vs badge (each equipped), the panel on screen
    if (want('loadout')) {
      for (const id of ids) {
        await equip(id); await show('loadout', 1300);
        if (id === ids[0]) {
          await check(`${S} loadout cards`, '.iw-loadout .iw-wcard__name', all, ids.length);
          await check(`${S} loadout stat labels`, '.iw-loadout .iw-stat__label', null, 5);   // (the panel's own labels: INK COVERAGE)
          // every weapon focused in turn: the detail panel's name
          for (const f of ids) { await A.js(`(() => { const c = [...document.querySelectorAll('.iw-loadout .iw-wcard')].find((e) => e._wid === ${JSON.stringify(f)}); __inkwave.menus._setFocus(c, { snap: true }); return 1; })()`); await wait(450); await check(`${S} loadout detail`, '.iw-loadout .iw-wd__name', [names[f]]); }
        }
        // the vs badge names the equipped weapon while another is focused
        await A.js(`(() => { const c = [...document.querySelectorAll('.iw-loadout .iw-wcard')].find((e) => e._wid !== ${JSON.stringify(id)}); __inkwave.menus._setFocus(c, { snap: true }); return 1; })()`); await wait(450);
        await check(`${S} loadout vs`, '.iw-loadout .iw-wd__cmp b', [names[id]]);
        const pan = await J(`(() => { const p = document.querySelector('.iw-loadout .iw-wd'), r = p.getBoundingClientRect(), k = [...p.querySelectorAll('.iw-kit')].map((e) => Math.round(e.getBoundingClientRect().bottom)); return { bottom: Math.round(r.bottom), kits: k, vh: innerHeight }; })()`);
        if (pan.bottom > pan.vh + 1 || pan.kits.some((b) => b > pan.vh + 1)) fails.push({ where: `${S} loadout panel (${names[id]} equipped)`, bad: ['runs off the bottom'], ...pan });
        if (SHOTS && id === longest) {
          await A.js(`(() => { const c = [...document.querySelectorAll('.iw-loadout .iw-wcard')].find((e) => e._wid === ${JSON.stringify(id)}); __inkwave.menus._setFocus(c, { snap: true }); return 1; })()`);
          say(await snap(`${out}/loadout-${w}x${h}.jpg`));
        }
      }
    }
    // ---- ONLINE hub chip
    if (want('hub')) {
      for (const id of ids) { await equip(id); await show('online', 900); await check(`${S} hub`, '.iw-hub__chips .iw-wchip:not(.iw-lchip) .iw-wchip__text b', [names[id]]); }
    }
    // ---- room lobby: the WEAPON chip, the drawer
    if (want('lobby')) {
      await show('online', 600);
      await A.until(`__G.net && __G.net.isMock`, 10000);
      if (!(await A.js(`!!(__G.net.lobby && __G.net.lobby.code)`))) await A.js(`__G.net.create('Mocky')`);
      await show('lobby', 1500);
      for (const id of ids) {
        await equip(id); await A.js(`__G.net.setMe({ weapon: ${JSON.stringify(id)} }); 1`); await wait(700);
        await check(`${S} lobby chip`, '.iw-lob__wchip .iw-wchip__text b', [names[id]]);
      }
      await equip(longest); await A.js(`__G.net.setMe({ weapon: ${JSON.stringify(longest)} }); 1`); await wait(500);
      await A.js(`(() => { __inkwave.menus._setFocus(document.querySelector('.iw-lob__wchip'), { snap: true }); return 1; })()`); await wait(200);
      await key('Enter');
      await A.until(`!!document.querySelector('.iw-ldr .iw-wcard')`, 5000);
      await wait(900);
      await check(`${S} lobby drawer cards`, '.iw-ldr .iw-wcard__name', all, ids.length);
      await check(`${S} lobby drawer stat labels`, '.iw-ldr .iw-stat__label', null, 5);
      for (const f of ids) { await A.js(`(() => { const c = [...document.querySelectorAll('.iw-ldr .iw-wcard')].find((e) => e._wid === ${JSON.stringify(f)}); __inkwave.menus._setFocus(c, { snap: true }); return 1; })()`); await wait(350); await check(`${S} lobby drawer detail`, '.iw-ldr .iw-wd__name', [names[f]]); }
      if (SHOTS) { await A.js(`(() => { const c = [...document.querySelectorAll('.iw-ldr .iw-wcard')].find((e) => e._wid === ${JSON.stringify(longest)}); __inkwave.menus._setFocus(c, { snap: true }); return 1; })()`); say(await snap(`${out}/lobby-drawer-${w}x${h}.jpg`)); }
      await key('Escape'); await wait(600);
    }
    if (SHOTS && want('setup')) { await equip(longest); await show('setup', 1300); say(await snap(`${out}/setup-${w}x${h}.jpg`)); }
    per[S] = fails.length - f0;
    // ---- the sub and special weapons' names in the same pickers (reported apart: kitFails), the longest main equipped:
    //   LOADOUT's SUB / SPECIAL chips (each one stepped through with →), the kit picker (every tile, every detail name,
    //   the "FOLLOWS YOUR <weapon>" kicker), the lobby's SUB / SPECIAL chips
    if (want('kits')) {
      sink = kfails; const k0 = kfails.length;
      for (const kind of ['sub', 'special']) {
        const ord = kind === 'sub' ? kits.subOrder : kits.specialOrder, nm = kind === 'sub' ? kits.subs : kits.specials;
        const allK = ord.map((id) => nm[id]);
        await equip(longest);
        await A.js(`__inkwave.api.setLoadout({ ${kind}: ${JSON.stringify(ord[0])} }); 1`);
        await show('loadout', 1300);
        const chip = `[...document.querySelectorAll('.iw-loadout .iw-kit--pick')][${kind === 'sub' ? 0 : 1}]`;
        const nameSel = `.iw-loadout .iw-kit--pick ${kind === 'sub' ? '> div > b' : '.iw-kit__row > b'}`;
        const seen = new Set();
        for (let i = 0; i < ord.length; i++) {
          await A.js(`(() => { __inkwave.menus._setFocus(${chip}, { snap: true }); return 1; })()`);
          if (i) { await key('ArrowRight'); await wait(250); }
          const r = await check(`${S} loadout ${kind} chip`, nameSel, allK);
          for (const x of r) seen.add(x.txt);
        }
        if (allK.some((n) => !seen.has(n))) sink.push({ where: `${S} loadout ${kind} chip`, missing: 'never shown: ' + allK.filter((n) => !seen.has(n)).join(', ') });
        await A.js(`__inkwave.api.setLoadout({ ${kind}: null }); 1`);
        // the picker (Enter on the chip): with the longest weapon name (the "FOLLOWS YOUR …" kicker), then with the
        // weapon whose own sub / special has the longest name (the Weapon's Own tile's caption)
        const ownLong = ids.reduce((b, id) => ((kits.own[id][kind] || '').length > (kits.own[b][kind] || '').length ? id : b), ids[0]);
        for (const wid of [...new Set([longest, ownLong])]) {
          await equip(wid); await show('loadout', 1100);
          await A.js(`(() => { __inkwave.menus._setFocus(${chip}, { snap: true }); return 1; })()`); await key('Enter');
          await A.until(`!!document.querySelector('.iw-kpick .iw-ktile')`, 5000); await wait(500);
          await check(`${S} ${kind} picker tiles`, '.iw-kpick .iw-ktile__name', null, ord.length);
          await check(`${S} ${kind} picker own (${names[wid]})`, '.iw-kpick .iw-ktile__sub', [kits.own[wid][kind]], 1);
          const nT = wid === longest ? await A.js(`document.querySelectorAll('.iw-kpick .iw-ktile').length`) : 1;
          for (let i = 0; i < nT; i++) {
            await A.js(`(() => { __inkwave.menus._setFocus(document.querySelectorAll('.iw-kpick .iw-ktile')[${i}], { snap: true }); return 1; })()`); await wait(250);
            await check(`${S} ${kind} picker detail`, '.iw-kpick .iw-kpick__dname', null);
            await check(`${S} ${kind} picker kicker`, '.iw-kpick .iw-kpick__kick', null);
          }
          await key('Escape'); await wait(500);
        }
      }
      // the lobby's SUB / SPECIAL chips (they show your saved pick: api.setLoadout, as the picker does)
      await equip(longest);
      await show('online', 600);
      await A.until(`__G.net && __G.net.isMock`, 10000);
      if (!(await A.js(`!!(__G.net.lobby && __G.net.lobby.code)`))) await A.js(`__G.net.create('Mocky')`);
      await show('lobby', 1200);
      for (const kind of ['sub', 'special']) {
        const ord = kind === 'sub' ? kits.subOrder : kits.specialOrder, nm = kind === 'sub' ? kits.subs : kits.specials;
        for (const id of ord) {
          await A.js(`__inkwave.api.setLoadout({ ${kind}: ${JSON.stringify(id)} }); __G.net.setMe({ ${kind}: ${JSON.stringify(id)} }); 1`); await wait(450);
          await check(`${S} lobby ${kind} chip`, `.iw-lkit--${kind} .iw-lkit__name`, [nm[id]]);
          // (and no line of it under the chip's SUB / SPECIAL tag, which sticks into the chip's edge: the tag may graze a
          // line's box — its empty ascender room — but not cover more than a quarter of its height)
          const under = await J(`(() => { const c = document.querySelector('.iw-lkit--${kind}'), n = c.querySelector('.iw-lkit__name'), t = c.querySelector('.iw-lkit__lbl');
            const rg = document.createRange(); rg.selectNodeContents(n); const q = t.getBoundingClientRect();
            return [...rg.getClientRects()].some((l) => l.right > q.left + 2 && l.left < q.right - 2 && Math.min(l.bottom, q.bottom) - Math.max(l.top, q.top) > 0.25 * l.height); })()`);
          if (under) sink.push({ where: `${S} lobby ${kind} chip`, txt: nm[id], bad: ['under the tag'] });
        }
        await A.js(`__inkwave.api.setLoadout({ ${kind}: null }); __G.net.setMe({ ${kind}: null }); 1`);
      }
      if (SHOTS) {   // the lobby with the longest sub and special picked
        const lg = (o, ord) => ord.reduce((b, id) => (o[id].length > o[b].length ? id : b), ord[0]);
        const ls = lg(kits.subs, kits.subOrder), lp = lg(kits.specials, kits.specialOrder);
        await A.js(`__inkwave.api.setLoadout({ sub: ${JSON.stringify(ls)}, special: ${JSON.stringify(lp)} }); __G.net.setMe({ sub: ${JSON.stringify(ls)}, special: ${JSON.stringify(lp)} }); 1`);
        say(await snap(`${out}/lobby-kits-${w}x${h}.jpg`));
        await A.js(`__inkwave.api.setLoadout({ sub: null, special: null }); __G.net.setMe({ sub: null, special: null }); 1`);
      }
      kitFails[S] = kfails.length - k0; sink = fails;
    }
  }
  // ---- Practice's pause panel (one practice, each size, each weapon)
  if (want('pause')) {
    await A.js(`__inkwave.menus.show(null); __inkwave.api.startPractice({ mapId: 'tidewater' }); 1`);
    await A.until(`__G.match && __G.match.practice && __G.match.state === 'playing'`, 90000, 300);
    for (const [w, h] of SIZES) {
      A.win.setContentSize(w, h); await wait(700);
      const f0 = fails.length;
      for (const id of ids) {
        await equip(id);
        await A.js(`__inkwave.menus.show('pause', { force: true }); 1`); await wait(900);
        await check(`${w}×${h} practice pause`, '.iw-ppractice .iw-kit b', null, 1).then(async (res) => {
          const first = res[0]; if (first && first.txt !== names[id]) fails.push({ where: `${w}×${h} practice pause`, txt: first.txt, bad: ['not the equipped weapon'] });
        });
      }
      per[`${w}×${h}`] = (per[`${w}×${h}`] || 0) + fails.length - f0;
    }
    await A.js(`__inkwave.menus.show(null); 1`);
  }
  await equip(startW);
  // (grouped: one line per screen and fault, with the names it hit)
  const group = (L) => { const o = {}; for (const f of L) { const k = f.where + ' · ' + (f.bad ? f.bad.map((b) => b.replace(/[\d,]+/g, '#')).join(' + ') : 'missing ' + f.missing); (o[k] || (o[k] = new Set())).add(f.txt || ''); } return Object.entries(o).map(([k, v]) => k + ' [' + [...v].join(', ') + ']'); };
  for (const [w, h] of SIZES) R(`${w}×${h}: every weapon name whole and unclipped on every screen that shows a weapon pick`, !per[`${w}×${h}`], group(fails.filter((f) => String(f.where).startsWith(`${w}×${h}`))));
  if (want('icons')) for (const [w, h] of SIZES) {
    const S = `${w}×${h}`, x = iconRes[S] || {}, ok = (p) => p && p.n === ids.length && !p.bad.length;
    R(`${S}: no weapon card's icon drawn into its name's letters — LOADOUT and the lobby drawer, all ${ids.length} cards, at rest and focused (and both panels on screen)`, ok(x.lo) && ok(x.dr), { loadout: x.lo && x.lo.bad, drawer: x.dr && x.dr.bad, worst: { loadout: x.lo && x.lo.worst, drawer: x.dr && x.dr.worst } });
    const ordOk = (p) => p && p.n === ids.length && !p.under.length;
    R(`${S}: the name paints above its icon (each icon pushed down onto its name: the name on top wherever the drawing is)`, ordOk(x.lo) && ordOk(x.dr), { loadout: x.lo && x.lo.under, drawer: x.dr && x.dr.under });
  }
  if (want('kits')) for (const [w, h] of SIZES) R(`${w}×${h}: every sub and special weapon name whole too (LOADOUT's chips, the sub / special picker, the lobby's chips)`, !kitFails[`${w}×${h}`], group(kfails.filter((f) => String(f.where).startsWith(`${w}×${h}`))));
  R('every weapon name checked on: the main menu card, the setup chip, LOADOUT (cards, detail, vs badge, the panel on screen), the online hub chip, the lobby chip and drawer, the practice pause', fails.length === 0, { fails: fails.length, longest: names[longest] });
};
