#!/usr/bin/env python3
# Bluestone blockout (scratch, round B fix 1): a top-down plan of part of a layout dump, to plan and check edits.
#   python3 plan-crop.py <dump.json> <out.png> x0 x1 z0 z1 [px per m, default 10] [title]
# Pieces drawn lowest top first: walkable tops by height (street blue-grey, 0.3-1.5 green-grey, 1.5-3 sand, >3 white),
# roof tops dark slate, rails red, hidden pieces skipped; a 5 m grid with labels; +x right, +z UP (Alpha's half at the
# bottom). Ramps are drawn as their footprint shaded low -> high.
import json, sys
from PIL import Image, ImageDraw, ImageFont
D = json.load(open(sys.argv[1])); out = sys.argv[2]
x0, x1, z0, z1 = map(float, sys.argv[3:7]); S = float(sys.argv[7]) if len(sys.argv) > 7 else 10.0
title = sys.argv[8] if len(sys.argv) > 8 else ''
W, H = int((x1 - x0) * S), int((z1 - z0) * S)
im = Image.new('RGB', (W, H + 30), (18, 40, 70)); d = ImageDraw.Draw(im)
F = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 12)
P = lambda x, z: ((x - x0) * S, (z1 - z) * S + 30)
def col(p, y):
    if p['roof']: return (52, 58, 66) if p['tag'] not in ('signal-yard', 'signal-yard-kerb') else (80, 70, 60)
    if y < -0.1: return (70, 80, 92)
    if y < 0.25: return (96, 104, 116)
    if y < 0.75: return (110, 128, 110)
    if y < 1.5: return (122, 150, 100)
    if y < 3.0: return (190, 170, 120)
    return (235, 235, 225)
pcs = [p for p in D['pieces'] if p['solid'] and not p['hidden'] and p['y1'] < 30]
def top(p): return max(p.get('ly', 0), p.get('hy', 0)) if p['k'] == 'r' else p['y1']
for p in sorted(pcs, key=lambda p: (p['rail'], top(p))):
    poly = [P(x, z) for x, z in p['poly']]
    if p['rail']: d.polygon(poly, fill=(220, 60, 60)); continue
    if p['k'] == 'r':
        d.polygon(poly, fill=col(p, (p['ly'] + p['hy']) / 2), outline=(255, 255, 255))
        lx, lz = p['lo']; hx, hz = p['hi']; d.line([P(lx, lz), P(hx, hz)], fill=(255, 255, 0), width=2)
        continue
    small = not p['roof'] and p['tag'] not in ('street', 'terrace', 'kerb', 'terrace-kerb', 'circus', 'carriageway', 'alley', 'alley-kerb')
    d.polygon(poly, fill=col(p, top(p)), outline=(30, 30, 30) if not p['eras'] else (255, 200, 0))
for gx in range(int(x0 // 5 * 5), int(x1) + 1, 5):
    if gx < x0: continue
    d.line([P(gx, z0), P(gx, z1)], fill=(255, 255, 255) if gx % 10 == 0 else (150, 150, 150), width=1)
    d.text((P(gx, z1)[0] + 2, 31), str(gx), fill=(255, 255, 255), font=F)
for gz in range(int(z0 // 5 * 5), int(z1) + 1, 5):
    if gz < z0: continue
    d.line([P(x0, gz), P(x1, gz)], fill=(255, 255, 255) if gz % 10 == 0 else (150, 150, 150), width=1)
    d.text((2, P(x0, gz)[1] + 1), str(gz), fill=(255, 255, 255), font=F)
d.rectangle([0, 0, W, 29], fill=(10, 10, 14)); d.text((6, 8), title + f'  era {D.get("era")} {D.get("mode")}  (+x right, +z up; 5 m grid)', fill=(255, 255, 255), font=F)
im.save(out)
