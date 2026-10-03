# rasterise the plan; render pictures; measure
import math, sys
import numpy as np
from PIL import Image, ImageDraw
import importlib
import plan
from geo import pip, rot, rotpoly, hexpoly

RES = 0.25
X0, X1, Z0, Z1 = -40.0, 40.0, -74.0, 74.0
NX, NZ = int((X1 - X0) / RES), int((Z1 - Z0) / RES)
xs = X0 + (np.arange(NX) + 0.5) * RES
zs = Z0 + (np.arange(NZ) + 0.5) * RES
XX, ZZ = np.meshgrid(xs, zs)


def all_pieces():
    out = []
    for p in plan.pieces:
        out.append(dict(p, side='A' if p['half'] else 'C'))
        if p['half']:
            q = dict(p)
            q['poly'] = rotpoly(p['poly'])
            if p['ramp']:
                r = dict(p['ramp'])
                r['low'] = (-r['low'][0], -r['low'][1], r['low'][2])
                r['high'] = (-r['high'][0], -r['high'][1], r['high'][2])
                q['ramp'] = r
            q['side'] = 'B'
            out.append(q)
    return out


def ramp_height(r):
    lx, lz, ly = r['low']
    hx, hz, hy = r['high']
    L = math.hypot(hx - lx, hz - lz)
    ux, uz = (hx - lx) / L, (hz - lz) / L
    t = ((XX - lx) * ux + (ZZ - lz) * uz) / L
    return ly + (hy - ly) * np.clip(t, 0, 1)


def build(lava='low', organs=True, stones=None, mode='turf', skip=()):
    L = plan.LOW if lava == 'low' else plan.HIGH
    top = np.full(XX.shape, -np.inf)
    roof = np.zeros(XX.shape, bool)
    rail = np.zeros(XX.shape, bool)
    railm = []
    owner = np.full(XX.shape, -1, int)
    names = []
    for k, p in enumerate(all_pieces()):
        names.append(p['name'])
        if p.get('note') == 'onlyIn bazookarp' and mode != 'bazookarp':
            continue
        if p['name'] in skip:
            continue
        m = pip(p['poly'], XX, ZZ)
        if p['kind'] == 'roof':
            roof |= m
            continue
        if p['kind'] == 'rail':
            railm.append((m, p.get('y0') if p.get('y0') is not None else -9))
            continue
        h = ramp_height(p['ramp']) if p['ramp'] else np.full(XX.shape, p['top'])
        upd = m & (h > top)
        top[upd] = h[upd]
        owner[upd] = k
    for m, y0 in railm:
        rail |= m & (top >= y0 - 0.3)
    # region
    reg = np.zeros(XX.shape, bool)
    for poly in plan.REGION['polys']:
        reg |= pip(poly, XX, ZZ)
    for poly in plan.REGION['half']:
        reg |= pip(poly, XX, ZZ) | pip(rotpoly(poly), XX, ZZ)
    # riders
    rid = np.zeros(XX.shape, bool)
    e = 0 if lava == 'low' else 1
    if organs:
        for side in (1, -1):
            for k, (x, z, r) in plan.ORG.items():
                t0, t1 = plan.POSE[k]
                h = t0 + (t1 - t0) * e
                m = pip(hexpoly(side * x, side * z, r), XX, ZZ)
                upd = m & (h > top)
                top[upd] = h
                rid |= m
    st = (lava == 'high') if stones is None else stones
    if st:
        for side in (1, -1):
            for s in plan.STONES:
                poly = plan.obox(side * s['c'][0], side * s['c'][1], s['along'], s['across'], s['ang'] + (180 if side < 0 else 0))
                m = pip(poly, XX, ZZ)
                top[m] = L + 0.45
                rid |= m
    lava_m = reg & (top < L + 0.15)
    return dict(top=top, roof=roof, rail=rail, reg=reg, lava=lava_m, rid=rid, L=L, owner=owner, names=names)


COL = {4.8: (236, 230, 214), 3.6: (196, 188, 170), 2.4: (160, 154, 140), 1.8: (130, 150, 140), 1.2: (128, 124, 116),
       0.0: (78, 70, 66)}


