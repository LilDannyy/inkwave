# routes picture: the plan (minimap view: +x left, Bravo top) with Alpha's routes to the centre (nav paths) and the zones
import json, sys, math
from PIL import Image, ImageDraw, ImageFont
J = json.load(open(sys.argv[1])); R = json.load(open(sys.argv[2])); out = sys.argv[3]
S = 11; x0, x1, z0, z1 = -38, 38, -48, 48
W, H = int((x1 - x0) * S), int((z1 - z0) * S) + 40
def P(x, z): return ((x1 - x) * S, (z1 - z) * S + 40)
im = Image.new('RGB', (W, H), (52, 118, 134)); d = ImageDraw.Draw(im, 'RGBA')
F = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 13); FB = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 16)
def col(y1, dd):
    if dd.get('roof'): return (120, 120, 128)
    if y1 < -0.05: return (205, 198, 178)
    if dd.get('tag') == 'sandbar': return (214, 205, 184)
    if y1 < 0.1: return (236, 231, 216)
    if y1 < 0.5: return (196, 160, 118)
    if y1 < 1.0: return (214, 186, 140)
    if y1 < 1.6: return (212, 184, 128)
    if y1 < 2.2: return (190, 155, 100)
    if y1 < 3.0: return (172, 135, 84)
    return (150, 110, 70)
def corners(dd):
    if dd['kind'] == 'box':
        a, b = dd['min'], dd['max']; return [(a[0], a[2]), (b[0], a[2]), (b[0], b[2]), (a[0], b[2])], b[1]
    if dd['kind'] == 'obox':
        cx, cy, cz = dd['center']; sx, sy, sz = dd['size']; a = math.radians(dd['rotY'])
        ax = (math.cos(a), -math.sin(a)); az = (math.sin(a), math.cos(a))
        return [(cx + ax[0] * sx / 2 * i + az[0] * sz / 2 * k, cz + ax[1] * sx / 2 * i + az[1] * sz / 2 * k) for i, k in [(-1, -1), (1, -1), (1, 1), (-1, 1)]], cy + sy / 2
    lo, hi, w = dd['low'], dd['high'], dd['width']
    dx, dz = hi[0] - lo[0], hi[2] - lo[2]; L = math.hypot(dx, dz); nx, nz = -dz / L * w / 2, dx / L * w / 2
    return [(lo[0] + nx, lo[2] + nz), (hi[0] + nx, hi[2] + nz), (hi[0] - nx, hi[2] - nz), (lo[0] - nx, lo[2] - nz)], (lo[1] + hi[1]) / 2 + 0.001
items = sorted([(t, p, dd) for dd in J['defs'] for p, t in [corners(dd)]], key=lambda t: t[0])
for top, pts, dd in items: d.polygon([P(*p) for p in pts], fill=col(top, dd))
for p in J['pl']:
    if p['type'] in ('driftwood', 'ropefence'):
        x, y, z = p['pos']; r = p['rotY']; Lh = p.get('L') or 3; ux, uz = math.cos(r), -math.sin(r)
        a, b = ((x - ux * Lh / 2, z - uz * Lh / 2), (x + ux * Lh / 2, z + uz * Lh / 2)) if p['type'] == 'driftwood' else ((x, z), (x + ux * Lh, z + uz * Lh))
        d.line([P(*a), P(*b)], fill=(120, 96, 70), width=2)
Z = J['zones']
zp = lambda z: z.get('polys') or [z['poly']]
for z in Z['center']:
    for p in zp(z): d.polygon([P(*q) for q in p], outline=(245, 200, 0), fill=(245, 200, 0, 60), width=2)
for sg in (1, -1):
    for p in zp(Z['side']): d.polygon([P(q[0] * sg, q[1] * sg) for q in p], outline=(245, 200, 0), fill=(245, 200, 0, 60), width=2)
C = [(230, 60, 60), (40, 110, 230), (150, 60, 200), (20, 160, 90), (240, 140, 20)]
leg = []
for i, (nm, pts) in enumerate(R.items()):
    c = C[i % len(C)]
    off = (i - 2) * 0.22
    d.line([P(x + off, z + off) for x, z in pts], fill=c + (235,), width=4, joint='curve')
    d.line([P(-x - off, -z - off) for x, z in pts], fill=c + (80,), width=3, joint='curve')
    leg.append((nm, c))
if len(sys.argv) > 4 and sys.argv[4] == 'tower':
    T = J['tower']['path']
    for sg, c in ((1, (230, 70, 40)), (-1, (40, 110, 230))):
        d.line([P(p[0] * sg, p[-1] * sg) for p in T], fill=c, width=5)
        for q in J['tower']['checkpoints']: X, Y = P(q[0] * sg, q[1] * sg); d.ellipse([X - 7, Y - 7, X + 7, Y + 7], fill=c, outline=(255, 255, 255), width=2)
    leg = [("tower track: Alpha's push (to Bravo's goal)", (230, 70, 40)), ("Bravo's push", (40, 110, 230))]
for pad in J['pads']:
    X, Y = P(pad[0], pad[2]); d.ellipse([X - 9, Y - 9, X + 9, Y + 9], outline=(255, 255, 255), width=3)
X, Y = P(0, 0); d.ellipse([X - 6, Y - 6, X + 6, Y + 6], fill=(255, 255, 255))
d.rectangle([0, 0, W, 40], fill=(24, 40, 60))
d.text((10, 2), ('Plan: sand 0 · dune/causeway/plinth 1.3 · crest/tier 2.5 · pad 3.2 · zones yellow' if len(sys.argv) > 4 else 'Alpha\'s routes, pad to centre (nav paths; Bravo mirrored, faint) · zones yellow · minimap view'), fill=(255, 255, 255), font=F)
x = 10
for nm, c in leg:
    d.rectangle([x, 22, x + 16, 34], fill=c); d.text((x + 20, 20), nm, fill=(255, 255, 255), font=F); x += 30 + int(d.textlength(nm, font=F))
im.save(out)
