// Botlab net test: several real game clients — offscreen windows in one Electron instance, each in its own session
// (own localStorage / profile) — playing online through the local relay (relay.cjs, the deployed relay's protocol on
// this machine; nothing touches the public relay). A test script (Node side) drives them all and returns its checks.
//   NET=tools/botlab/tests/net-practice.cjs CLIENTS=2 tools/botlab/run.sh tools/botlab/netpage.cjs
// env: CLIENTS (2), W / H (client size, 1280×800), QUALITY (low), FPS (offscreen frame rate, 30), NET_ARGS (→ ctx.args),
//      OUT (pictures; default <BOTLAB_OUT>/net), URLQ (extra page query, e.g. "netlag=40&netjitter=20"), WATCHDOG (ms).
//      APP_CSP=1 (offscreen-boot.cjs): app:// pages get the desktop app's own Content-Security-Policy.
// The script: module.exports = async (ctx) => [{ name, ok, info }]. ctx:
//   clients[i] = { i, win, js(code) → value, until(code, ms, poll) → value, shot(file, { w, q }), log: [] (console
//                  errors / warnings), url, ses (its Electron session) }
//   relay ({ url, rooms, stats }), wait(ms), say(...), out (dir), args, R(name, ok, info) (record a check), results
//   open(i, query?, { base }?) — open / reopen client i (a late joiner, say); a query with relay=none leaves ?relay=
//                  out (the page then picks its relay itself); base: load the game from there instead of app://inkwave/
//                  (e.g. a tools/host/selfhost.cjs URL — the browser build); close(i) — kill a client's window
//   guard ({ blocked: [urls], healthTo }) — every client's session refuses the deployed relay, the official site and
//                  any Cloudflare quick tunnel (tests never reach them); healthTo (a URL) answers the deployed relay's
//                  /health from there instead
const { app, BrowserWindow, session } = require('electron');
const fs = require('fs');
const path = require('path');
const boot = require(process.env.S + '/offscreen-boot.cjs');
const { startRelay } = require(process.env.S + '/relay.cjs');

const N = Math.max(1, +(process.env.CLIENTS || 2));
const W = +(process.env.W || 1280), H = +(process.env.H || 800);
const QUALITY = process.env.QUALITY || 'low';
const FPS = +(process.env.FPS || 30);
const OUT = process.env.OUT || path.join(process.env.BOTLAB_OUT || path.join(boot.ROOT, '.botlab'), 'net');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (...a) => console.log('[net]', ...a);
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); setTimeout(() => process.exit(1), 3000); }, +(process.env.WATCHDOG || 900000));

