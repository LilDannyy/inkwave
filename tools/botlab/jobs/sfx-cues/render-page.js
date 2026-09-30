// sfx-cues listening sheet (the page side of render.cjs): renders sounds offline (OfflineAudioContext, the game's own
// AudioEngine and master chain) and measures them.
//   window.__R.sheet()        → [[label, [entry …]] …]: every sub and special, its sounds in phase order
//   window.__R.render(entry)  → { name, mode, dur, peak, rawPeak, lufsM, clicks, nan, bands, env, wav (base64 PCM) }
// An entry is a sound name, or 'name@pitch' (the in-flight whoosh runs at each kind's pitch). Loops are rendered ~3.2 s:
// warnings with their progress param swept 0 → 1 (the enemy's timbre), movers passing the listener left → right 3 m in
// front (the Doppler as src/audio/cues.js computes it), the rest standing still.
(async () => {
  const A = await import('./src/audio/audio.js');
  const SR = 48000;
  const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
  const K1 = { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] };
  const K2 = { b: [1, -2, 1], a: [-1.99004745483398, 0.99007225036621] };
  function biq(x, c) {
    const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const v = c.b[0] * x[i] + c.b[1] * x1 + c.b[2] * x2 - c.a[0] * y1 - c.a[1] * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
    return y;
  }
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const ar = re[i + k], ai = im[i + k], br = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, bi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ar + br; im[i + k] = ai + bi; re[i + k + len / 2] = ar - br; im[i + k + len / 2] = ai - bi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  }
  const EDGES = [150, 300, 600, 1200, 2400, 4800, 9600];   // 8 octave-ish bands
  function analyze(buf) {
    const n = buf.length, L = buf.getChannelData(0), R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
    let peak = 0, nan = 0, first = -1, last = -1;
    for (let i = 0; i < n; i++) { const l = L[i], r = R[i]; if (!Number.isFinite(l) || !Number.isFinite(r)) { nan++; continue; } const a = Math.max(Math.abs(l), Math.abs(r)); if (a > peak) peak = a; if (a > 0.001) { if (first < 0) first = i; last = i; } }
    const kl = biq(biq(L, K1), K2), kr = R === L ? kl : biq(biq(R, K1), K2);
    const B = Math.floor(0.4 * SR), H = Math.floor(0.1 * SR); let mx = 0;
    for (let s = 0; s + B <= n; s += H) { let z = 0; for (let i = s; i < s + B; i++) z += kl[i] * kl[i] + kr[i] * kr[i]; mx = Math.max(mx, z / B); }
    const mono = new Float32Array(n); for (let i = 0; i < n; i++) mono[i] = (L[i] + R[i]) * 0.5;
    // clicks: isolated single-sample steps far above the local activity (as tools/audio-test.mjs)
    const pre = new Float64Array(n + 1); for (let i = 1; i < n; i++) { const d = mono[i] - mono[i - 1]; pre[i + 1] = pre[i] + d * d; }
    let clicks = 0; const W = 512;
    for (let i = 2; i < n - 1; i++) {
      const d = Math.abs(mono[i] - mono[i - 1]); if (d < 0.03) continue;
      const lo = Math.max(1, i - W), hi = Math.min(n - 1, i + W), loc = Math.sqrt((pre[hi + 1] - pre[lo]) / (hi - lo + 1));
      const iso = d > 3 * Math.max(Math.abs(mono[i - 1] - mono[i - 2]), Math.abs(mono[i + 1] - mono[i]));
      if (d / (loc || 1e-9) > 16 && iso) { clicks++; i += W; }
    }
    // a fingerprint: the spectrum in 8 bands and the level over 12 slices of the active part (for "which two sound alike")
    const a0 = Math.max(0, first), a1 = Math.max(a0 + 4096, last + 1), N = 4096, bands = new Array(8).fill(0);
    const re = new Float64Array(N), im = new Float64Array(N), hop = Math.max(1024, Math.floor((a1 - a0) / 60));
    for (let s = a0; s + N <= Math.min(n, a1 + N); s += hop) {
      for (let i = 0; i < N; i++) { re[i] = mono[s + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1))); im[i] = 0; }
      fft(re, im);
      for (let k = 1; k < N / 2; k++) { const f = (k * SR) / N; let b = 0; while (b < 7 && f >= EDGES[b]) b++; bands[b] += re[k] * re[k] + im[k] * im[k]; }
    }
    const bt = bands.reduce((x, y) => x + y, 0) || 1;
    const env = []; const seg = Math.max(1, Math.floor((a1 - a0) / 12));
    for (let j = 0; j < 12; j++) { let z = 0; for (let i = a0 + j * seg; i < Math.min(n, a0 + (j + 1) * seg); i++) z += mono[i] * mono[i]; env.push(Math.sqrt(z / seg)); }
    const em = Math.max(...env) || 1;
    // rhythm: the level every 5 ms, its autocorrelation's strongest peak between 1.5 and 30 Hz (a tick rate, a gallop,
    // a spin) and how strong it is (0 = steady, 1 = fully pulsed)
    const hopE = SR / 200, ev = [];
    for (let i = a0; i + hopE <= Math.min(n, a1); i += hopE) { let z = 0; for (let k = 0; k < hopE; k++) z += mono[i + k] * mono[i + k]; ev.push(Math.sqrt(z / hopE)); }
    const mu = ev.reduce((x, y) => x + y, 0) / (ev.length || 1); for (let i = 0; i < ev.length; i++) ev[i] -= mu;
    const r0 = ev.reduce((x, y) => x + y * y, 0) || 1; let amRate = 0, amDepth = 0;
    for (let lag = Math.floor(200 / 30); lag <= Math.floor(200 / 1.5) && lag < ev.length - 4; lag++) {
      let z = 0; for (let i = 0; i + lag < ev.length; i++) z += ev[i] * ev[i + lag];
      const c = z / r0; if (c > amDepth) { amDepth = c; amRate = 200 / lag; }
    }
    let cen = 0; for (let b = 0; b < 8; b++) cen += (b / bt) * bands[b];
    return { dur: last > 0 ? +(last / SR).toFixed(2) : 0, peak: +db(peak).toFixed(1), lufsM: +(mx > 0 ? -0.691 + 10 * Math.log10(mx) : -99).toFixed(1), nan, clicks,
      bands: bands.map((b) => +(b / bt).toFixed(4)), env: env.map((e) => +(e / em).toFixed(2)), attack: +(env.indexOf(em) / 12).toFixed(2),
      amRate: +amRate.toFixed(1), amDepth: +amDepth.toFixed(2), centroid: +cen.toFixed(2) };
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
  // loops: which params sweep 0 → 1 (warnings, strain), which pass by (movers); how long the sweep lasts (the real fuse)
  const SWEEP = { fuse_bomb: { k: 1, roll: 0 }, fuse_sticky: { k: 1 }, hunt_alarm: { close: 1 }, lock_tone: { k: 1 }, shaker_rattle: { k: 1, armed: 1 },
    slam_warn: 'slam', strike_mark: { k: 1 }, beam_lock: { k: 1 }, kraken_dive: { k: 1 }, orb_fuse: { k: 1 }, bubble_drift: { charge: 1 },
    curtain_drip: { life: 0 }, mist_hiss: { life: 0.2 }, kraken_move: { speed: 1 }, stamp_carry: { speed: 1 }, seeker_run: { speed: 1, dash: 1 }, shell_whistle: { vy: 'arc' } };
  const PASS = new Set(['sub_fly', 'seeker_run', 'twister', 'stamp_fly', 'orb_fly', 'zip_whizz', 'kraken_move', 'shaker_rattle', 'torpedo_whirr', 'tracer_hum', 'waddle_walk',
    'boomerang_whirr', 'shell_whistle', 'jet_loop', 'crab_move', 'crab_roll', 'storm_rain']);
  const DUR = { fuse_bomb: 0.95, fuse_sticky: 2.4, orb_fuse: 1.5, beam_lock: 1.3, strike_mark: 2.2, slam_warn: 1.1, kraken_dive: 0.7, lock_tone: 1.5, shell_whistle: 1.4 };
  async function render(entry, raw) {
    const [name, ps] = String(entry).split('@'), P = ps ? +ps : 1;
    const d = A.SFX[name];
    if (!d) return null;
    const isLoop = !d.build && !!d.loop;
    const secs = isLoop ? 3.4 : 3;
    const ctx = new OfflineAudioContext(2, Math.floor(SR * secs), SR);
    const eng = new A.AudioEngine({ context: ctx, seed: 77, music: false, raw });
    eng.init();
    eng.setVolumes({ master: 1, music: 1, sfx: 1 });
    eng.master.gain.value = 1; eng.sfxBus.gain.value = 1;
    if (!isLoop) { eng.play(name, { at: 0.1, pitch: P }); return { buf: await ctx.startRendering(), mode: 'shot' }; }
    eng.setListener({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 });
    const sweep = SWEEP[name], pass = PASS.has(name), T0 = 0.1, span = DUR[name] || 2.6;
    let h = null;
    const pos = (t) => ({ x: -14 + 28 * Math.min(1, Math.max(0, (t - T0) / 2.8)), y: 0.5, z: -3 });
    // the director's Doppler: the source's radial speed toward the listener → pitch (c_eff 55 m/s, clamped)
    const dop = (t) => { const p0 = pos(t), p1 = pos(t + 0.05), vx = (p1.x - p0.x) / 0.05; const dist = Math.hypot(p0.x, p0.z); const vr = -(p0.x * vx) / (dist || 1); return Math.min(1.22, Math.max(0.84, 1 / (1 - vr / 55))); };
    const par = (u) => {
      if (sweep === 'slam') return u < 0.55 ? { phase: 0, k: u / 0.55 } : u < 0.75 ? { phase: 1, k: (u - 0.55) / 0.2 } : { phase: 2, k: (u - 0.75) / 0.25 };
      if (!sweep) return null;
      return Object.fromEntries(Object.entries(sweep).map(([k, v]) => [k, v === 'arc' ? 12 - 24 * u : v === 0 ? 1 - u : v * u]));
    };
    ctx.suspend(T0).then(() => { h = eng.loop(name, { volume: 1, pitch: P * (pass ? dop(T0) : 1), pos: pass ? pos(T0) : undefined, params: par(0) || undefined }); ctx.resume(); });
    for (let t = T0 + 0.05; t < 3.05; t += 0.05) {
      const tt = +t.toFixed(4);
      ctx.suspend(tt).then(() => {
        const o = {};
        if (pass) { o.pos = pos(tt); o.pitch = P * dop(tt); }
        const q = par(Math.min(1, (tt - T0) / span)); if (q) o.params = q;
        h?.set(o); ctx.resume();
      });
    }
    ctx.suspend(3.1).then(() => { h?.stop(0.15); ctx.resume(); });
    return { buf: await ctx.startRendering(), mode: pass ? 'loop pass-by' : sweep ? 'loop sweep' : 'loop' };
  }
  // every sub and special, its sounds in the order you'd hear them (throw → flight → landing / arming → warning → blast / end)
  const SHEET = [
    ['Splat Bomb', ['bomb_throw', 'sub_fly@1', 'bomb_beep', 'fuse_bomb', 'bomb_explode']],
    ['Cling Charge', ['throw_sticky', 'sub_fly@0.85', 'sticky_stick', 'fuse_sticky', 'sticky_explode']],
    ['Pop Pellet', ['throw_burst', 'sub_fly@1.5', 'pellet_pop']],
    ['Skitter Bomb', ['throw_seeker', 'sub_fly@1.15', 'seeker_land', 'seeker_run', 'seeker_explode']],
    ['Echo Orb', ['throw_scan', 'sub_fly@1.35', 'scan_burst']],
    ['Drip Curtain', ['throw_curtain', 'sub_fly@0.7', 'curtain_up', 'curtain_drip', 'curtain_down']],
    ['Twirl Sprinkler', ['throw_sprinkler', 'sub_fly@1.25', 'sprinkler_stick', 'sprinkler_spin', 'sprinkler_break']],
    ['Lurk Mine', ['place_mine', 'mine_trip', 'mine_explode']],
    ['Hop Beacon', ['place_beacon', 'beacon_hum', 'beacon_use', 'beacon_break']],
    ['Murk Bomb', ['throw_mist', 'sub_fly@0.8', 'mist_burst', 'mist_hiss']],
    ['Shaker Bomb', ['throw_shaker', 'shaker_rattle', 'shaker_land', 'shaker_blast@1.06', 'shaker_blast@1.12', 'shaker_blast@1.18']],
    ['Waddle Bomb', ['throw_waddle', 'sub_fly@1.05', 'waddle_land', 'waddle_beep', 'waddle_lock', 'waddle_walk', 'hunt_alarm', 'waddle_explode', 'waddle_pop']],
    ['Tide Torpedo', ['torpedo_throw', 'torpedo_whirr', 'torpedo_transform', 'lock_tone', 'torpedo_launch', 'torpedo_burst']],
    ['Tracer Bolt', ['tracer_zap', 'tracer_hum', 'tracer_bounce', 'tracer_hit']],
    ['Whirl Boomerang', ['boomerang_throw', 'boomerang_whirr', 'boomerang_return', 'boomerang_orbit', 'boomerang_tick', 'boomerang_blast', 'boomerang_burst']],
    ['Tidal Slam', ['special_activate', 'slam_leap', 'slam_warn', 'special_slam']],
    ['Ink Tempest', ['storm_throw', 'sub_fly@0.6', 'storm_thunder', 'storm_rain', 'storm_fade']],
    ['Bomb Barrage', ['barrage_start', 'barrage_drum']],
    ['Bubble Guard', ['shield_up', 'shield_hum', 'shield_hit', 'shield_pop']],
    ['Deep Sonar', ['sonar_ping', 'sonar_mark', 'sonar_blip']],
    ['Vortex Strike', ['strike_arm', 'strike_aim', 'strike_launch', 'strike_mark', 'strike_whistle', 'strike_impact', 'tornado', 'vortex_end']],
    ['Twister Zooka', ['zooka_arm', 'zooka_fire', 'twister', 'twister_burst']],
    ['Howl Box', ['wail_up', 'wail_hold', 'wail_charge', 'beam_lock', 'wail_blast']],
    ['Kraken', ['kraken_on', 'kraken_move', 'kraken_jump', 'kraken_dive', 'kraken_slam', 'kraken_off']],
    ['Bubble Blower', ['blower_start', 'blower_inflate', 'bubble_release', 'bubble_drift', 'bubble_blast', 'bubble_pop']],
    ['Ink Jet', ['jet_ignite', 'jet_loop', 'jet_boost', 'jet_fire', 'jet_boom', 'jet_end']],
    ['Mega Stamp', ['stamp_start', 'stamp_carry', 'stamp_swing', 'stamp_slam', 'stamp_throw', 'stamp_fly', 'stamp_crash']],
    ['Cheer Orb', ['booyah_charge', 'booyah_cheer', 'booyah_throw', 'orb_fly', 'orb_land', 'orb_fuse', 'booyah_blast']],
    ['Zipline', ['zip_cloak', 'zip_aura', 'zip_fire', 'zip_latch', 'zip_pull', 'zip_whizz', 'zip_impact']],
    ['Crab Rig', ['crab_boot', 'crab_move', 'crab_roll', 'crab_gatling', 'crab_cannon', 'shell_whistle', 'shell_boom', 'crab_reload', 'crab_hit', 'crab_break']],
    ['(every special)', ['special_ending', 'special_end']],
  ];
  window.__R = {
    sheet: () => SHEET,
    async render(entry) {
      try {
        const r = await render(entry, false);
        if (!r) return { name: entry, error: 'no such sound' };
        const raw = await render(entry, true);
        return { name: entry, mode: r.mode, ...analyze(r.buf), rawPeak: analyze(raw.buf).peak, wav: wav(r.buf) };
      } catch (e) { return { name: entry, error: String(e && e.stack || e) }; }
    },
  };
  return true;
})()
