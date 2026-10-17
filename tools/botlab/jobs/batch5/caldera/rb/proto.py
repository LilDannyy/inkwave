# outline prototype: the outer outline of the walkable floor as one closed polygon (Alpha's half-loop + its turn),
# rasterised at 1 m on the review's canvas, then the review's footprint metrics. python3 proto.py variant
import sys, json, math, numpy as np
from scipy import ndimage
from scipy.spatial import ConvexHull
from PIL import Image, ImageDraw
D = math.pi / 180
def P(r, a): return (r * math.cos(a * D), r * math.sin(a * D))
def load(f):
    d=json.load(open(f)); g=np.array(d['grid']).reshape(d['nz'],d['nx']); m=(g!=-1)
    C=np.zeros((180,120),bool)
    for j in range(d['nz']):
        for i in range(d['nx']):
            if m[j,i]:
                x=d['x0']+i; z=d['z0']+j
                if -60<=x<60 and -90<=z<90: C[z+90,x+60]=True
    return C
def foot(C):
    F=ndimage.binary_closing(C,structure=np.ones((5,5)),iterations=1); F=ndimage.binary_fill_holes(F)
    lab,n=ndimage.label(F)
    if n>1: sizes=ndimage.sum(F,lab,range(1,n+1)); F=lab==(1+np.argmax(sizes))
    return F
def solidity(F):
    pts=np.argwhere(F); h=ConvexHull(pts+0.0); return F.sum()/(h.volume+(h.area/2)+1)
iou=lambda a,b:(a&b).sum()/(a|b).sum()
REF={k:foot(load('fg-'+k+'.json')) for k in ['halyard','craters','aquarium']}
def raster(poly):
    im=Image.new('L',(120*4,180*4),0); ImageDraw.Draw(im).polygon([((x+60)*4,(z+90)*4) for x,z in poly],fill=255)
    a=np.array(im)[2::4,2::4]>0
    return a
def arcpts(f, a0, a1, step=3):
    n=max(2,int(abs(a1-a0)/step)+1); return [P(f(a0+(a1-a0)*i/(n-1)), a0+(a1-a0)*i/(n-1)) for i in range(n)]
def evaluate(H, name, extra=None):
    full = H + [(-x,-z) for x,z in H]
    C = raster(full)
    F = foot(C)
    out = f"{name}: area {F.sum()} solidity {solidity(F):.3f} IoU hal {iou(F,REF['halyard']):.3f} cra {iou(F,REF['craters']):.3f} aq {iou(F,REF['aquarium']):.3f}"
    w = ' '.join(f"{z}:{int(F[z+90].sum())}" for z in range(-65,66,10))
    print(out); print('   widths', w)
    sc=4; im=Image.new('RGB',(120*sc*4+12,180*sc),(255,255,255)); 
    for k,(G,col) in enumerate([(F,(230,200,170)),(REF['halyard'],(200,200,200)),(REF['craters'],(200,200,200)),(REF['aquarium'],(200,200,200))]):
        a=np.zeros((180,120,3),np.uint8); a[:]=(24,26,33); a[G]=col
        if k>0: a[F&~G]=(200,120,90); a[F&G]=(230,200,170)
        im.paste(Image.fromarray(a[::-1]).resize((120*sc,180*sc),Image.NEAREST),(k*(120*sc+4),0))
    dr=ImageDraw.Draw(im)
    for k in range(4):
        for v in range(-50,51,10): x=k*(120*sc+4)+(v+60)*sc; dr.line([(x,0),(x,180*sc)],fill=(60,90,140))
        for v in range(-80,81,10): y=(90-v)*sc; dr.line([(k*(120*sc+4),y),(k*(120*sc+4)+120*sc,y)],fill=(60,90,140))
    im.save(name+'.png')
    return F
def deficit(F):
    from scipy.spatial import ConvexHull
    pts=np.argwhere(F)+0.0; h=ConvexHull(pts)
    im=Image.new('L',(120,180),0); ImageDraw.Draw(im).polygon([(pts[i][1]+0.5,pts[i][0]+0.5) for i in h.vertices],fill=1)
    Hm=np.array(im)>0; V=Hm&~F
    lab,n=ndimage.label(V); out=[]
    for k in range(1,n+1):
        ys,xs=np.nonzero(lab==k); 
        if len(ys)<20: continue
        out.append((len(ys), int(xs.mean())-60, int(ys.mean())-90))
    return sorted(out,reverse=True)
