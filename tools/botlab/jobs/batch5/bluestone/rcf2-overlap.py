#!/usr/bin/env python3
# Bluestone round C fix 2 (scratch): "could a player confuse these from above?" as a number. The best overlap (IoU) of
# two stages' masks over the four flips and every whole-metre shift, at 1 m cells, for the walkable floor and for the
# filled footprint (floor plus buildings and roofs). Masks from shape-sheet.mjs (0.5 m cells, -99 = out of play,
# -50 = a roof or building, else a walkable top).
#   (cd tools/botlab/jobs/batch5/bluestone && ERA=1 node --import ./three-hook.mjs shape-sheet.mjs m.json crossmarket bluestone halyard)
#   python3 rcf2-overlap.py m.json crossmarket bluestone halyard        (every pair)
import sys, json, itertools, numpy as np
d = json.load(open(sys.argv[1])); ids = sys.argv[2:]
def masks(s):
    C = s['C']; g = np.array(s['g']).reshape(s['nz'], s['nx']); k = int(round(1 / C))
    def down(m): h, w = m.shape[0] // k * k, m.shape[1] // k * k; return m[:h, :w].reshape(h // k, k, w // k, k).mean((1, 3)) >= 0.5
    return down((g != -99) & (g != -50)), down(g != -99)
def best(a, b):
    out = 0.0; a = a.astype(np.float32)
    for fb in (b, b[::-1], b[:, ::-1], b[::-1, ::-1]):
        fb = fb.astype(np.float32); H = (a.shape[0] + fb.shape[0]); W = (a.shape[1] + fb.shape[1])
        A = np.zeros((H, W), np.float32); A[:a.shape[0], :a.shape[1]] = a
        B = np.zeros((H, W), np.float32); B[:fb.shape[0], :fb.shape[1]] = fb
        I = np.real(np.fft.ifft2(np.fft.fft2(A) * np.conj(np.fft.fft2(B))))
        out = max(out, float((I / (a.sum() + fb.sum() - I + 1e-9)).max()))
    return out
M = {i: masks(d[i]) for i in ids}
for i, j in itertools.combinations(ids, 2):
    print(f'{i} vs {j}: walkable {best(M[i][0], M[j][0]):.2f}, footprint {best(M[i][1], M[j][1]):.2f}')
for i in ids: print(f'{i}: walkable {int(M[i][0].sum())} m², footprint {int(M[i][1].sum())} m², fill of its bounds {M[i][1].sum() / M[i][1].size:.2f}')
