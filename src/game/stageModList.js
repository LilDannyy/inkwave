// Imports every stage module so it registers itself (src/game/stageMods.js; docs/STAGE-MODS.md). Imported once from
// main.js, after the registry. One line per module; each module is its own file (its stage's engineer owns it).
import './eras.js';    // Bluestone Junction: the era engine (LAYOUT.eras)
import './pipes.js';   // Gulper Aquarium: the pipe engine (LAYOUT.pipes)
import './lava.js';    // Highmark Foundry: the lava engine (LAYOUT.lava)
