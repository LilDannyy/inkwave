const ROOT = process.env.ROOT || '/Users/danielosling/Desktop/1/st-b5-caldera';
export async function resolve(spec, ctx, next) {
  if (spec === 'three') return { url: 'file://' + ROOT + '/vendor/three/build/three.module.js', shortCircuit: true };
  if (spec.startsWith('three/addons/')) return { url: 'file://' + ROOT + '/vendor/three/jsm/' + spec.slice(13), shortCircuit: true };
  return next(spec, ctx);
}
