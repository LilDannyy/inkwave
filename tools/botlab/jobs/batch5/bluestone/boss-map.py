#!/usr/bin/env python3
# Bluestone (scratch, fix round 2): python3 boss-map.py dump.json out.png "title" — HULLBREAKER's nav round the circus
# (boss-nav.mjs DUMP=): home ground (where it plans to go) in orange, walls dark, drops blue, floor grey; the balcony's,
# the landing's, the gallery's and the verandas' footprints outlined in white (both halves); 10 px per metre, +z up.
import sys, json
from PIL import Image, ImageDraw, ImageFont
d = json.load(open(sys.argv[1])); S = 16
W = H = int(52 * S + 20)
im = Image.new('RGB', (W, H + 80), (24, 26, 30)); dr = ImageDraw.Draw(im)
X = lambda x: int((x + 26) * S + 10); Z = lambda z: int((26 - z) * S + 70)
col = {0: (110, 110, 104), 1: (40, 40, 44), 2: (40, 70, 110), 3: (90, 60, 90)}
for x, z, k, p in d['cells']:
    c = (230, 140, 50) if p else col[k]
    dr.rectangle([X(x - 0.25), Z(z + 0.25), X(x + 0.25) - 1, Z(z - 0.25) - 1], fill=c)
for name, (x0, x1, z0, z1) in d['over'].items():
    for s in (1, -1):
        a = (x0, x1, z0, z1) if s > 0 else (-x1, -x0, -z1, -z0)
        dr.rectangle([X(a[0]), Z(a[3]), X(a[1]), Z(a[2])], outline=(255, 255, 255), width=2)
for r in (8.2, 20):
    dr.ellipse([X(-r), Z(r), X(r), Z(-r)], outline=(160, 160, 160))
F = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 15)
dr.text((10, 8), sys.argv[3] if len(sys.argv) > 3 else '', fill=(255, 255, 255), font=F)
dr.text((10, 28), 'orange = home ground · dark = walls to its nav · blue = drops · white = overhangs · +z up', fill=(210, 210, 210), font=F); dr.text((10, 46), 'circles r 8.2 (dome columns) and 20 (the circus)', fill=(210, 210, 210), font=F)
im.save(sys.argv[2]); print('saved', sys.argv[2])
