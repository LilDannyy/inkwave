// sfx-cues listening sheet (the page side of render.cjs): renders sounds offline (OfflineAudioContext, the game's own
// AudioEngine and master chain) and measures them. window.__R.render(name) → { name, mode, dur, peak, rawPeak, lufsM,
// clicks, nan, wav (base64 16-bit PCM) }. Loops are rendered ~3.2 s: warnings with their progress param swept 0 → 1
// (foe timbre), movers passing the listener left → right 3 m in front (Doppler as src/audio/cues.js computes it).
(async () => {
  const A = await import('./src/audio/audio.js');
  const { CUE_GROUPS } = await import('./src/audio/sfx-cues.js');
  const SR = 48000;
  const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
  const K1 = { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] };
  const K2 = { b: [1, -2, 1], a: [-1.99004745483398, 0.99007225036621] };
  function biq(x, c) {
    const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const v = c.b[0] * x[i] + c.b[1] * x1 + c.b[2] * x2 - c.a[0] * y1 - c.a[1] * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
    return y;
  }
  function analyze(buf) {
    const n = buf.length, L = buf.getChannelData(0), R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
    let peak = 0, nan = 0, last = -1;
    for (let i = 0; i < n; i++) { const l = L[i], r = R[i]; if (!Number.isFinite(l) || !Number.isFinite(r)) { nan++; continue; } const a = Math.max(Math.abs(l), Math.abs(r)); if (a > peak) peak = a; if (a > 0.001) last = i; }
    const kl = biq(biq(L, K1), K2), kr = R === L ? kl : biq(biq(R, K1), K2);
    const B = Math.floor(0.4 * SR), H = Math.floor(0.1 * SR); let mx = 0;
    for (let s = 0; s + B <= n; s += H) { let z = 0; for (let i = s; i < s + B; i++) z += kl[i] * kl[i] + kr[i] * kr[i]; mx = Math.max(mx, z / B); }
    // clicks: isolated single-sample steps far above the local activity (as tools/audio-test.mjs)
    const mono = new Float32Array(n); for (let i = 0; i < n; i++) mono[i] = (L[i] + R[i]) * 0.5;
    const pre = new Float64Array(n + 1); for (let i = 1; i < n; i++) { const d = mono[i] - mono[i - 1]; pre[i + 1] = pre[i] + d * d; }
    let clicks = 0; const W = 512;
    for (let i = 2; i < n - 1; i++) {
      const d = Math.abs(mono[i] - mono[i - 1]); if (d < 0.03) continue;
      const lo = Math.max(1, i - W), hi = Math.min(n - 1, i + W), loc = Math.sqrt((pre[hi + 1] - pre[lo]) / (hi - lo + 1));
      const iso = d > 3 * Math.max(Math.abs(mono[i - 1] - mono[i - 2]), Math.abs(mono[i + 1] - mono[i]));
      if (d / (loc || 1e-9) > 16 && iso) { clicks++; i += W; }
    }
    return { dur: last > 0 ? +(last / SR).toFixed(2) : 0, peak: +db(peak).toFixed(1), lufsM: +(mx > 0 ? -0.691 + 10 * Math.log10(mx) : -99).toFixed(1), nan, clicks };
  }
  function wav(buf) {
    const n = buf.length, ch = buf.numberOfChannels, dv = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true); dv.setUint16(22, ch, true); dv.setUint32(24, SR, true); dv.setUint32(28, SR * ch * 2, true);
    dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * ch * 2, true);
    const cs = [...Array(ch)].map((_, c) => buf.getChannelData(c)); let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { dv.setInt16(o, Math.max(-1, Math.min(1, cs[c][i])) * 32767, true); o += 2; }
    let s = ''; const u8 = new Uint8Array(dv.buffer);
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }
  // loops: which param sweeps 0 → 1 (warnings), which pass by (movers)
  const SWEEP = { fuse_bomb: { k: 1, roll: 0 }, fuse_sticky: { k: 1 }, hunt_alarm: { close: 1 }, lock_tone: { k: 1 }, shaker_rattle: { k: 1, armed: 1 },
    slam_warn: 'slam', strike_mark: { k: 1 }, beam_lock: { k: 1 }, kraken_dive: { k: 1 }, orb_fuse: { k: 1 }, bubble_drift: { charge: 1 },
    curtain_drip: { life: 0 }, mist_hiss: { life: 0.2 }, kraken_move: { speed: 1 }, stamp_carry: { speed: 1 }, seeker_run: { speed: 1, dash: 1 } };
  const PASS = new Set(['sub_fly', 'seeker_run', 'twister', 'stamp_fly', 'orb_fly', 'zip_whizz', 'kraken_move', 'shaker_rattle', 'torpedo_whirr', 'tracer_hum', 'waddle_walk', 'boomerang_whirr']);
  const DUR = { fuse_bomb: 0.95, fuse_sticky: 2.4, orb_fuse: 1.5, beam_lock: 1.3, strike_mark: 2.2, slam_warn: 1.1, kraken_dive: 0.7, lock_tone: 1.5 };
  async function render(name, raw) {
    const d = A.SFX[name];
    if (!d) return null;
    const isLoop = !d.build && !!d.loop;
    const secs = isLoop ? 3.4 : Math.min(4.5, 3);
    const ctx = new OfflineAudioContext(2, Math.floor(SR * secs), SR);
    const eng = new A.AudioEngine({ context: ctx, seed: 77, music: false, raw });
    eng.init();
    eng.setVolumes({ master: 1, music: 1, sfx: 1 });
    eng.master.gain.value = 1; eng.sfxBus.gain.value = 1;
    if (!isLoop) { eng.play(name, { at: 0.1 }); return { buf: await ctx.startRendering(), mode: 'shot' }; }
    eng.setListener({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 });
    const sweep = SWEEP[name], pass = PASS.has(name), T0 = 0.1, span = DUR[name] || 2.6;
    let h = null;
    const pos = (t) => ({ x: -14 + 28 * Math.min(1, Math.max(0, (t - T0) / 2.8)), y: 0.5, z: -3 });
    // the director's Doppler: radial speed toward the listener → pitch (c_eff 55 m/s, clamped)
    const dop = (t) => { const p0 = pos(t), p1 = pos(t + 0.05), vx = (p1.x - p0.x) / 0.05; const dist = Math.hypot(p0.x, p0.z); const vr = -(p0.x * vx) / (dist || 1); return Math.min(1.22, Math.max(0.84, 1 / (1 - vr / 55))); };
    ctx.suspend(T0).then(() => { h = eng.loop(name, { volume: 1, pitch: pass ? dop(T0) : 1, pos: pass ? pos(T0) : undefined, params: sweep && sweep !== 'slam' ? Object.fromEntries(Object.keys(sweep).map((k) => [k, 0])) : { phase: 0, k: 0 } }); ctx.resume(); });
    for (let t = T0 + 0.05; t < 3.05; t += 0.05) {
      const tt = t;
      ctx.suspend(+tt.toFixed(4)).then(() => {
        const o = {};
        if (pass) { o.pos = pos(tt); o.pitch = dop(tt); }
        const u = Math.min(1, (tt - T0) / span);
        if (sweep === 'slam') o.params = u < 0.55 ? { phase: 0, k: u / 0.55 } : u < 0.75 ? { phase: 1, k: (u - 0.55) / 0.2 } : { phase: 2, k: (u - 0.75) / 0.25 };
        else if (sweep) o.params = Object.fromEntries(Object.entries(sweep).map(([k, v]) => [k, v === 0 ? 1 - u : v * u]));
        h?.set(o); ctx.resume();
      });
    }
    ctx.suspend(3.1).then(() => { h?.stop(0.15); ctx.resume(); });
    return { buf: await ctx.startRendering(), mode: pass ? 'loop pass-by' : sweep ? 'loop sweep' : 'loop' };
  }
  window.__R = {
    names: () => [...CUE_GROUPS.Subs, ...CUE_GROUPS.Specials],
    async render(name) {
      try {
        const r = await render(name, false);
        if (!r) return { name, error: 'no such sound' };
        const raw = await render(name, true);
        return { name, mode: r.mode, ...analyze(r.buf), rawPeak: analyze(raw.buf).peak, wav: wav(r.buf) };
      } catch (e) { return { name, error: String(e && e.stack || e) }; }
    },
  };
  return true;
})()
