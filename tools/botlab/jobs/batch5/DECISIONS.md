# Batch 5: the lead's decisions on the open questions (2026-10-04)

The user gave the lead full creative liberty for this batch ("im giving you full creative liberty over this ... just
remember our high level of quality, especially when it comes to map design"). These are the lead's answers to the open
questions in `bazookarp/SPEC.md` and `subs/SPEC.md`. Where a spec and this file disagree, this file wins. Anything
marked TELL THE USER goes into the lead's final report as a choice they may want to change.

## Names (final)
- Mode: **Bazookarp**. The object is the Bazookarp; its shield is the **Roe Shell**; it starts on **the Pond**; the
  checkpoints are **weirs**; the goal is the **Dragon Gate**; the prohibited areas are **Carp-Free Zones**; its shot is
  the **Carp Shot**. HUD strings as the spec has them ("Don't retreat!", "Carp-Free Zone!").
- Subs: **Glide Bomb** (`glide`), **Scrap Sentry** (`sentry`), **Chain Bobber** (`bobber`), **Dash Pellet** (`dash`),
  appended to `SUB_ORDER` in that order.
- Stages: **Bluestone Junction** (`bluestone`), **Gulper Aquarium** (`aquarium`), **Highmark Foundry** (`caldera`).

## Bazookarp (questions 1–18 in the spec)
1. Two weirs on a stage: the literal reading of the user's words. Landing the Bazookarp on either lowers all of that
   team's weirs and raises its Gate. **Yes.**
2. Weirs at 40–55 % of the way from the Pond to the Gate ("closer to the middle"). **Yes.**
3. Pond-to-Gate walking distance 55–85 m; stages whose base fronts are too short get lengthened as Bazookarp-only
   variants. **Yes** (the user: "feel free to do vast stage redesigns to make all stages playable").
4. A fresh 60 s fuse on every pick-up. **Yes.**
5. No passive special charge while both counts are still 100. **Yes.**
6. "Team Alpha wins if untouched": a hidden coin the host flips at the start, shown only in the result reason. **Yes.**
   (INKWAVE shows team names in the lobby, so the coin is what keeps the user's "players are not informed".)
7. Overtime safety cap of 300 s. **Yes.**
8. "A few seconds" = 5 s, strict. **Yes.**
9. The shell's burst and the fuse's explosion go through armour and need a clear line. **Yes.**
10. A stage with no Bazookarp layout yet is hidden for this mode only. **Yes**, as an intermediate state: the batch is
    not finished until every stage has a layout.
11. Score from the nav-based walking field, read at the carrier's node. **Yes.**
12. Shell 1000 hp at the start, 500 re-formed, specials count half: starting values, tuned from the damage table and
    bot matches. **Yes.**
13. A teammate's Bubble Guard on the carrier: measure it; cap it at 3 s on a carrier if more than a quarter of
    knockouts follow one within 8 s. **Yes.**
14. Treehills hedges count as roofs for a carrier; the pods stay on in this mode. **Yes.**
15. Aquarium pipes refuse a carrier. **Yes.**
16. Cargo (humans only) stays in rotation on the checker plus a scripted carry. **Yes.** TELL THE USER it has had no
    bot matches in this mode.
17. The 10 s overtime pick-up window pauses while the Bazookarp cannot be touched. **Yes.**
18. Carp Shot blasts are judged on the victim's own screen. **Yes.**

## Subs (questions 19–24 and the carried-over ones)
19. Dash Pellet: the dash is horizontal, in any of the 360° the player is steering, on the ground or in the air.
    No upward dash (it would break the 1.8 m reach rule that keeps roofs and perches off-limits). TELL THE USER
    ("omni-directional" could be read to include up and down).
20. Chain Bobber: the user said "The more you link together, the bigger the explosion", so the blast **keeps growing
    to 8 links**: radius 1.8 / 2.2 / 2.6 / 3.0 for 1–4, then +0.2 m per bobber to 3.8 m at 8; centre damage held at 180
    from 4 up. Beyond 8 it stops growing. Measure it in bot matches; the cap is the balance lever.
21. Scrap Sentry damage 22 a shot. **Yes.**
22. The Twinfire roll and the Mitts leap can pass through thin walls at low frame rates, as the dash would have.
    Give them the dash's sub-step rule, as its own small change at integration. **Yes.**
23. Glide Bomb cook rules (main weapon locked while cooking, the stone slips out 1 s after a full cook, radius 3.2 at
    full cook). **Yes.**
24. Aquarium device aprons through `G.level.noPlace`. **Yes.**
- Glide Bomb ink stays 65 %; the bobber guard stays 24 a player (fallback 16 if the performance test fails).
- The Bubble Blower bug the subs designer found (team fire on a remote bubble is dropped online) is fixed at
  integration, with a two-client test.

## Order of work (wave 2 on)
1. Wave 1's six packages merge first (`b5-int1`): the subs and the Bazookarp engine build on its deployable code.
2. The three stages start as soon as their designs are final (they own their own files): gimmick engine + blockout
   first, then a stop for the lead to look at pictures, then the place.
3. Then, on the merged base: the four subs (parallel), and the Bazookarp packages in the spec's order (`karp-engine`,
   `karp-checker`, then `karp-face` and `karp-bots` in parallel, then `karp-ref`).
4. Then a Bazookarp layout for every stage, the consolidated balance run, the full verification sweep.
