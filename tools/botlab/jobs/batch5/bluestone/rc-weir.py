#!/usr/bin/env python3
# Bluestone round C (scratch): SPEC §9.1 #9 and ENGINE rule 17 at the Bazookarp's weir, Pond and Gate (both teams'): every
# solid within 3 m of the centre that stands above its floor up to the shell's 2.3 m, and every era piece within 3 m.
#   python3 rc-weir.py <dump-bazookarp-all.json> <layout bazookarp JSON>
import json, math, sys
D = json.load(open(sys.argv[1])); K = json.loads(open(sys.argv[2]).read())
def segdist(p, a, b):
    ax, az = a; bx, bz = b; px, pz = p; dx, dz = bx-ax, bz-az; L2 = dx*dx+dz*dz
    t = 0 if L2 == 0 else max(0, min(1, ((px-ax)*dx+(pz-az)*dz)/L2)); return math.hypot(px-(ax+t*dx), pz-(az+t*dz))
def inside(p, poly):
    x, z = p; c = False
    for i in range(len(poly)):
        x1, z1 = poly[i]; x2, z2 = poly[(i+1) % len(poly)]
        if (z1 > z) != (z2 > z) and x < (x2-x1)*(z-z1)/(z2-z1)+x1: c = not c
    return c
w = K['weirs'][0]['at']; g = K['gate']['at']; s = K['start']
spots = [('Bravo weir (Alpha attack)', (w[0], w[1], w[2])), ('Alpha weir (Bravo attack)', (-w[0], w[1], -w[2])),
         ('Bravo Gate', (g[0], 1.0, g[1])), ('Alpha Gate', (-g[0], 1.0, -g[1])), ('Pond', tuple(s))]
for name, (wx, wy, wz) in spots:
    hits, eras = [], []
    for p in D['pieces']:
        if not p['solid'] or p.get('hidden'): continue
        top = max(p['y1'], p.get('hy', -99)) if p['k'] == 'r' else p['y1']; bot = p['y0']
        d = 0.0 if inside((wx, wz), p['poly']) else min(segdist((wx, wz), p['poly'][i], p['poly'][(i+1) % len(p['poly'])]) for i in range(len(p['poly'])))
        if d < 3.0 and p['eras']: eras.append((round(d, 2), p['tag'], p['eras']))
        if top <= wy + 0.05 or bot >= wy + 2.3: continue
        if d < 3.0: hits.append((round(d, 2), p['tag'], round(bot, 2), round(top, 2), 'rail' if p['rail'] else ('roof' if p['roof'] else '')))
    hits.sort(); eras.sort()
    print(f'{name} at {wx, wy, wz}: solids within 3 m {hits[:6] or "none"}; era pieces within 3 m {eras[:4] or "none"}')