const clients = [];
let relay = null;
// nothing a test does may reach the deployed relay, the official site or a live tunnel link
const guard = { blocked: [], healthTo: null };
const OUTSIDE = /^(wss?|https?):\/\/([^/?#]+\.)?(workers\.dev|pages\.dev|trycloudflare\.com)(:\d+)?([/?#]|$)/i;
function guardSession(ses) {
  if (!ses || ses._iwGuard) return;
  ses._iwGuard = true;
  ses.webRequest.onBeforeRequest((d, cb) => {
    if (!OUTSIDE.test(d.url)) { cb({}); return; }
    if (guard.healthTo && /^https:\/\/inkwave-net\.inkwave\.workers\.dev\/health$/.test(d.url)) { guard.blocked.push('(redirected) ' + d.url); cb({ redirectURL: guard.healthTo }); return; }
    guard.blocked.push(d.url);
    cb({ cancel: true });
  });
}

function attach(i, win) {
  const c = clients[i] || (clients[i] = { i, log: [], frame: null });
  c.win = win;
  c.closed = false;
  const wc = win.webContents;
  wc.setBackgroundThrottling(false);
  wc.setAudioMuted(true);
  try { wc.setFrameRate(FPS); } catch { /* */ }
  wc.on('paint', (_e, _d, img) => { c.frame = img; });
  wc.on('console-message', (e) => {
    const lvl = String(e.level), m = String(e.message);
    if (/error|warn/i.test(lvl) || /TypeError|ReferenceError|Uncaught/.test(m)) { if (!/Security Warning|Autofill|lightmap/.test(m)) c.log.push(`[${lvl}] ${m.slice(0, 400)}`); }
    if (process.env.ALLLOGS) console.log(`c${i} ${m.slice(0, 300)}`);
  });
  wc.on('render-process-gone', (_e, d) => { c.log.push(`[gone] ${d.reason}`); });
  c.ses = wc.session;
  guardSession(wc.session);
  c.js = (code) => wc.executeJavaScript(code, true);
  c.until = async (code, ms = 30000, poll = 150) => {
    const t0 = Date.now();
    let v;
    for (;;) {
      try { v = await c.js(code); } catch (e) { v = undefined; }
      if (v) return v;
      if (Date.now() - t0 > ms) throw new Error(`c${i}: timed out (${ms} ms) waiting for ${code.slice(0, 160)}`);
      await wait(poll);
    }
  };
  c.shot = async (file, { w = 1280, q = 82 } = {}) => {
    wc.invalidate();
    await wait(120);
    const img = c.frame;
    if (!img) return null;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const sz = img.getSize();
    const im = sz.width > w ? img.resize({ width: w, quality: 'good' }) : img;
    let buf = file.endsWith('.png') ? im.toPNG() : im.toJPEG(q);
    for (let qq = q - 10; buf.length > 290 * 1024 && qq >= 40 && !file.endsWith('.png'); qq -= 10) buf = im.toJPEG(qq);
    fs.writeFileSync(file, buf);
    return { file, bytes: buf.length };
  };
  return c;
}

function query(i, extra, base = 'app://inkwave/') {
  const q = new URLSearchParams();
  q.set('skipTitle', '');
  q.set('relay', relay.url);
  if (process.env.URLQ) for (const [k, v] of new URLSearchParams(process.env.URLQ)) q.set(k, v);
  if (extra) for (const [k, v] of new URLSearchParams(extra)) q.set(k, v);
  if (q.get('relay') === 'none') q.delete('relay');
  return base + 'index.html?' + q.toString().replace(/=(&|$)/g, '$1');
}

// a fresh page: settings first (low quality: several full games share one GPU), then the game with its query
async function load(c, extra) {
  const wc = c.win.webContents;
  const base = c.base || 'app://inkwave/';
  await c.win.loadURL(base + 'assets/stages/manifest.json');   // (a light page on the game's origin: its localStorage)
  await c.js(`(() => { try { const k = 'inkwave.settings'; const s = JSON.parse(localStorage.getItem(k) || '{}'); s.quality = ${JSON.stringify(QUALITY)}; s.minimap = true; localStorage.setItem(k, JSON.stringify(s));
    const p = JSON.parse(localStorage.getItem('inkwave.profile') || '{}'); p.name = ${JSON.stringify('P' + (c.i + 1))}; localStorage.setItem('inkwave.profile', JSON.stringify(p)); } catch (e) {} return 1; })()`).catch(() => 0);
  c.url = query(c.i, extra, base);
  await c.win.loadURL(c.url);
  await c.until(`!!(window.__inkwave && window.__inkwave.api && window.__G && __G.net && __G.mode === 'menu')`, 240000, 300);
  await c.js(`window.__inkwave._onPointerUnlock = () => {}; (() => { const L = (window.__netlog = []), t0 = performance.now(), T = () => ((performance.now() - t0) / 1000).toFixed(1);
    for (const k of ['state', 'error', 'leave', 'host', 'match', 'join']) __G.net.on(k, (e) => L.push(T() + ' ' + k + ' ' + JSON.stringify(e, (kk, v) => (kk === 'lobby' || kk === 'style' ? undefined : v)))); })(); 1`);
  void wc;
}

async function open(i, extra, { base } = {}) {
  let c = clients[i];
  if (!c || c.closed) {
    const part = 'netc' + i + '-' + Date.now();
    const ses = session.fromPartition(part);
    ses.protocol.handle('app', boot.fsHandler);
    guardSession(ses);
    const win = new BrowserWindow({ show: false, width: W, height: H, webPreferences: { offscreen: true, partition: part, contextIsolation: true, sandbox: true } });
    c = attach(i, win);
  }
  if (base !== undefined) c.base = base;
  await load(c, extra);
  return c;
}

function close(i) {
  const c = clients[i];
  if (!c || c.closed) return;
  c.closed = true;
  try { c.win.destroy(); } catch { /* gone */ }
}

let claimed = false;
app.on('browser-window-created', (_, win) => {
  if (claimed) return; claimed = true;
  // the app's own window (electron/main.cjs) is client 0
  guardSession(win.webContents.session);
  win.setContentSize(W, H);
  const c0 = attach(0, win);
  let started = false;
  win.webContents.on('did-finish-load', async () => {
    if (started) return; started = true;
    const results = [];
    const R = (name, ok, info) => { results.push({ name, ok: !!ok, info }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
    try {
      relay = await startRelay(0);
      say('relay', relay.url);
      const t0 = Date.now();
      await load(c0, process.env.Q0 || '');
      for (let i = 1; i < N; i++) await open(i, process.env['Q' + i] || '');
      say(`${N} clients up in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      const script = require(path.resolve(process.env.NET));
      const ctx = { clients, relay, wait, say, out: OUT, args: process.env.NET_ARGS || '', R, results, open, close, guard };
      fs.mkdirSync(OUT, { recursive: true });
      const extra = await script(ctx);
      if (Array.isArray(extra)) for (const r of extra) R(r.name, r.ok, r.info);
    } catch (e) {
      console.log('HARNESS ERROR', e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e);
      results.push({ name: 'harness', ok: false });
      for (const c of clients) { if (!c || c.closed) continue; try { console.log(`c${c.i} netlog:`, (await c.js('(window.__netlog || []).slice(-12).join(" || ")')) || ''); } catch { /* */ } }
    }
    const pass = results.filter((r) => r.ok).length;
    console.log(`RESULT ${pass}/${results.length}`);
    for (const c of clients) if (c) console.log(`c${c.i} console:`, c.log.length ? [...new Set(c.log)].slice(0, 6).join(' || ') : 'none');
    if (relay) console.log('relay stats', JSON.stringify(relay.stats));
    console.log('outside requests refused:', guard.blocked.length ? [...new Set(guard.blocked)].slice(0, 8).join(' · ') : 'none');
    try { await relay?.close(); } catch { /* */ }
    app.quit();
  });
});
