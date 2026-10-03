# Highmark Foundry (caldera), revision 2: the plan as data. Alpha's half + centre; Bravo = 180° turn.
import math
from geo import P, arc, rot, rotpoly, area, hexpoly

D = math.pi / 180
LOW, HIGH = -0.6, 0.8
R3 = lambda v: round(v, 2)

# ---------------------------------------------------------------- Alpha's Spillway axis (SE)
DA = -48.0
d = (math.cos(DA * D), math.sin(DA * D))          # along the channel, outward
n = (math.cos((DA + 90) * D), math.sin((DA + 90) * D))   # across, toward Bravo's horn tip
HW = 5.5
S_MOUTH, S_LIP = 22.3, 34.0


def ch(s, t):
    return (R3(s * d[0] + t * n[0]), R3(s * d[1] + t * n[1]))


pieces = []


def add(name, poly, top=None, kind='floor', half=True, ramp=None, y0=None, note=''):
    pieces.append(dict(name=name, poly=[(R3(p[0]), R3(p[1])) for p in poly], top=top, kind=kind, half=half, ramp=ramp,
                       y0=y0, note=note))


def rect(x0, x1, z0, z1):
    return [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]


def obox(cx, cz, along, across, ang):
    ux, uz = math.cos(ang * D), math.sin(ang * D)
    vx, vz = -uz, ux
    a, b = along / 2, across / 2
    return [(cx - ux * a - vx * b, cz - uz * a - vz * b), (cx + ux * a - vx * b, cz + uz * a - vz * b),
            (cx + ux * a + vx * b, cz + uz * a + vz * b), (cx - ux * a + vx * b, cz - uz * a + vz * b)]


def ramp_rect(p_low, p_high, width, y_low, y_high):
    (lx, lz), (hx, hz) = p_low, p_high
    L = math.hypot(hx - lx, hz - lz)
    ux, uz = (hx - lx) / L, (hz - lz) / L
    vx, vz = -uz, ux
    w = width / 2
    poly = [(lx - vx * w, lz - vz * w), (hx - vx * w, hz - vz * w), (hx + vx * w, hz + vz * w), (lx + vx * w, lz + vz * w)]
    return poly, dict(low=(lx, lz, y_low), high=(hx, hz, y_high), width=width, run=L)


# ---------------------------------------------------------------- the Organ Pipes (Alpha's cluster, SSW, a line along z)
ORG_X, R_L, R_AB = -10.0, 2.5, 1.5
HL, HAB = R_L * math.sqrt(3) / 2, R_AB * math.sqrt(3) / 2
L_Z = -12.8
B_Z = L_Z + HL + 0.2 + HAB
A_Z = B_Z + 2 * HAB + 0.2
ORG = dict(L=(ORG_X, L_Z, R_L), B=(ORG_X, R3(B_Z), R_AB), A=(ORG_X, R3(A_Z), R_AB))
POSE = dict(L=(2.3, 4.65), B=(1.8, 3.5), A=(1.4, 2.35))


def notch_bravo():
    """island edge round Bravo's cluster (L north, B and A south of it), 0.15 m off every column flat"""
    o = 0.15
    Lx, Lz = -ORG_X, -L_Z
    Bx, Bz, Az = -ORG_X, -B_Z, -A_Z

    def off(p, ang):
        return (p[0] + o * math.cos(ang * D), p[1] + o * math.sin(ang * D))
    pts = [off((Lx + R_L, Lz), -30), off((Lx + R_L / 2, Lz - HL), -30), off((Lx + R_L / 2, Lz - HL), -90),
           off((Bx + R_AB / 2, Bz + HAB), 30), off((Bx + R_AB, Bz), 30), off((Bx + R_AB, Bz), -30),
           off((Bx + R_AB / 2, Bz - HAB), -30), off((Bx + R_AB / 2, Az + HAB), 30), off((Bx + R_AB, Az), 30),
           off((Bx + R_AB, Az), -30), off((Bx + R_AB / 2, Az - HAB), -30), off((Bx + R_AB / 2, Az - HAB), -90),
           off((Bx - R_AB / 2, Az - HAB), -90), off((Bx - R_AB / 2, Az - HAB), -150), off((Bx - R_AB, Az), -150),
           off((Bx - R_AB, Az), 150), off((Bx - R_AB / 2, Az + HAB), 150), off((Bx - R_AB / 2, Bz - HAB), -150),
           off((Bx - R_AB, Bz), -150), off((Bx - R_AB, Bz), 150), off((Bx - R_AB / 2, Bz + HAB), 150),
           off((Lx - R_L / 2, Lz - HL), -90), off((Lx - R_L / 2, Lz - HL), -150), off((Lx - R_L, Lz), -150)]
    return pts


