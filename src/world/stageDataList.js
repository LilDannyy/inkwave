// Imports every stage module's three-free data file so it registers its tool hooks (stageData.js). Imported by
// mapThumb.js (the browser and Node alike). [b5-stagehooks]
import './eras-data.js';    // Bluestone Junction (LAYOUT.eras)
import './pipes-data.js';   // Gulper Aquarium (LAYOUT.pipes): expandPipes, legAt, checkPipes … (aquarium ENGINE.md §3.2)
import './lava-data.js';    // Highmark Foundry (LAYOUT.lava)
