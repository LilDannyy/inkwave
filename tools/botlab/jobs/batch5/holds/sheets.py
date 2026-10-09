#!/usr/bin/env python3
"""Stitch tools/botlab/scenes/holds.js pictures into one JPEG sheet per weapon (rows = states, columns = views).
  python3 sheets.py <shots dir> <out dir> [weapons] [states] [views] [tag]
Each cell is the middle of the frame (the kid), labelled; sheets are kept under 300 KB."""
import os, sys
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
W = (sys.argv[3] if len(sys.argv) > 3 else 'brush,roller,blaster,brolly').split(',')
S = (sys.argv[4] if len(sys.argv) > 4 else 'stand,run,fire,roll,jump,lobby,victory,defeat').split(',')
VW = (sys.argv[5] if len(sys.argv) > 5 else 'front,left,back,right').split(',')
TAG = sys.argv[6] if len(sys.argv) > 6 else ''
os.makedirs(out, exist_ok=True)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 18)
except Exception:
    font = ImageFont.load_default()
CW, CH = int(os.environ.get("CW", 250)), int(os.environ.get("CH", 300))
for w in W:
    rows = [s for s in S if any(os.path.exists(f'{src}/testbox-turf-day-{w}-{s}-{v}.png') for v in VW)]
    if not rows:
        continue
    sheet = Image.new('RGB', (CW * len(VW), CH * len(rows) + 30), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    d.text((8, 5), f'{w}{"  " + TAG if TAG else ""}   (columns: {", ".join(VW)})', fill=(255, 255, 255), font=font)
    for r, s in enumerate(rows):
        for c, v in enumerate(VW):
            f = f'{src}/testbox-turf-day-{w}-{s}-{v}.png'
            if not os.path.exists(f):
                continue
            im = Image.open(f).convert('RGB')
            iw, ih = im.size
            cw = int(ih * CW / CH)
            im = im.crop(((iw - cw) // 2, 0, (iw + cw) // 2, ih)).resize((CW, CH), Image.LANCZOS)
            sheet.paste(im, (c * CW, 30 + r * CH))
            d.text((c * CW + 6, 30 + r * CH + 4), f'{s} / {v}', fill=(255, 255, 255), font=font, stroke_width=2, stroke_fill=(0, 0, 0))
    name = f'{out}/{w}{"-" + TAG if TAG else ""}.jpg'
    q = 88
    while True:
        sheet.save(name, quality=q)
        if os.path.getsize(name) < 300_000 or q < 40:
            break
        q -= 6
    print(name, os.path.getsize(name), q)
