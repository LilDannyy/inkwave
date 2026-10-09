#!/usr/bin/env python3
# Bluestone round C (scratch): walkable-floor masks side by side at one scale (shape-sheet.mjs's raster: 0.5 m cells,
# a walkable top = solid, not roof / rail / hidden, nothing solid 0.6 m over it). White = walkable floor, grey = roofs and
# buildings, blue = water / out of play; a 10 m grid. The same orientation as shoot.cjs's 'top' frames (+z to the right,
# +x up), so the masks line up with the pictures above them.
#   python3 rc-masks.py in.json out.png PXM "title" id=label ...
import sys, json
from PIL import Image, ImageDraw, ImageFont
d = json.load(open(sys.argv[1])); out = sys.argv[2]; S = float(sys.argv[3]); title = sys.argv[4]
labels = dict(a.split('=', 1) for a in sys.argv[5:])
F = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 15); Fb = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 20)
panels = []
for id, lab in labels.items():
    s = d[id]; C = s['C']; nx, nz = s['nx'], s['nz']
    w, h = int(nz * C * S), int(nx * C * S)             # +z across, +x up
    im = Image.new('RGB', (w, h), (36, 72, 104)); px = im.load(); n = 0
    for j in range(nz):
        for i in range(nx):
            v = s['g'][j * nx + i]
            if v == -99: continue
            c = (120, 118, 112) if v == -50 else (242, 238, 226)
            if v != -50: n += 1
            X0 = int(j * C * S); X1 = int((j + 1) * C * S); Y1 = h - int(i * C * S); Y0 = h - int((i + 1) * C * S)
            for x in range(X0, X1):
                for y in range(Y0, Y1):
                    if 0 <= x < w and 0 <= y < h: px[x, y] = c
    dr = ImageDraw.Draw(im)
    for m in range(-100, 101, 10):
        X = (m - s['z0']) * S; Y = h - (m - s['x0']) * S
        if 0 <= X < w: dr.line([(X, 0), (X, h)], fill=(70, 100, 130), width=1)
        if 0 <= Y < h: dr.line([(0, Y), (w, Y)], fill=(70, 100, 130), width=1)
    panels.append((lab.replace('{n}', f'{n * C * C:,.0f}'), im))
Wd = max(p[1].width for p in panels) + 60; Hh = sum(p[1].height + 34 for p in panels) + 90
sheet = Image.new('RGB', (Wd, Hh), (22, 26, 32)); dr = ImageDraw.Draw(sheet); dr.text((30, 14), title, fill=(255, 255, 255), font=Fb)
y = 52
for lab, im in panels:
    dr.text((30, y), lab, fill=(230, 230, 230), font=F); y += 22; sheet.paste(im, (30, y)); y += im.height + 12
dr.rectangle([30, Hh - 26, 30 + int(20 * S), Hh - 20], fill=(230, 230, 230)); dr.text((40 + int(20 * S), Hh - 32), '20 m', fill=(230, 230, 230), font=F)
sheet.save(out); print('saved', out, sheet.size)
