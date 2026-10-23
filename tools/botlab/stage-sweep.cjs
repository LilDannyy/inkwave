// Botlab stage sweep: every tagged structure of one half of a stage seen from where a player stands next to it (1.7 m
// over the floor they walk past), one contact sheet per cluster, for art reviews: nothing at eye level goes unseen.
// (Gulper Aquarium's review 7 built it; every stage review since uses it. tools/botlab/README.md, "Stages".)
//   MAP=aquarium TIME=day OUT=/path/dir tools/botlab/run.sh tools/botlab/stage-sweep.cjs
// The views: every tagged block of Alpha's half (centre z <= ZMAX, default 0.3; the tags in SKIP are not swept, default
// the floors and rails: ground,promenade,feeding-deck,tank-bed,rail; UNTAGGED=1 sweeps untagged blocks too, as
// '(untagged)') is grouped with the same tag's blocks less than 1 m from it into a cluster. Round each cluster 3–8 eye
// positions are picked, one per bearing sector (one per ~6 m of its outline): 1.7 m over a walkable nav node 1–8 m from
// the cluster (nearest 3.2 m wins), 2.5 m under its foot to 3.2 m over its top, with a clear line of sight to it.
// Clusters with no such position (overhead pieces, things nobody walks past) are listed as NO EYE-LEVEL VIEW.
// OUT gets:
//   views.json     the cameras (VIEWS=<a views.json> shoots those instead of generating: before / after, same cameras)
//   shots/<view>.jpg, sheets/<nnn>-<tag>.<k>.jpg (one per cluster, its views labelled with their eye positions)
//   clusters.txt   every cluster (tag.k, blocks, box, views), the NO EYE-LEVEL VIEW ones first
// BEFORE=<an earlier run's OUT>: each sheet puts that run's shot (row "before") over this run's ("after"), and
//   clusters.txt gives every cluster's largest per-view change (the share of the frame, in %, whose pixels moved by more
//   than 20/255 at 320 × 180) and lists the CHANGED ones (over CHANGE, default 0.3 %). The scene's own animation (the sea,
//   bubbles, fish, clouds) moves too: read the sheets. SHEETS_ONLY=1 re-draws the sheets and the list from OUT's shots
//   (with BEFORE: a new pairing) without shooting.
// TWIN=1: Bravo's twins (every view turned (x, z) → (−x, −z); names, shots and sheets suffixed -B). ONLY=<regex>: only
//   the views whose names match. MODE=turf (default) / zones / tower. W / H the shot size (1280 × 720).
// The page runs the game's DEFAULT_SETTINGS (quality high; each view at fov 70), bots off, actors, HUD and paint
// cleared; each picture is the frame painted after its own stepped frame. WATCHDOG=ms (default 3,000,000).
const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
require(process.env.S + '/offscreen-boot.cjs');
const MAP = process.env.MAP || 'aquarium', TIME = process.env.TIME || 'day', MODE = process.env.MODE || 'turf';
const OUT = process.env.OUT || `${process.env.BOTLAB_ROOT || '.'}/.botlab/sweep-${MAP}-${TIME}`;
const TWIN = process.env.TWIN === '1', BEFORE = process.env.BEFORE || '', CHANGE = +(process.env.CHANGE || 0.3), SHEETS_ONLY = process.env.SHEETS_ONLY === '1';
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const SKIP = (process.env.SKIP ?? 'ground,promenade,feeding-deck,tank-bed,rail').split(',').filter(Boolean);
const ZMAX = +(process.env.ZMAX ?? 0.3), UNTAGGED = process.env.UNTAGGED === '1';
const T0 = Date.now(), ts = () => ((Date.now() - T0) / 1000).toFixed(0) + 's';
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); }, +(process.env.WATCHDOG || 3000000));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const SUF = TWIN ? '-B' : '';
// (a hand-made VIEWS list — [{ name, from, look, fov? }] — groups by `cluster`, else by its name less a trailing -n / .n)
const clusterOf = (v) => (v.tag != null ? `${v.tag}.${v.k}` : (v.cluster || v.name.replace(/[-.]\d+$/, '')));
// a contact sheet, drawn in the page (a 2D canvas): cells in row-major order ({ label, b64, color } or null), a title
// line; JPEG under 290 KB (the quality steps down until it fits)
const SHEET = `async (spec) => {
  const load = (b64) => new Promise((res) => { if (!b64) return res(null); const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'data:image/jpeg;base64,' + b64; });
  const { cols, tw, th, title, cells } = spec, rows = Math.ceil(cells.length / cols), LH = 20, HH = 28;
  const c = document.createElement('canvas'); c.width = cols * tw; c.height = HH + rows * (th + LH);
  const x = c.getContext('2d'); x.fillStyle = '#141416'; x.fillRect(0, 0, c.width, c.height);
  x.font = '600 16px Helvetica, Arial, sans-serif'; x.fillStyle = '#ffd65a'; x.fillText(title, 6, 19);
  x.font = '13px Helvetica, Arial, sans-serif';
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]; if (!cell) continue;
    const X = (i % cols) * tw, Y = HH + Math.floor(i / cols) * (th + LH);
    x.fillStyle = cell.color || '#f0e6c8'; x.fillText(cell.label, X + 5, Y + 15);
    const im = await load(cell.b64);
    if (im) x.drawImage(im, X, Y + LH, tw, th); else { x.fillStyle = '#3c0000'; x.fillRect(X, Y + LH, tw, th); }
  }
  for (let q = 0.86; ; q -= 0.06) { const u = c.toDataURL('image/jpeg', q); if (u.length * 0.75 < 290000 || q < 0.4) return u.slice(u.indexOf(',') + 1); }
}`;
// a view's change: the share of its frame (in %, at 320 × 180) whose pixels moved by more than 20/255 (the channels'
// mean) — a stencil on a small box shows, the JPEG's own noise does not
const small = (img) => img.resize({ width: 320, height: 180, quality: 'good' }).getBitmap();
const mad = (a, b) => { if (!a || !b || a.length !== b.length) return null; let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) n++; return (100 * n) / (a.length / 4); };
const tile = (img) => (img && !img.isEmpty() ? img.resize({ width: 400, height: 225, quality: 'good' }).toJPEG(88).toString('base64') : null);