# ---------------------------------------------------------------- Gauge Island (irregular basalt mass)
ISLAND_E = [(0, -11.5), (5.0, -11.5), (7.8, -10.9), (10.4, -9.2), (12.3, -7.4), (13.5, -7.9), (13.5, -2.0),
            (14.1, 1.0), (13.7, 4.4), (12.7, 7.6)]
ISLAND_HALF = ISLAND_E + notch_bravo() + [(5.0, 11.5)]
ISLAND = ISLAND_HALF + rotpoly(ISLAND_HALF)
add('Gauge Island', ISLAND, 1.2, half=False, y0=-1.1)
add('Pour Floor', rect(-5, 5, -5, 5), 1.8, half=False)
PIERS = [(4.2, 1.75), (4.2, -1.75), (-4.2, 1.75), (-4.2, -1.75)]
for (px, pz) in PIERS:
    add('Surge Gauge pier', rect(px - 0.6, px + 0.6, pz - 0.6, pz + 0.6), 7.0, kind='roof', half=False)
add('Causeway', rect(-4, 4, -22.65, -11.5), 1.2, y0=-1.1)

# ---------------------------------------------------------------- Alpha's base
add('Spawn gallery', rect(-10, 10, -69, -57.5), 4.8)
add('Casting Hall', rect(-16, 16, -73, -69), 12, kind='roof')
YARD = arc(39, -63, -126, step=2.5) + [(-27.5, -40.0), (-27.5, -47.0), (-24.0, -54.0), (-20.5, -58.0), (-16.0, -60.5),
                                        (-16.0, -66.0), (-10.0, -66.0), (-10.0, -57.5), (10.0, -57.5), (10.0, -66.0),
                                        (16.0, -66.0), (16.0, -60.0), (17.5, -54.0), (18.0, -47.0), (18.0, -40.0)]
add('The Yard', YARD, 3.6)
s_r30 = math.sqrt(30 ** 2 - HW ** 2)
TER = arc(30, -126, -58.6, step=2.5)[:-1] + [ch(s_r30, -HW), ch(S_LIP, -HW)] + arc(39, -63, -126, step=2.5)
add('Moulding Terrace', TER, 2.4)

# the Slump stone line (Alpha's): S0 at the south head, S1 at the north head
S0, S1 = P(23.5, -143.5), P(23.5, -178.5)
SA0, SA1 = -145.5, -176.5          # the shelf's south and north ends (θ)
SL = math.hypot(S1[0] - S0[0], S1[1] - S0[1])
SU = ((S1[0] - S0[0]) / SL, (S1[1] - S0[1]) / SL)
SV = (SU[1], -SU[0])          # across the line, toward the island
FACE = 1.9                    # half width of each head's tip face


def sp(base, a, b):
    return (base[0] + SU[0] * a + SV[0] * b, base[1] + SU[1] * a + SV[1] * b)


SH_IN, SH_OUT = 27.0, 31.5          # the Slump shelf, r
SOUTH_TIP = [sp(S0, 0, FACE), sp(S0, 0, -FACE)]      # inward end first
NORTH_TIP = [sp(S1, 0, -FACE), sp(S1, 0, FACE)]
LF = [ch(S_MOUTH, -HW), ch(s_r30, -HW)] + arc(30, -58.6, -126, step=2.5) + [P(30.5, -126), P(SH_OUT, -133.0), P(SH_OUT, SA0)] + \
    [SOUTH_TIP[1], SOUTH_TIP[0]] + arc(23, -137.0, -100.1, step=2.5) + [(-4.0, -22.65), (4.0, -22.65)] + \
    arc(23, -79.9, -61.9, step=2.5)
