#!/usr/bin/env python3
# Bluestone round C (scratch): put top-down pictures side by side AT ONE SCALE.
#   [COLS=n] python3 rc-sheet.py out.jpg "title" PXM  img1=label1=bounds1  img2=label2=bounds2 ...   (n panels per row)
# Each picture is a shoot.cjs 'top' preset frame (or crossmarket-top.webp, shot the same way); bounds "minX,maxX,minZ,maxZ"
# give its scale: the preset's camera height is max((D/2)/tan(17.5°), (W/2)/(tan(17.5°)/(16/9))) × 1.04 with fov 35°
# across the frame's width, so the frame spans 2·H·tan(17.5°) metres across. Every picture is resized to PXM px/m.
import sys, math
from PIL import Image, ImageDraw, ImageFont
out, title, PXM = sys.argv[1], sys.argv[2], float(sys.argv[3])
F = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 15); Fb = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 20)
T = math.tan(17.5 * math.pi / 180)
panels = []
for a in sys.argv[4:]:
    path, label, b = a.split('=')
    x0, x1, z0, z1 = map(float, b.split(','))
    W, D = x1 - x0, z1 - z0
    H = max((D / 2) / T, (W / 2) / (T / (16 / 9))) * 1.04
    span = 2 * H * T                       # metres across the frame
    im = Image.open(path).convert('RGB')
    s = PXM * span / im.width
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    panels.append((label, im))
import os
COLS = int(os.environ.get('COLS', '1'))
rows = [panels[i:i + COLS] for i in range(0, len(panels), COLS)]
Wd = max(sum(p[1].width for p in r) + 30 * (len(r) + 1) for r in rows)
Hh = sum(max(p[1].height for p in r) + 34 for r in rows) + 90
sheet = Image.new('RGB', (Wd, Hh), (22, 26, 32)); dr = ImageDraw.Draw(sheet)
dr.text((30, 14), title, fill=(255, 255, 255), font=Fb)
y = 52
for r in rows:
    x = 30
    for label, im in r:
        dr.text((x, y), label, fill=(230, 230, 230), font=F); sheet.paste(im, (x, y + 22)); x += im.width + 30
    y += max(p[1].height for p in r) + 34
# a 20 m scale bar
dr.rectangle([30, Hh - 26, 30 + int(20 * PXM), Hh - 20], fill=(230, 230, 230)); dr.text((40 + int(20 * PXM), Hh - 32), '20 m', fill=(230, 230, 230), font=F)
sheet.save(out, quality=82); print('saved', out, sheet.size)
