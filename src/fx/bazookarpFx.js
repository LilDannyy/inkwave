// [b5-karp] Bazookarp's look — the WP1 PLACEHOLDER (WP2, karp-face, builds the finished one: SPEC §6.7). Built and
// cleared on 'match:state' like TowerFx; update(dt) each frame (main.js). Everything here is visual: nothing collides.
//   the Roe Shell    a translucent sphere, its colour leaning to the team ahead on the meter, white flash on hits
//   the Bazookarp    a carp (a capsule + a tail cone): white-gold resting, in the carrier's ink on its shoulder; while
//                    the carrier swims the enemy sees only a wake glow (a flat disc, depth-tested) — S31
//   the light pillar gold over it while unheld, the carrier's ink while held (hidden from the enemy with the carrier)
//   weirs            a curtain plane between the posts in the attacking team's ink; gone once lowered
//   Dragon Gates     a ring on the plinth; risen: a light column in the attacking team's ink
//   free zones       outlines in the owning team's ink; placeholder signs (posts + boards) where the data had none
//   Carp Shots       ink balls; landed: a swelling ring at the blast radius; the local carrier's arc preview
import * as THREE from 'three';
import { G, on } from '../core/ctx.js';
import { BAZOOKARP as K } from '../config.js';
import { launch, radiusOf } from '../game/karpGun.js';

const _v = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Color();
const GOLD = new THREE.Color('#ffd27a');
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, ...o });

export class BazookarpFx {
  constructor(scene) {
    this.scene = scene; this.root = null; this.match = null; this.K = null;
    this.shots = new Map();
    this._unsubs = [
      on('match:state', ({ state, match }) => {
        if (!match || match.attract || !match.karp) { if (match !== this.match || state === 'intro') this.clear(); return; }
        if (match !== this.match) this.build(match);
        if (state === 'results') this.clear();
      }),
    ];
    G.karpFx = this;
  }
  clear() {
    if (this.root) {
      this.scene.remove(this.root);
      this.root.traverse((o) => { o.geometry?.dispose?.(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); });
    }
    this.root = null; this.match = null; this.K = null; this.shots.clear();
  }
  dispose() { this.clear(); this._unsubs.forEach((u) => u()); }

