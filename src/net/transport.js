// WebSocket link to the room relay (server/src/index.js). Game payloads travel as raw JSON strings wrapped in a tiny
// envelope the relay never parses: "b|<json>" broadcast, "s|<to>|<json>" to one member; incoming "m|<from>|<json>".
// Control frames are JSON objects (welcome / join / leave / err / pong).

import { G } from '../core/ctx.js';

export const PROTO = 1;

// Where the relay lives (relayInfo), first match wins:
//   ?relay=…   a dev / test override (the botlab's local relay);
//   hosted     a self-hosted copy — tools/host/selfhost.cjs marks its index.html with
//              <meta name="inkwave-relay" content="same-origin"> — talks to the relay on its own host (the page already
//              knows its server, so the player's choice below doesn't apply);
//   friend     the player's choice on ONLINE › SERVER (settings.server 'friend' + settings.serverLink — a friend's
//              self-hosted server: a tunnel link, a LAN address, a bare host), normalised by parseServerLink;
//   local      a page served from this machine or the LAN talks to a local `wrangler dev` relay on :8787;
//   official   the deployed Worker.
export const PROD_RELAY = 'wss://inkwave-net.inkwave.workers.dev';
// the desktop app (electron/main.cjs serves the game as app://inkwave): the relays see that as its Origin
export const isDesktopApp = () => typeof location !== 'undefined' && location.protocol === 'app:';
export const isHostedPage = () => typeof document !== 'undefined' && document.querySelector('meta[name="inkwave-relay"]')?.content === 'same-origin';

// a host the player's own machine or LAN can reach over plain http / ws (a bare one of these defaults to http)
const LAN_HOST = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|\[[0-9a-f:.]+\]|[a-z0-9-]+\.(local|lan|home|internal))$/i;
const IPV4 = /^\d+\.\d+\.\d+\.\d+$/;
const BAD_LINK = 'That doesn\u2019t look like a server link';

/** A friend's server link, as pasted → { ok: true, ws: 'wss://host[:port]', http: 'https://host[:port]', host } or
 *  { ok: false, empty?, error } (a player-facing reason). Takes https / http / wss / ws links and bare hosts
 *  ("xyz.trycloudflare.com", "192.168.1.50:8090"); keeps only the scheme, host and port (paths, queries, fragments and
 *  trailing slashes go); a link inside a message is found. Bare hosts: http for this machine / the LAN, else https;
 *  a Cloudflare quick tunnel is always https. */