add('Lakefront', LF, 1.2, y0=-1.1)
MOOR = arc(23.6, -106, -134, step=2) + [P(31.2, -134.0), P(30.5, -126.0)] + arc(30.0, -126, -106, step=2)
add('Pumice Moorings', MOOR, 1.8)
CF = [(4.0, -22.65)] + arc(23, -79.9, -61.9, step=2.5)[1:] + [ch(S_MOUTH, -HW), ch(S_MOUTH, 0.0), (12.3, -7.4),
                                                              (10.4, -9.2), (7.8, -10.9), (5.0, -11.5), (4.0, -11.5)]
add('Casting Floor', CF, 0.0, y0=-1.1)
SP = [ch(S_MOUTH, -HW), ch(S_LIP, -HW), ch(S_LIP, HW), ch(S_MOUTH, HW)]
add('Spillway', SP, 0.0, y0=-1.1)
add('Spillway Bridge', [ch(27.0, -HW), ch(30.0, -HW), ch(30.0, HW), ch(27.0, HW)], 2.4, y0=2.0)

# ---------------------------------------------------------------- Alpha's west rim
RIMHEAD = [P(39, -126), P(30.5, -126), P(SH_OUT, -133.0), P(SH_OUT, SA0), P(36.0, -148.5), P(41.0, -143.0), P(44.5, -136.0),
           (-34.0, -35.5), (-31.5, -41.0), (-27.5, -44.0), (-27.5, -40.0)]
add('Rim Head', RIMHEAD, 3.6)
SHELF = [P(SH_IN, SA0), P(SH_OUT, SA0)] + arc(SH_OUT, SA0 - 2.5, SA1 + 2.5, step=2.5) + [P(SH_OUT, SA1), P(SH_IN, SA1)] + \
    arc(SH_IN, SA1 + 2.5, SA0 - 2.5, step=2.5)
add('Slump shelf', SHELF, 0.0, y0=-1.1)
NHEAD = [NORTH_TIP[0], P(SH_IN, SA1), P(SH_OUT, SA1), P(30.5, 178.0), P(21.0, 178.0), NORTH_TIP[1]]
add('North Slump head', NHEAD, 1.2, y0=-1.1)
LADLE = arc(21, 157.5, 178, step=2.5) + arc(26.0, 178, 157.5, step=2.5)
add('Ladle Road', LADLE, 2.4, y0=-1.1)
RIDGE = arc(26.0, 158, 178, step=2.5) + [P(30.5, 178.0), P(31.0, 172.0), P(30.0, 166.0), P(28.2, 161.0)]
add('Rim Ridge', RIDGE, 3.6)
HORN = [ch(-27.0, -HW), ch(-S_LIP, -HW), P(31.0, 144.5), P(30.5, 149.0), P(29.5, 153.0), P(28.0, 156.0), P(26.0, 157.5), P(21.0, 157.5)] + \
    arc(21.0, 155.0, 150.0, step=2.5) + [P(21.3, 149.0), ch(-27.0, -8.0)]
HSTEP = [ch(-S_MOUTH, -HW), ch(-27.0, -HW), ch(-27.0, -8.0), P(21.3, 149.0), P(21.6, 148.0)]
add('Horn Step', HSTEP, 1.2, y0=-1.1)
add('Horn tip W', HORN, 2.4, y0=-1.1)
wb, wr = ramp_rect((-13.5, 5.0), (-20.75, 5.0), 4.0, 1.2, 2.4)
add('West Bridge', wb, ramp=wr)


# ---------------------------------------------------------------- details: stairs, rails, parapets, cover, natural ground
def radial_stair(name, th, width, r_face, run, y_lo, y_hi):
    """a stair on the lower tier, its top edge on the arc r_face at angle th, running inward (toward the lake)"""
    p_hi, p_lo = P(r_face, th), P(r_face - run, th)
    poly, rp = ramp_rect(p_lo, p_hi, width, y_lo, y_hi)
    add(name, poly, ramp=rp)
    return poly


def rail_arc(name, r, a0, a1, t=0.25, h=1.0, kind='rail', top=None):
    add(name, arc(r + t / 2, a0, a1, step=2.0) + arc(r - t / 2, a1, a0, step=2.0), top if top is not None else h, kind=kind)


