# Bluestone art phase (scratch): an overview of a stage-sweep run — the first view (or ALL=1 every view) of each cluster,
# 4 × 4 per page, labelled — to find the bare faces quickly. Run with python3 -I.
#   python3 -I sweep-overview.py <sweep OUT dir> <out prefix> [per-cluster views (default 1)] [cols] [rows] [max KB] [thumb w] [title]
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
d, pre = sys.argv[1], sys.argv[2]
k = int(sys.argv[3]) if len(sys.argv) > 3 else 1
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4
rows = int(sys.argv[5]) if len(sys.argv) > 5 else 4
MAXKB = int(sys.argv[6]) if len(sys.argv) > 6 else 295
TW = int(sys.argv[7]) if len(sys.argv) > 7 else 420
TITLE = sys.argv[8] if len(sys.argv) > 8 else ''
V = json.load(open(os.path.join(d, 'views.json')))
views = V['views'] if isinstance(V, dict) and 'views' in V else V
by = {}
for v in views:
    c = v.get('cluster') or v.get('name', '').rsplit('.', 1)[0]
    by.setdefault(c, []).append(v)
items = []
for c, vs in by.items():
    for v in vs[:k]:
        p = os.path.join(d, 'shots', v['name'] + '.jpg')
        if os.path.exists(p): items.append((v['name'], p))
try: F = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 15)
except Exception: F = ImageFont.load_default()
tw, th = TW, TW * 9 // 16
per = cols * rows
for page in range((len(items) + per - 1) // per):
    top = 30 if TITLE else 0
    S = Image.new('RGB', (cols * (tw + 4), top + rows * (th + 22)), (32, 36, 44))
    g = ImageDraw.Draw(S)
    if TITLE: g.text((6, 6), f'{TITLE}  ({page + 1}/{(len(items) + per - 1) // per})', fill=(244, 233, 200), font=F)
    for i, (n, p) in enumerate(items[page * per:(page + 1) * per]):
        x, y = (i % cols) * (tw + 4), top + (i // cols) * (th + 22)
        S.paste(Image.open(p).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + 20))
        g.text((x + 4, y + 2), n, fill=(244, 233, 200), font=F)
    out = f'{pre}-{page:02d}.jpg'
    q = 85
    while True:
        S.save(out, quality=q, optimize=True)
        if os.path.getsize(out) < MAXKB * 1024 or q < 40: break
        q -= 7
    print(out, os.path.getsize(out))
