// Botlab: a local stand-in for the online relay (server/src/index.js, a Cloudflare Durable Object) — the same wire
// protocol, room rules and limits, on plain Node `http` with the WebSocket handshake and framing done by hand (no
// packages), so online features can be tested with real clients on this machine and never on the deployed relay.
//
//   node tools/botlab/relay.cjs [port]                      (default 8788; prints "RELAY ws://127.0.0.1:<port>")
//   const { startRelay } = require('./relay.cjs'); const r = await startRelay(0);   // r.port, r.url, r.rooms, r.close()
// Point a game page at it with ?relay=ws://127.0.0.1:<port>.
//
// Mirrored exactly (keep in step with server/src/index.js):
//   GET /room/<CODE>?name=&create=1&v=<proto> (WebSocket upgrade) · GET /health → "ok"
//   client → room: "b|<payload>" broadcast to everyone else · "s|<toId>|<payload>" to one member ·
//                  {"t":"lock","v":bool} (host only) · "ping" → "pong" (auto-response: no rate count, no wake) ·
//                  {"t":"ping","c":n} → {"t":"pong","c":n}
//   room → client: "m|<fromId>|<payload>" · {"t":"welcome","id","host","members":[{id,name}]} · {"t":"join","m":{id,name}} ·
//                  {"t":"leave","id","host"} · {"t":"err","e":"…"} then close 4000
//   refusals: bad proto ('Please refresh the page — the game was updated'), 'Room code taken', 'Room not found',
//   'Room is full' (8), 'Match in progress' (locked); MSG_MAX 65536 chars (bigger messages are dropped, never fanned
//   out); RATE 90 msgs/s with BURST_STRIKES 4 (and > 3×RATE in one second) → close 4008 'Too many messages'; the
//   liveness sweep every 4 s drops a socket silent for 20 s while the room is locked (150 s otherwise) → close 4001.
// One deliberate difference: the browser origin. The deployed relay only admits the game's site and local / LAN pages;
// this one also admits the desktop app's own origin (app://inkwave), which is how the botlab's Electron clients load.
'use strict';
const http = require('http');
const crypto = require('crypto');

const PROTO = 1, MAX = 8;
const ORIGIN_OK = (o) => /^https:\/\/([a-z0-9-]+\.)?inkwave-aah\.pages\.dev$/.test(o)
  || /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-z0-9-]+\.local)(:\d+)?$/.test(o)
  || o === 'app://inkwave';   // (test-only: the botlab's Electron clients)
const MSG_MAX = 65536, RATE = 90, BURST_STRIKES = 4;
const SILENT_MATCH = 20000, SILENT_LOBBY = 150000, SWEEP = 4000;
const CODE = /^[A-Z0-9]{4,8}$/;
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// ------------------------------------------------------------------ WebSocket framing (RFC 6455, server side)
function frame(op, payload) {
  const n = payload.length;
  const head = n < 126 ? Buffer.from([0x80 | op, n]) : n < 65536 ? Buffer.from([0x80 | op, 126, n >> 8, n & 255]) : (() => { const b = Buffer.alloc(10); b[0] = 0x80 | op; b[1] = 127; b.writeBigUInt64BE(BigInt(n), 2); return b; })();
  return Buffer.concat([head, payload]);
}