def box(name, cx, cz, w, dd, h, base, kind='roof', ang=0.0):
    add(name, obox(cx, cz, w, dd, ang), base + h, kind=kind)


# gallery
add('Gallery Stair', *[ramp_rect((0, -54.8), (0, -57.5), 8.0, 3.6, 4.8)[0]], ramp=ramp_rect((0, -54.8), (0, -57.5), 8.0, 3.6, 4.8)[1])
for sx in (1, -1):
    gp, gr = ramp_rect((sx * 12.7, -63.0), (sx * 10.0, -63.0), 3.0, 3.6, 4.8)
    add('Gallery side stair', gp, ramp=gr)
# yard → terrace (on the terrace, against the r 39 face)
radial_stair('Upper Surge Steps', -98.0, 4.0, 39.0, 2.7, 2.4, 3.6)
osp, osr = ramp_rect(P(33.2, -126.0 + 5.0), P(33.2, -126.0), 3.0, 2.4, 3.6)
add('Office Stair', osp, ramp=osr)
radial_stair('Cupola Stair', -70.0, 3.0, 39.0, 2.7, 2.4, 3.6)
# terrace → Lakefront (on the Lakefront, against the r 30 face)
radial_stair('Lower Surge Steps', -97.0, 8.0, 30.0, 2.7, 1.2, 2.4)
radial_stair('East Steps', -74.0, 3.0, 30.0, 2.7, 1.2, 2.4)

# the bastion (3.6): the Surge Office's balcony out over the terrace
add('Bastion', arc(39.05, -116.0, -123.0, step=2) + arc(35.5, -123.0, -116.0, step=2), 3.6)
# the weighbridge pit (yard, sunk 0.6) with ramps at both ends
add('Weighbridge pit', rect(-12.0, -5.0, -52.0, -48.0), 3.0)
for x0, x1 in ((-13.0, -10.5), (-1.0, -3.5)):
    pp, pr = ramp_rect((x1, -52.5), (x0, -52.5), 4.0, 3.0, 3.6)
