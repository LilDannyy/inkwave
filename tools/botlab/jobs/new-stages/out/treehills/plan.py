# Eco-Forest Treehills — top-down plan from dump.mjs's JSON: pieces shaded by height, ramps hatched, the zones, the
# tower track, the pods (+ their hedges), spawn pads. Minimap view: +X to the left, Bravo at the top (as a player sees it).
#   python3 plan.py dump.json out.png [scale]
import json, sys, math
from PIL import Image, ImageDraw, ImageFont
J = json.load(open(sys.argv[1])); out = sys.argv[2]; S = float(sys.argv[3]) if len(sys.argv) > 3 else 11
B = J['bounds']; x0, x1, z0, z1 = B['minX'] - 3, B['maxX'] + 3, B['minZ'] - 3, B['maxZ'] + 3
W, H = int((x1 - x0) * S), int((z1 - z0) * S)
def P(x, z): return ((x1 - x) * S, (z1 - z) * S)
im = Image.new('RGB', (W, H), (46, 112, 108)); d = ImageDraw.Draw(im, 'RGBA')
F = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 12)
def col(y1, dd):
    if dd.get('roof'): return (120, 120, 128)
    t = dd.get('tag') or ''
    if t in ('retaining', 'coping'): base = (150, 160, 150)
    elif y1 < 0.5: base = (170, 200, 140)
    elif y1 < 1.8: base = (196, 190, 150)
    elif y1 < 3.0: base = (206, 170, 110)
    elif y1 < 3.5: base = (230, 228, 220)
    else: base = (190, 130, 90)
    return base
def corners(dd):
    if dd['kind'] == 'box':
        a, b = dd['min'], dd['max']; return [(a[0], a[2]), (b[0], a[2]), (b[0], b[2]), (a[0], b[2])], b[1]
    if dd['kind'] == 'obox':
        cx, cy, cz = dd['center']; sx, sy, sz = dd['size']; a = math.radians(dd['rotY'])
        ax = (math.cos(a), -math.sin(a)); az = (math.sin(a), math.cos(a))
        return [(cx + ax[0] * sx / 2 * i + az[0] * sz / 2 * k, cz + ax[1] * sx / 2 * i + az[1] * sz / 2 * k) for i, k in [(-1, -1), (1, -1), (1, 1), (-1, 1)]], cy + sy / 2
    lo, hi, w = dd['low'], dd['high'], dd['width']
    dx, dz = hi[0] - lo[0], hi[2] - lo[2]; L = math.hypot(dx, dz); nx, nz = -dz / L * w / 2, dx / L * w / 2
    return [(lo[0] + nx, lo[2] + nz), (hi[0] + nx, hi[2] + nz), (hi[0] - nx, hi[2] - nz), (lo[0] - nx, lo[2] - nz)], max(lo[1], hi[1]) + 0.001
items = sorted([(t, p, dd) for dd in J['defs'] if not dd.get('hidden') for p, t in [corners(dd)]], key=lambda t: t[0])
for top, pts, dd in items:
    c = col(top, dd)
    if dd['kind'] == 'ramp':
        d.polygon([P(*p) for p in pts], fill=(222, 214, 190), outline=(120, 110, 90))
        lo, hi = dd['low'], dd['high']
        for k in range(1, 8):
            t = k / 8; cx, cz = lo[0] + (hi[0] - lo[0]) * t, lo[2] + (hi[2] - lo[2]) * t
            dx, dz = hi[0] - lo[0], hi[2] - lo[2]; L = math.hypot(dx, dz); nx, nz = -dz / L * dd['width'] / 2, dx / L * dd['width'] / 2
            d.line([P(cx + nx, cz + nz), P(cx - nx, cz - nz)], fill=(150, 140, 110), width=1)
    else:
        d.polygon([P(*p) for p in pts], fill=c)
# height labels at region centres (sparse)
Z = J['zones']
zp = lambda z: z.get('polys') or [z['poly']]
for z in Z['center']:
    for p in zp(z): d.polygon([P(*q) for q in p], outline=(245, 200, 0), fill=(245, 200, 0, 50), width=2)
for sg in (1, -1):
    for p in zp(Z['side']): d.polygon([P(q[0] * sg, q[1] * sg) for q in p], outline=(245, 200, 0), fill=(245, 200, 0, 50), width=2)
T = J['tower']['path']
for sg, c in ((1, (255, 90, 200, 230)), (-1, (90, 200, 255, 230))):
    pts = [P(p[0] * sg, p[-1] * sg) for p in T]
    d.line(pts, fill=c, width=int(2.5 * S))
    d.line(pts, fill=(255, 255, 255, 160), width=2)
    for cp in J['tower'].get('checkpoints', []):
        x, z = cp[0] * sg, cp[1] * sg; d.ellipse([P(x + 0.8, z + 0.8), P(x - 0.8, z - 0.8)], fill=(255, 255, 255))
# pods + hedges
for sg in (1, -1):
    for p in J['pods']['list']:
        x, y, z = p['pos']; x, z = x * sg, z * sg; r = p['rotY'] + (math.pi if sg < 0 else 0)
        w, h, dd = p['size']; ux, uz = math.cos(r), -math.sin(r); vx, vz = math.sin(r), math.cos(r)
        q = [(x + ux * w / 2 * i + vx * dd / 2 * k, z + uz * w / 2 * i + vz * dd / 2 * k) for i, k in [(-1, -1), (1, -1), (1, 1), (-1, 1)]]
        d.polygon([P(*a) for a in q], fill=(90, 170, 60, 120), outline=(40, 110, 30))
        d.ellipse([P(x + 0.45, z + 0.45), P(x - 0.45, z - 0.45)], fill=(40, 90, 40))
# props (footprints as small dots / boxes)
for p in J['pl']:
    if p['type'] == 'pod': continue
    x, y, z = p['pos']
    d.rectangle([P(x + 0.3, z + 0.3), P(x - 0.3, z - 0.3)], fill=(60, 60, 70))
for sp in J['pads']:
    x, y, z = sp; d.ellipse([P(x + 1.2, z + 1.2), P(x - 1.2, z - 1.2)], outline=(255, 255, 255), width=2)
    d.ellipse([P(x + 4.2, z + 4.2), P(x - 4.2, z - 4.2)], outline=(255, 255, 255, 120), width=1)
# grid
for gx in range(-30, 31, 10):
    d.line([P(gx, z0), P(gx, z1)], fill=(255, 255, 255, 30)); d.text(P(gx + 0.3, z1 - 0.3), str(gx), fill=(255, 255, 255, 140), font=F)
for gz in range(-40, 41, 10):
    d.line([P(x0, gz), P(x1, gz)], fill=(255, 255, 255, 30)); d.text(P(x1 - 0.3, gz + 0.3), str(gz), fill=(255, 255, 255, 140), font=F)
im.save(out)
print('saved', out, im.size)
