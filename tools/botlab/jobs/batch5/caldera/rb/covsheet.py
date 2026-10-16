# cover maps side by side at one scale: distance to cover (green ≤ 3 m, yellow ≤ 5, red > 5), from cover-map logs
import sys, json, re, base64, numpy as np
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]; items = list(zip(sys.argv[2::2], sys.argv[3::2]))
try: font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 18)
except Exception: font = ImageFont.load_default()
CX, CZ, sc = 46, 78, 5
pan = []
for title, f in items:
    log = open(f).read(); d = json.loads(re.search(r'PASS cover map\s+(\{.*\})', log).group(1)); g = d['grid']
    b = np.frombuffer(base64.b64decode(g['b64']), dtype=np.uint8).reshape(g['nz'], g['nx'])
    a = np.zeros((2 * CZ, 2 * CX, 3), np.uint8); a[:] = (24, 26, 33)
    for j in range(g['nz']):
        z = g['z0'] + j
        if not -CZ <= z < CZ: continue
        for i in range(g['nx']):
            x = g['x0'] + i; v = b[j, i]
            if v == 255 or not -CX <= x < CX: continue
            dd = v / 10; a[z + CZ, x + CX] = (60, 170, 90) if dd <= 3 else (215, 190, 60) if dd <= 5 else (220, 60, 60)
    im = Image.fromarray(a[::-1]).resize((2 * CX * sc, 2 * CZ * sc), Image.NEAREST)
    dr = ImageDraw.Draw(im); dr.text((8, 8), f"{title}: {d['within5m_pct']} % within 5 m, largest open r {d['largestOpenRadius_m']} m", fill=(255, 255, 255), font=font)
    pan.append(im)
W = sum(p.width for p in pan) + 6 * (len(pan) - 1); S = Image.new('RGB', (W, pan[0].height), (255, 255, 255)); x = 0
for p in pan: S.paste(p, (x, 0)); x += p.width + 6
S = S.resize((S.width * 2 // 3, S.height * 2 // 3), Image.LANCZOS)
for q in (85, 75, 65, 55):
    S.save(out, quality=q)
    import os
    if os.path.getsize(out) < 295000: break
print('wrote', out, S.size, os.path.getsize(out))
