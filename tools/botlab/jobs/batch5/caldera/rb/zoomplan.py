# zoomed colour plan with a 5 m grid: python3 zoomplan.py plan.json out.png x0 x1 z0 z1 [ppm] [title]
import sys, json, numpy as np
from PIL import Image, ImageDraw
d = json.load(open(sys.argv[1])); out = sys.argv[2]; X0, X1, Z0, Z1 = map(float, sys.argv[3:7]); ppm = int(sys.argv[7]) if len(sys.argv) > 7 else 8
title = sys.argv[8] if len(sys.argv) > 8 else ''
S, nx, nz, X, Z = d['S'], d['nx'], d['nz'], d['X'], d['Z']
W, H = int((X1 - X0) * ppm), int((Z1 - Z0) * ppm)
im = Image.new('RGB', (W, H), (24, 26, 33)); px = im.load()
for py in range(H):
    z = Z1 - (py + 0.5) / ppm
    j = int((z + Z) / S)
    if not (0 <= j < nz): continue
    for qx in range(W):
        x = X0 + (qx + 0.5) / ppm; i = int((x + X) / S)
        if not (0 <= i < nx): continue
        k, y, rg = d['cells'][j * nx + i]
        if k == 0:
            if rg: px[qx, py] = (200, 62, 38)
            continue
        if k == 2: c = (60, 63, 70) if y < 9 else (225, 222, 214)
        elif k == 3: c = (47, 120, 72)
        elif k == 4: c = (120, 70, 60)
        elif k == 5: c = (240, 236, 226)
        elif k == 6: c = (70, 140, 120)
        elif k == 7: c = (150, 154, 162)
        else: v = int(95 + max(-1, min(5, y)) * 26); c = (min(255, v), min(255, v - 3), min(255, v - 9))
        px[qx, py] = c
dr = ImageDraw.Draw(im)
for v in range(int(X0 // 5 * 5), int(X1) + 1, 5):
    x = (v - X0) * ppm; dr.line([(x, 0), (x, H)], fill=(70, 110, 170) if v % 10 else (110, 160, 230), width=1); dr.text((x + 2, 2), str(v), fill=(160, 200, 255))
for v in range(int(Z0 // 5 * 5), int(Z1) + 1, 5):
    y = (Z1 - v) * ppm; dr.line([(0, y), (W, y)], fill=(70, 110, 170) if v % 10 else (110, 160, 230), width=1); dr.text((2, y + 2), str(v), fill=(160, 200, 255))
dr.text((W // 2 - 50, 14), title, fill=(255, 255, 255))
im.save(out); print('wrote', out, im.size)
