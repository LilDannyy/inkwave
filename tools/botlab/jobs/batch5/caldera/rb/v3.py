from proto import *
def slump(a0=-146, a1=-176.5, r0=36.5, r1=31.5): return arcpts(lambda a: r0 + (r1-r0)*(a-a0)/(a1-a0), a0, a1)
def H_Z(tailR=34, tailA=-48, tip=[(24,-22),(20.5,-21)], headE=[], headW=[], sl=None, mid=[], endR=34):
    H = arcpts(lambda a: tailR, 0, tailA) + tip + headE + headW
    H += (slump(*sl) if sl else []) + mid + [P(endR,-179.9)]
    return H
# z5: head east edge diagonal from the mouth to the hall, Slump a real bite (cliff r 29) between the Rim Head (r 40) and the Ridge (r 36)
evaluate(H_Z(tailR=35, tailA=-50, tip=[(23,-24),(19,-23)], headE=[(11,-27),(8,-36),(4,-46),(0,-56),(-4,-64),(-7,-69)],
   headW=[(-27,-69),(-32,-66),(-36,-59),(-39,-50),(-40,-41),(-38,-32),(-33,-25)], sl=(-146,-176.5,29,29), endR=35), 'z5')
evaluate(H_Z(tailR=35, tailA=-50, tip=[(23,-24),(19,-23)], headE=[(11,-27),(8,-36),(4,-46),(0,-56),(-4,-64),(-7,-69)],
   headW=[(-27,-69),(-32,-66),(-36,-59),(-39,-50),(-40,-41),(-38,-32),(-33,-25)], sl=(-150,-172,28,28), endR=37), 'z6-deeper-slump')
evaluate(H_Z(tailR=36, tailA=-46, tip=[(24,-24),(18,-23)], headE=[(10,-26),(5,-34),(0,-44),(-3,-54),(-6,-63),(-8,-69)],
   headW=[(-30,-69),(-35,-66),(-39,-59),(-42,-50),(-42,-41),(-39,-32),(-34,-25)], sl=(-150,-172,28,28), endR=37), 'z7')
