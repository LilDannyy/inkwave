# Batch 5 integration `b5-int4` — lead report

Date: 2026-10-17  
Branch: `b5-int4`

## Work completed

- Merged, in brief order, `b5-karp-checker` (`4db65ccc`), `b5-karp-face` (`dcbc17d3`), `b5-karp-bots` (`08537605`), `b5-stage-aquarium` (`05a5fcc5`), `b5-stage-bluestone` (`e9b2bbbf`), and `b5-stage-caldera` (`90a16a5b`).
- Merged `new-stages` at `a9974492` (`da40dbb9`); it adds the integration commit and scratch docs on top of the existing wave-2 tree.
- Applied DECISIONS #33 in `3ba7ea7b`: the three playable stages and Bazookarp are visible and marked `PUBLIC BETA`; `wip` remains available for genuinely unavailable content. Aquarium's pipe exit cooldown is 3.5 seconds, and the `pipes.js` camera test restores default camera settings before its ride check.
- Fixed the reported prolonged bobber hold-fire in `7c0f59a1`: a held web hold times out after 1.5 seconds, clears its stand/ambush hold, and forces movement/replanning. An earlier unconditional Glide-cook timeout (`bf4f476e`) broke legitimate full cooks; the following commit replaced it with the bobber-specific timeout, and `sub-glide` passed after that correction.
- Fixed Bazookarp's stale field initialization in `59a2619b`, syncing the field to the live stage era/lava state once per match. Added the clarifying stage-specific cooldown comment in `69d6631e`.

## Merge notes

- `src/config.js`: retained each package's appended stage/mode registrations and WIP/BETA semantics; Bazookarp is removed from `WIP_MODES` and its mode card is beta-tagged.
- `src/ui/menus.js` and `styles/ui.css`: kept stage-picker, lobby, and results beta badges alongside existing Boss Battle mode-card badge behavior.
- `src/game/bots.js` and the Bazookarp hooks: retained the subs' polish and each stage's era/lava behavior together with the Bazookarp bot hook.
- `src/game/deployables.js`: retained the shared `crushIn` behavior required by the devices and Bazookarp.
- `src/game/karpField.js`: applied the Bluestone `karp-anyValid.patch`; the corrected `eras-karp` part B passed 5/5.
- `docs/NET.md`, `docs/STAGE-MODS.md`, and other package docs: retained the sections from each merged package.
- The `new-stages` merge had no app-code changes to reconcile.

## Tests

Electron checks were launched through `tools/botlab/run.sh` with `BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3`. Results captured during this work:

| Check | Result |
| --- | --- |
| `node build/check-maps.mjs` | All layouts/variants passed except the documented Halyard half[41] ramp at 25.7° (limit 24°), a pre-existing open issue. |
| `stage-mods`, `world-build` | 36/36, 5/5 passed. |
| `pipes`, `pipes-audit` | 92/92, 8/8 passed. |
| `eras-world`, `eras-modes` | 19/19, 6/6 passed. |
| `eras-jump` | `only=first` 1/1; `only=sched,flip,guard,modes` 10/10; `only=fall,shove,rescue,device,zip` 8/8; `only=fx,sky,freeze` 5/5. `only=frames` remains unrun because the shared Mac's load average was high; this part must be judged alone at low load. The unsplit run exceeded the 900000 ms watchdog. |
| `eras-karp` | 5/5 passed on Bluestone in Bazookarp mode. |
| `lava` | 58/59 passed; one check failed (details were truncated in the captured output and remain uncertain). |
| `lava-audit` | 38/41 passed. The observed failure was rule 21, pinch placement beside a Pumice stone at HIGH; 18 pinches intersected on the tested paths. Remaining failures were not recoverable from truncated output. |
| `lava-karp` | Did not return after more than 16 minutes and did not emit a result; I stopped the runner I had launched. Treat as incomplete, not a pass. |
| `bazookarp-rules`, `karp-bots`, `hud-karp`, `int3` | 119/119, 42/42, 43/43, 4/4 passed. |
| `sub-glide`, `sub-bobber`, `sub-sentry`, `sub-dash` | 65/65, 84/84, 50/50, 48/48 passed on the final code. |
| `deployables`, `bot-specials`, `tower-rules`, `loadout-picker`, `beta-content` | 34/34, 18/19, 26/26, 23/23, 7/7. The `bot-specials` failure was the Bubble Blower counter-play check for a friendly bubble with an enemy behind a wall. |
| `sfx-cues` | Started alone after the other page tests, but returned no output for over five minutes while load remained high; I stopped the runner I had launched. Unresolved, not a pass. |
| `net-karp` (2 clients) | Started with the prescribed local runner, but returned no output after more than 16 minutes while system load rose above 50; I stopped the runner I had launched. Unresolved, not a pass. |
| `net-eras`, `net-lava`, `net-pipes`, `net-stagemods`, `net-lobbykit`, `net-practice`, and 3-client `net-karp` | Not run. |

