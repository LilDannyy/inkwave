# Draw shape-sheet.mjs's output: each stage's footprint at one scale (+x right, +z down: Alpha's spawn at the top)
#   python3 shape-sheet.py sheet.json out.png
import sys, json
from PIL import Image, ImageDraw, ImageFont
d = json.load(open(sys.argv[1])); out = sys.argv[2]
PX = 5  # pixels per 0.5 m cell → 10 px per metre
F = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 22); Fs = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 15)
COL = {'0': (214, 207, 192), '1': (176, 168, 150), '2': (139, 122, 99), '#': (90, 96, 104)}
panels = []
for id, s in d.items():
    rows = s['rows']; nz = len(rows); nx = len(rows[0])
    im = Image.new('RGB', (nx * PX, nz * PX), (43, 92, 120)); dr = ImageDraw.Draw(im)
    for j, row in enumerate(rows):
        for i, c in enumerate(row):
            if c != '.': dr.rectangle([i * PX, j * PX, (i + 1) * PX - 1, (j + 1) * PX - 1], fill=COL[c])
    b = s['bounds']
    for k, (x, y, z) in enumerate(s['spawns']):
        cx, cz = (x - b['minX']) / s['res'] * PX, (z - b['minZ']) / s['res'] * PX
        dr.ellipse([cx - 9, cz - 9, cx + 9, cz + 9], fill=(255, 140, 20) if k == 0 else (60, 100, 255), outline=(255, 255, 255), width=2)
    panels.append((id, im, s))
H = max(p[1].height for p in panels) + 90; W = sum(p[1].width for p in panels) + 40 * (len(panels) + 1)
sheet = Image.new('RGB', (W, H), (24, 28, 34)); dr = ImageDraw.Draw(sheet); x = 40
for id, im, s in panels:
    sheet.paste(im, (x, 70 + (H - 90 - im.height) // 2))
    b = s['bounds']; dr.text((x, 12), id, fill=(255, 255, 255), font=F)
    dr.text((x, 40), f"{b['maxX']-b['minX']:.0f} x {b['maxZ']-b['minZ']:.0f} m bounds", fill=(190, 190, 190), font=Fs)
    x += im.width + 40
dr.line([(40, H - 14), (140, H - 14)], fill=(255, 255, 255), width=3); dr.text((150, H - 24), '10 m (same scale for every stage; Alpha spawn orange)', fill=(220, 220, 220), font=Fs)
sheet.save(out); print('saved', out, sheet.size)