# (ramps are part of the pit's look: the yard floor is cut and the ramps sit in the cut)
# the casting bed (terrace, raised 0.6)
add('Casting bed', arc(36.2, -74.0, -80.0, step=2) + arc(33.0, -80.0, -74.0, step=2), 3.0)
# buildings and big pieces (roof)
add('Surge Office', rect(-23.0, -16.0, -53.5, -47.5), 9.5, kind='roof')
add('Cupola furnace', obox(14.0, -46.5, 4.4, 4.4, 0), 15.0, kind='roof')
add('Weighbridge office', rect(10.5, 14.5, -59.5, -56.0), 6.8, kind='roof')
add('Jib crane mast', rect(15.4, 16.6, -57.1, -55.9), 12.0, kind='roof')
add('Firebrick Store', obox(*P(35.0, -63.5), 4.0, 5.0, -63.5 + 90), 7.0, kind='roof')
add('Winch house', obox(-21.2, -19.6, 3.0, 3.0, -140.0), 4.0, kind='roof')
# the gauge posts on the horn tips (walkable 3.6 roofs with parapets)
add('Gauge Post', obox(*P(26.2, 152.0), 3.6, 3.6, 152.0), 3.6)
# cover (roof), Alpha's half
COVER = [
    # yard: two 1.3 m stacks on the Gate apron, the rest round the tower loop and the Gate court
    ('covers stack (1.3)', 5.6, -56.2, 1.6, 1.6, 1.3, 3.6),
    ('manhole covers (1.3)', 2.0, -50.6, 1.6, 1.6, 1.3, 3.6),
    ('lamp-post rack', -7.5, -56.6, 5.0, 1.2, 1.2, 3.6),
    ('bench ends', -16.0, -44.5, 1.6, 2.4, 1.0, 3.6),
    ('pig iron', -18.5, -41.5, 1.6, 1.6, 1.0, 3.6),
    ('ingot stack', -1.0, -47.0, 1.6, 1.6, 1.1, 3.6),
    ('drum stack', -24.0, -44.5, 1.4, 1.4, 1.2, 3.6),
    ('mould boxes', 4.0, -39.9, 2.0, 1.0, 1.0, 3.6),
    ('cable drum', 13.5, -53.5, 1.6, 1.6, 1.2, 3.6),
    ('weighbridge load', -8.5, -54.0, 2.0, 1.2, 1.1, 3.6),
    ('weigh-beam hut', -8.5, -46.3, 2.4, 1.4, 2.4, 3.6),
    ('ingot rack', -1.5, -40.1, 2.0, 1.0, 1.0, 3.6),
    ('drum stack', -25.5, -37.0, 1.6, 1.2, 1.2, 3.6),
    ('outcrop', -29.8, -40.8, 1.6, 1.4, 1.3, 3.6),
    ('cairn', -32.2, -27.5, 1.2, 1.2, 1.2, 3.6),
    ('ladle cradle', P(22.0, 155.8)[0], P(22.0, 155.8)[1], 1.6, 1.4, 1.2, 2.4),
    ('bollard pallet', -21.5, -46.0, 1.6, 1.6, 0.9, 3.6),
    ('drain grates', -12.5, -59.0, 1.6, 1.6, 1.1, 3.6),
    ('rails', 10.5, -40.4, 2.2, 1.2, 1.0, 3.6),
    # terrace
    ('pattern crates', -10.0, -37.0, 2.4, 1.0, 1.2, 2.4),
    ('pattern crates', 11.5, -31.5, 1.0, 2.4, 1.2, 2.4),
    ('firebrick pallet', 9.5, -37.4, 1.2, 1.2, 1.0, 2.4),
    ('ingot pile', -14.0, -31.4, 1.6, 1.6, 1.0, 2.4),
    ('flask stack', -7.5, -31.4, 1.6, 0.9, 1.1, 2.4),
    ('flask stack', -2.0, -31.3, 1.6, 0.9, 1.1, 2.4),
    ('mould boxes', -1.0, -36.8, 2.0, 0.8, 1.0, 2.4),
    ('outcrop', -24.5, -29.0, 1.6, 1.4, 1.3, 3.6),
    ('cairn', -21.5, -36.5, 1.2, 1.2, 1.2, 3.6),
    # Lakefront
    ('ladle car', 11.5, -24.6, 3.0, 1.6, 2.0, 1.2),
    ('chain bin', -5.6, -24.2, 1.2, 1.0, 1.1, 1.2),
    ('Tide Board', 7.0, -23.8, 2.4, 0.6, 2.2, 1.2),
    ('capstan', -14.6, -22.0, 1.4, 1.2, 1.3, 1.8),
    ('chain bollard', -11.4, -24.4, 1.0, 1.0, 1.0, 1.8),
    ('stone crate', -17.4, -21.6, 1.2, 1.2, 1.0, 1.8),
    # causeway lamp plinths
    ('lamp plinth', 3.4, -14.5, 0.9, 0.9, 1.3, 1.2), ('lamp plinth', -3.4, -14.5, 0.9, 0.9, 1.3, 1.2),
    ('lamp plinth', 3.4, -19.5, 0.9, 0.9, 1.3, 1.2), ('lamp plinth', -3.4, -19.5, 0.9, 0.9, 1.3, 1.2),
    # Casting Floor
    ('mould stack', 8.4, -17.4, 1.6, 1.6, 1.8, 0.0), ('ladle stand', 13.4, -15.0, 1.6, 1.6, 2.0, 0.0),
    # Spillway
    ('bridge pier', 0, 0, 0, 0, 0, 0),
    # island
    ('ingot stack', 2.8, -9.0, 1.2, 1.2, 1.0, 1.2), ('ingot stack', -2.8, -9.0, 1.2, 1.2, 1.0, 1.2),
    ('stilling drum', 7.5, -6.4, 2.0, 2.0, 1.6, 1.2), ('ladle stand', 11.2, 0.6, 1.6, 1.6, 2.0, 1.2),
    # rims
    ('cairn', -26.0, -27.0, 1.2, 1.2, 1.2, 3.6), ('outcrop', -33.0, -38.0, 2.4, 1.6, 1.4, 3.6),
    ('vent hood', P(24.0, 177.0)[0], P(24.0, 177.0)[1], 1.4, 1.4, 1.4, 2.4),
    ('outcrop', P(28.0, 175.5)[0], P(28.0, 175.5)[1], 2.0, 1.4, 1.3, 3.6),
    ('cairn', -24.6, 16.2, 1.2, 1.2, 1.2, 2.4),
    ('hornito', P(30.4, -152.0)[0], P(30.4, -152.0)[1], 1.4, 1.4, 2.0, 0.0),
    ('hornito', P(30.4, -168.0)[0], P(30.4, -168.0)[1], 1.4, 1.4, 2.0, 0.0),
    ('hornito', 0, 0, 0, 0, 0, 0),
]
for (nm, cx, cz, w, dd, h, base) in COVER:
    if w == 0:
        continue
    box(nm, cx, cz, w, dd, h, base)
