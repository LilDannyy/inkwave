# Highmark Foundry r3: render plan.mjs samples (LOW, HIGH) as a top-down colour plan, the walkable-floor silhouettes
# (cover-map's floor rule, closed 5x5 and holes filled: the review's footprint), and the references beside them
# (Halyard, Craters, Gulper Aquarium: their cover-map grids). Prints the review's shape metrics.
#   python3 plan.py plan-low.json plan-high.json refdir out.png
import sys, json, re, base64, numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
from scipy.spatial import ConvexHull
lowf, highf, refdir, out = sys.argv[1:5]
CX, CZ = 40, 80                     # the common canvas: x -40..40, z -80..80, 1 m
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
    b = np.frombuffer(base64.b64decode(g['b64']), dtype=np.uint8)
    return canvas_from(g, (b != 255).astype(int))
def foot(F):
    return ndi.binary_fill_holes(ndi.binary_closing(F, structure=np.ones((5, 5))))
def solidity(F):
    ys, xs = np.nonzero(F); pts = np.r_[np.c_[xs, ys], np.c_[xs + 1, ys], np.c_[xs, ys + 1], np.c_[xs + 1, ys + 1]]
    return F.sum() / ConvexHull(pts).volume
iou = lambda a, b: (a & b).sum() / (a | b).sum()
def colour(d):
    S, nx, nz = d['S'], d['nx'], d['nz']; img = np.zeros((nz, nx, 3), np.uint8); img[:] = (24, 26, 33)
    for j in range(nz):
        for i in range(nx):
            k, y, rg = d['cells'][j * nx + i]
            if k == 0:
                if rg: img[j, i] = (200, 62, 38)
                continue
            if k == 2: c = (70, 73, 80) if y < 9 else (225, 222, 214)
            elif k == 3: c = (47, 90, 72)
            elif k == 4: c = (88, 76, 72)
            elif k == 5: c = (240, 236, 226)
            elif k == 6: c = (70, 112, 100)
            elif k == 7: c = (110, 114, 122)
            else: v = int(112 + max(-1, min(5, y)) * 22); c = (v, v - 3, v - 9)
            img[j, i] = c
    return Image.fromarray(img[::-1])        # +z up (Bravo at the top)
def sil(F, scale):
    a = np.zeros(F.shape + (3,), np.uint8); a[:] = (24, 26, 33); a[F] = (232, 228, 218)
    return Image.fromarray(a[::-1]).resize((F.shape[1] * scale, F.shape[0] * scale), Image.NEAREST)
D = {k: json.load(open(f)) for k, f in [('low', lowf), ('high', highf)]}
R = {k: ref(refdir + '/' + f) for k, f in [('halyard', 'cov-hal.txt'), ('craters', 'cov-craters.txt'), ('aquarium', 'cov-aq.txt')]}
Fh = foot(R['halyard'])
rows = []
for st in ['low', 'high']:
    g = D[st]['grid']; F = canvas_from(g, g['floor']); Fo = foot(F); D[st]['F'] = F; D[st]['Fo'] = Fo
    w = {z: int(Fo[z + CZ].sum()) for z in range(-60, 61, 4)}
    band = int(F[CZ - 20:CZ + 20].sum())
    rows.append(f"{st}: floor {F.sum()} m2, footprint {Fo.sum()}, solidity {solidity(Fo):.3f}, IoU Halyard {iou(Fo, Fh):.3f}, "
                f"IoU Gulper {iou(Fo, foot(R['aquarium'])):.3f}, IoU Craters {iou(Fo, foot(R['craters'])):.3f}, band |z|<20 floor {band}")
    rows.append('   widths ' + ' '.join(f'{z}:{v}' for z, v in w.items()))
for k, F in R.items():
    Fo = foot(F); rows.append(f"{k}: floor {F.sum()}, footprint {Fo.sum()}, solidity {solidity(Fo):.3f}, IoU Halyard {iou(Fo, Fh):.3f}, band {int(F[CZ-20:CZ+20].sum())}")
print('\n'.join(rows))
sc = int(round(1 / D['low']['S']))
pan = [('Highmark r3 LOW', colour(D['low'])), ('Highmark r3 HIGH', colour(D['high'])),
       ('floor LOW', sil(D['low']['F'], sc)), ('footprint LOW', sil(D['low']['Fo'], sc)), ('footprint HIGH', sil(D['high']['Fo'], sc)),
       ('Halyard', sil(foot(R['halyard']), sc)), ('Craters', sil(foot(R['craters']), sc)), ('Gulper Aquarium', sil(foot(R['aquarium']), sc))]
W = max(p.width for _, p in pan); H = max(p.height for _, p in pan)
sheet = Image.new('RGB', (len(pan) * (W + 6), H + 22), (255, 255, 255)); d = ImageDraw.Draw(sheet)
for i, (t, p) in enumerate(pan):
    sheet.paste(p, (i * (W + 6) + (W - p.width) // 2, 22 + (H - p.height) // 2)); d.text((i * (W + 6) + 4, 5), t, fill=(0, 0, 0))
sheet.save(out); sheet.crop((0, 0, 2 * (W + 6), H + 22)).save(out.replace('.png', '-c.png'))
print('wrote', out)