  build(match) {
    this.clear();
    const Kp = match.karp;
    if (!Kp || !G.level) return;
    this.match = match; this.K = Kp;
    const root = (this.root = new THREE.Group());
    root.name = 'bazookarpFx';
    // the shell
    this.shell = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), basic('#ffffff', { opacity: 0.32, side: THREE.DoubleSide }));
    this.shell.renderOrder = 2;
    root.add(this.shell);
    // the carp: a capsule body + a tail cone (the mouth faces +z)
    const carp = (this.carp = new THREE.Group());
    this.carpMat = new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.35, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 6, 12), this.carpMat); body.rotation.x = Math.PI / 2; carp.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 10), this.carpMat); tail.rotation.x = -Math.PI / 2; tail.position.z = -0.6; carp.add(tail);
    root.add(carp);
    // the light pillar
    this.pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 30, 10, 1, true), basic(GOLD, { opacity: 0.22, blending: THREE.AdditiveBlending }));
    root.add(this.pillar);
    // the wake glow
    this.wake = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), basic('#ffffff', { opacity: 0.45, blending: THREE.AdditiveBlending }));
    this.wake.rotation.x = -Math.PI / 2;
    root.add(this.wake);
    // weirs: a curtain between the posts per weir
    this.curtains = [];
    for (const list of Kp.weirs) for (const w of list) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(4.9, 2.2), basic(G.teamColors[w.team] || '#ffffff', { opacity: 0.38, side: THREE.DoubleSide }));
      m.position.copy(w.pos); m.position.y += 1.15; m.rotation.y = w.yaw + Math.PI / 2;
      root.add(m); this.curtains.push({ w, m });
    }
    // Gates: a ring + a column
    this.gates = Kp.gates.map((g) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.7, 32), basic(G.teamColors[g.team] || '#ffffff', { opacity: 0.8, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.copy(g.pos); ring.position.y += 0.05;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 9, 24, 1, true), basic(G.teamColors[g.team] || '#ffffff', { opacity: 0.18, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      col.position.copy(g.pos); col.position.y += 4.5; col.visible = false;
      root.add(ring, col);
      return { g, ring, col };
    });
    // free zones: outlines in the owner's ink
    for (const t of [0, 1]) for (const z of Kp.R.zones[t]) {
      const y = (z.y0 ?? 0) + 0.06, pts = z.poly.map((p) => new THREE.Vector3(p[0], Math.max(y, G.level.groundHeight(p[0], p[1], (z.y1 ?? 5) + 0.5) + 0.06), p[1]));
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: G.teamColors[t] || '#ffffff', transparent: true, opacity: 0.8 }));
      root.add(line);
    }
    // the placeholder's own signs (data signs are level pieces): a post + a board
    for (const s of Kp.field.signs) {
      if (!s.auto) continue;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.12), new THREE.MeshStandardMaterial({ color: '#7a7268' }));
      post.position.set(s.x, (s.y > -50 ? s.y : 0) + 0.9, s.z);
      const board = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), basic(G.teamColors[s.team] || '#ffffff', { opacity: 0.9, side: THREE.DoubleSide }));
      board.position.set(s.x, (s.y > -50 ? s.y : 0) + 1.7, s.z);
      root.add(post, board);
    }
    // the arc preview: dots along the flight (a 1 px line in the aim's plane read edge-on from the chase camera, review
    // round 1) and, where it lands, the blast's ring over a filled disc (WP2 draws the finished one)
    this.arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 40 }, () => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 }));
    this.arc.visible = false; this.arc.frustumCulled = false;
    this.arcDots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.08, 8, 6), basic('#ffffff', { opacity: 0.95 }), 20);
    this.arcDots.visible = false; this.arcDots.frustumCulled = false;
    this.arcRing = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 40), basic('#ffffff', { opacity: 0.85, side: THREE.DoubleSide }));
    this.arcRing.rotation.x = -Math.PI / 2; this.arcRing.visible = false;
    this.arcDisc = new THREE.Mesh(new THREE.CircleGeometry(0.86, 40), basic('#ffffff', { opacity: 0.32, side: THREE.DoubleSide }));
    this.arcDisc.rotation.x = -Math.PI / 2; this.arcDisc.visible = false;
    root.add(this.arc, this.arcDots, this.arcRing, this.arcDisc);
    this._m4 = new THREE.Matrix4();
    this.shotGeo = new THREE.SphereGeometry(0.22, 12, 8);
    this.ringGeo = new THREE.RingGeometry(0.9, 1, 40);
    this.scene.add(root);
  }

  // is the carrier hidden from this screen's viewer (an enemy while it swims)?
  _hiddenFromViewer(H) { const me = G.match?.local; return !!(H && me && me.team !== H.team && this.K.hidden(H)); }

  update(dt) {
    const Kp = this.K;
    if (!this.root || !Kp || !this.match || this.match.karp !== Kp) return;
    const H = Kp.holder, sh = Kp.shell;
    // the shell
    const on = sh.state !== 'none';
    this.shell.visible = on;
    if (on) {
      const r = Math.max(0.05, sh.radius());
      this.shell.position.copy(sh.center()); this.shell.scale.setScalar(r);
      const k = sh.hp > 0 ? sh.meter / sh.hp : 0;
      _c.set('#ffffff'); if (k > 0) _c.lerp(_c2.copy(G.teamColors[0]), Math.min(1, k)); else if (k < 0) _c.lerp(_c2.copy(G.teamColors[1]), Math.min(1, -k));
      if (sh.flashK > 0) _c.lerp(_c2.set('#ffffff'), sh.flashK * 0.6);
      this.shell.material.color.copy(_c);
      this.shell.material.opacity = sh.state === 'growing' ? 0.2 : 0.3 + 0.25 * Math.abs(k) ** 2;
    }
    // the carp, the pillar, the wake
    const hid = this._hiddenFromViewer(H);
    if (H) {
      H.visualPos ? H.visualPos(_v) : _v.copy(H.pos);
      this.carp.position.set(_v.x - Math.sin(H.yaw) * 0.1 + Math.cos(H.yaw) * 0.25, _v.y + (H.form === 'squid' ? 0.35 : 1.45), _v.z - Math.cos(H.yaw) * 0.1 - Math.sin(H.yaw) * 0.25);
      this.carp.rotation.set(-(H.aimPitch || 0) * 0.6, H.aimYaw ?? H.yaw, 0);
      this.carpMat.color.copy(G.teamColors[H.team]); this.carpMat.emissive.copy(G.teamColors[H.team]);
      const C = H.carry?.gun; this.carpMat.emissiveIntensity = 0.3 + (C ? C.c * 1.2 : 0);
      this.carp.visible = !hid && !(H.form === 'squid' && (H.submerged || H.climbing));
      this.carp.scale.setScalar(1);
    } else {
      const lift = Kp.phase === 'resetting' ? 0 : K.shell.lift;
      this.carp.position.set(Kp.pos.x, Kp.pos.y + lift, Kp.pos.z);
      this.carp.rotation.set(0, (this.carp.rotation.y + dt * 0.8) % (Math.PI * 2), 0);
      this.carpMat.color.copy(GOLD); this.carpMat.emissive.copy(GOLD); this.carpMat.emissiveIntensity = Kp.phase === 'free' ? 0.8 : 0.35;
      this.carp.visible = Kp.phase !== 'done';
      this.carp.scale.setScalar(Kp.phase === 'resetting' ? 1.4 : 1);
    }
    this.pillar.visible = !hid && Kp.phase !== 'done';
    this.pillar.position.set(H ? H.pos.x : Kp.pos.x, (H ? H.pos.y : Kp.pos.y) + 15, H ? H.pos.z : Kp.pos.z);
    this.pillar.material.color.copy(H ? G.teamColors[H.team] : GOLD);
    this.wake.visible = !!(H && H.alive && (H.submerged || H.climbing));
    if (this.wake.visible) { this.wake.position.set(H.pos.x, H.pos.y + 0.06, H.pos.z); this.wake.material.color.copy(G.teamColors[H.team]); this.wake.scale.setScalar(1 + 0.15 * Math.sin(G.time * 9)); }
    // weirs and Gates
    for (const c of this.curtains) c.m.visible = !Kp.lowered[c.w.team];
    for (const g of this.gates) { const up = Kp.gateUp[g.g.team]; g.col.visible = up; g.ring.material.opacity = up ? 0.95 : 0.45; }
    // Carp Shots
    const live = new Set();
    for (const s of G.karpGun?.shots || []) {
      live.add(s);
      let e = this.shots.get(s);
      if (!e) {
        e = { ball: new THREE.Mesh(this.shotGeo, basic(G.teamColors[s.team], { opacity: 0.95 })), ring: new THREE.Mesh(this.ringGeo, basic(G.teamColors[s.team], { opacity: 0.8, side: THREE.DoubleSide })) };
        e.ring.rotation.x = -Math.PI / 2;
        this.root.add(e.ball, e.ring); this.shots.set(s, e);
      }
      e.ball.visible = s.phase !== 'done';
      e.ball.position.copy(s.pos);
      e.ball.scale.setScalar(s.phase === 'swell' ? 1 + 1.5 * (s.swell / K.gun.swell) : 1 + s.c);
      e.ring.visible = s.phase === 'swell';
      if (e.ring.visible) { e.ring.position.set(s.land.x, s.land.y + 0.08, s.land.z); e.ring.scale.setScalar(s.radius * Math.min(1, 0.3 + s.swell / K.gun.swell)); }
    }
    for (const [s, e] of this.shots) if (!live.has(s)) { this.root.remove(e.ball, e.ring); e.ball.material.dispose(); e.ring.material.dispose(); this.shots.delete(s); }
    // the local carrier's arc preview while charging
    const me = G.match?.local, g = me && me.carry?.gun;
    const show = !!(me && me === H && g && (g.charging || g.tap) && me.form !== 'squid');
    this.arc.visible = this.arcRing.visible = this.arcDots.visible = this.arcDisc.visible = show;
    if (show) {
      const L = launch(me, g.c), pos = this.arc.geometry.attributes.position, p = L.from.clone(), v = L.vel.clone();
      let landed = null, nd = 0;
      for (let i = 0; i < 40; i++) {
        pos.setXYZ(i, p.x, p.y, p.z);
        // (a dot every other step, from the third on: the first ones sit on the carp's mouth)
        if (!landed && i >= 2 && i % 2 === 0 && nd < 20) this.arcDots.setMatrixAt(nd++, this._m4.makeTranslation(p.x, p.y, p.z));
        if (!landed) {
          const n = p.clone().addScaledVector(v, 0.04);
          v.y -= K.gun.gravity * 0.04;
          if (G.physics.los(p, n)) p.copy(n); else landed = p.clone();
        }
      }
      pos.needsUpdate = true;
      this.arcDots.count = nd; this.arcDots.instanceMatrix.needsUpdate = true;
      const end = landed || p, R = radiusOf(g.c), col = G.teamColors[me.team];
      this.arcRing.position.set(end.x, end.y + 0.06, end.z); this.arcRing.scale.setScalar(R);
      this.arcDisc.position.set(end.x, end.y + 0.05, end.z); this.arcDisc.scale.setScalar(R);
      for (const o of [this.arc, this.arcDots, this.arcRing, this.arcDisc]) o.material.color.copy(col);
    }
  }
}
