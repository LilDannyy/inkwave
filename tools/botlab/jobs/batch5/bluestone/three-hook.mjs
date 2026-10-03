// node --import ./three-hook.mjs …: resolve the bare 'three' / 'three/addons/' imports to vendor/three (the page's
// import map), so src/world/level.js loads in Node for the blockout checks (scratch)
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`
const root = ${JSON.stringify(new URL('../../../../../', import.meta.url).href)};
export async function resolve(spec, ctx, next) {
  if (spec === 'three') return next(root + 'vendor/three/build/three.module.js', ctx);
  if (spec.startsWith('three/addons/')) return next(root + 'vendor/three/jsm/' + spec.slice(13), ctx);
  return next(spec, ctx);
}`));