class Sock {
  constructor(socket, room) {
    this.s = socket; this.room = room; this.buf = Buffer.alloc(0); this.frag = null; this.open = true;
    this.att = null;            // { id, name, seq, at, gone } (the Durable Object's socket attachment)
    this.autoTs = 0;            // last "ping" auto-response (getWebSocketAutoResponseTimestamp)
    this.stats = { in: 0, out: 0, bytesIn: 0, bytesOut: 0 };
    socket.on('data', (d) => this._data(d));
    socket.on('close', () => this._closed());
    socket.on('end', () => { this._closed(); try { socket.end(); } catch { /* gone */ } });   // (the http server keeps sockets half-open)
    socket.on('error', () => this._closed());
  }
  send(str) {
    if (!this.open) return;
    const b = Buffer.from(str, 'utf8');
    this.stats.out++; this.stats.bytesOut += b.length;
    try { this.s.write(frame(1, b)); } catch { /* closing */ }
  }
  close(code, reason) {
    if (!this.open) return;
    this.open = false;
    const r = Buffer.from(String(reason || ''), 'utf8').subarray(0, 120);
    const p = Buffer.alloc(2 + r.length); p.writeUInt16BE(code || 1000, 0); r.copy(p, 2);
    try { this.s.write(frame(8, p)); } catch { /* gone */ }
    setTimeout(() => { try { this.s.end(); } catch { /* gone */ } }, 50);
    this.room._gone(this);
  }
  _closed() { if (this.open) { this.open = false; } this.room._gone(this); }
  _data(d) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, d]) : d;
    for (;;) {
      const b = this.buf;
      if (b.length < 2) return;
      const fin = (b[0] & 0x80) !== 0, op = b[0] & 0x0f, masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f, off = 2;
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
      const mk = masked ? 4 : 0;
      if (b.length < off + mk + len) return;
      let p = b.subarray(off + mk, off + mk + len);
      if (masked) { const m = b.subarray(off, off + 4); p = Buffer.from(p); for (let i = 0; i < p.length; i++) p[i] ^= m[i & 3]; }
      this.buf = b.subarray(off + mk + len);
      if (op === 8) { this.close(1000, ''); return; }                 // client close → echo + gone
      if (op === 9) { try { this.s.write(frame(10, p)); } catch { /* gone */ } continue; }   // protocol ping
      if (op === 10) continue;
      if (op === 0) { if (!this.frag) continue; this.frag.parts.push(p); if (!fin) continue; p = Buffer.concat(this.frag.parts); const t = this.frag.op; this.frag = null; if (t === 1) this._text(p.toString('utf8')); continue; }
      if (!fin) { this.frag = { op, parts: [p] }; continue; }
      if (op === 1) this._text(p.toString('utf8'));
      // (binary frames: the relay ignores non-strings)
    }
  }
  _text(msg) {
    this.stats.in++; this.stats.bytesIn += msg.length;
    if (msg === 'ping') { this.autoTs = Date.now(); this.send('pong'); return; }   // (setWebSocketAutoResponse)
    this.room._message(this, msg);
  }
}

// ------------------------------------------------------------------ the room (server/src/index.js Room)
class Room {
  constructor(code, relay) { this.code = code; this.relay = relay; this.locked = false; this.seq = 0; this.socks = new Set(); this.seen = new Map(); this.rate = new Map(); this.alarm = null; this.log = []; }
  members() { return [...this.socks].filter((s) => s.att && !s.att.gone).sort((x, y) => x.att.seq - y.att.seq); }
  host() { const ms = this.members(); return ms.length ? ms[0].att.id : null; }

