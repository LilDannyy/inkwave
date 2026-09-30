// sfx-cues listening sheet: renders every new sub / special cue sound offline in the game page and writes WAVs.
//   BOTLAB_OUT=… SLOTS=4 tools/botlab/run.sh tools/botlab/jobs/sfx-cues/render.cjs
//   ONLY=fuse_bomb,twister …   just those;  OUT=dir   (default tools/botlab/jobs/sfx-cues/out)
// Writes out/<name>.wav for each, out/cues.wav (all of them in a row, 0.5 s apart), out/cues.txt (what starts when)
// and out/metrics.json (peak / raw peak dBFS, LUFS-M max, clicks, NaNs). The WAVs are git-ignored.
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path');
require(process.env.S + '/offscreen-boot.cjs');
setTimeout(() => { console.log('WATCHDOG'); app.exit(1); setTimeout(() => process.exit(1), 3000); }, +(process.env.WATCHDOG || 900000));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = process.env.OUT || path.join(__dirname, 'out');
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
let claimed = false;
app.on('browser-window-created', (_, win) => {
  if (claimed) return; claimed = true;
  win.webContents.setBackgroundThrottling(false);
  let started = false;
  win.webContents.on('did-finish-load', async () => {
    if (started) return; started = true;
    await win.loadURL('app://inkwave/index.html?autopilot');
    const js = (c) => win.webContents.executeJavaScript(c, true);
    for (let i = 0; i < 80; i++) { if (await js('!!window.__inkwave?.api')) break; await wait(250); }
    try {
      await js(fs.readFileSync(path.join(__dirname, 'render-page.js'), 'utf8'));
      const names = ONLY.length ? ONLY : await js('window.__R.names()');
      fs.mkdirSync(OUT, { recursive: true });
      const metrics = [], chunks = [], index = [];
      let t = 0, bad = 0;
      for (const n of names) {
        const r = await js(`window.__R.render(${JSON.stringify(n)})`);
        if (r.error) { console.log('ERROR', n, r.error.slice(0, 400)); bad++; continue; }
        const buf = Buffer.from(r.wav, 'base64');
        fs.writeFileSync(path.join(OUT, n + '.wav'), buf);
        const pcm = buf.subarray(44), secs = pcm.length / (48000 * 4);
        // trim the sheet copy to the sound's own length (+0.3 s tail)
        const keep = Math.min(pcm.length, Math.ceil((Math.max(0.4, r.dur) + 0.3) * 48000) * 4);
        chunks.push(pcm.subarray(0, keep), Buffer.alloc(Math.floor(0.5 * 48000) * 4));
        index.push(`${t.toFixed(2).padStart(7)} s  ${n}  (${r.mode})`);
        t += keep / (48000 * 4) + 0.5;
        delete r.wav; metrics.push(r);
        const warn = r.nan || r.clicks || r.peak > -0.5 || r.rawPeak > 0 ? '  <-- check' : '';
        console.log(`${n.padEnd(18)} ${r.mode.padEnd(13)} dur ${String(r.dur).padStart(5)}  peak ${String(r.peak).padStart(6)}  raw ${String(r.rawPeak).padStart(6)}  LUFS-M ${String(r.lufsM).padStart(6)}  clicks ${r.clicks}${warn}`);
        void secs;
      }
      // the sheet: one long WAV
      const data = Buffer.concat(chunks), hdr = Buffer.alloc(44);
      hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16);
      hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(48000, 24); hdr.writeUInt32LE(48000 * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
      hdr.write('data', 36); hdr.writeUInt32LE(data.length, 40);
      if (!ONLY.length) {
        fs.writeFileSync(path.join(OUT, 'cues.wav'), Buffer.concat([hdr, data]));
        fs.writeFileSync(path.join(OUT, 'cues.txt'), index.join('\n') + '\n');
      }
      fs.writeFileSync(path.join(OUT, ONLY.length ? 'metrics-only.json' : 'metrics.json'), JSON.stringify(metrics, null, 1));
      console.log(`RENDERED ${metrics.length}/${names.length}${bad ? `, ${bad} failed` : ''} → ${OUT}`);
    } catch (e) { console.log('HARNESS ERROR', e.message); }
    app.quit();
  });
});
