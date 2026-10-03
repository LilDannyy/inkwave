# ASCII plans generated from the piece model (1 char = 1 m of x, 1 row = 2 m of z, +z down the page)
import numpy as np, math
import raster, plan
from raster import XX, ZZ, RES, X0, Z0
from geo import pip, rotpoly, hexpoly

NATURAL = {'Rim Head': 'R', 'Rim Ridge': 'R', 'Ladle Road': 'r', 'Horn tip W': 'r', 'Horn Step': '.'}


def char_at(S, owners, x, z, lava):
    j, i = int((z - Z0) / RES), int((x - X0) / RES)
    if not (0 <= j < XX.shape[0] and 0 <= i < XX.shape[1]):
        return ' '
    if abs(x - 0) < 0.6 and abs(z + 64.5) < 1.1:
        return 'X'
    if abs(x - 0) < 0.6 and abs(z - 64.5) < 1.1:
        return 'X'
    if S['roof'][j, i]:
        return owners['roofc'][j, i]
    if S['rail'][j, i]:
        return '|'
    if S['rid'][j, i]:
        return 's' if lava == 'high' and owners['stone'][j, i] else 'L'
    if S['lava'][j, i]:
        return '~'
    t = S['top'][j, i]
    if not np.isfinite(t):
        return ' '
    k = S['owner'][j, i]
    nm = S['names'][k] if k >= 0 else ''
    if nm in ('Spillway Bridge', 'West Bridge', 'Ladle Gantry (bazookarp only)'):
        return 'b' if nm != 'Ladle Gantry (bazookarp only)' else 'g'
    p = raster.all_pieces()[k] if k >= 0 else None
    if p is not None and p['ramp'] is not None:
        return '/'
    if 'spatter cone' in nm or 'mound' in nm:
        return '^'
    if 'stump' in nm:
        return 'o'
    if abs(t - 4.8) < 0.1: return 'S'
    if abs(t - 3.6) < 0.1: return NATURAL.get(nm, '#')
    if abs(t - 3.0) < 0.1: return 'c' if nm == 'Casting bed' else 'v'
    if abs(t - 2.4) < 0.1: return NATURAL.get(nm, '=')
    if abs(t - 1.8) < 0.1: return 'm' if 'Moorings' in nm else ':'
    if abs(t - 1.2) < 0.1: return '.'
    if abs(t - 0.0) < 0.1: return ','
    return '?'


def roof_chars(mode='turf'):
    rc = np.full(XX.shape, 'o', dtype='<U1')
    for p in raster.all_pieces():
        if p['kind'] != 'roof' or (p.get('note') == 'onlyIn bazookarp' and mode != 'bazookarp'):
            continue
        m = pip(p['poly'], XX, ZZ)
        nm = p['name']
        big = nm in ('Casting Hall', 'Surge Office', 'Cupola furnace', 'Weighbridge office', 'Firebrick Store', 'Winch house',
                     'Jib crane mast', 'Surge Gauge pier')
        if nm == 'Terrace parapet' or nm == 'Rim Head parapet':
            rc[m] = 'n'
        elif big:
            rc[m] = 'B'
    return rc


def stone_mask():
    sm = np.zeros(XX.shape, bool)
    for side in (1, -1):
        for s in plan.STONES:
            poly = plan.obox(side * s['c'][0], side * s['c'][1], s['along'], s['across'], s['ang'] + (180 if side < 0 else 0))
            sm |= pip(poly, XX, ZZ)
    return sm


def plan_text(lava='low', z0=-70, z1=14, x0=-36, x1=36, mode='turf', marks=None):
    S = raster.build(lava, mode=mode)
    owners = dict(roofc=roof_chars(mode), stone=stone_mask())
    lines = []
    hdr = '       ' + ''.join(f'{v:<10d}' for v in range(-30, 31, 10))
    # header aligned: column for x = x0 + c
    head = [' '] * (x1 - x0 + 1)
    for v in range(-30, 31, 10):
        s = str(v)
        c = v - x0
        for q, ch in enumerate(s):
            if 0 <= c + q < len(head):
                head[c + q] = ch
    lines.append('       ' + ''.join(head))
    for z in range(z0, z1 + 1, 2):
        row = ''.join(char_at(S, owners, x + 0.5, z + 1.0, lava) for x in range(x0, x1 + 1))
        if marks:
            row = list(row)
            for (mx, mz, ch) in marks:
                if z <= mz < z + 2 and x0 <= mx <= x1:
                    row[int(math.floor(mx)) - x0] = ch
            row = ''.join(row)
        lines.append(f'{z:5d}  ' + row.rstrip())
    return '\n'.join(lines)


if __name__ == '__main__':
    print(plan_text('low'))
    print()
    print(plan_text('high', z0=-34, z1=14))
