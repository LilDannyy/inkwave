# Bluestone art phase (scratch): contact sheets of art-shots.cjs pictures. Run with python3 -I.
#   python3 -I art-sheet.py <dir> <out.jpg> <title> <rowkey,…> <colkey,…> <pattern with {r} and {c}> [thumb width]
# e.g. … out/art sheet.jpg "Places, day" circus,knee e1,e2,e3 "places-{r}-{c}-day.jpg" 560
import sys, os
from PIL import Image, ImageDraw, ImageFont
d, out, title, rows, cols, pat = sys.argv[1:7]
tw = int(sys.argv[7]) if len(sys.argv) > 7 else 560
rows, cols = rows.split(','), cols.split(',')
th = tw * 9 // 16
try: F = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 18); F2 = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 24)
except Exception: F = F2 = ImageFont.load_default()
lw, top = 110, 40
S = Image.new('RGB', (lw + tw * len(cols) + 4 * len(cols), top + (th + 4) * len(rows)), (32, 36, 44))
g = ImageDraw.Draw(S)
g.text((10, 8), title, fill=(244, 233, 200), font=F2)
for j, c in enumerate(cols): g.text((lw + j * (tw + 4) + 6, top - 22), c, fill=(220, 220, 220), font=F)
for i, r in enumerate(rows):
    g.text((8, top + i * (th + 4) + th // 2 - 10), r, fill=(220, 220, 220), font=F)
    for j, c in enumerate(cols):
        p = os.path.join(d, pat.replace('{r}', r).replace('{c}', c))
        if not os.path.exists(p): continue
        im = Image.open(p).convert('RGB').resize((tw, th), Image.LANCZOS)
        S.paste(im, (lw + j * (tw + 4), top + i * (th + 4)))
q = 88
while True:
    S.save(out, quality=q, optimize=True)
    if os.path.getsize(out) < 295 * 1024 or q < 40: break
    q -= 6
print(out, os.path.getsize(out), q)
