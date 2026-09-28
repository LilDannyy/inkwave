(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, THREE = await import('three');
  const { TOWER, SUB, SPECIALS } = await import('./src/config.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  dbg.freeze();
  const T = m.tower, P = T.paint;
  const intents = new Map();
  for (const a of m.actors) if (a.bot) a.bot.update = () => { const it = intents.get(a); a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = a.intent.sub = a.intent.special = false; if (it) it(a.intent); };
  const step = (s) => { for (let i = 0; i < Math.round(s * 60); i++) dbg.step(1000 / 60); };
  const A = m.actors.filter((a) => a.team === 0 && !a.isLocal), B = m.actors.filter((a) => a.team === 1);
  const park = (a, i = 0) => { const pd = __G.level.spawnPads[a.team]; a.pos.set(pd.x + i, pd.y + 0.3, pd.z); a.vel.set(0, 0, 0); };
  for (const a of m.actors) park(a, m.actors.indexOf(a) % 4);
  step(0.5);
  const c = Math.cos(T.yaw), s = Math.sin(T.yaw), X = new THREE.Vector3(c, 0, -s), Z = new THREE.Vector3(s, 0, c);
  const W = (lx, ly, lz) => new THREE.Vector3(T.pos.x + X.x * lx + Z.x * lz, T.pos.y + ly, T.pos.z + X.z * lx + Z.z * lz);
  const Rr = TOWER.platformR, H = TOWER.platformH;
  // 1) ink reaches the tower: a splat on its +x wall, one on its deck, none on the grate / pillar
  const n0 = P.n;
  for (let y = 0.25; y < H; y += 0.35) for (let z = -0.9; z <= 0.9; z += 0.45) __G.paint.splat(W(Rr + 0.15, y, z), 0.45, 0);
  __G.paint.splat(W(-0.6, H + 0.1, 0.6), 0.5, 0);
  const wallInk = P.wallTeam(W(Rr, 0.8, 0), X), deckInk = P.groundTeam(W(-0.6, H, 0.6)), grateInk = P.groundTeam(W(Rr - 0.1, H, 0));
  R('ink reaches the tower: its wall and deck take it, the grate rim does not', P.n > n0 && wallInk === 1 && deckInk === 1 && grateInk === 0, { painted: P.n - n0, wallInk, deckInk, grateInk });
  // 2) swim up the inked wall: a squid pressing into it climbs and pops onto the deck
  const a = A[0];
  a.pos.copy(W(Rr + 0.75, 0, 0)); a.pos.y = T.pos.y + 0.05; a.vel.set(0, 0, 0); a.yaw = Math.atan2(-X.x, -X.z);
  intents.set(a, (it) => { it.squid = true; it.move.set(-X.x, 0, -X.z); });
  let climbed = false, maxY = 0;
  for (let i = 0; i < 180; i++) { step(1 / 60); climbed = climbed || a.climbing; maxY = Math.max(maxY, a.pos.y - T.pos.y); }
  intents.set(a, (it) => { it.squid = true; });
  step(0.6);
  const onTop = Math.abs(a.pos.y - T.top) < 0.25 && Math.hypot(a.pos.x - T.pos.x, a.pos.z - T.pos.z) < Rr + 0.2;
  R('a squid swims up the inked wall onto the deck (' + H + ' m: higher than a jump)', climbed && onTop, { climbed, maxY: +maxY.toFixed(2), dy: +(a.pos.y - T.top).toFixed(2), grounded: a.grounded, onBlock: a.ground && a.ground.block === T.block.id });
  // 3) swimming in our ink on the deck: the ground reads as our ink
  a.pos.copy(W(-0.6, H + 0.05, 0.6)); a.vel.set(0, 0, 0); intents.set(a, (it) => { it.squid = true; });
  step(0.4);
  R('on the deck in our ink: our ground (swim / refill / hide)', a.groundTeam === 1, { groundTeam: a.groundTeam, form: a.form });
  intents.set(a, null);
  // 4) a sticky bomb on the tower rides with it
  const b0 = B[0];
  b0.pos.copy(W(Rr + 4, 0, 0)); b0.pos.y = T.pos.y + 0.05;
  __G.subs._throw(b0, SUB.sticky, new THREE.Vector3(b0.pos.x, T.pos.y + 1.0, b0.pos.z), new THREE.Vector3(-X.x * 14, 0.5, -X.z * 14));
  let st = null;
  for (let i = 0; i < 40 && !st; i++) { step(1 / 60); st = __G.subs.items.find((it) => it.kind === 'sticky' && it.state === 'stuck'); }
  // (now move the tower: Alpha rides)
  A.slice(1, 3).forEach((r, i) => { r.pos.copy(W(i ? 0.8 : -0.8, H + 0.05, 0)); r.vel.set(0, 0, 0); });
  const s0 = T.s, off0 = st ? st.pos.clone().sub(T.pos) : null;
  step(1.2);
  const off1 = st && !st.dead ? st.pos.clone().sub(T.pos) : null;
  R('a sticky bomb stuck to the tower rides with it', !!st && !!st.ride && Math.abs(T.s - s0) > 0.3 && off0 && off1 && off0.distanceTo(off1) < 0.05, { stuck: !!st, rides: !!(st && st.ride), moved: +(T.s - s0).toFixed(2), drift: off0 && off1 ? +off0.distanceTo(off1).toFixed(3) : null });
  // 5) riders carried along don't walk
  const rider = A[1];
  let hsMax = 0; for (let i = 0; i < 60; i++) { A.slice(1, 3).forEach((r) => { r.vel.x = r.vel.z = 0; }); step(1 / 60); hsMax = Math.max(hsMax, rider.character.hs || 0); }
  R('a rider standing still while the tower carries them does not walk (animation)', T.moving !== 0 && hsMax < 0.25, { hsMax: +hsMax.toFixed(3), towerMoving: T.moving });
  // 6) Bubble Guard on the tower: double the shove
  const q = A[2];
  q.status.shield = 5; q.vel.set(0, 0, 0);
  const sOn = T.riderList.includes(q);
  __G.specials.filterDamage(q, 40, b0, 'test');
  const vOn = Math.hypot(q.vel.x, q.vel.z);
  const q2 = A[3] || B[1]; q2.status.shield = 5; q2.pos.copy(W(Rr + 6, 0.05, 3)); q2.vel.set(0, 0, 0); step(1 / 60); q2.vel.set(0, 0, 0);
  __G.specials.filterDamage(q2, 40, b0, 'test');
  const vOff = Math.hypot(q2.vel.x, q2.vel.z);
  q.status.shield = 0; q2.status.shield = 0;
  R('Bubble Guard on the tower: twice the shove', sOn && Math.abs(vOn - 2 * vOff) < 0.05 && vOff > 0, { onTower: sOn, vOn: +vOn.toFixed(2), vOff: +vOff.toFixed(2) });
  // 7) a Kraken on the tower can be shot off
  const k = A[1];
  k.setSpecial('kraken'); k.special = k.specialCost(); k._startSpecial(); step(0.2);
  k.pos.copy(W(0.8, H + 0.05, 0)); k.vel.set(0, 0, 0); step(0.2);
  const onBefore = T.riderList.includes(k);
  let t = 0; for (; t < 4 && T.riderList.includes(k); t += 1 / 60) { if ((t * 60 | 0) % 7 === 0) __G.specials.filterDamage(k, 35, b0, 'test'); step(1 / 60); }
  R('a Kraken riding the tower is shot off by steady fire', onBefore && !T.riderList.includes(k), { onBefore, secs: +t.toFixed(2), kraken: !!(k.specialActive && k.specialActive.id === 'kraken') });
  if (k.specialActive) __G.specials.end(k, 'test');
  // 8) a super jump to a teammate riding the tower lands on its deck (not off its edge), even as it moves
  const mate = A[0], jumper = A[2];
  mate.pos.copy(W(0.8, H + 0.05, 0)); mate.vel.set(0, 0, 0);
  park(jumper, 0); jumper.status.shield = 0; step(0.5);
  const js = jumper.superJump(mate, { instant: true });
  let landed = false;
  for (let i = 0; i < 240 && !landed; i++) { step(1 / 60); landed = !jumper.superJumpState && T.riderList.includes(jumper); }
  R('a super jump to a teammate riding the tower lands on its deck', js && landed, { started: js, onDeck: T.riderList.includes(jumper), dy: +(jumper.pos.y - T.top).toFixed(2), dxz: +Math.hypot(jumper.pos.x - T.pos.x, jumper.pos.z - T.pos.z).toFixed(2) });
  return out;
})()
