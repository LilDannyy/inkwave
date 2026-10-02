// INKWAVE — host the web game and its online relay yourself, on one port, so friends can play from a browser link
// (e.g. through a Cloudflare quick tunnel: `cloudflared tunnel --url http://localhost:8090`).
//
//   node tools/host/selfhost.cjs [--root <dir>] [--port 8090] [--host 0.0.0.0]
//
// --root is the game folder to serve (default: this checkout). For a public link serve a clean copy, not a working
// checkout: `tools/host/export.sh <dir>` writes just the game files (index.html, src, assets, vendor, styles, songs).
//
// What it does:
//   - serves the game's files (read-only; no directory listings, no dotfiles, nothing outside --root);
//   - adds <meta name="inkwave-relay" content="same-origin"> to index.html, so the game's rooms use the relay on this
//     same host (src/net/transport.js relayURL) instead of the deployed one — which only admits the official site;
//   - runs the relay (tools/botlab/relay.cjs: the deployed relay's protocol, room rules and limits) on /room/<CODE>,
//     admitting pages from this host, a *.trycloudflare.com tunnel, localhost and the LAN.
// Music: songs/ only holds what you put there (see songs/README.md) — none ships with the game.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { attachRelay } = require('../botlab/relay.cjs');

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const ROOT = path.resolve(arg('root', path.join(__dirname, '..', '..')));
const PORT = +arg('port', 8090), HOST = arg('host', '0.0.0.0');

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

// the relay admits pages from this host (whatever name it was reached by), a quick tunnel, localhost and the LAN
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-z0-9-]+\.local)(:\d+)?$/i;
const TUNNEL = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i;
function originOk(origin, req) {
  if (!origin) return false;
  if (LOCAL.test(origin) || TUNNEL.test(origin)) return true;
  let o; try { o = new URL(origin); } catch { return false; }
  const hosts = [req.headers.host, req.headers['x-forwarded-host']].filter(Boolean).map((h) => String(h).split(',')[0].trim().toLowerCase());
  return hosts.includes(o.host.toLowerCase());
}

function serve(req, res, url) {
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

const server = http.createServer();
const relay = attachRelay(server, { originOk, onRequest: serve });
server.listen(PORT, HOST, () => {
  console.log(`INKWAVE self-host: serving ${ROOT}`);
  console.log(`  game + relay on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}  (rooms: /room/<CODE>)`);
});
// a line a minute while anyone's playing (rooms and players), so a log shows the server's alive
setInterval(() => {
  const n = relay.rooms.size;
  if (n) console.log(`${new Date().toISOString()} rooms ${n}, players ${[...relay.rooms.values()].reduce((a, r) => a + (r.socks?.size ?? r.socks?.length ?? 0), 0)}`);
}, 60000).unref();
