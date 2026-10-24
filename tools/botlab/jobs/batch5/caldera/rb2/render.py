# overlay plan: python3 render.py dump.json out.png x0 x1 z0 z1 ppm title
import sys, json
from PIL import Image, ImageDraw
d = json.load(open(sys.argv[1])); out = sys.argv[2]; X0, X1, Z0, Z1 = map(float, sys.argv[3:7]); ppm = int(sys.argv[7]); title = sys.argv[8] if len(sys.argv) > 8 else ''
W, H = int((X1 - X0) * ppm), int((Z1 - Z0) * ppm)
im = Image.new('RGB', (W, H), (22, 24, 30)); dr = ImageDraw.Draw(im, 'RGBA')
P = lambda x, z: ((x - X0) * ppm, (Z1 - z) * ppm)
fc = {'yard': (176, 170, 160), 'terrace': (140, 140, 150), 'lakefront': (112, 112, 116), 'moorings': (128, 124, 110), 'rimHead': (120, 92, 84), 'gallery': (228, 224, 214)}
for k in ['lakefront', 'moorings', 'terrace', 'yard', 'rimHead', 'gallery']: dr.polygon([P(*p) for p in d['polys'][k]], fill=fc[k], outline=(30, 30, 30))
# distance heat: cells over 7 m red, 6-7 orange
for nm, a in d['dist'].items():
    for x, z, v in a['cells']:
        if v > 7: col = (230, 40, 40, 150)
        elif v > 6: col = (240, 150, 40, 110)
        else: continue
        p = P(x - 0.25, z + 0.25); dr.rectangle([p[0], p[1], p[0] + 0.5 * ppm, p[1] + 0.5 * ppm], fill=col)
# tower lane (platform 2.5 m + 0.5 clearance)
T = d['tower']
for i in range(1, len(T)):
    (ax, az), (bx, bz) = T[i - 1], T[i]
    x0, x1, z0, z1 = min(ax, bx) - 1.75, max(ax, bx) + 1.75, min(az, bz) - 1.75, max(az, bz) + 1.75
    dr.rectangle([P(x0, z1), P(x1, z0)], fill=(60, 120, 255, 50), outline=(80, 140, 255, 160))
for b in d['blocks']:
    if b['floor'] or b['hidden'] or b['tag'] in ('weighbridge', 'pit-ramp'): continue
    cs = [P(*p) for p in b['c']]
    if b['rail']: dr.polygon(cs, fill=(47, 140, 90, 200)); continue
    h = b['y1'] - b['y0']
    if b['ramp']: col = (95, 100, 120, 200)
    elif h >= 3.6: col = (245, 245, 245, 230)
    elif h >= 2.4: col = (40, 44, 120, 235)
    elif h >= 1.8: col = (60, 70, 170, 235)
    elif h >= 0.9: col = (40, 42, 48, 235)
    else: col = (200, 170, 110, 220)
    dr.polygon(cs, fill=col, outline=(0, 0, 0, 200))
for k, c in [('gate', (255, 220, 0)), ('weir', (0, 230, 255))]:
    x, z = d[k]; r = 3 if k == 'weir' else 1
    dr.ellipse([P(x - r, z + r), P(x + r, z - r)], outline=c + (255,), width=2)
for v in range(int(X0 // 5 * 5), int(X1) + 1, 5):
    x = (v - X0) * ppm; dr.line([(x, 0), (x, H)], fill=(110, 160, 230, 90 if v % 10 else 170), width=1); dr.text((x + 2, 2), str(v), fill=(160, 200, 255))
for v in range(int(Z0 // 5 * 5), int(Z1) + 1, 5):
    y = (Z1 - v) * ppm; dr.line([(0, y), (W, y)], fill=(110, 160, 230, 90 if v % 10 else 170), width=1); dr.text((2, y + 2), str(v), fill=(160, 200, 255))
mx = '  '.join(f"{k} {v['max']}" for k, v in d['dist'].items())
dr.text((60, 14), title + '   max no-mass r: ' + mx, fill=(255, 255, 255))
im.save(out); print('wrote', out, im.size)
