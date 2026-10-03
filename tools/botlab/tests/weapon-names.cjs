// b5-tuning: every weapon's whole name readable wherever a weapon is picked or shown as picked (2026-10-04, the user:
// "make sure the full weapon name can be seen in the weapon select") — at 960×600, 1280×720 and 1920×1080, on:
//   main      the main menu's CURRENT LOADOUT card
//   setup     the match setup's WEAPON chip (PLAY › mode › setup)
//   loadout   LOADOUT: the weapon cards, the detail panel's name, the "vs <equipped>" badge — and the panel itself
//             inside the screen (it ran off the bottom at 16:9)
//   hub       ONLINE: the hub's WEAPON chip
//   lobby     a room's WEAPON chip, and its CHOOSE YOUR WEAPON drawer (the cards + the detail's name)
//   pause     Practice's pause panel (YOUR LOADOUT)
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
  for (const [w, h] of SIZES) {
    A.win.setContentSize(w, h); await wait(900);
    const S = `${w}×${h}`, f0 = fails.length;
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
  if (want('kits')) for (const [w, h] of SIZES) R(`${w}×${h}: every sub and special weapon name whole too (LOADOUT's chips, the sub / special picker, the lobby's chips)`, !kitFails[`${w}×${h}`], group(kfails.filter((f) => String(f.where).startsWith(`${w}×${h}`))));
  R('every weapon name checked on: the main menu card, the setup chip, LOADOUT (cards, detail, vs badge, the panel on screen), the online hub chip, the lobby chip and drawer, the practice pause', fails.length === 0, { fails: fails.length, longest: names[longest] });
};
