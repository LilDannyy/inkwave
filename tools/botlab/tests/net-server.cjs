// The desktop app on a friend's server: ONLINE › SERVER (src/ui/menus.js _serverChip, src/net/transport.js relayInfo)
// against a real tools/host/selfhost.cjs on a free localhost port — never the deployed relay or a live tunnel (netpage's
// guard refuses them; the official relay's /health is answered by the local server where a check needs one).
//   CLIENTS=1 APP_CSP=1 NET=tools/botlab/tests/net-server.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
// NET_ARGS: 'shots' saves pictures to OUT (the online screen on Official / on a friend's server, the picker, the
// refusals); 'nolan' skips the LAN-address check (a second server on this Mac's LAN address for a few seconds).
// Clients: A = the app's own window (app://inkwave, no ?relay=: the server comes from the new setting), B = the browser
// build loaded from the self-host URL, C = a second app:// client.
const path = require('path');
const os = require('os');
const { startSelfhost } = require('../../host/selfhost.cjs');

module.exports = async (ctx) => {
  const { clients, R, wait, say, out, open, guard } = ctx;
  const SHOTS = /shots/.test(ctx.args);
  const shot = async (c, name) => { if (!SHOTS) return; await wait(700); const r = await c.shot(`${out}/${name}.jpg`); say('shot', name, r && r.bytes); };
  const J = async (c, code) => JSON.parse(await c.js(`Promise.resolve(${code}).then((v) => JSON.stringify(v))`));
  const origins = [];
  const host = await startSelfhost({ root: path.resolve(__dirname, '../../..'), port: 0, host: '127.0.0.1', onOrigin: (o, ok) => origins.push([o, ok]), log: (m) => say('selfhost:', m) });
  const HOST = `127.0.0.1:${host.port}`, LINK = `http://${HOST}`, WS = `ws://${HOST}`;
  say('selfhost', host.url);
  let lan = null;
  const A0 = clients[0];
  try {
    // ------------------------------------------------------------------ the app client, with no ?relay=
    const A = await open(0, 'relay=none');
    R('client A is the desktop app (app://inkwave, no ?relay=)', await A.js(`location.origin === 'app://inkwave' && !new URLSearchParams(location.search).has('relay') && !!window.inkwaveNative`));
    const T = `(await import('/src/net/transport.js'))`;

    // 1. links → the WebSocket base (https → wss, http → ws, bare hosts, paths / queries / slashes dropped, garbage refused)
    const cases = [
      ['https://bold-frog-tide.trycloudflare.com', 'wss://bold-frog-tide.trycloudflare.com'],
      ['https://bold-frog-tide.trycloudflare.com/', 'wss://bold-frog-tide.trycloudflare.com'],
      ['https://Bold-Frog-Tide.trycloudflare.com/index.html?relay=x#top', 'wss://bold-frog-tide.trycloudflare.com'],
      ['bold-frog-tide.trycloudflare.com', 'wss://bold-frog-tide.trycloudflare.com'],
      ['http://192.168.1.50:8090', 'ws://192.168.1.50:8090'],
      ['http://192.168.1.50:8090/game/index.html?x=1', 'ws://192.168.1.50:8090'],
      ['192.168.1.50:8090', 'ws://192.168.1.50:8090'],
      ['localhost:8090/', 'ws://localhost:8090'],
      ['mac-mini.local:8090', 'ws://mac-mini.local:8090'],
      ['https://example.com:443//', 'wss://example.com'],
      ['wss://example.com:8443/room/ABCDE', 'wss://example.com:8443'],
      ['Play with me: https://bold-frog-tide.trycloudflare.com !', 'wss://bold-frog-tide.trycloudflare.com'],
      ['  <http://10.0.0.7:8090/>  ', 'ws://10.0.0.7:8090'],
      ['hello world', null], ['asdf', null], ['12345', null], ['ftp://example.com', null], ['javascript:alert(1)', null],
      ['https://', null], ['https://user:pw@example.com', null], ['http://999.1.1.1', null], ['', null],
    ];
    const got = await J(A, `(async () => { const T = ${T}; return ${JSON.stringify(cases)}.map(([t]) => T.parseServerLink(t)); })()`);
    const bad = cases.map(([t, want], i) => [t, want, got[i]]).filter(([, want, g]) => (want ? !(g.ok && g.ws === want) : g.ok || !g.error));
    R(`links normalise to a WebSocket base, garbage is refused with a reason (${cases.length} cases)`, !bad.length, bad.length ? bad : { garbage: got.filter((g) => !g.ok).map((g) => g.error).filter((e, i, a) => a.indexOf(e) === i) });

    // 2. Official is unchanged
    const off = await J(A, `(async () => { const T = ${T}; return { info: T.relayInfo(), url: T.relayURL(), prod: T.PROD_RELAY }; })()`);
    R('Official (the default): relayURL() is the deployed relay', off.info.source === 'official' && off.url === off.prod && off.prod === 'wss://inkwave-net.inkwave.workers.dev', off.info);

    // 3. the app's page policy: a remote script is still refused, the relay may be reached
    const csp = await A.js(`import(${JSON.stringify(host.url + '/src/config.js')}).then(() => 'loaded', (e) => 'refused')`);
    R('the app\'s CSP is in force (a script from the server is refused)', csp === 'refused', { csp });

    // 4. the online screen: the SERVER chip, reached with the pad / keys from CREATE
    guard.healthTo = `${host.url}/health`;   // (the official relay's /health answered locally: the chip's real look)
    await A.js(`__inkwave.menus.show('online'); 1`);
    await A.until(`!!document.querySelector('.iw-srvchip') && document.querySelector('.iw-srvst').dataset.st !== 'busy'`, 12000);
    const chip0 = await J(A, `(() => { const c = document.querySelector('.iw-srvchip'); return { name: c.querySelector('.iw-srvchip__name').textContent, st: c.querySelector('.iw-srvst').dataset.st, txt: c.querySelector('.iw-srvst span').textContent, ro: c.classList.contains('is-ro') }; })()`);
    R('the online screen shows SERVER: Official · Connected (an editable chip)', chip0.name === 'Official' && chip0.st === 'ok' && chip0.txt === 'Connected' && !chip0.ro, chip0);
    await shot(A, 'online-official');
    const focusOf = `(() => { const f = __inkwave.menus._focus; return f ? (f.dataset.id || f.className) : null; })()`;
    const nav = async (c, dir) => { await c.js(`__inkwave.menus.nav(${JSON.stringify(dir)}); 1`); await wait(120); return J(c, focusOf); };
    const f0 = await J(A, focusOf);
    const up = await nav(A, 'up'), down = await nav(A, 'down'), up2 = await nav(A, 'up'), right = await nav(A, 'right'), left = await nav(A, 'left');
    R('pad / keys: CREATE ↑ SERVER, ↓ back to CREATE; SERVER → your name ← SERVER', f0 === 'create' && up === 'server' && down === 'create' && up2 === 'server' && right === 'name' && left === 'server', { f0, up, down, up2, right, left });
    const dn = [await nav(A, 'down'), await nav(A, 'down'), await nav(A, 'up'), await nav(A, 'up')];
    R('…the rest of the hub still navigates as before (CREATE ↓ JOIN ↑ CREATE)', dn[0] === 'create' && dn[1] === 'join' && dn[2] === 'create' && dn[3] === 'server', dn);

    // 5. the picker: Friend's server, the link pasted with the PASTE button (clipboard: a message with the link in it)
    await nav(A, 'accept');
    await A.until(`!!document.querySelector('.iw-srvmodal')`, 4000);
    const p0 = await J(A, `({ f: ${focusOf}, friend: document.querySelector('.iw-srvm').classList.contains('is-friend') })`);
    await nav(A, 'right');
    const p1 = await J(A, `({ friend: document.querySelector('.iw-srvm').classList.contains('is-friend'), st: document.querySelector('.iw-srvm__st').dataset.st, txt: document.querySelector('.iw-srvm__st span').textContent, saved: JSON.parse(localStorage.getItem('inkwave.settings')).server })`);
    R('picker: opens on PLAY ON; → picks FRIEND\'S SERVER (saved) and asks for a link', p0.f === 'srv-choice' && !p0.friend && p1.friend && p1.st === 'warn' && /Paste a link/.test(p1.txt) && p1.saved === 'friend', { p0, p1 });
    const f2 = await nav(A, 'down'), f3 = await nav(A, 'right');
    R('…↓ the link field, → PASTE', f2 === 'srv-link' && f3 === 'srv-paste', { f2, f3 });
    // garbage typed in the field: refused with a reason, nothing saved
    // (an offscreen window never has the OS focus, so the page gets no focus / blur events: the field's are sent by hand)
    await A.js(`(() => { const i = document.querySelector('.iw-srvm__input'); i.dispatchEvent(new FocusEvent('focus')); i.value = 'not a server'; i.dispatchEvent(new FocusEvent('blur')); return 1; })()`);
    const g = await J(A, `({ err: document.querySelector('.iw-srvm__err').textContent, link: JSON.parse(localStorage.getItem('inkwave.settings')).serverLink || '' })`);
    R('typed garbage: "That doesn\'t look like a server link", nothing saved', /doesn.t look like a server link/.test(g.err) && g.link === '', g);
    await A.js(`navigator.clipboard.readText = () => Promise.resolve(${JSON.stringify(`Server's up! ${LINK}/ — come play`)}); 1`);
    const fp = await nav(A, 'right');   // (typing put the cursor on the field: → PASTE)
    if (fp !== 'srv-paste') R('cursor on PASTE', false, { fp });
    await nav(A, 'accept');
    await A.until(`document.querySelector('.iw-srvm__st').dataset.st === 'ok'`, 8000).catch(() => null);
    const p2 = await J(A, `(async () => { const T = ${T}; return { input: document.querySelector('.iw-srvm__input').value, st: document.querySelector('.iw-srvm__st').dataset.st, txt: document.querySelector('.iw-srvm__st span').textContent, err: document.querySelector('.iw-srvm__err').textContent, s: JSON.parse(localStorage.getItem('inkwave.settings')), info: T.relayInfo() }; })()`);
    R('PASTE: the link pulled out of the message, normalised, saved; the server checked: Connected', p2.input === LINK && p2.st === 'ok' && p2.txt === 'Connected' && !p2.err && p2.s.server === 'friend' && p2.s.serverLink === LINK && p2.info.source === 'friend' && p2.info.url === WS, p2);
    await shot(A, 'online-friend-picker');
    // a pasted link with ⌘V while the picker is open (not in the field): goes to the link, not the room code
    await A.js(`(() => { const dt = new DataTransfer(); dt.setData('text/plain', 'https://quiet-moss-lane.trycloudflare.com/'); document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); return 1; })()`);
    await wait(300);
    const p3 = await J(A, `({ link: JSON.parse(localStorage.getItem('inkwave.settings')).serverLink, input: document.querySelector('.iw-srvm__input').value, code: [...document.querySelectorAll('.iw-code__ch')].map((b) => b.textContent).join('') })`);
    R('⌘V in the picker sets the link (the room code stays empty)', p3.link === 'https://quiet-moss-lane.trycloudflare.com' && p3.input === p3.link && p3.code === '', p3);
    await A.js(`navigator.clipboard.readText = () => Promise.resolve(${JSON.stringify(LINK)}); 1`);
    await A.js(`document.querySelector('.iw-srvm__paste').click(); 1`);
    await A.until(`JSON.parse(localStorage.getItem('inkwave.settings')).serverLink === ${JSON.stringify(LINK)} && document.querySelector('.iw-srvm__st').dataset.st === 'ok'`, 8000);
    await nav(A, 'back');
    await A.until(`!document.querySelector('.iw-srvmodal') && document.querySelector('.iw-srvst').dataset.st === 'ok'`, 6000);
    const chip1 = await J(A, `(() => { const c = document.querySelector('.iw-srvchip'); return { name: c.querySelector('.iw-srvchip__name').textContent, txt: c.querySelector('.iw-srvst span').textContent, f: ${focusOf} }; })()`);
    R('back closes the picker; the chip reads the friend\'s server · Connected; focus back on it', chip1.name === HOST && chip1.txt === 'Connected' && chip1.f === 'server', chip1);
    await shot(A, 'online-friend');

    // 6. the setting survives a reload (the app restarted)
    await open(0, 'relay=none');
    await A.js(`__inkwave.menus.show('online'); 1`);
    await A.until(`document.querySelector('.iw-srvst') && document.querySelector('.iw-srvst').dataset.st === 'ok'`, 12000);
    const re = await J(A, `(async () => { const T = ${T}; return { info: T.relayInfo(), name: document.querySelector('.iw-srvchip__name').textContent }; })()`);
    R('after a reload: still the friend\'s server (relayURL → ws://127.0.0.1:<port>), Connected', re.info.source === 'friend' && re.info.url === WS && re.name === HOST, re);

    // 7. A creates a room through the UI (CREATE A ROOM) on the friend's server
    await A.js(`__inkwave.menus._setFocus(document.querySelector('.iw-hubcard--create')); __inkwave.menus.nav('accept'); 1`);
    await A.until(`__G.net.state === 'lobby' && __inkwave.menus.current === 'lobby' && !!document.querySelector('.iw-lobby .iw-rc__share')`, 15000);
    const code = await A.js(`__G.net.code`);
    const room = [...host.relay.rooms.values()].find((r) => r.code === code);
    const share = await A.js(`(document.querySelector('.iw-lobby .iw-rc__share') || {}).textContent || ''`);
    R(`A (the app) created room ${code} on the self-hosted relay`, !!room && room.members().length === 1, { members: room && room.members().length });
    R('the lobby says which server the room is on', share.includes(HOST) && /ONLINE › SERVER/.test(share), { share });
    const appO = origins.filter(([o]) => o.startsWith('app:'));
    R('Electron\'s Origin for the app\'s pages is exactly "app://inkwave" (and the self-host admits it)', appO.length >= 1 && appO.every(([o, ok]) => o === 'app://inkwave' && ok), { seen: [...new Set(origins.map(([o, ok]) => `${o} ${ok}`))] });
    await shot(A, 'lobby-friend');

    // 8. B: the browser build from the self-host URL — its own server wins over a saved choice (meta same-origin)
    const B = await open(1, 'relay=none', { base: `${host.url}/` });
    await B.js(`localStorage.setItem('inkwave.settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('inkwave.settings') || '{}'), server: 'friend', serverLink: 'https://elsewhere.example' })); 1`);
    await open(1, 'relay=none');   // (reload with that saved)
    const bi = await J(B, `(async () => { const T = ${T}; return { origin: location.origin, meta: !!document.querySelector('meta[name="inkwave-relay"]'), saved: JSON.parse(localStorage.getItem('inkwave.settings')).serverLink, info: T.relayInfo() }; })()`);
    R('B (browser, served by the self-host): the meta wins over a saved friend\'s link', bi.origin === host.url && bi.meta && bi.saved === 'https://elsewhere.example' && bi.info.source === 'hosted' && bi.info.url === WS, bi);
    await B.js(`__inkwave.menus.show('online'); 1`);
    await B.until(`document.querySelector('.iw-srvst') && document.querySelector('.iw-srvst').dataset.st === 'ok'`, 12000);
    const bchip = await J(B, `(() => { const c = document.querySelector('.iw-srvchip'); __inkwave.menus._setFocus(document.querySelector('.iw-hubcard--create')); __inkwave.menus.nav('up'); return { name: c.querySelector('.iw-srvchip__name').textContent, ro: c.classList.contains('is-ro'), nav: c.hasAttribute('data-nav'), f: ${focusOf} }; })()`);
    R('…its SERVER chip is read-only ("This site\'s server", no cursor stop: ↑ from CREATE stays put)', bchip.ro && !bchip.nav && /This site/.test(bchip.name) && bchip.f === 'create', bchip);
    await shot(B, 'online-hosted');
    await B.js(`__G.net.join(${JSON.stringify(code)}, 'Browsy').then(() => 1)`);
    await A.until(`__G.net.lobby.players.length === 2`, 15000);
    R('B (browser) joined the app\'s room', true);

    // 9. C: another app client. First Official in the app → refused (the official relay's /health answers; its socket is
    // refused like the real one's 403) → the hint; then a version mismatch; then the friend's server for real
    const C = await open(2, 'relay=none');
    const ci = await J(C, `(async () => { const T = ${T}; return T.relayInfo(); })()`);
    await C.js(`__inkwave.menus.show('online'); 1`);
    await C.until(`document.querySelector('.iw-srvst') && document.querySelector('.iw-srvst').dataset.st !== 'busy'`, 12000);
    await C.js(`__inkwave.menus._setFocus(document.querySelector('.iw-hubcard--create')); __inkwave.menus.nav('accept'); 1`);
    await C.until(`/NOT ON THIS SERVER YET/.test(document.querySelector('.iw-hubcard__status').textContent) || document.querySelector('.iw-hubcard--create.is-err')`, 15000);
    const cr = await J(C, `({ status: document.querySelector('.iw-hubcard__status').textContent, chip: document.querySelector('.iw-srvst span').textContent })`);
    R('app on Official, refused: "The official server doesn\'t accept the desktop app yet; use a friend\'s server link"', ci.source === 'official' && /doesn.t accept the desktop app yet; use a friend.s server link/.test(cr.status) && cr.chip === 'Turns the app away', { ci: ci.source, ...cr });
    await shot(C, 'online-official-refused');
    guard.healthTo = null;
    // a version mismatch: this client claims an older protocol (v=0) — the relay's refusal, shown in the app
    await C.js(`__inkwave.api.setSettings({ server: 'friend', serverLink: ${JSON.stringify(LINK)} }); (() => { const W = window.WebSocket; window.__WS = W; window.WebSocket = class extends W { constructor(u, p) { super(String(u).replace(/([?&]v=)\\d+/, '$10'), p); } }; })(); 1`);
    await C.js(`__inkwave.menus.show('main'); 1`); await wait(400);
    await C.js(`__inkwave.menus.show('online'); 1`); await wait(900);
    await C.js(`(() => { const dt = new DataTransfer(); dt.setData('text/plain', ${JSON.stringify(code)}); document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); return 1; })()`);
    await C.until(`document.querySelector('.iw-jstat.is-on')`, 15000);
    const ve = await J(C, `({ title: document.querySelector('.iw-jstat b').textContent, text: document.querySelector('.iw-jstat__txt span').textContent })`);
    R('version mismatch: "Please refresh the page — the game was updated", worded for the app', ve.title === 'GAME VERSIONS DIFFER' && ve.text.startsWith('Please refresh the page — the game was updated') && /update the app/.test(ve.text), ve);
    await shot(C, 'online-version');
    await C.js(`window.WebSocket = window.__WS; 1`);
    await C.js(`__G.net.join(${JSON.stringify(code)}, 'Appy').then(() => 1)`);
    await A.until(`__G.net.lobby.players.length === 3`, 15000);
    R('C (the app, friend\'s server) joined too: 3 in the room', true);

    // 10. Practice: everyone in the match
    await A.js(`__G.net.setSettings({ mode: 'practice', map: 'tidewater', time: 'day', botCount: 0 }); 1`);
    for (const c of [B, C]) await c.until(`__G.net.lobby.mode === 'practice' && __G.net.lobby.map === 'tidewater'`, 10000);
    await A.js(`__G.net.start()`);
    for (const c of [A, B, C]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 120000, 300);
    const roster = async (c) => J(c, `__G.match.actors.filter((a) => !a.isBot).map((a) => a.name).sort()`);
    const ra = await roster(A), rb = await roster(B), rc = await roster(C);
    const pr = await J(A, `({ practice: !!__G.match.practice, map: __inkwave.mapDef.id })`);
    R('Practice: app, browser and app all in the match, the same three on every screen', pr.practice && pr.map === 'tidewater' && ra.length === 3 && JSON.stringify(ra) === JSON.stringify(rb) && JSON.stringify(ra) === JSON.stringify(rc), { ra, rb, rc, ...pr });
    const idB = await B.js('__G.net.myId');
    const pos = (c, id) => J(c, `(() => { const a = __G.match.actors.find((x) => x.owner === ${JSON.stringify(id)} && !x.isBot); return a ? [a.pos.x, a.pos.z] : null; })()`);
    const own = () => J(B, `[__G.match.local.pos.x, __G.match.local.pos.z]`);
    const q0 = await pos(A, idB);
    await B.js(`(() => { const a = __G.match.local; a.pos.x += 2.5; return 1; })()`);
    await wait(2500);
    const q1 = await pos(A, idB), b1 = await own();
    const d = (a, b) => (a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : 99);
    R('the app sees the browser player where the browser has it (after a step)', d(q1, b1) < 1 && d(q0, q1) > 0.5, { q0, q1, b1 });
    if (SHOTS) await shot(A, 'practice-app');
    await A.js(`__inkwave.api.practiceEnd(); 1`);
    for (const c of [A, B, C]) await c.until(`__G.net.state === 'lobby'`, 40000, 400).catch(() => null);

    // 11. a LAN address from the app: the /health check and a room socket (mixed content / private network rules)
    if (!/nolan/.test(ctx.args)) {
      const ip = Object.values(os.networkInterfaces()).flat().find((n) => n && n.family === 'IPv4' && !n.internal && /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(n.address));
      if (!ip) R('LAN address check: no LAN address on this Mac (skipped)', true);
      else {
        lan = await startSelfhost({ root: path.resolve(__dirname, '../../..'), port: 0, host: ip.address, log: () => {} });
        const L = `http://${ip.address}:${lan.port}`;
        const lr = await J(C, `(async () => { const T = ${T}; const p = T.parseServerLink(${JSON.stringify(L)}); const h = await T.pingRelay(p.ws, 4000);
          const sock = await new Promise((res) => { const w = new WebSocket(p.ws + '/room/BCEFG?name=x&v=' + T.PROTO); w.onmessage = (e) => { res(String(e.data).slice(0, 80)); w.close(); }; w.onerror = () => res('error'); setTimeout(() => res('timeout'), 5000); });
          return { ws: p.ws, health: h, sock }; })()`);
        R(`the app reaches a LAN address (${L}): /health and a room socket`, lr.health.ok && /Room not found/.test(lr.sock), lr);
        await lan.close(); lan = null;
      }
    }

    // the outside stayed out: the harness refused the app's socket to the deployed relay (and every tunnel request)
    R('the deployed relay was never reached: its room socket was refused by the harness', guard.blocked.some((u) => u.startsWith('wss://inkwave-net.inkwave.workers.dev/room/')), { refused: [...new Set(guard.blocked.map((u) => u.replace(/\?.*/, '')))].slice(0, 6) });
    return [];
  } finally {
    guard.healthTo = null;
    if (lan) await lan.close().catch(() => {});
    // the app window's profile is the botlab slot's: leave it on Official for the next harness
    if (A0 && !A0.closed) await A0.js(`(() => { try { const s = JSON.parse(localStorage.getItem('inkwave.settings') || '{}'); delete s.server; delete s.serverLink; localStorage.setItem('inkwave.settings', JSON.stringify(s)); } catch (e) {} return 1; })()`).catch(() => {});
    await host.close();
  }
};