def color_for(h):
    best = None
    for k, c in COL.items():
        if best is None or abs(h - k) < abs(h - best):
            best = k
    return COL[best]


def render(S, path, scale=4, grid=True, marks=()):
    top, roof, lava, rid = S['top'], S['roof'], S['lava'], S['rid']
    img = np.zeros(top.shape + (3,), np.uint8)
    img[:] = (20, 22, 26)
    fl = np.isfinite(top)
    # height shading
    for k, c in COL.items():
        m = fl & (np.abs(top - k) < 0.31)
        img[m] = c
    ramp = fl & ~np.any([np.abs(top - k) < 0.31 for k in COL], axis=0)
    img[ramp] = (170, 140, 110)
    img[S['rid'] & fl] = (90, 120, 200)
    img[lava] = (200, 60, 20)
    img[roof] = (45, 48, 56)
    im = Image.fromarray(img[::-1, :, :]).resize((NX * scale // 2, NZ * scale // 2), Image.NEAREST)  # z up = north up
    dr = ImageDraw.Draw(im)
    sc = scale / 2 / RES

    def px(x, z):
        return ((x - X0) * sc, (Z1 - z) * sc)
    if grid:
        for gx in range(-40, 41, 10):
            dr.line([px(gx, Z0), px(gx, Z1)], fill=(60, 60, 60))
        for gz in range(-70, 71, 10):
            dr.line([px(X0, gz), px(X1, gz)], fill=(60, 60, 60))
    for (x, z, c) in marks:
        dr.ellipse([px(x, z)[0] - 4, px(x, z)[1] - 4, px(x, z)[0] + 4, px(x, z)[1] + 4], fill=c)
    im.save(path)


if __name__ == '__main__':
    for lv in ('low', 'high'):
        S = build(lv)
        render(S, f'top-{lv}.png', scale=4)
    print('ok')


def render2(S, path, scale=6, labels=True, extra=None):
    """outlined render: tiers in distinct colours, piece outlines, labels"""
    top, lava = S['top'], S['lava']
    PAL = {4.8: (240, 236, 222), 3.6: (214, 200, 168), 2.4: (176, 168, 150), 1.8: (120, 168, 150), 1.2: (140, 136, 128),
           0.0: (92, 76, 70)}
    img = np.zeros(top.shape + (3,), np.uint8)
    img[:] = (24, 26, 30)
    fl = np.isfinite(top)
    for k, c in PAL.items():
        img[fl & (np.abs(top - k) < 0.25)] = c
    other = fl & ~np.any([np.abs(top - k) < 0.25 for k in PAL], axis=0)
    img[other] = (196, 160, 120)
    img[S['rid'] & fl] = (92, 128, 214)
    img[lava] = (214, 70, 24)
    img[S['roof']] = (52, 56, 66)
    W, H = int(NX * RES * scale), int(NZ * RES * scale)
    im = Image.fromarray(img[::-1, :, :]).resize((W, H), Image.NEAREST)
    dr = ImageDraw.Draw(im)

    def px(x, z):
        return ((x - X0) * scale, (Z1 - z) * scale)
    for gx in range(-40, 41, 10):
        dr.line([px(gx, Z0), px(gx, Z1)], fill=(70, 70, 70))
    for gz in range(-70, 71, 10):
        dr.line([px(X0, gz), px(X1, gz)], fill=(70, 70, 70))
    for p in all_pieces():
        pts = [px(*q) for q in p['poly']]
        dr.line(pts + [pts[0]], fill=(30, 30, 30), width=1)
        if labels and p['side'] in ('A', 'C') and p['kind'] != 'roof':
            cx = sum(q[0] for q in p['poly']) / len(p['poly'])
            cz = sum(q[1] for q in p['poly']) / len(p['poly'])
            dr.text(px(cx, cz), p['name'][:16], fill=(0, 0, 0))
    for poly in plan.REGION['polys'] + plan.REGION['half'] + [rotpoly(q) for q in plan.REGION['half']]:
        pts = [px(*q) for q in poly]
        dr.line(pts + [pts[0]], fill=(255, 220, 0), width=1)
    if extra:
        extra(dr, px)
    im.save(path)
