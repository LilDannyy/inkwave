# geometry helpers for the caldera paper model
import math
import numpy as np

D = math.pi / 180


def P(r, a):
    return (round(r * math.cos(a * D), 3), round(r * math.sin(a * D), 3))


def arc(r, a0, a1, n=None, step=4.0):
    if n is None:
        n = max(2, int(abs(a1 - a0) / step) + 1)
    return [P(r, a0 + (a1 - a0) * i / (n - 1)) for i in range(n)]


def rot(p):
    return (-p[0], -p[1])


def rotpoly(poly):
    return [rot(p) for p in poly]


def area(poly):
    a = 0
    for i in range(len(poly)):
        x0, z0 = poly[i]
        x1, z1 = poly[(i + 1) % len(poly)]
        a += x0 * z1 - x1 * z0
    return a / 2


def pip(poly, X, Z):
    """vectorised point in polygon (even-odd)"""
    inside = np.zeros(X.shape, bool)
    n = len(poly)
    for i in range(n):
        xi, zi = poly[i]
        xj, zj = poly[i - 1]
        cond = (zi > Z) != (zj > Z)
        with np.errstate(divide='ignore', invalid='ignore'):
            xint = (xj - xi) * (Z - zi) / (zj - zi + 1e-12) + xi
        inside ^= cond & (X < xint)
    return inside


def hexpoly(cx, cz, r, yaw=0):
    # corners on local ±x; yaw degrees (math convention, ccw from +x toward +z)
    return [(round(cx + r * math.cos((60 * k + yaw) * D), 4), round(cz + r * math.sin((60 * k + yaw) * D), 4)) for k in range(6)]


def offset_convex(poly, d):
    """offset a convex polygon outward by d (miter)"""
    n = len(poly)
    a = area(poly)
    sgn = 1 if a > 0 else -1
    lines = []
    for i in range(n):
        x0, z0 = poly[i]
        x1, z1 = poly[(i + 1) % n]
        L = math.hypot(x1 - x0, z1 - z0)
        ux, uz = (x1 - x0) / L, (z1 - z0) / L
        nx, nz = (uz * sgn, -ux * sgn)  # outward for ccw (sgn 1)
        lines.append(((x0 + nx * d, z0 + nz * d), (ux, uz)))
    out = []
    for i in range(n):
        (p, u) = lines[i - 1]
        (q, v) = lines[i]
        # intersect p + t u, q + s v
        den = u[0] * v[1] - u[1] * v[0]
        t = ((q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0]) / den
        out.append((round(p[0] + t * u[0], 4), round(p[1] + t * u[1], 4)))
    return out


def seg_dist(px, pz, ax, az, bx, bz):
    dx, dz = bx - ax, bz - az
    L2 = dx * dx + dz * dz
    t = max(0, min(1, ((px - ax) * dx + (pz - az) * dz) / L2)) if L2 else 0
    return math.hypot(px - ax - t * dx, pz - az - t * dz)


def poly_dist(poly, x, z):
    return min(seg_dist(x, z, *poly[i - 1], *poly[i]) for i in range(len(poly)))
