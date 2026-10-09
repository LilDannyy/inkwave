import json, numpy as np
from scipy import ndimage
from scipy.spatial import ConvexHull
S='/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/fx2/'
def load(f):
    d=json.load(open(S+f)); g=np.array(d['grid']).reshape(d['nz'],d['nx'])
    m=(g!=-1)
    # place into a common canvas centred on the origin: x -60..60, z -90..90
    C=np.zeros((180,120),bool)
    for j in range(d['nz']):
        for i in range(d['nx']):
            if m[j,i]:
                x=d['x0']+i; z=d['z0']+j
                if -60<=x<60 and -90<=z<90: C[z+90,x+60]=True
    return C
def foot(C):
    F=ndimage.binary_closing(C,structure=np.ones((5,5)),iterations=1)
    F=ndimage.binary_fill_holes(F)
    lab,n=ndimage.label(F); 
    if n>1:
        sizes=ndimage.sum(F,lab,range(1,n+1)); F=lab==(1+np.argmax(sizes))
    return F
def solidity(F):
    pts=np.argwhere(F); h=ConvexHull(pts+0.0); return F.sum()/ (h.volume+ (h.area/2)+1)
def widths(F,zs):
    out=[]
    for z in zs:
        row=F[z+90]; xs=np.where(row)[0]
        out.append((z, int(row.sum()), (int(xs.min())-60, int(xs.max())-60+1) if len(xs) else None))
    return out
G={k:load(f) for k,f in [('cal-low','grid-low.json'),('cal-high','grid-high.json'),('halyard','../r4/fg-halyard.json'),('craters','../r4/fg-craters.json'),('aquarium','../r4/fg-aquarium.json')]}
F={k:foot(v) for k,v in G.items()}
def iou(a,b): return (a&b).sum()/(a|b).sum()
for k in F: print(f"{k:9s} floor {G[k].sum():5d}  footprint {F[k].sum():5d}  solidity {solidity(F[k]):.3f}  holes(lake) {F[k].sum()-ndimage.binary_closing(G[k],np.ones((5,5))).sum():5d}")
for a in ['cal-low','cal-high','aquarium','craters']:
    print(a, 'IoU halyard %.3f  craters %.3f  aquarium %.3f'%(iou(F[a],F['halyard']),iou(F[a],F['craters']),iou(F[a],F['aquarium'])))
zs=list(range(-70,71,5))
for k in ['cal-low','cal-high','halyard']:
    print(k, ' '.join(f"{z}:{w}" for z,w,_ in widths(F[k],zs)))
# lake: open (non-floor) cells enclosed by the footprint within r<30 of origin
for k in ['cal-low','cal-high']:
    hole=F[k]&~ndimage.binary_closing(G[k],np.ones((3,3)))
    lab,n=ndimage.label(hole); sizes=sorted(ndimage.sum(hole,lab,range(1,n+1)),reverse=True)[:6]
    print(k,'enclosed non-floor regions (m2, largest):',[int(s) for s in sizes])
np.save(S+'F.npy',np.stack([F['cal-low'],F['cal-high'],F['halyard'],F['craters'],F['aquarium']]))

