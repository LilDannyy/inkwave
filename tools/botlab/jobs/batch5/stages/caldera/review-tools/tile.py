# tile a sweep's shots into overview pages (5 x 4, 384 x 216 each, labelled) + per-shot flat-share metric
import sys, os, json, glob
from PIL import Image, ImageDraw, ImageFont, ImageStat
import numpy as np
src, dst, tag = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(dst, exist_ok=True)
views = json.load(open(os.path.join(src, 'views.json')))
names = [v['name'] for v in views]
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 14)
C, Rw, TW, TH, LH = 5, 4, 384, 216, 18
metrics = {}
def flat_share(im):
    a = np.asarray(im.resize((640, 360)).convert('RGB')).astype(np.float32)
    L = a.mean(axis=2); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    n = 0; flat = 0
    for y in range(0, 360, 16):
        for x in range(0, 640, 16):
            blk = L[y:y+16, x:x+16]; rb = r[y:y+16, x:x+16].mean(); gb = g[y:y+16, x:x+16].mean(); bb = b[y:y+16, x:x+16].mean()
            sky = bb > rb + 15 and bb > 120   # blue sky
            lava = rb > gb + 60               # lava red/orange
            n += 1
            if not sky and not lava and blk.std() < 2.2: flat += 1
    return flat / n
pages = []
for p0 in range(0, len(names), C * Rw):
    page = Image.new('RGB', (C * TW, Rw * (TH + LH) + 24), (20, 20, 22)); d = ImageDraw.Draw(page)
    d.text((6, 4), f'{tag}  views {p0}..{min(p0 + C * Rw, len(names)) - 1}', fill=(255, 214, 90), font=font)
    for i, nm in enumerate(names[p0:p0 + C * Rw]):
        f = os.path.join(src, 'shots', nm + '.jpg')
        if not os.path.exists(f): continue
        im = Image.open(f); fs = flat_share(im); metrics[nm] = round(fs, 3)
        X, Y = (i % C) * TW, 24 + (i // C) * (TH + LH)
        page.paste(im.resize((TW, TH)), (X, Y + LH))
        d.text((X + 4, Y + 1), f'{p0 + i} {nm}  flat {fs:.2f}', fill=(255, 120, 120) if fs > 0.25 else (240, 230, 200), font=font)
    out = os.path.join(dst, f'{tag}-p{p0 // (C * Rw):02d}.jpg')
    q = 85
    while True:
        page.save(out, 'JPEG', quality=q)
        if os.path.getsize(out) < 290000 or q < 40: break
        q -= 7
    pages.append(out)
json.dump(metrics, open(os.path.join(dst, f'{tag}-flat.json'), 'w'))
print(len(pages), 'pages'); 
srt = sorted(metrics.items(), key=lambda kv: -kv[1])
print('top flat:', srt[:25])
print('mean flat', round(sum(metrics.values()) / len(metrics), 3), 'n>0.25', sum(1 for v in metrics.values() if v > 0.25), 'n>0.4', sum(1 for v in metrics.values() if v > 0.4))
