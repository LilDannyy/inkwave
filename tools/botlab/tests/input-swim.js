// Swim vs weapon input: the most recent press of swim / fire / sub wins (actor.js).
//   MAP=testbox PAGE=tools/botlab/tests/input-swim.js tools/botlab/run.sh tools/botlab/page.cjs
// A bot actor is driven by hand (its brain replaced by a scripted intent), standing on its own ink.
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  dbg.freeze();
  const step = (s) => { for (let i = 0; i < Math.round(s * 60); i++) dbg.step(1000 / 60); };
  const a = m.actors.find((x) => x.team === 0 && !x.isLocal);
  let want = {};
  for (const o of m.actors) if (o.bot) o.bot.update = () => {
    const it = o.intent; it.move.set(0, 0, 0); it.fire = it.jump = it.squid = it.sub = it.special = false;
    if (o === a) Object.assign(it, want);
  };
  // park everyone else far away; stand on our own ink
  m.actors.forEach((o, i) => { if (o !== a) { o.pos.set(-20 + i * 3, 0.1, 30); o.vel.set(0, 0, 0); } });
  a.pos.set(0, 0.1, 0); a.vel.set(0, 0, 0);
  const THREE = await import('three');
  __G.paint.splat(new THREE.Vector3(0, 0, 0), 3, 0);
  const setup = (weapon, sub) => { a.setWeapon(weapon); if (sub) a.setSub(sub); a.ink = 100; want = {}; step(0.4); };
  const shots = () => (__G.projectiles.list || __G.projectiles.items || []).length;

  // 1) charging a charger, then swim → dives at once, the charge is dropped (no shot, no ink spent)
  setup('charger');
  want = { fire: true }; step(0.5);
  const charging = a.weaponRunner.charging, ink0 = a.ink;
  want = { fire: true, squid: true }; step(0.1);
  R('swim pressed while charging: dives, the charge is dropped', charging && a.form === 'squid' && !a.weaponRunner.charging && Math.abs(a.ink - ink0) < 1,
    { wasCharging: charging, form: a.form, charging: a.weaponRunner.charging, inkBefore: +ink0.toFixed(1), inkAfter: +a.ink.toFixed(1) });
  want = {}; step(0.3);

  // 2) splatling streaming, then swim → dives, the stream stops
  setup('splatling');
  want = { fire: true }; step(1.2); want = {}; step(0.05);
  const streaming = a.weaponRunner.busy();
  want = { squid: true }; step(0.1);
  R('swim pressed during a splatling stream / charge: dives, the stream stops', a.form === 'squid' && !a.weaponRunner.streaming && !(a.weaponRunner.burstT > 0),
    { busyBefore: streaming, form: a.form });
  want = {}; step(0.3);

  // 3) in squid form, press fire → pops out and shoots
  setup('shooter');
  want = { squid: true }; step(0.4);
  const wasSquid = a.form === 'squid', inkS = a.ink;
  want = { squid: true, fire: true }; step(0.4);
  R('fire pressed in squid form: pops out and shoots', wasSquid && a.form === 'kid' && a.ink < inkS - 0.5, { wasSquid, form: a.form, inkSpent: +(inkS - a.ink).toFixed(1) });
  want = {}; step(0.3);

  // 4) in squid form, press sub → pops out, readies the sub; letting go throws it
  setup('shooter', 'bomb');
  want = { squid: true }; step(0.4);
  const inkB = a.ink;
  want = { squid: true, sub: true }; step(0.2);
  const outForSub = a.form === 'kid' && a.weaponRunner.aimingSub;
  want = { squid: true }; step(0.1);
  R('sub pressed in squid form: pops out and readies the sub; releasing throws it', outForSub && a.ink < inkB - 10,
    { outForSub, inkSpent: +(inkB - a.ink).toFixed(1) });
  want = {}; step(0.5);

  // 5) holding the sub ready, then swim → dives, the sub is not thrown (release in squid form throws nothing)
  setup('shooter', 'bomb');
  want = { sub: true }; step(0.3);
  const aiming = a.weaponRunner.aimingSub, inkC = a.ink;
  want = { sub: true, squid: true }; step(0.1);
  const dived = a.form === 'squid' && !a.weaponRunner.aimingSub;
  want = { squid: true }; step(0.2);
  R('swim pressed while holding the sub: dives, nothing is thrown', aiming && dived && Math.abs(a.ink - inkC) < 1, { aiming, dived, inkBefore: +inkC.toFixed(1), inkAfter: +a.ink.toFixed(1) });
  want = {}; step(0.3);

  // 6) swim held, fire held after → shooting keeps winning while fire is held; letting go of fire dives again
  setup('shooter');
  want = { squid: true }; step(0.3);
  want = { squid: true, fire: true }; step(0.3);
  const kidWhileFire = a.form === 'kid';
  want = { squid: true }; step(0.2);
  R('swim held + fire pressed later: shoots while fire is held, dives when it is let go', kidWhileFire && a.form === 'squid', { kidWhileFire, form: a.form });
  void shots;
  return out;
})()
