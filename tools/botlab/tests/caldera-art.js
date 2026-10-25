// Highmark Foundry art verification page test
(async () => {
  const out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const g = window.__inkwave, G = window.__G, L = G.level;
  const THREE = await import('three');
  const { PropKit } = await import('./src/world/props.js');
  const { dressingFor } = await import('./src/world/dressing.js');
  const { LAYOUT } = await import('./src/world/stages/caldera/layout.js');
  const { SURF } = await import('./src/world/stages/caldera/surfaces.js');
  const { LAVA } = await import('./src/world/stages/caldera/lava.js');
  const { inMode } = await import('./src/world/variants.js');

  // 1. Headless PropKit build - no colliders
  const kit = new PropKit(null, { headless: true });
  let cols = 0, n = 0, types = new Set();
  const placements = dressingFor('caldera');
  for (const it of placements) {
    const r = kit.add(it.type, it);
    cols += r.colliders.length;
    n++;
    types.add(it.type);
  }
  R('dressing adds no colliders (visual only)', n > 0 && cols === 0, { placements: n, types: types.size, colliders: cols });

  // 2. Mid Pour Floor clearance: nothing visual below 7.0 m in the open center
  // open center: |x| < 3.6 and |z| < 1.15
  let midBelow7 = 0;
  const midCulprits = new Map();
  const sampleMid = [];
  const v3 = new THREE.Vector3();
  for (const it of placements) {
    const k2 = new PropKit(null, { headless: true });
    k2.add(it.type, it);
    for (const parts of k2._buckets.values()) {
      for (const p of parts) {
        const P = p.g.attributes.position;
        for (let i = 0; i < P.count; i++) {
          v3.fromBufferAttribute(P, i).applyMatrix4(p.m);
          if (Math.abs(v3.x) < 3.6 && Math.abs(v3.z) < 1.15 && v3.y > 1.2 && v3.y < 7.0) {
            midBelow7++;
            midCulprits.set(it.type, (midCulprits.get(it.type) || 0) + 1);
            if (sampleMid.length < 5) sampleMid.push([it.type, +v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2)]);
          }
        }
      }
    }
  }
  R('open Pour Floor center is clear below 7.0 m (Tower Pond unblocked)', midBelow7 === 0, { verticesBelow7m: midBelow7, culprits: Object.fromEntries(midCulprits), sampleMid });

  // 3. Walkable tops ghost probe:
  // Walkable blocks: solid blocks that are not roofs, rails, or hidden
  const walkableBlocks = L.blocks.filter(b => b.solid && !b.roof && !b.rail && !b.hidden);
  const solidBlocks = L.blocks.filter(b => b.solid);

  const _d = new THREE.Vector3();
  const distToBlock = (b, x, y, z) => {
    _d.set(x - b.center.x, y - b.center.y, z - b.center.z);
    const u0 = _d.dot(b.axes[0]);
    const u1 = _d.dot(b.axes[1]);
    const u2 = _d.dot(b.axes[2]);
    const e0 = Math.max(0, Math.abs(u0) - b.half.x);
    const e1 = Math.max(0, Math.abs(u1) - b.half.y);
    const e2 = Math.max(0, Math.abs(u2) - b.half.z);
    return Math.hypot(e0, e1, e2);
  };

  const walkableTopUnder = (x, z, y) => {
    let best = -Infinity;
    for (const b of walkableBlocks) {
      _d.set(x - b.center.x, 0, z - b.center.z);
      const u0 = _d.dot(b.axes[0]);
      const u2 = _d.dot(b.axes[2]);
      if (Math.abs(u0) <= b.half.x + 0.05 && Math.abs(u2) <= b.half.z + 0.05) {
        const top = b.center.y + b.half.y;
        if (top <= y + 0.05 && top > best) {
          best = top;
        }
      }
    }
    return best;
  };

  let ghosts = 0, farthest = 0, atFarthest = null;
  const ghostCulprits = new Map();
  const lavaCulprits = new Map();
  const samplesByCulprit = new Map();
  const HIGH_MARK = LAVA.high;
  let lavaGhosts = 0;

  const { REGION_ALL, inPoly } = await import('./src/world/stages/caldera/geo.js');

  for (const it of placements) {
    if (!inMode(it, 'turf')) continue;
    const k2 = new PropKit(null, { headless: true });
    k2.add(it.type, it);
    for (const [mat, parts] of k2._buckets.entries()) {
      for (const p of parts) {
        const P = p.g.attributes.position;
        for (let i = 0; i < P.count; i++) {
          v3.fromBufferAttribute(P, i).applyMatrix4(p.m);
          // Check if inside lava region below HIGH + 0.3 off a block
          if (v3.y < HIGH_MARK + 0.3 && REGION_ALL.some(poly => inPoly(poly, v3.x, v3.z))) {
            let nearSolid = false;
            for (const b of solidBlocks) {
              if (distToBlock(b, v3.x, v3.y, v3.z) <= 0.085) {
                nearSolid = true;
                break;
              }
            }
            if (!nearSolid) {
              lavaGhosts++;
              lavaCulprits.set(it.type, (lavaCulprits.get(it.type) || 0) + 1);
            }
          }

          // Check if in player body space over walkable ground
          const gh = walkableTopUnder(v3.x, v3.z, v3.y);
          if (gh > -Infinity && v3.y > gh + 0.08 && v3.y < gh + 1.8) {
            let minDist = Infinity;
            let nearestTag = null;
            for (const b of solidBlocks) {
              const d = distToBlock(b, v3.x, v3.y, v3.z);
              if (d < minDist) {
                minDist = d;
                nearestTag = b.tag;
              }
              if (minDist <= 0.085) break;
            }
            if (minDist > 0.085) {
              ghosts++;
              ghostCulprits.set(it.type, (ghostCulprits.get(it.type) || 0) + 1);
              let arr = samplesByCulprit.get(it.type);
              if (!arr) { arr = []; samplesByCulprit.set(it.type, arr); }
              if (arr.length < 3) arr.push([+v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2), +minDist.toFixed(3), nearestTag]);
              if (minDist > farthest) {
                farthest = minDist;
                atFarthest = [+v3.x.toFixed(2), +v3.y.toFixed(2), +v3.z.toFixed(2), mat, it.type];
              }
            }
          }
        }
      }
    }
  }

  R('dressing vertices on walkable tops within 8.5 cm of solid faces', ghosts === 0, { ghosts, farthest: +farthest.toFixed(3), atFarthest, culprits: Object.fromEntries(ghostCulprits), samples: Object.fromEntries(samplesByCulprit) });
  R('no dressing vertices in lava below HIGH + 0.3 off solid blocks', lavaGhosts === 0, { lavaGhosts, culprits: Object.fromEntries(lavaCulprits) });

  // 4. Decor lamps: exactly 4 plinth lamps, none in lava or on roofs
  const lamps = LAYOUT.decor?.lamps || [];
  const badLamps = lamps.filter(([x, z]) => {
    // Check if on plinth: [-3, -14.5], [3, -14.5], [-3, -19.5], [3, -19.5]
    const onPlinth = (Math.abs(x) === 3.0 && (Math.abs(z + 14.5) < 0.1 || Math.abs(z + 19.5) < 0.1));
    return !onPlinth;
  });
  R('decor lamps stand only on the 4 plinths', lamps.length === 4 && badLamps.length === 0, { total: lamps.length, badLamps });

  // 5. Stage surfaces applied on blocks
  const usedPatterns = new Set(L.blocks.map(b => b.pattern));
  R('stage surfaces (tuff 70, basalt 71, glaze 72) carry the stage', [SURF.tuff, SURF.basalt, SURF.glaze].every(s => usedPatterns.has(s)), { SURF, used: Array.from(usedPatterns) });

  return out;
})();
