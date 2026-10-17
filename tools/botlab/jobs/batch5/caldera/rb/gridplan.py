# colour plan with a 10 m grid and labels: python3 gridplan.py plan.json out.png [title]
import sys, json, numpy as np
from PIL import Image, ImageDraw
d = json.load(open(sys.argv[1])); out = sys.argv[2]; title = sys.argv[3] if len(sys.argv) > 3 else ''
S, nx, nz, X, Z = d['S'], d['nx'], d['nz'], d['X'], d['Z']
img = np.zeros((nz, nx, 3), np.uint8); img[:] = (24, 26, 33)
for j in range(nz):
    for i in range(nx):
        k, y, rg = d['cells'][j * nx + i]
        if k == 0:
            if rg: img[j, i] = (200, 62, 38)
            continue
        if k == 2: c = (70, 73, 80) if y < 9 else (225, 222, 214)
        elif k == 3: c = (47, 90, 72)
        elif k == 4: c = (88, 70, 66)
        elif k == 5: c = (240, 236, 226)
        elif k == 6: c = (70, 112, 100)
        elif k == 7: c = (140, 144, 152)
        else: v = int(100 + max(-1, min(5, y)) * 25); c = (min(255, v), min(255, v - 3), min(255, v - 9))
        if rg and k not in (2, 3, 7) and y < 0.9: c = (150, 60, 50)
        img[j, i] = c
sc = 5 if S == 0.5 else 10
im = Image.fromarray(img[::-1]).resize((nx * sc, nz * sc), Image.NEAREST)
dr = ImageDraw.Draw(im)
ppm = sc / S
for v in range(-int(X) // 10 * 10, int(X) + 1, 10):
    px = (v + X) * ppm; dr.line([(px, 0), (px, nz * sc)], fill=(90, 160, 255) if v == 0 else (60, 90, 140), width=1)
    dr.text((px + 2, 2), str(v), fill=(140, 190, 255))
for v in range(-int(Z) // 10 * 10, int(Z) + 1, 10):
    py = (Z - v) * ppm; dr.line([(0, py), (nx * sc, py)], fill=(90, 160, 255) if v == 0 else (60, 90, 140), width=1)
    dr.text((2, py + 2), str(v), fill=(140, 190, 255))
dr.text((nx * sc // 2 - 60, 14), title, fill=(255, 255, 255))
im.save(out); print('wrote', out, im.size)