  accept(sock, url) {
    this.socks.add(sock);
    const fail = (e) => { sock.send(JSON.stringify({ t: 'err', e })); sock.close(4000, e); };
    const ms = this.members().filter((m) => m !== sock);
    const create = url.searchParams.get('create') === '1';
    if (+(url.searchParams.get('v') || 0) !== PROTO) return fail('Please refresh the page — the game was updated');
    if (create && ms.length) return fail('Room code taken');
    if (!create && !ms.length) return fail('Room not found');
    if (ms.length >= MAX) return fail('Room is full');
    if (this.locked && ms.length) return fail('Match in progress');
    if (!ms.length) this.locked = false;
    const name = (url.searchParams.get('name') || 'Player').replace(/[^\p{L}\p{N} ._\-!?']/gu, '').slice(0, 16) || 'Player';
    let id;
    do { id = Math.random().toString(36).slice(2, 6).toUpperCase(); } while (ms.some((m) => m.att.id === id));
    const a = { id, name, seq: this.seq++, at: Date.now() };
    sock.att = a;
    const all = [...ms.map((m) => m.att), a];
    sock.send(JSON.stringify({ t: 'welcome', id, host: all[0].id, members: all.map(({ id, name }) => ({ id, name })) }));
    const j = JSON.stringify({ t: 'join', m: { id, name } });
    for (const m of ms) m.send(j);
    this.log.push(['join', id, name]);
    if (!this.alarm) this._arm();
  }

  _arm() { this.alarm = setTimeout(() => this._sweep(), SWEEP); this.alarm.unref?.(); }
  _sweep() {
    this.alarm = null;
    const now = Date.now(), limit = this.locked ? SILENT_MATCH : SILENT_LOBBY;
    for (const m of this.members()) {
      const seen = Math.max(m.att.at || 0, this.seen.get(m) || 0, m.autoTs || 0);
      if (now - seen > limit) m.close(4001, 'Connection timed out');
    }
    if (this.members().length) this._arm();
  }

  _message(ws, msg) {
    const me = ws.att;
    if (!me || me.gone) return;
    const now = Date.now();
    this.seen.set(ws, now);
    if (msg.length > MSG_MAX) { this.relay.stats.dropped++; return; }   // oversized: dropped, never fanned out
    let r = this.rate.get(ws);
    if (!r) this.rate.set(ws, (r = { t: now, n: 0, strikes: 0 }));
    if (now - r.t >= 1000) { r.strikes = r.n > RATE ? r.strikes + 1 : Math.max(0, r.strikes - 1); r.t = now; r.n = 0; }
    if (++r.n > RATE * 3 || r.strikes >= BURST_STRIKES) { this.relay.stats.rateKicks++; ws.close(4008, 'Too many messages'); return; }
    this.relay.stats.peakRate = Math.max(this.relay.stats.peakRate, r.n);
    this.relay.stats.maxMsg = Math.max(this.relay.stats.maxMsg, msg.length);
    const c = msg.charCodeAt(0);
    if (c === 98 /* b */ && msg.charCodeAt(1) === 124) {
      const out = 'm|' + me.id + '|' + msg.slice(2);
      for (const s of this.socks) if (s !== ws && s.att && !s.att.gone) s.send(out);
      return;
    }
    if (c === 115 /* s */ && msg.charCodeAt(1) === 124) {
      const k = msg.indexOf('|', 2);
      if (k < 0) return;
      const to = msg.slice(2, k), out = 'm|' + me.id + '|' + msg.slice(k + 1);
      for (const s of this.socks) if (s.att && s.att.id === to && !s.att.gone) { s.send(out); break; }
      return;
    }
    if (c === 123 /* { */) {
      let o; try { o = JSON.parse(msg); } catch { return; }
      if (o.t === 'ping') ws.send(JSON.stringify({ t: 'pong', c: o.c }));
      else if (o.t === 'lock' && this.host() === me.id) { this.locked = !!o.v; this.log.push(['lock', this.locked]); }
    }
  }

  _gone(ws) {
    this.seen.delete(ws); this.rate.delete(ws);
    const a = ws.att;
    this.socks.delete(ws);
    if (!a || a.gone) return;
    a.gone = true;
    const host = this.host();
    const out = JSON.stringify({ t: 'leave', id: a.id, host });
    for (const m of this.members()) m.send(out);
    this.log.push(['leave', a.id, host]);
    if (!this.members().length) { this.locked = false; clearTimeout(this.alarm); this.alarm = null; }
  }
}

// ------------------------------------------------------------------ the Worker's fetch() + the upgrade
function startRelay(port = 8788, host = '127.0.0.1') {
  const rooms = new Map();
  const relay = { rooms, stats: { dropped: 0, rateKicks: 0, peakRate: 0, maxMsg: 0 } };
  const room = (code) => { let r = rooms.get(code); if (!r) rooms.set(code, (r = new Room(code, relay))); return r; };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/health') { res.writeHead(200, { 'access-control-allow-origin': '*' }); res.end('ok'); return; }
    const m = url.pathname.match(/^\/room\/([A-Za-z0-9]+)$/);
    if (!m) { res.writeHead(404); res.end('INKWAVE relay'); return; }
    if (!CODE.test(m[1].toUpperCase())) { res.writeHead(400); res.end('bad code'); return; }
    res.writeHead(426); res.end('expected websocket');
  });
  server.on('upgrade', (req, socket) => {
    const url = new URL(req.url, 'http://x');
    const deny = (st, txt) => { try { socket.write(`HTTP/1.1 ${st}\r\nContent-Type: text/plain\r\nContent-Length: ${txt.length}\r\nConnection: close\r\n\r\n${txt}`); socket.destroy(); } catch { /* gone */ } };
    const m = url.pathname.match(/^\/room\/([A-Za-z0-9]+)$/);
    if (!m) return deny('404 Not Found', 'INKWAVE relay');
    const code = m[1].toUpperCase();
    if (!CODE.test(code)) return deny('400 Bad Request', 'bad code');
    if (String(req.headers.upgrade || '').toLowerCase() !== 'websocket') return deny('426 Upgrade Required', 'expected websocket');
    if (!ORIGIN_OK(req.headers.origin || '')) return deny('403 Forbidden', 'forbidden');
    const key = req.headers['sec-websocket-key'];
    if (!key) return deny('400 Bad Request', 'no key');
    const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
    socket.setNoDelay(true);
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    const r = room(code);
    r.accept(new Sock(socket, r), url);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const p = server.address().port;
      relay.port = p; relay.url = `ws://${host}:${p}`;
      relay.close = () => new Promise((r) => { for (const rm of rooms.values()) for (const s of rm.socks) { try { s.s.destroy(); } catch { /* gone */ } } server.close(() => r()); });
      resolve(relay);
    });
  });
}

module.exports = { startRelay, PROTO, MAX, MSG_MAX, RATE };

if (require.main === module) {
  startRelay(+(process.argv[2] || 8788)).then((r) => console.log(`RELAY ${r.url}`), (e) => { console.error('relay:', e.message); process.exit(1); });
}
