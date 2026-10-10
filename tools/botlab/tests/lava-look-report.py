#!/usr/bin/env python3
"""The lava's look report (ENGINE.md §6 step 6, §7 R1) from tools/botlab/tests/lava-look.js's hud-shots pictures.

  python3 tools/botlab/tests/lava-look-report.py <hud-shots OUT dir>

For each shot and its "-mask" twin (the lava surface drawn flat magenta): the open lava away from the shore (the mask,
eroded 6 px) — the lit-seam share (pixels whose brightest channel is >= 0.40: R1 wants >= 35 % at rest and <= 55 %
moving), the lit pixels' mean hue / value / chroma, the crust's value; and per palette each ink's hue distance from the
lava's lit hue and its chroma against the lava's (ink must stay the loudest colour). Prints a table; exit 1 on a miss.
"""
import colorsys, glob, json, os, re, sys

import numpy as np
from PIL import Image

PAL = {
    'tangerine-cobalt': ['#ff8a14', '#2f5bff'], 'bubblegum-mint': ['#ff3f9e', '#18d48c'], 'lemon-grape': ['#f2e312', '#8a3cff'],
    'aqua-cherry': ['#10d2e6', '#ff4150'], 'lime-magenta': ['#a6f01a', '#e02cd8'], 'colourblind': ['#ffd21a', '#2a52ff'],
}


def erode(m, n):
    m = m.copy()
    for _ in range(n):
        m[1:, :] &= m[:-1, :]; m[:-1, :] &= m[1:, :]; m[:, 1:] &= m[:, :-1]; m[:, :-1] &= m[:, 1:]
    return m


def hsv(hexc):
    v = int(hexc[1:], 16)
    return colorsys.rgb_to_hsv(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255)


def main(d):
    rows, bad = [], []
    for f in sorted(glob.glob(os.path.join(d, '*-mask.png'))):
        if f.endswith('-top.png'):
            continue
        base = f[:-9] + '.png'
        if not os.path.exists(base):
            continue
        name = re.sub(r'^.*?-day-', '', os.path.basename(base))[:-4]
        A = np.asarray(Image.open(base).convert('RGB')).astype(np.float32) / 255
        M = np.asarray(Image.open(f).convert('RGB')).astype(np.int32)
        mk = (M[..., 0] > 225) & (M[..., 1] < 50) & (M[..., 2] > 225)
        mk[:int(mk.shape[0] * 0.12), :] = False   # (the HUD's top bar)
        core = erode(mk, 6)
        n = int(core.sum())
        if n < 2000:
            rows.append({'shot': name, 'lavaPx': n, 'note': 'too little open lava in view'}); bad.append(name + ': too little lava'); continue
        px = A[core]
        val = px.max(axis=1)
        lit = val >= 0.40
        share = float(lit.mean())
        lp = px[lit] if lit.any() else px
        h, s, v = (float(q) for q in colorsys.rgb_to_hsv(*(float(c) for c in lp.mean(axis=0))))
        crust = float(np.median(val[~lit])) if (~lit).any() else None
        row = {'shot': name, 'lavaPx': n, 'litShare': round(share, 3), 'litHue': round(h * 360), 'litSat': round(s, 2), 'litVal': round(v, 2), 'litChroma': round(s * v, 2), 'crustVal': crust and round(crust, 2)}
        pal = next((k for k in PAL if name.startswith(k)), None)
        if pal:
            inks = []
            for hx in PAL[pal]:
                ih, is_, iv = hsv(hx)
                dh = abs(ih - h) * 360; dh = min(dh, 360 - dh)
                inks.append({'ink': hx, 'hueGap': round(dh), 'chroma': round(is_ * iv, 2), 'louder': is_ * iv > s * v})
            row['inks'] = inks
            if not all(i['louder'] for i in inks):
                bad.append(f'{name}: an ink is not louder than the lava')
        moving = name.startswith('moving-rise') or name.startswith('moving-fall')
        if not moving and not name.startswith('moving') and share < 0.35:
            bad.append(f'{name}: lit seams {share:.0%} at rest (R1: >= 35 %)')
        if moving and share > 0.55:
            bad.append(f'{name}: lit seams {share:.0%} moving (R1: <= 55 %)')
        rows.append(row)
    print(json.dumps(rows, indent=1))
    print('RESULT', 'ok' if not bad else 'misses: ' + '; '.join(bad))
    return 0 if not bad else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else '.'))
