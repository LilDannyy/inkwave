#!/usr/bin/env python3
"""Sub visibility pass: pair up shots.cjs pictures from the old build and the new one.

    python3 compose.py BEFORE_DIR AFTER_DIR OUT_DIR

One JPEG (< 300 KB) per sub + pose: columns before | after, rows = a player ~8 m away / the thrower's own camera; each
picture carries a 3x inset around the sub (its screen spot from info.json), so the model reads even when it is small.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

PW, PH = 800, 450          # one panel
INSET, ZOOM = 260, 3       # inset size (px, square-ish) and magnification


def font(sz):
    for f in ('/System/Library/Fonts/SFNS.ttf', '/System/Library/Fonts/Helvetica.ttc', '/Library/Fonts/Arial.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except Exception:
            pass
    return ImageFont.load_default()


F, FS = font(22), font(16)


def panel(path, rec, label):
    im = Image.open(path).convert('RGB')
    W, H = im.size
    out = im.resize((PW, PH), Image.LANCZOS)
    d = ImageDraw.Draw(out)
    if rec and rec.get('screen'):
        sx, sy = rec['screen']
        if 0 <= sx <= 1 and 0 <= sy <= 1:
            cw, ch = INSET * W // (PW * ZOOM) * 2, int(INSET * 0.75) * H // (PH * ZOOM) * 2   # source crop (full-res px)
            cx, cy = int(sx * W), int(sy * H)
            x0, y0 = max(0, min(W - cw, cx - cw // 2)), max(0, min(H - ch, cy - ch // 2))
            crop = im.crop((x0, y0, x0 + cw, y0 + ch)).resize((INSET, int(INSET * 0.75)), Image.LANCZOS)
            ix, iy = PW - INSET - 8, PH - int(INSET * 0.75) - 8
            out.paste(crop, (ix, iy))
            d.rectangle([ix - 2, iy - 2, ix + INSET + 1, iy + int(INSET * 0.75) + 1], outline=(255, 255, 255), width=2)
            d.text((ix + 6, iy + 4), f'{ZOOM}x', font=FS, fill=(255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0))
            # where the inset comes from
            bx0, by0 = x0 * PW // W, y0 * PH // H
            d.rectangle([bx0, by0, bx0 + cw * PW // W, by0 + ch * PH // H], outline=(255, 255, 255), width=1)
    d.text((10, 8), label, font=F, fill=(255, 255, 255), stroke_width=3, stroke_fill=(0, 0, 0))
    return out


def main(bdir, adir, odir):
    os.makedirs(odir, exist_ok=True)
    rb = {(r['kind'], r['pose'], r.get('cam')): r for r in json.load(open(os.path.join(bdir, 'info.json')))}
    ra = {(r['kind'], r['pose'], r.get('cam')): r for r in json.load(open(os.path.join(adir, 'info.json')))}
    seen = []
    for (k, p, c) in ra:
        if (k, p) not in seen:
            seen.append((k, p))
    for k, p in seen:
        sheet = Image.new('RGB', (PW * 2, PH * 2), (0, 0, 0))
        for row, cam in enumerate(('side', 'thrower')):
            where = 'a player 8 m away' if cam == 'side' else "the thrower's camera"
            for col, (dr, rr, tag) in enumerate(((bdir, rb, 'before'), (adir, ra, 'after'))):
                f = os.path.join(dr, f'{k}-{p}-{cam}.jpg')
                if not os.path.exists(f):
                    continue
                rec = rr.get((k, p, cam))
                sz = rec.get('size') if rec else None
                lab = f'{k} {p} - {tag} - {where}' + (f"   model {max(sz):.2f} m" if sz else '')
                sheet.paste(panel(f, rec, lab), (col * PW, row * PH))
        dst = os.path.join(odir, f'{k}-{p}.jpg')
        for q in (86, 80, 74, 68, 62, 56):
            sheet.save(dst, 'JPEG', quality=q, optimize=True)
            if os.path.getsize(dst) < 300 * 1024:
                break
        print(dst, os.path.getsize(dst) // 1024, 'KB')


if __name__ == '__main__':
    main(*sys.argv[1:4])
