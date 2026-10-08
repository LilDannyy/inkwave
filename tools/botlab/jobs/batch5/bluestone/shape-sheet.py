# The shape test (scratch): python3 shape-sheet.py in.json out.png "title" [labels]  — every stage's walkable footprint at
# the same scale (2 px per metre, +z up, Alpha at the bottom), height-shaded; grey = buildings / roofs; a 10 m grid.
import sys, json
from PIL import Image, ImageDraw, ImageFont
d = json.load(open(sys.argv[1])); out = sys.argv[2]; title = sys.argv[3] if len(sys.argv) > 3 else ''
labels = dict(a.split('=', 1) for a in sys.argv[4:]) if len(sys.argv) > 4 else {}
S = 3.0  # px per metre
F = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 15); Fs = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 13); Fb = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 22)
panels = []
for id, s in d.items():
    w, h = int(s['nx'] * s['C'] * S), int(s['nz'] * s['C'] * S)
    im = Image.new('RGB', (w, h), (36, 72, 104)); px = im.load()
    for j in range(s['nz']):
        for i in range(s['nx']):
            v = s['g'][j * s['nx'] + i]
            if v == -99: continue
            if v == -50: c = (120, 118, 112)
            else:
                t = max(0.0, min(1.0, (v + 0.3) / 6.0)); c = (int(205 + 40 * t), int(196 + 40 * t), int(170 + 50 * t))
                if v < 0.35: c = (196, 188, 160)
            x0 = int(i * s['C'] * S); x1 = int((i + 1) * s['C'] * S); y1 = h - int(j * s['C'] * S); y0 = h - int((j + 1) * s['C'] * S)
            for x in range(x0, x1):
                for y in range(y0, y1):
                    if 0 <= x < w and 0 <= y < h: px[x, y] = c
    dr = ImageDraw.Draw(im)
    for m in range(-100, 101, 10):   # 10 m grid
        X = (m - s['x0']) * S; Y = h - (m - s['z0']) * S
        if 0 <= X < w: dr.line([(X, 0), (X, h)], fill=(70, 100, 130) if m else (220, 90, 90), width=1 if m else 3)
        if 0 <= Y < h: dr.line([(0, Y), (w, Y)], fill=(70, 100, 130) if m else (220, 90, 90), width=1 if m else 3)
    panels.append((labels.get(id, id), im))
W = sum(p[1].width for p in panels) + 40 * (len(panels) + 1); H = max(p[1].height for p in panels) + 120
sheet = Image.new('RGB', (W, H), (22, 26, 32)); dr = ImageDraw.Draw(sheet)
dr.text((40, 14), title, fill=(255, 255, 255), font=Fb)
x = 40
for name, im in panels:
    sheet.paste(im, (x, 76 + (H - 120 - im.height) // 2))
    for li, line in enumerate(name.split('|')): dr.text((x, 40 + li * 16), line, fill=(230, 230, 230), font=Fs)
    x += im.width + 40
dr.text((40, H - 32), '3 px = 1 m (same scale), +z up (Alpha at the bottom), 10 m grid, red = the axes through mid; sand = walkable (lighter = higher), grey = buildings / roofs, blue = water / out of play', fill=(200, 200, 200), font=F)
sheet.save(out); print('saved', out, sheet.size)
