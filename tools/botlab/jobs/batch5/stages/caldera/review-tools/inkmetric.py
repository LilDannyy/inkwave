# ink-loudest metric: per camera pair (no ink / ink), ink pixels = changed by the ink (sum |dRGB| > 60 and chroma up);
# S_ink = median HSV saturation x value-weighted chroma of the ink pixels; background = the other pixels of the lower two
# thirds; share = background pixels whose chroma >= the ink's median chroma (chroma = max - min of RGB, 0..255)
import sys, os, glob, json
import numpy as np
from PIL import Image
d = sys.argv[1]; out = {}
files = sorted(glob.glob(os.path.join(d, '*-0.png')))
for f0 in files:
    f1 = f0[:-6] + '-1.png'
    a = np.asarray(Image.open(f0).convert('RGB')).astype(np.int32); b = np.asarray(Image.open(f1).convert('RGB')).astype(np.int32)
    H = a.shape[0]; lo = slice(H // 3, H)
    diff = np.abs(a - b).sum(axis=2)
    chA = a.max(axis=2) - a.min(axis=2); chB = b.max(axis=2) - b.min(axis=2)
    ink = (diff > 60)
    inkL = ink[lo]; chL = chB[lo]
    n_ink = int(inkL.sum())
    if n_ink < 500: out[os.path.basename(f0)[:-6]] = {'ink_px': n_ink}; continue
    s_ink = float(np.median(chL[inkL]))
    bg = ~inkL
    share = float((chL[bg] >= s_ink).sum()) / float(bg.sum())
    # lava-ish share: background pixels red-dominant and as chromatic as the ink
    r, g, bb = b[lo][..., 0], b[lo][..., 1], b[lo][..., 2]
    lavaish = (r > g + 50) & (r > bb + 50) & bg & (chL >= s_ink)
    out[os.path.basename(f0)[:-6]] = {'ink_px_share': round(n_ink / inkL.size, 3), 'ink_chroma_med': round(s_ink, 1), 'bg_as_loud_share': round(share, 4), 'of_which_redlava': round(float(lavaish.sum()) / float(bg.sum()), 4), 'mean_luma_lower': round(float(b[lo].mean()), 1)}
    # debug overlay
    vis = b.copy().astype(np.uint8); m = ink; vis[m] = (vis[m] * 0.4 + np.array([0, 255, 0]) * 0.6).astype(np.uint8)
    loud = np.zeros_like(ink); loud[lo] = bg & (chL >= s_ink); vis[loud] = (vis[loud] * 0.4 + np.array([255, 0, 255]) * 0.6).astype(np.uint8)
    Image.fromarray(vis).resize((640, 360)).save(f0[:-6] + '-mask.jpg', quality=80)
json.dump(out, open(os.path.join(d, 'metric.json'), 'w'), indent=1)
for k, v in out.items(): print(k, v)
