# the review's footprint (shape.py's foot) and its convex-hull deficit regions: area, centre, max depth from the hull, mouth width
import json, sys, numpy as np
from scipy import ndimage
from scipy.spatial import ConvexHull
from PIL import Image, ImageDraw
exec(open('shape.py').read().split("G={k:load")[0].replace("S='/private","S0='/private").replace("d=json.load(open(S+f))","d=json.load(open(f))"))
for f in sys.argv[1:]:
    F = foot(load(f)); pts = np.argwhere(F) + 0.0; h = ConvexHull(pts)
    hv = [(pts[i][1] + 0.5, pts[i][0] + 0.5) for i in h.vertices]
    im = Image.new('L', (120, 180), 0); ImageDraw.Draw(im).polygon(hv, fill=1); Hm = np.array(im) > 0
    V = Hm & ~F; lab, n = ndimage.label(V)
    # distance of each void cell from the hull's outside
    dist = ndimage.distance_transform_edt(Hm)
    print(f, 'solidity %.3f' % solidity(F), 'area', F.sum(), 'hull ~', Hm.sum())
    for k in range(1, n + 1):
        m = lab == k
        if m.sum() < 25: continue
        ys, xs = np.nonzero(m)
        edge = m & ~ndimage.binary_erosion(Hm)    # cells of this void on the hull's rim: the notch's mouth
        ey, ex = np.nonzero(edge)
        mouth = np.hypot(ex.max() - ex.min(), ey.max() - ey.min()) if len(ex) else 0
        print('   void %4d m2 at (%4d,%4d)  depth %4.1f m  mouth %4.1f m' % (m.sum(), xs.mean() - 60, ys.mean() - 90, dist[m].max(), mouth))