## Bot matches

| Match | Stuck | Console errors | Frame errors | Result |
| --- | ---: | ---: | ---: | --- |
| Crossmarket Turf, eight new subs | 0.4% | 0 | 0 | Pass: one 2.0 s episode was `hold:false`; no `hold:true` episode over 2 s; bobber `holdTimeouts=4`. |
| Bluestone Turf | 0.1% | 0 | 0 | Pass |
| Bluestone Zones | 0.4% | 0 | 0 | Pass |
| Bluestone Tower | 1.5% | 1 warning/error line | 0 | Over the 1% stuck target; captured line needs inspection. |
| Aquarium Turf / Zones / Tower | 0% / 0.3% / 0.1% | 0 / 0 / 0 | 0 / 0 / 0 | Pass |
| Caldera Turf / Zones / Tower | 0.6% / 0.2% / 0.7% | 1 / 1 / 1 warning/error lines | 0 / 0 / 0 | Stuck/frame thresholds passed; console lines need inspection. |
| Bazookarp on karpbox and halyard | — | — | — | Not run. |

## Pictures and compatibility

Four screenshots were visually inspected and committed as JPEGs under 300 KB:

- `out/beta-stage-tile.jpg` — Bluestone's selectable stage tile and badge.
- `out/beta-lobby.jpg` — lobby stage picker and badge.
- `out/beta-mode-card.jpg` — Boss Battle and Bazookarp mode cards, both labeled PUBLIC BETA.
- `out/beta-results.jpg` — results overlay showing Bluestone Junction and PUBLIC BETA.

`karp-layout-diff.mjs` compared the current tree against `a9974492`: all 78 builds and day/sunset thumbnails for the 13 older stages are identical. The 18 expected differences are the three integrated stages across four modes and two thumbnails each.

## Commits and remaining work

Key commits: `4db65ccc`, `dcbc17d3`, `08537605`, `05a5fcc5`, `e9b2bbbf`, `90a16a5b`, `3ba7ea7b`, `da40dbb9`, `59a2619b`, `7c0f59a1`, `69d6631e`, and screenshot commit `d63ed8c0`.

Still open: run the `eras-jump` frames split at low load; rerun/capture `lava` and `lava-audit` failures with complete output; investigate the `lava-karp`, `net-karp`, and `sfx-cues` hangs and `bot-specials` failure; finish the online suite; run Bazookarp matches on karpbox and halyard; inspect the warning/error lines and rerun Bluestone Tower to meet the stuck target; complete final diff/status review. Push is held pending the user's direction.

## Addendum: beta issue capture

Implemented the Addendum's issue logging. `src/core/issueLog.js` uses a 500-entry ring and records timestamp, build commit, mode, stage, era/lava state and online status. It captures wrapped `console.error` / `console.warn`, `window.onerror`, unhandled rejections, in-game frames over 250 ms, bot no-progress episodes over 5 seconds, and a guest's local result disagreement with the host result. Player names and room-code-like strings are scrubbed.

- Desktop JSONL: `<app.getPath('userData')>/issues.log`; rotates above 5 MiB. Startup prints the path. Renderer console warning/error events are forwarded too.
- Hosted JSONL: `<site-root>/issues.log`; `POST /issue` enforces same-origin, an 8 KiB body cap and 20 requests/minute/IP, rotating above 20 MiB. `tools/host/export.sh` writes the build commit to `build-id.txt`; the host injects it into the page. The game posts buffered entries to the same origin at 10-second intervals and on unload.
- Summary: `node tools/botlab/issues-summary.cjs <issues.log> [other.log ...]` prints grouped counts, stage, mode, first/last seen and an example message.

Proof: `issue-log.js` page test PASS 2/2; `issue-host.cjs` PASS for JSONL append, same-origin rejection, 8 KiB cap and rate limit; `net-practice` PASS 29/29 with no client console errors. Syntax checks and `git diff --check` passed. The botlab page harness itself prints an Electron `console-message` deprecation warning; the app's warning/error forwarding uses the current details-object callback signature. No live hosted server was contacted.
