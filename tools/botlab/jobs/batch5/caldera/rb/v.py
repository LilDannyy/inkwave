from proto import *
def H_of(tailR=34, tipA=-38, tip=(23.5,-24.5), bank=[(12.3,-27.2),(13.5,-38)], headE=[(11.5,-45),(9.5,-55),(7.5,-62),(5,-69)],
         back=-69, headW=[(-24,-69),(-29,-65),(-33,-57),(-35,-47),(-35,-38),(-33,-30)], slump=(36.5,31.5), endR=34):
    H = arcpts(lambda a: tailR, 0, tipA) + [tip] + [(21.1,-25.2)] + bank + headE + headW
    H += arcpts(lambda a: slump[0] + (slump[1]-slump[0]) * (a + 146) / (-176.5 + 146), -146, -176.5)
    H += [P(endR, -179.9)]
    return H
import sys
evaluate(H_of(), 'v1')
# current-like (horn run kept, wide head) for calibration
cur = arcpts(lambda a: 31 - 3*(-a)/18 if a > -18 else 28, 0, -18) + [(26.9,-14.5),(27.6,-21),(28.8,-27),(28.9,-32.5),(24.5,-38)] + [(14.8,-38.9),(13,-45.5),(11,-52),(9.2,-58.5),(7.4,-65),(5.5,-69),(-23,-69),(-28.5,-66),(-33.5,-60),(-37,-52.5),(-38.6,-44),(-38.2,-35.5),(-36,-28.5),(-33.4,-24.6)]
cur += arcpts(lambda a: 36.5 + (31.5-36.5)*(a+146)/(-30.5), -146, -176.5) + [P(31,-179.5)]
evaluate(cur, 'cur')
evaluate(H_of(tailR=30, endR=30, slump=(33,30)), 'v2-thin-tail')
evaluate(H_of(headW=[(-22,-69),(-26,-65),(-29,-57),(-30,-47),(-31,-38),(-31,-30)]), 'v3-narrow-head')