export function parseServerLink(text) {
  let s = String(text ?? '').trim();
  const inMsg = s.match(/\b(?:https?|wss?):\/\/[^\s<>"'`]+/i);
  if (inMsg) s = inMsg[0];
  s = s.replace(/^[<("'`]+/, '').replace(/[>)"'`,;!?]+$/, '').replace(/\.$/, '');   // quotes / brackets / punctuation round it
  if (!s) return { ok: false, empty: true, error: 'Paste your friend\u2019s server link' };
  if (/\s/.test(s) || s.length > 300) return { ok: false, error: BAD_LINK };
  const scheme = s.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (!scheme && /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(s)) return { ok: false, error: 'Use a link that starts with https:// or http://' };
  if (scheme && !/^(https?|wss?)$/i.test(scheme[1])) return { ok: false, error: 'Use a link that starts with https:// or http://' };
  // the host as typed (the URL parser would make "12345" an IP address): this machine, an IP, a LAN name, or a dotted
  // name ending in a letters-only label (a TLD)
  const auth = (scheme ? s.slice(scheme[0].length) : s).split(/[/?#]/)[0];
  if (auth.includes('@')) return { ok: false, error: 'Leave the name and password out of the link' };
  const typed = (auth.startsWith('[') ? auth.slice(0, auth.indexOf(']') + 1) : auth.replace(/:\d*$/, '')).toLowerCase();
  if (!(LAN_HOST.test(typed) || IPV4.test(typed) || /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+(xn--[a-z0-9-]+|[a-z]{2,})$/.test(typed))) return { ok: false, error: BAD_LINK };
  let u;
  try { u = new URL(scheme ? s : `${LAN_HOST.test(typed) || IPV4.test(typed) ? 'http' : 'https'}://${s}`); } catch { return { ok: false, error: BAD_LINK }; }
  const host = u.hostname.toLowerCase();
  if (!host) return { ok: false, error: BAD_LINK };
  const tunnel = /\.trycloudflare\.com$/.test(host);    // (quick tunnels are https-only, on 443)
  const secure = tunnel || /^(https|wss):$/.test(u.protocol);
  const port = u.port && !tunnel && !((secure && u.port === '443') || (!secure && u.port === '80')) ? `:${u.port}` : '';
  const hp = host + port;
  return { ok: true, ws: `${secure ? 'wss' : 'ws'}://${hp}`, http: `${secure ? 'https' : 'http'}://${hp}`, host: hp };
}

/** The player's saved server choice: { server: 'official' | 'friend', link } (settings — G.settings once the game has
 *  booted, else what it saved). */
export function serverChoice() {
  let s = G.settings;
  if (!s) { try { s = JSON.parse(localStorage.getItem('inkwave.settings') || 'null'); } catch { s = null; } }
  return { server: s && s.server === 'friend' ? 'friend' : 'official', link: s && typeof s.serverLink === 'string' ? s.serverLink : '' };
}

/** Which relay a room would use now and why: { url, source: 'query' | 'hosted' | 'friend' | 'local' | 'official',
 *  host?, error? }. url is null when the player picked a friend's server without a usable link. */
export function relayInfo() {
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('relay') : null;
  if (q) return { url: q.replace(/\/+$/, ''), source: 'query' };
  if (isHostedPage()) return { url: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`, source: 'hosted', host: location.host };
  const c = serverChoice();
  if (c.server === 'friend') {
    const p = parseServerLink(c.link);
    return p.ok ? { url: p.ws, source: 'friend', host: p.host } : { url: null, source: 'friend', error: p.error };
  }
  const h = location.hostname;
  const local = h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(h) || h.endsWith('.local');
  return local ? { url: `ws://${h}:8787`, source: 'local' } : { url: PROD_RELAY, source: 'official' };
}
export function relayURL() { return relayInfo().url; }
// connect() refusals of our own (the rest are the relay's words — server/src/index.js)
export const NO_LINK = 'No server link';                   // a friend's server picked, but no usable link saved
export const REFUSED = 'Server turned this game away';     // the relay is up (its /health answers) but refused the socket

/** Is a relay up? GET <its http base>/health (the relay answers "ok" to any origin). → { ok, ms } or { ok: false,
 *  why: 'timeout' | 'unreachable' | 'not-inkwave' }. One request, no retries. */
export async function pingRelay(wsBase, ms = 5000) {
  if (!wsBase) return { ok: false, why: 'unreachable' };
  const url = wsBase.replace(/^ws(s?):\/\//i, 'http$1://').replace(/\/+$/, '') + '/health';
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let late = false;
  const t = setTimeout(() => { late = true; ctl?.abort(); }, ms);
  const t0 = performance.now();
  try {
    const r = await fetch(url, { cache: 'no-store', credentials: 'omit', signal: ctl?.signal });
    const body = r.ok ? (await r.text()).trim() : '';
    return r.ok && body === 'ok' ? { ok: true, ms: Math.round(performance.now() - t0) } : { ok: false, why: 'not-inkwave', status: r.status };
  } catch { return { ok: false, why: late ? 'timeout' : 'unreachable' }; }
  finally { clearTimeout(t); }
}

// Debug: simulate a real connection on localhost — ?netlag=ms (extra one-way delay on everything received),
// &netjitter=ms (random extra, delivered in order like TCP: late packets bunch up) and &netspike=p (chance per
// message of a 250 ms Wi-Fi hiccup that holds everything behind it).
const SIM = (() => {
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const lag = +q.get('netlag') || 0, jit = +q.get('netjitter') || 0, spike = +q.get('netspike') || 0;
  return lag || jit || spike ? { lag, jit, spike, last: 0 } : null;
})();

export class Transport {
  constructor() {
    this.ws = null;
    this.id = null;
    this.onControl = null;   // (obj) => void   welcome / join / leave
    this.onMessage = null;   // (from, obj) => void
    this.onClose = null;     // (reason) => void
    this.rtt = 0;            // smoothed round trip to the relay, ms
    this._pingT = null; this._pingSent = 0;
    this.bytesIn = 0; this.bytesOut = 0;
  }

  /** Resolves with the welcome frame, rejects with an Error carrying a player-facing message. */
  connect(code, name, create) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const done = (fn, v) => { if (!settled) { settled = true; clearTimeout(timer); fn(v); } };
      const R = relayInfo();
      if (!R.url) { reject(new Error(NO_LINK)); return; }
      const url = `${R.url}/room/${encodeURIComponent(code)}?name=${encodeURIComponent(name)}&v=${PROTO}${create ? '&create=1' : ''}`;
      let ws;
      try { ws = new WebSocket(url); } catch { reject(new Error('Could not connect')); return; }
      this.ws = ws;
      const timer = setTimeout(() => { done(reject, new Error('Could not connect')); try { ws.close(); } catch { /* ignore */ } }, 8000);
      // the handshake failed without a word from a room (a browser never sees the HTTP status): when the relay's
      // /health still answers, it is up and turned this page away (its origin rule — e.g. the official relay and the
      // desktop app), which is worth telling apart from "can't reach it"
      let probing = false, opened = false;
      const handshakeFailed = () => {
        if (settled || probing) return;
        probing = true;
        clearTimeout(timer);
        pingRelay(R.url, 3000).then((p) => done(reject, new Error(p.ok ? REFUSED : 'Could not connect')));
      };
      const handle = (ev) => {
        const s = typeof ev.data === 'string' ? ev.data : '';
        this.bytesIn += s.length;
        if (s === 'pong') {   // answered by the relay runtime itself (it doubles as our liveness signal there)
          if (this._pingSent) { const r = performance.now() - this._pingSent; this._pingSent = 0; this.rtt = this.rtt ? this.rtt + (r - this.rtt) * 0.3 : r; }
          return;
        }
        if (s.charCodeAt(0) === 109 && s.charCodeAt(1) === 124) {            // "m|from|json"
          const k = s.indexOf('|', 2);
          let obj; try { obj = JSON.parse(s.slice(k + 1)); } catch { return; }
          this.onMessage?.(s.slice(2, k), obj);
          return;
        }
        let o; try { o = JSON.parse(s); } catch { return; }
        if (o.t === 'err') { done(reject, new Error(o.e || 'Could not connect')); return; }
        if (o.t === 'pong') { const r = performance.now() - o.c; this.rtt = this.rtt ? this.rtt + (r - this.rtt) * 0.3 : r; return; }
        if (o.t === 'welcome') { this.id = o.id; this._startPing(); done(resolve, o); }
        this.onControl?.(o);
      };
      ws.onmessage = !SIM ? handle : (ev) => {
        const t = Math.max(performance.now() + SIM.lag + Math.random() * SIM.jit + (Math.random() < SIM.spike ? 250 : 0), SIM.last);
        SIM.last = t;
        setTimeout(() => { if (this.ws === ws) handle(ev); }, t - performance.now());
      };
      ws.onclose = (ev) => {
        this._stopPing();
        if (!settled) { if (ev.reason) done(reject, new Error(ev.reason)); else if (!opened) handshakeFailed(); else done(reject, new Error('Could not connect')); return; }
        this.onClose?.(ev.reason || 'Disconnected');
      };
      ws.onopen = () => { opened = true; };
      ws.onerror = () => { if (settled) return; if (!opened) handshakeFailed(); else done(reject, new Error('Could not connect')); };
    });
  }

  _startPing() {
    this._stopPing();
    const ping = () => {
      if (!this._pingSent) this._pingSent = performance.now();   // time the oldest unanswered one (pongs come in order)
      this._raw('ping');                                          // always sent: the relay reads silence as a dead link
    };
    ping();
    this._pingT = setInterval(ping, 2000);
  }
  _stopPing() { if (this._pingT) clearInterval(this._pingT); this._pingT = null; }

  _raw(s) {
    const ws = this.ws;
    if (!ws || ws.readyState !== 1) return false;
    this.bytesOut += s.length;
    ws.send(s);
    return true;
  }
  broadcast(obj) { return this._raw('b|' + JSON.stringify(obj)); }
  sendTo(id, obj) { return this._raw('s|' + id + '|' + JSON.stringify(obj)); }
  lock(v) { return this._raw(JSON.stringify({ t: 'lock', v: !!v })); }
  get open() { return !!this.ws && this.ws.readyState === 1; }

  close() {
    this._stopPing();
    const ws = this.ws; this.ws = null;
    if (ws) { ws.onclose = null; try { ws.close(1000, 'bye'); } catch { /* ignore */ } }
  }
}