add('bridge pier', obox(*ch(28.5, 0.0), 0.8, 2.4, DA), 2.0, kind='roof')
add('hornito', obox(*ch(31.5, 2.0), 1.6, 1.6, DA), 2.2, kind='roof')
add('hornito', obox(*ch(24.6, -2.6), 1.6, 1.6, DA), 2.2, kind='roof')
# the column pavement round each Organ cluster: static basalt stumps (cover where ≥ 0.9 over the island)
STUMPS = [('Organ stump', -6.5, -8.8, 0.9, 2.1), ('Organ stump', -12.4, -2.8, 0.9, 2.4), ('Organ stump (step)', -7.0, -3.4, 0.8, 1.8)]
for (nm, cx, cz, r, top) in STUMPS:
    add(nm, hexpoly(cx, cz, r, 0), top)
# natural ground: mounds (walkable, slopes ≤ 24°), modelled as their flat tops
MOUNDS = [
    ('Rim Head spatter cone', -29.5, -33.0, 2.6, 0.9, 3.6),
    ('Rim Head hummock', -28.5, -24.5, 1.8, 0.6, 3.6),
    ('Ridge spatter cone', P(28.25, 166.5)[0], P(28.25, 166.5)[1], 1.8, 0.8, 3.6),
]
for th in (163.5, 171.0):
    srp, srr = ramp_rect(P(23.0, th), P(26.0, th), 3.0, 2.4, 3.6)
    add('Scree ramp', srp, ramp=srr)
for (nm, cx, cz, R, h, base) in MOUNDS:
    add(nm, hexpoly(cx, cz, R * 0.45, 30), base + h)       # the flat top (radius 0.45 R); the slopes are ramps

# rails (block walking; shots, ink, squids and sight pass) and solid parapets (cover)
def gaps_arc(r, a0, a1, gaps):
    """arc from a0 to a1 (a0 > a1, both negative), minus the angular gaps [(g0, g1), …] (g0 > g1)"""
    segs, cur = [], a0
    for g0, g1 in sorted(gaps, key=lambda g: -g[0]):
        if g0 < cur:
            segs.append((cur, g0))
        cur = min(cur, g1)
    if cur > a1:
        segs.append((cur, a1))
    return segs


# yard front railing on the r 39 arc: gaps at the Cupola Stair, the Upper Surge Steps (+ hop face), the tower climb
for (s0, s1) in gaps_arc(39.0, -63.0, -116.0, [(-67.8, -72.2), (-90.0, -101.0), (-105.0, -112.2)]):
    rail_arc('Yard front railing', 39.0, s0, s1)
# terrace parapet on the r 30 arc (solid, 0.9, cover): gaps at the stairs, the tower climb, and west of θ −104 (the Moorings)
for (s0, s1) in gaps_arc(30.0, -58.6, -79.5, [(-71.0, -77.0)]):
    add('Terrace parapet', arc(30.25, s0, s1, step=2) + arc(29.75, s1, s0, step=2), 3.3, kind='roof')
# gallery balustrades
add('Gallery balustrade', rect(4.0, 10.0, -57.6, -57.4), 5.8, kind='rail')
add('Gallery balustrade', rect(-10.0, -4.0, -57.6, -57.4), 5.8, kind='rail')
for sx in (1, -1):
    add('Gallery balustrade', rect(sx * 10 - 0.1, sx * 10 + 0.1, -69.0, -64.5), 5.8, kind='rail')
    add('Gallery balustrade', rect(sx * 10 - 0.1, sx * 10 + 0.1, -61.5, -57.5), 5.8, kind='rail')
