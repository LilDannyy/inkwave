# Highmark Foundry r3: the shape sheet — top shots from ONE camera (250 m up, 35° horizontal fov: 10.15 px/m on a
# 1600 px frame) of Highmark at LOW and HIGH, Gulper Aquarium (its top-tide-down.jpg, shot from the 'top' preset at
# 257.3 m, rescaled ×1.029 to this camera), Great Turf War Craters and Halyard Marina; then the walkable-floor
# footprints (cover-map's floor rule, closed 5×5, holes filled) at the same scale.
#   python3 sheet.py low.png high.png gulper.jpg craters.png halyard.png plan-low.json plan-high.json refdir out.jpg [title]
import sys, json, re, base64, numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
lo, hi, gu, cr, ha, pl, ph, refdir, out = sys.argv[1:10]
title = sys.argv[10] if len(sys.argv) > 10 else 'Highmark Foundry r3'
W, H = 1600, 900
def frame(p, scale=1.0):
    im = Image.open(p).convert('RGB')
    if scale != 1.0:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        l, t = (im.width - W) // 2, (im.height - H) // 2; im = im.crop((l, t, l + W, t + H))
    return im
try: font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 30); small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 24)
except Exception: font = small = ImageFont.load_default()
rows = [(f'{title} — LOW lava (−0.6)', frame(lo)), (f'{title} — HIGH lava (+0.8)', frame(hi)),
        ('Gulper Aquarium (batch 5, the round stage) — its top-tide-down.jpg rescaled to this camera', frame(gu, 257.3 / 250)),
        ('Great Turf War Craters', frame(cr)), ('Halyard Marina (the bar)', frame(ha))]
# footprints, same 10.15 px/m, laid out like the shots (z to the right, x up)
CX, CZ, PPM = 40, 80, 10.15
def canvas_from(g, floor):
    C = np.zeros((2 * CZ, 2 * CX), bool)
    for j in range(g['nz']):
        z = g['z0'] + j
        if not (-CZ <= z < CZ): continue
        for i in range(g['nx']):
            x = g['x0'] + i
            if -CX <= x < CX and floor[j * g['nx'] + i]: C[z + CZ, x + CX] = True
    return C
def ref(f):
    log = open(f).read(); g = json.loads(re.search(r'PASS cover map\s+(\{.*\})', log).group(1))['grid']
    b = np.frombuffer(base64.b64decode(g['b64']), dtype=np.uint8); return canvas_from(g, (b != 255).astype(int))
foot = lambda F: ndi.binary_fill_holes(ndi.binary_closing(F, structure=np.ones((5, 5))))
def sil(F, col):
    # F[z, x] → image with z to the right, +x up (the shots' orientation)
    a = np.zeros((2 * CX, 2 * CZ, 3), np.uint8); a[:] = (24, 26, 33); T = F.T[::-1]; a[T] = col
    im = Image.fromarray(a).resize((round(2 * CZ * PPM / 2), round(2 * CX * PPM / 2)), Image.NEAREST)
    return im
fl = [(json.load(open(pl))['grid'], 'Highmark LOW'), (json.load(open(ph))['grid'], 'Highmark HIGH')]
sils = [(t, sil(foot(canvas_from(g, g['floor'])), (236, 196, 160))) for g, t in fl]
sils += [(t, sil(foot(ref(refdir + '/' + f)), (220, 220, 214))) for t, f in [('Gulper Aquarium', 'cov-aq.txt'), ('Craters', 'cov-craters.txt'), ('Halyard', 'cov-hal.txt')]]
sw, sh = sils[0][1].size
LBL = 44
sheet = Image.new('RGB', (W, len(rows) * (H + LBL) + LBL + 3 * (sh + LBL)), (250, 250, 248)); d = ImageDraw.Draw(sheet)
y = 0
for t, im in rows:
    d.text((12, y + 8), t, fill=(20, 20, 20), font=font); sheet.paste(im, (0, y + LBL)); y += H + LBL
d.text((12, y + 8), 'Walkable-floor footprints at the same scale (cover-map floor rule; closed 5×5, holes filled — the review’s measure)', fill=(20, 20, 20), font=small); y += LBL
for k, (t, im) in enumerate(sils):
    col, row = k % 2, k // 2
    x0, y0 = col * (sw + 0), y + row * (sh + LBL)
    d.text((x0 + 12, y0 + 8), t, fill=(20, 20, 20), font=small); sheet.paste(im, (x0, y0 + LBL))
sheet = sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS)
q = 85
while True:
    sheet.save(out, quality=q)
    import os
    if os.path.getsize(out) < 295000 or q < 40: break
    q -= 5
print('wrote', out, sheet.size, os.path.getsize(out), 'q', q)
