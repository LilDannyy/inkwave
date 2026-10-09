from proto import *
import itertools, random
def spir(a0, a1, r0, r1, step=3): return arcpts(lambda a: r0 + (r1-r0)*(a-a0)/(a1-a0), a0, a1, step)
def build(tR, tEnd, cl, nb, bite, se, wx):
    headE=[(12.7,-29.1),(6,-32),(bite+2.5,-37),(bite,-44),(bite+1.5,-51),(se-1,-56),(se+1,-61),(se,-66.5)]
    headW=[(-34,-66.5),(wx+3,-62),(wx+0.5,-55),(wx,-47),(wx+0.5,-39),(wx+2.5,-32),(-35.5,-26.5)]
    H = spir(0,-20,tR,tR)+spir(-20,-40,tR,tEnd)+[(25,-24),(24,-28.5),(21.5,-27.2)]+headE+headW+spir(-149,-173,cl,cl)+[P(nb,-177),P(tR,-179.9)]
    return H
def metr(H):
    full = H + [(-x,-z) for x,z in H]; F = foot(raster(full))
    w = max(np.nonzero(F[z+90])[0].max()-np.nonzero(F[z+90])[0].min()+1 for z in range(-66,-34))
    return F, solidity(F), iou(F,REF['halyard']), iou(F,REF['craters']), w
random.seed(1); best=[]
for it in range(220):
    p=(random.choice([34,35,36,37]),random.choice([28,30,32]),random.choice([26,27,28,29]),random.choice([35,37,39]),random.choice([-4,-2,0]),random.choice([-2,0,2,4,6]),random.choice([-39,-40,-41,-42]))
    F,s,ih,ic,w=metr(build(*p))
    if w<=41: best.append((s,ih,ic,w,int(F.sum()),p))
best.sort()
for b in best[:12]: print(b)
