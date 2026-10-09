// Environmental splat causes beyond the sea (stage modules register theirs: src/game/stageMods.js registerCause).
// { name, knocked, icon (an SVG string), flood (the screen flood's colour), clear (the sea's clear-flood path), byColor }
// Read by hud.js splatCause, main.js 'splatted' and screenfx.js's flood. Three-free, no imports. [b5-stagehooks]
const CAUSES = new Map();
export function registerCause(id, c) { CAUSES.set(id, { name: id, ...c }); }
export const envCause = (id) => (typeof id === 'string' && CAUSES.size ? CAUSES.get(id) || null : null);