let claimed = false;
app.on('browser-window-created', (_, win) => {
  if (claimed) return; claimed = true;
  const logs = [];
  win.webContents.on('console-message', (e) => { const m = String(e.message); if (/error|warn/i.test(String(e.level)) && !/Security Warning|Autofill/.test(m)) logs.push(`[${e.level}] ${m.slice(0, 300)}`); });
  let frame = null, paints = 0; win.webContents.on('paint', (_e, _d, img) => { frame = img; paints++; });
  win.webContents.once('did-finish-load', () => run().catch((e) => { console.log('HARNESS ERROR', e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e); app.exit(2); }));
  const run = async () => {
    win.setContentSize(W, H);
    const js = (c) => win.webContents.executeJavaScript(c, true);
    for (let i = 0; i < 160; i++) { if (await js('!!window.__inkwave?.api')) break; await wait(250); }
    await js('window.__inkwave._onPointerUnlock = () => {}; 0');
    for (const d of ['shots', 'sheets']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
    await js(`(async () => { const { DEFAULT_SETTINGS } = await import('./src/config.js'); const g = window.__inkwave; Object.assign(g.settings, DEFAULT_SETTINGS); g.R.applySettings(g.settings); return 1; })()`);
    await js(`window.__inkwave.api.startMatch({ mapId: '${MAP}', duration: 180, time: '${TIME}', mode: '${MODE}' })`);
    { const got = await js(`(window.__inkwave.mapDef && window.__inkwave.mapDef.id) || null`); if (got !== MAP) { console.log(`MAP MISMATCH: asked for ${MAP}, the game built ${got}`); app.exit(3); return; } }
    for (let i = 0; i < 400; i++) { if (await js(`window.__inkwave.match?.state === 'playing'`)) break; await wait(250); }
    await js(`(() => { const g = window.__inkwave; for (const a of g.match.actors) a.bot = null; return 1; })()`);
    await wait(1500);
    const info = await js(`(() => { const g = window.__inkwave, L = __G.level; return { map: '${MAP}', time: '${TIME}', mode: '${MODE}', quality: g.settings.quality, fov: g.settings.fov, lightSize: L.lightSize, layoutHash: L.layoutHash, blocks: L.blocks.length, nav: __G.nav.nodes.length }; })()`);
    console.log('SETTINGS', ts(), JSON.stringify(info));
    let views;
    if (!process.env.VIEWS && !SHEETS_ONLY) {
      views = await js(`(() => {
        const L = __G.level, nav = __G.nav, ph = __G.physics, V3 = L.blocks[0].center.constructor;
        const SKIP = new Set(${JSON.stringify(SKIP)}), ZMAX = ${ZMAX}, UNTAGGED = ${UNTAGGED};
        const groups = new Map();
        for (const b of L.blocks) {
          const tag = b.tag || (UNTAGGED ? '(untagged)' : null);
          if (!tag || SKIP.has(tag)) continue;
          if (!isFinite(b.aabbMin.x)) continue;
          if ((b.aabbMin.z + b.aabbMax.z) / 2 > ZMAX) continue;
          if (!groups.has(tag)) groups.set(tag, []); groups.get(tag).push(b);
        }
        // (a cluster: the same tag's blocks chained by gaps under 1 m in plan)
        const gap = (a, b) => Math.max(0, a.aabbMin.x - b.aabbMax.x, b.aabbMin.x - a.aabbMax.x, a.aabbMin.z - b.aabbMax.z, b.aabbMin.z - a.aabbMax.z);
        const clusters = [];
        for (const [tag, bs] of groups) {
          const par = bs.map((_, i) => i), f = (i) => (par[i] === i ? i : (par[i] = f(par[i])));
          for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) if (gap(bs[i], bs[j]) < 1.0) par[f(i)] = f(j);
          const m = new Map(); bs.forEach((b, i) => { const r = f(i); if (!m.has(r)) m.set(r, []); m.get(r).push(b); });
          let k = 0;
          for (const list of m.values()) {
            const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
            for (const b of list) for (const [i, a] of ['x', 'y', 'z'].entries()) { mn[i] = Math.min(mn[i], b.aabbMin[a]); mx[i] = Math.max(mx[i], b.aabbMax[a]); }
            clusters.push({ tag, k: k++, n: list.length, mn, mx, hidden: list.every((b) => b.hidden) });
          }
        }
        const valid = nav.valid || null;
        const nodes = nav.nodes.filter((n) => !valid || valid[n.id]);
        const E = new V3(), T = new V3(), Q = new V3();
        const r2 = (v) => +v.toFixed(2), views = [];
        for (const c of clusters) {
          const cx = (c.mn[0] + c.mx[0]) / 2, cz = (c.mn[2] + c.mx[2]) / 2, ex = c.mx[0] - c.mn[0], ez = c.mx[2] - c.mn[2];
          const nv = Math.max(3, Math.min(8, Math.round((2 * (ex + ez)) / 6)));
          const cand = [];
          for (const n of nodes) {
            const dx = Math.max(c.mn[0] - n.x, 0, n.x - c.mx[0]), dz = Math.max(c.mn[2] - n.z, 0, n.z - c.mx[2]), d = Math.hypot(dx, dz);
            if (d < 1.0 || d > 8.0) continue;
            if (n.y < c.mn[1] - 2.5 || n.y > c.mx[1] + 3.2) continue;
            E.set(n.x, n.y + 1.7, n.z);
            const tx = Math.min(c.mx[0], Math.max(c.mn[0], n.x)), tz = Math.min(c.mx[2], Math.max(c.mn[2], n.z));
            const ty = Math.min(c.mx[1] - 0.1, Math.max(c.mn[1] + 0.2, n.y + 0.9));
            T.set(tx, ty, tz); Q.copy(E).sub(T); const ql = Q.length(); if (ql < 0.5) continue;
            Q.multiplyScalar(0.35 / ql).add(T);
            if (!ph.los(E, Q)) continue;
            cand.push({ n, d, brg: Math.atan2(n.z - cz, n.x - cx), t: [tx, ty, tz] });
          }
          const picked = [];
          for (let s = 0; s < nv; s++) {
            const a0 = -Math.PI + (s * 2 * Math.PI) / nv, a1 = a0 + (2 * Math.PI) / nv;
            let best = null, bs = Infinity;
            for (const q of cand) {
              if (q.brg < a0 || q.brg >= a1) continue;
              if (picked.some((p) => Math.hypot(p.n.x - q.n.x, p.n.z - q.n.z) < 1.8)) continue;
              const sc = Math.abs(q.d - 3.2); if (sc < bs) { bs = sc; best = q; }
            }
            if (best) picked.push(best);
          }
          const base = { tag: c.tag, k: c.k, n: c.n, hidden: c.hidden, mn: c.mn.map(r2), mx: c.mx.map(r2) };
          // (a big cluster's view looks at its nearest point; a small one's at its middle)
          picked.forEach((q, i) => views.push({ name: c.tag + '.' + c.k + '.' + i, ...base, from: [r2(q.n.x), r2(q.n.y + 1.7), r2(q.n.z)],
            look: (Math.max(ex, ez) > 7 ? q.t : [cx, q.t[1], cz]).map(r2), d: r2(q.d) }));
          if (!picked.length) views.push({ name: c.tag + '.' + c.k + '.none', ...base, none: true });
        }
        return views;
      })()`);
    } else views = JSON.parse(fs.readFileSync(process.env.VIEWS || path.join(OUT, 'views.json'), 'utf8'));
    fs.writeFileSync(path.join(OUT, 'views.json'), JSON.stringify(views));
    const none = views.filter((v) => v.none);
    console.log(`VIEWS ${views.length - none.length} views of ${new Set(views.map(clusterOf)).size} clusters, ${none.length} cluster(s) with NO EYE-LEVEL VIEW`);
    let shoot = views.filter((v) => !v.none && (!ONLY || ONLY.test(v.name))).map((v) => ({ ...v, ck: clusterOf(v) }));
    if (TWIN) shoot = shoot.map((v) => ({ ...v, name: v.name + SUF, from: [-v.from[0], v.from[1], -v.from[2]], look: [-v.look[0], v.look[1], -v.look[2]] }));
    await js(`(async () => {
      const g = window.__inkwave;
      g.debug.freeze();
      for (const a of g.match.actors) { a.character.setVisible(false); a.character.root.visible = false; } __G.projectiles.clear();
      __G.paint.clear();
      g.hud?.setVisible(false); g.menus?.show(null);
      document.querySelectorAll('.iw-hud, .iw-ui, #fade').forEach((e) => { e.style.visibility = 'hidden'; });
      return 1;
    })()`);
    const stepPaint = async () => { const p0 = paints; await js(`window.__inkwave.debug.step(1000 / 60); 0`); for (let i = 0; i < 200 && paints <= p0; i++) await wait(25); };
    let n = 0;
    for (const spec of SHEETS_ONLY ? [] : shoot) {
      const ok = await js(`(async () => {
        const g = window.__inkwave, THREE = await import('three');
        const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
        const P = ${JSON.stringify({ from: spec.from, look: spec.look, fov: spec.fov })};
        if (g.match && g.match.time < 100) g.match.time = 170;
        __G.paint.clear();
        g.settings.fov = P.fov || 70;
        g.rig.cinematic(V(P.from), V(P.from), V(P.look), V(P.look), 99, () => {});
        for (let i = 0; i < 3; i++) g.debug.step(1000 / 60);
        return true;
      })()`);
      if (ok !== true) { console.log('SHOT FAIL', spec.name, ok); continue; }
      await wait(150);
      await stepPaint(); await wait(100); await stepPaint(); await wait(150);
      if (frame) fs.writeFileSync(path.join(OUT, 'shots', spec.name + '.jpg'), frame.toJPEG(86));
      n++; if (n % 50 === 0) console.log('shot', n, ts());
    }
    console.log('SHOTS', n, ts());
    // the sheets: one per cluster (in the views' order), and the cluster list
    const byC = new Map();
    for (const v of shoot) { const c = v.ck; if (!byC.has(c)) byC.set(c, []); byC.get(c).push(v); }
    const meta = new Map();
    for (const v of views) { const c = clusterOf(v); if (!meta.has(c)) meta.set(c, v); }
    const rows = [], changed = [];
    let si = 0;
    for (const [c, vs] of byC) {
      const m = meta.get(c), cells = [];
      const img = (dir, v) => { const f = path.join(dir, 'shots', v.name + '.jpg'); return fs.existsSync(f) ? nativeImage.createFromPath(f) : null; };
      const lab = (v) => `${v.name}  @(${v.from.map((x) => x.toFixed(1)).join(', ')})`;
      let worst = null;
      if (BEFORE) {
        for (let s = 0; s < vs.length; s += 4) {
          const ch = vs.slice(s, s + 4), after = ch.map((v) => img(OUT, v)), before = ch.map((v) => img(BEFORE, v));
          const dif = ch.map((_, i) => (after[i] && before[i] ? mad(small(after[i]), small(before[i])) : null));
          for (const d of dif) if (d != null) worst = Math.max(worst ?? 0, d);
          for (let i = 0; i < 4; i++) cells.push(ch[i] ? { label: `BEFORE ${ch[i].name}`, b64: tile(before[i]), color: '#9fb4c8' } : null);
          for (let i = 0; i < 4; i++) cells.push(ch[i] ? { label: `AFTER ${lab(ch[i])}${dif[i] != null ? `  Δ ${dif[i].toFixed(1)} %` : ''}`, b64: tile(after[i]), color: dif[i] > CHANGE ? '#ffb36b' : '#f0e6c8' } : null);
        }
      } else for (const v of vs) cells.push({ label: lab(v), b64: tile(img(OUT, v)) });
      const box = m.mn ? `  box (${m.mn.join(', ')}) … (${m.mx.join(', ')})` : '';
      const title = `${MAP} · ${TIME}${TWIN ? ' · Bravo twin' : ''} · ${c}${SUF}${m.n ? ` · ${m.n} block(s)` : ''}${box}${BEFORE ? `  ·  changed up to ${worst == null ? '–' : worst.toFixed(1)} % of a view` : ''}`;
      // (the page draws it; a GPU stall on a loaded machine must not hang the run)
      const b64 = await Promise.race([js(`(${SHEET})(${JSON.stringify({ cols: 4, tw: 400, th: 225, title, cells })})`), wait(60000).then(() => null)]);
      if (!b64) { console.log(`SHEET TIMEOUT ${c}${SUF}`); continue; }
      const sheet = `${String(si++).padStart(3, '0')}-${c}${SUF}.jpg`.replace(/[^\w.()+-]/g, '_');
      fs.writeFileSync(path.join(OUT, 'sheets', sheet), Buffer.from(b64, 'base64'));
      rows.push({ c, m, nv: vs.length, worst, sheet });
      if (worst != null && worst > CHANGE) changed.push(c);
    }
    const L = [`# stage-sweep ${JSON.stringify(info)}${TWIN ? ' TWIN' : ''}${BEFORE ? ` BEFORE=${BEFORE}` : ''}`,
      `# ${shoot.length} views of ${byC.size} clusters shot; ${none.length} cluster(s) with no eye-level view`, '',
      `NO EYE-LEVEL VIEW (${none.length}):`, ...none.map((v) => `  ${clusterOf(v)}  ${v.n} block(s)  box (${v.mn.join(', ')}) … (${v.mx.join(', ')})${v.hidden ? '  hidden' : ''}`), ''];
    if (BEFORE) L.push(`CHANGED (a view more than ${CHANGE} % changed): ${changed.length}`, ...changed.map((c) => `  ${c}${SUF}  Δ ${rows.find((r) => r.c === c).worst.toFixed(1)} %`), '');
    L.push('CLUSTERS:', ...rows.map((r) => `  ${r.c}${SUF}  ${r.m.n ?? '?'} block(s)  ${r.nv} view(s)${r.worst != null ? `  Δ ${r.worst.toFixed(1)} %` : ''}  ${r.sheet}${r.m.mn ? `  box (${r.m.mn.join(', ')}) … (${r.m.mx.join(', ')})` : ''}`));
    fs.writeFileSync(path.join(OUT, `clusters${SUF}.txt`), L.join('\n') + '\n');
    console.log(`SHEETS ${rows.length} in ${path.join(OUT, 'sheets')}; ${path.join(OUT, `clusters${SUF}.txt`)}`);
    for (const v of none) console.log(`NO EYE-LEVEL VIEW ${clusterOf(v)}`);
    if (BEFORE) console.log(`CHANGED ${changed.length}: ${changed.join(' ')}`);
    const uniq = [...new Set(logs)];
    console.log(`CONSOLE ${uniq.length} unique warning/error line(s)`); for (const l of uniq.slice(0, 30)) console.log('  ' + l);
    app.quit();
  };
});
