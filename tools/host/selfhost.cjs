// INKWAVE — host the web game and its online relay yourself, on one port, so friends can play from a browser link
// (e.g. through a Cloudflare quick tunnel: `cloudflared tunnel --url http://localhost:8090`) or from the desktop app.
//
//   node tools/host/selfhost.cjs [--root <dir>] [--port 8090] [--host 0.0.0.0]
//
// --root is the game folder to serve (default: this checkout). For a public link serve a clean copy, not a working
// checkout: `tools/host/export.sh <dir>` writes just the game files (index.html, src, assets, vendor, styles, songs).
//
// What it does:
//   - serves the game's files (read-only; no directory listings, no dotfiles, nothing outside --root);
//   - adds <meta name="inkwave-relay" content="same-origin"> to index.html, so the game's rooms use the relay on this
//     same host (src/net/transport.js relayInfo) instead of the deployed one — which only admits the official site;
//   - runs the relay (tools/botlab/relay.cjs: the deployed relay's protocol, room rules and limits) on /room/<CODE>,
//     admitting pages from this host, a *.trycloudflare.com tunnel, localhost, the LAN and the desktop app.
// Desktop app players: ONLINE › SERVER › Friend's server, then paste this server's link (the tunnel link, or
// http://<this Mac's LAN address>:8090). Everyone must run the same game version (the relay turns older / newer
// clients away: "Please refresh the page — the game was updated").
// Music: songs/ only holds what you put there (see songs/README.md) — none ships with the game.
//
// From Node (the botlab's tests): const { startSelfhost } = require('./selfhost.cjs');
//   const s = await startSelfhost({ root, port: 0, host: '127.0.0.1', onOrigin(origin, ok) {} });   // s.url, s.port, s.relay, s.close()
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { attachRelay } = require('../botlab/relay.cjs');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream', '.ktx2': 'image/ktx2', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.wav': 'audio/wav',
  '.flac': 'audio/flac', '.hdr': 'application/octet-stream', '.exr': 'application/octet-stream',
};
const META = '<meta name="inkwave-relay" content="same-origin">';

// the relay admits pages from this host (whatever name it was reached by), a quick tunnel, localhost, the LAN and the
// desktop app (electron/main.cjs serves the game on its privileged app:// scheme — standard + secure — so its pages'
// Origin is exactly app://inkwave)
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-z0-9-]+\.local)(:\d+)?$/i;
const TUNNEL = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i;
const APP = 'app://inkwave';
function originOk(origin, req) {
  if (!origin) return false;
  if (origin === APP || LOCAL.test(origin) || TUNNEL.test(origin)) return true;
  let o; try { o = new URL(origin); } catch { return false; }
  const hosts = [req.headers.host, req.headers['x-forwarded-host']].filter(Boolean).map((h) => String(h).split(',')[0].trim().toLowerCase());
  return hosts.includes(o.host.toLowerCase());
}

function serve(ROOT, req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch { res.writeHead(400); res.end('bad path'); return; }
  if (rel.endsWith('/')) rel += 'index.html';
  // nothing hidden (.git, .env, .botlab …) and nothing outside the root
  if (rel.split('/').some((p) => p.startsWith('.'))) { res.writeHead(404); res.end('not found'); return; }
  const file = path.resolve(ROOT, '.' + rel);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(404); res.end('not found'); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); return; }
    const ext = path.extname(file).toLowerCase();
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' };
    // code and pages revalidate (an update shows on the next load); stage art, fonts and the like may be cached a day
    headers['Cache-Control'] = /\.(html|js|mjs|css|json)$/.test(ext) ? 'no-cache' : 'public, max-age=86400';
    if (ext === '.html') {
      fs.readFile(file, 'utf8', (e, html) => {
        if (e) { res.writeHead(500); res.end(); return; }
        const out = html.includes('name="inkwave-relay"') ? html : html.replace(/<head([^>]*)>/i, (m) => `${m}\n  ${META}`);
        const body = Buffer.from(out, 'utf8');
        res.writeHead(200, { ...headers, 'Content-Length': body.length });
        res.end(req.method === 'HEAD' ? undefined : body);
      });
      return;
    }
    res.writeHead(200, { ...headers, 'Content-Length': st.size });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  });
}

function startSelfhost({ root = path.join(__dirname, '..', '..'), port = 8090, host = '0.0.0.0', onOrigin = null, log = console.log } = {}) {
  const ROOT = path.resolve(root);
  const server = http.createServer();
  const refused = new Set();
  const relay = attachRelay(server, {
    originOk: (origin, req) => {
      const ok = originOk(origin, req);
      if (onOrigin) onOrigin(origin, ok);
      // (once per origin: a friend who can't get in shows up in the log with where they came from)
      if (!ok && !refused.has(origin) && refused.size < 50) { refused.add(origin); log(`${new Date().toISOString()} refused a room connection from origin ${JSON.stringify(origin || '(none)')}`); }
      return ok;
    },
    onRequest: (req, res, url) => serve(ROOT, req, res, url),
  });
  // a line a minute while anyone's playing (rooms and players), so a log shows the server's alive
  const tick = setInterval(() => {
    const live = [...relay.rooms.values()].filter((r) => r.members().length);
    if (live.length) log(`${new Date().toISOString()} rooms ${live.length}, players ${live.reduce((a, r) => a + r.members().length, 0)}`);
  }, 60000);
  tick.unref();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const p = server.address().port, shown = host === '0.0.0.0' || host === '::' ? 'localhost' : host;
      resolve({
        server, relay, root: ROOT, port: p, url: `http://${shown}:${p}`,
        close: () => new Promise((r) => { clearInterval(tick); for (const rm of relay.rooms.values()) for (const s of rm.socks) { try { s.s.destroy(); } catch { /* gone */ } } server.close(() => r()); }),
      });
    });
  });
}

module.exports = { startSelfhost, originOk };

if (require.main === module) {
  const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
  startSelfhost({ root: arg('root', path.join(__dirname, '..', '..')), port: +arg('port', 8090), host: arg('host', '0.0.0.0') }).then((s) => {
    console.log(`INKWAVE self-host: serving ${s.root}`);
    console.log(`  game + relay on ${s.url}  (rooms: /room/<CODE>)`);
  }, (e) => { console.error('selfhost:', e.message); process.exit(1); });
}
