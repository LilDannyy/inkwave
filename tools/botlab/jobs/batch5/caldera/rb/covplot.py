# overlay cover-map's uncovered cells (distance to cover > 5 m) on the zoomed plan; list clusters
import sys, json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
c = json.load(open(sys.argv[1])); im = Image.open(sys.argv[2]).convert('RGB'); X0, X1, Z0, Z1, ppm = map(float, sys.argv[3:8]); out = sys.argv[8]
g = np.array(c['grid']).reshape(c['nz'], c['nx']); dr = ImageDraw.Draw(im, 'RGBA')
bad = (g > 5)
lab, n = ndimage.label(bad)
for j in range(c['nz']):
    for i in range(c['nx']):
        if g[j, i] > 5:
            x = c['x0'] + i; z = c['z0'] + j
            px, py = (x - X0) * ppm, (Z1 - z - 1) * ppm
            dr.rectangle([px, py, px + ppm, py + ppm], fill=(255, 0, 255, 150))
im.save(out)
cl = []
for k in range(1, n + 1):
    ys, xs = np.nonzero(lab == k); cl.append((len(ys), round(c['x0'] + xs.mean() + 0.5, 1), round(c['z0'] + ys.mean() + 0.5, 1), round(float(g[lab == k].max()), 1)))
cl.sort(reverse=True); print('uncovered cells', int(bad.sum()), 'of', int((g >= 0).sum()), 'clusters', cl[:14])
