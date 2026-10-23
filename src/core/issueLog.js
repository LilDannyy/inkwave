// Small in-memory issue ring shared by the desktop and hosted builds.
import { G } from './ctx.js';

const CAP = 500, entries = new Array(CAP), pending = [];
let head = 0, size = 0, installed = false, sendAt = 0, stuck = new WeakMap();
const original = {};
const clean = (v) => {
  let s = String(v == null ? '' : v).replace(/\b[A-Z0-9]{5,8}\b/g, '[code]');
  for (const a of [...(G.match?.actors || []), ...(G.net?.lobby?.players || [])]) if (a?.name) s = s.split(String(a.name)).join('[player]');
  return s.slice(0, 1200);
};
// [b5-caldera] the lava's match module (src/game/lava.js) has a state() method: log its phase ('low' | 'rise' | 'high' |
// 'fall'), never the function — the desktop build sends each row over IPC, which cannot clone one, so every row threw
// on Highmark Foundry (inside Game._frame for a stuck bot or a slow frame, and inside every console.warn / error)
const lavaOf = (lv) => (lv == null ? null : typeof lv.state === 'function' ? (lv.st?.phase ?? null) : (lv.state ?? null));
function details() {
  const m = G.match, stage = G.game?.mapDef?.id || G.level?.mapId || null;
  return { build: window.inkwaveNative?.buildCommit?.() || document.querySelector('meta[name="inkwave-build"]')?.content || 'unknown', mode: m?.mode || G.mode || 'unknown', stage,
    era: m?.stage?.era ?? G.stageWorld?.era ?? null, lava: lavaOf(m?.lava) ?? lavaOf(G.lava), online: !!G.netm };
}
function append(kind, message, extra = {}) {
  const row = { at: new Date().toISOString(), kind, message: clean(message), ...details(), ...extra };
  entries[head] = row; head = (head + 1) % CAP; size = Math.min(CAP, size + 1);
  if (pending.length === CAP) pending.shift(); pending.push(row);
  if (window.inkwaveNative?.issue) {   // [b5-caldera] a row IPC cannot clone is sent as its JSON; the log never throws into its caller
    try { window.inkwaveNative.issue(row); } catch (e) { try { window.inkwaveNative.issue(JSON.parse(JSON.stringify(row))); } catch (e2) { /* dropped */ } }
  }
  else if (location.protocol !== 'app:') schedulePost();
  return row;
}
function snapshot() { const out = new Array(size); for (let i = 0; i < size; i++) out[i] = entries[(head - size + i + CAP) % CAP]; return out; }
function schedulePost() { if (sendAt) return; sendAt = setTimeout(() => { sendAt = 0; flush(); }, 10000); }
function flush() {
  if (!pending.length || location.protocol === 'app:') return;
  const batch = []; let bytes = 16;
  while (pending.length) { const row = pending[0], n = JSON.stringify(row).length + 1; if (batch.length && bytes + n > 7800) break; batch.push(pending.shift()); bytes += n; }
  fetch('/issue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ entries: batch }), keepalive: true, credentials: 'same-origin' }).catch(() => {});
  if (pending.length) schedulePost();
}
export const issueLog = { append, snapshot, flush, frame(ms) { if (G.mode === 'match' && G.match && !G.match.loading && ms > 250) append('slow-frame', `frame ${Math.round(ms)} ms`); },
  bots(dt) {
    const actors = G.match?.actors; if (!actors) return;
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i], b = a.bot; if (!b || (a.isLocal === false && a.remote) || !a.alive) continue;
      let s = stuck.get(b); if (!s) s = { t: 0, x: a.pos.x, y: a.pos.y, z: a.pos.z };
      const moved = Math.hypot(a.pos.x - s.x, a.pos.z - s.z, (a.pos.y - s.y) * 0.5) > 0.08;
      if (moved) s.t = 0;
      else if ((b.noProg || b.stuck || 0) > 0 || s.t > 0) s.t += dt;
      s.x = a.pos.x; s.y = a.pos.y; s.z = a.pos.z;
      if (s.t > 5 && !b._issueStuckLogged) { b._issueStuckLogged = true; append('stuck-bot', 'bot stuck episode exceeded 5 seconds', { duration: +s.t.toFixed(1) }); }
      if (!s.t) b._issueStuckLogged = false;
      stuck.set(b, s);
    }
  } };
if (typeof window !== 'undefined') window.__issueLog = issueLog;
if (!installed && typeof window !== 'undefined') {
  installed = true;
  for (const k of ['error', 'warn']) { original[k] = console[k]; console[k] = function (...args) { append(`console-${k}`, args.map((x) => x?.stack || x?.message || String(x)).join(' ')); return original[k].apply(this, args); }; }
  window.addEventListener('error', (e) => append('window-error', e.message || e.error?.stack || 'window error'));
  window.addEventListener('unhandledrejection', (e) => append('unhandled-rejection', e.reason?.stack || e.reason?.message || e.reason));
  window.addEventListener('beforeunload', flush);
}
