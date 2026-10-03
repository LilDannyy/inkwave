// Pictures of the room lobby's SUB / SPECIAL chips in the offline stand-in (?netmock=1): the bottom bar at 1280×720 and
// 960×600, the kit picker over the lobby, and the other squidkids' kits on their nameplates; prints the bar's layout.
//   CLIENTS=1 Q0='netmock=1&mockauto=0' NET=tools/botlab/jobs/lobby-kit/mock-shots.cjs OUT=tools/botlab/jobs/lobby-kit/out tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = async ({ clients: [A], R, wait, say, out, args }) => {
  const J = async (code) => JSON.parse(await A.js(`JSON.stringify(${code})`));
  const size = async (w, h) => { A.win.setContentSize(w, h); await wait(900); };
  // (the layout boxes in the bar — offsetLeft / offsetWidth, so a focused chip's scale-up doesn't count)
  const bar = () => J(`(() => { const B = document.querySelector('.iw-lob__bar'); const kids = [...document.querySelectorAll('.iw-lob__bar > *, .iw-lob__you > *, .iw-lob__kits > *')].filter((e) => e.offsetParent);
    const px = (e) => { let x = 0; for (let n = e; n; n = n.offsetParent) x += n.offsetLeft; return x; }, at = (e) => px(e) - px(B);
    return { vw: innerWidth, vh: innerHeight, bar: [0, B.clientWidth], items: kids.map((e) => [e.className.split(' ').filter((c) => c.startsWith('iw-')).slice(-1)[0], at(e), e.offsetWidth, e.offsetHeight]),
      names: [...document.querySelectorAll('.iw-lkit__name')].map((e) => [e.textContent, e.scrollWidth > e.clientWidth + 1]) }; })()`);
  const tag = args || 'mock';
  // (a busy machine paints the offscreen frame late: shoot once to wake it, then for real)
  const snap = async (file, o) => { await wait(1200); await A.shot(file, o); await wait(900); return A.shot(file, o); };
  await A.js(`__inkwave.api.setLoadout({ weapon: 'shooter', sub: 'boomerang', special: null }); 1`);
  await A.js(`__inkwave.menus.show('online'); 1`);
  await A.until(`__G.net && __G.net.isMock`, 10000);
  await A.js(`__G.net.create('Mocky')`);
  await A.js(`__inkwave.menus.show('lobby'); 1`);
  await A.js(`(() => { const m = __G.net.mock; m.add({ name: 'Otto', team: 0, weapon: 'roller', sub: 'scan', special: 'kraken', ready: true }); m.add({ name: 'Glub', team: 1, weapon: 'charger', sub: null, special: null }); m.add({ name: 'Lulu', team: 1, weapon: 'brush', sub: 'sticky', special: 'barrage_sticky', ready: true }); return 1; })()`);
  await A.until(`__inkwave.menus.current === 'lobby' && !!document.querySelector('.iw-lkit')`, 10000);
  for (const [w, h] of [[1280, 720], [960, 600]]) {
    await size(w, h);
    await wait(2500);
    const m = await bar();
    say(w, h, JSON.stringify(m));
    const over = m.items.some((it) => it[1] < m.bar[0] - 1 || it[1] + it[2] > m.bar[1] + 1);
    const grow = (m.items.find((it) => it[0] === 'iw-lob__grow') || [])[2];
    R(`${w}×${h}: the bar's items stay inside it, with room to spare`, !over && grow > 0, { grow, ...m });
    // every sub's and special's chip name (menus.js: a three-word name → its first and last; > 11 / > 13 letters a
    // size down), tried in the SUB chip: none clipped
    const clipped = await J(`(() => {
      const C = document.querySelector('.iw-lkit--sub'), K = C._k, keep = [K.name.textContent, C.className], bad = [];
      const short = (n) => { const w = String(n).split(' '); return w.length > 2 ? w[0] + ' ' + w[w.length - 1] : String(n); };
      for (const d of [...Object.values(__inkwave.api.subs), ...Object.values(__inkwave.api.specials)]) {
        const t = short(d.name); K.name.textContent = t; C.classList.toggle('is-long', t.length > 11 && t.length <= 13); C.classList.toggle('is-xlong', t.length > 13);
        if (K.name.scrollWidth > K.name.clientWidth + 1) bad.push([t, K.name.scrollWidth, K.name.clientWidth]);
      }
      K.name.textContent = keep[0]; C.className = keep[1];
      return bad; })()`);
    R(`${w}×${h}: every sub / special name fits its chip`, !clipped.length, clipped);
    // …and every weapon's name in the (narrower) WEAPON chip: one line, or two for a name over 9 letters
    const wclip = await J(`(() => {
      const C = document.querySelector('.iw-lob__wchip'), b = C.querySelector('.iw-wchip__text b'), keep = [b.textContent, C.className], bad = [];
      for (const d of Object.values(__inkwave.api.weapons)) {
        b.textContent = d.name; C.classList.toggle('is-long', d.name.length > 9);
        if (b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1) bad.push([d.name, b.scrollWidth, b.clientWidth, b.scrollHeight, b.clientHeight]);
      }
      b.textContent = keep[0]; C.className = keep[1];
      return bad; })()`);
    R(`${w}×${h}: every weapon name fits the WEAPON chip`, !wclip.length, wclip);
    // READY? / START! gave up some width: their sub-lines (at 960 the longest never fitted, as before)
    const subs = await J(`(() => {
      const b = document.querySelector('.iw-btn--lobstart .iw-btn__sub'), keep = b.textContent, out = [];
      for (const t of ['Everyone’s ready — let’s ink!', 'Let the host know you’re set', 'Press again to cancel', 'Practice together — no clock']) { b.textContent = t; out.push([t, b.scrollWidth <= b.clientWidth + 1]); }
      b.textContent = keep; return out; })()`);
    if (w >= 1280) R(`${w}×${h}: the READY? / START! sub-lines fit`, subs.every((x) => x[1]), subs); else say('sub-lines', JSON.stringify(subs));
    say(await snap(`${out}/${tag}-bar-${w}x${h}.jpg`, { w }));
  }
  await size(1280, 720);
  await wait(1200);
  await A.js(`(() => { __inkwave.menus._setFocus(document.querySelector('[data-id="special"]'), { snap: true }); return 1; })()`);
  await A.js(`(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter', key: 'Enter', bubbles: true })); return 1; })()`);
  await A.until(`!!document.querySelector('.iw-kpickm .iw-ktile')`, 5000);
  await wait(900);
  say(await snap(`${out}/${tag}-picker-1280x720.jpg`));
  R('the special picker opens over the lobby on the weapon\'s own', (await A.js(`__inkwave.menus._focus && __inkwave.menus._focus.dataset.id`)) === 'kp-special-own');
};