# Spillway lip fence, bridge girders
add('Lip fence', [ch(S_LIP - 0.15, -HW), ch(S_LIP + 0.1, -HW), ch(S_LIP + 0.1, HW), ch(S_LIP - 0.15, HW)], 1.0, kind='rail')
for t in (-1.5, 1.5):
    add('Bridge girder', obox(*ch(28.5 + t, 0.0), 0.25, 11.0, DA), 3.4, kind='rail', y0=2.4)
# Rim Head parapet over the Slump
add('Rim Head parapet', [P(SH_OUT, SA0), P(36.0, -148.5), P(36.0, -148.1), P(SH_OUT + 0.3, SA0 + 0.2)], 4.5, kind='roof')

# Bazookarp only: the Ladle Gantry (Lakefront → island SE shoulder, over the Casting Floor)
add('Ladle Gantry (bazookarp only)', rect(8.0, 11.0, -21.5, -9.4), 1.2, note='onlyIn bazookarp')

# ---------------------------------------------------------------- the Slump stones
def stones():
    lens = [2.4, 2.7, 2.5, 2.6, None]
    widths = [2.6, 2.3, 2.8, 2.4, 2.6]
    offs = [0.45, -0.45, 0.4, -0.45, 0.45]
    lens[4] = round(SL - 0.5 - 4 * 0.25 - sum(lens[:4]), 2)
    out, s = [], 0.25
    ang = math.degrees(math.atan2(SU[1], SU[0]))
    for i in range(5):
        c = s + lens[i] / 2
        cx, cz = sp(S0, c, offs[i])
        out.append(dict(i=i + 1, c=(R3(cx), R3(cz)), along=lens[i], across=widths[i], ang=round(ang, 1), off=offs[i]))
        s += lens[i] + 0.25
    return out


STONES = stones()

# ---------------------------------------------------------------- the lava region (a set of polygons, 0.5 m into every bank)
E = 0.5
# the lake: one self-symmetric outline. East half (θ −90 → 90): Alpha's Lakefront, across the Spillway mouth, Bravo's
# horn tip and Ladle Road, across the mouth of Bravo's Slump bay (head tip to head tip), Bravo's Lakefront.
def lake_half():
    s1 = math.sqrt((23 + E) ** 2 - (HW + E) ** 2)
    pts = arc(23 + E, -90, -62.6, step=2.5)
    pts += [ch(s1, -HW - E), ch(S_MOUTH, 0.0)]
    # Bravo's rim shore = Alpha's west shore turned: horn tip, Ladle Road r 21 → +E, the north head's tip
    w = [P(21.6 + E, 148.0), P(21 + E, 150.0)] + arc(21 + E, 152.5, 177.5, step=2.5)
    w += [sp(S1, E, FACE), sp(S1, E, -FACE)]                     # north head tip face, E into the head
    w += [sp(S0, -E, -FACE), sp(S0, -E, FACE)]                   # south head tip face, E into the head
    w += arc(23 + E, -137.0, -92.5, step=2.5)
    pts += [rot(p) for p in w]
    return pts
LAKE_HALF = lake_half()
LAKE = LAKE_HALF + rotpoly(LAKE_HALF)
SPILL_R = [ch(S_MOUTH - 1.5, -HW - E), ch(S_LIP, -HW - E), ch(S_LIP, HW + E), ch(S_MOUTH - 1.5, HW + E)]
# the Slump bay: between the two heads' outer sides (E into each), out to the cliff foot + E, and in across the stones
SLUMP_R = [sp(S0, -E, FACE), sp(S0, -E, -FACE), P(SH_OUT + E, SA0 + 1.1)] + arc(SH_OUT + E, SA0 - 1.5, SA1 + 1.5, step=2.5) + \
    [P(SH_OUT + E, SA1 - 1.1), sp(S1, E, -FACE), sp(S1, E, FACE)]
REGION = dict(polys=[LAKE], half=[SPILL_R, SLUMP_R])
