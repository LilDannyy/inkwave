// Pre-render hook for caldera rise-shelf-ink: paint vivid team ink on the Slump shelf, cliff, and heads
(async () => {
  const THREE = await import('three');
  const P = (typeof __G !== 'undefined' && __G?.paint) || window.__inkwave?.paint;
  if (!P) {
    console.error('paint-ink: paint system not found');
    return;
  }
  const V = THREE.Vector3;

  // Splat Team 0 (Alpha team: cyan / cobalt)
  const team0Pts = [
    [-26.0, 0.05, -10.0], [-24.5, 0.05, -8.0], [-23.0, 0.05, -12.0],
    [-25.5, 1.25, -6.0],  [-21.0, 1.25, -10.0], [-19.5, 1.25, -7.5],
    [-27.0, 2.2, -9.0],   [-26.0, 3.2, -11.0], [-24.0, 1.8, -14.0],
    [-22.0, 2.0, -6.5],   [-20.0, 0.05, -11.0], [-25.0, 0.05, -14.0]
  ];
  for (const [x, y, z] of team0Pts) {
    P.splat(new V(x, y, z), 2.5, 0, { instant: true });
  }

  // Splat Team 1 (Bravo team: orange / gold)
  const team1Pts = [
    [-24.0, 0.05, -11.5], [-22.5, 0.05, -7.0],  [-25.5, 0.05, -6.5],
    [-22.0, 1.25, -13.5], [-18.0, 1.25, -8.5],  [-20.5, 1.25, -13.0],
    [-26.5, 2.2, -12.0],  [-25.0, 3.0, -8.0],   [-23.0, 2.5, -11.0],
    [-19.0, 1.8, -10.5],  [-21.0, 0.05, -8.0],  [-26.0, 0.05, -13.0]
  ];
  for (const [x, y, z] of team1Pts) {
    P.splat(new V(x, y, z), 2.5, 1, { instant: true });
  }
  console.log('paint-ink: painted', team0Pts.length + team1Pts.length, 'splats');
})();
