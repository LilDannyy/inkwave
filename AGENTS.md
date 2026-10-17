# INKWAVE (this worktree: batch 5 integration `b5-int4`)
Read `tools/botlab/jobs/batch5/COMMON.md` first: it is the standing order for every builder (how to run tests, git
identity, what never to touch). Your task is `tools/botlab/jobs/batch5/int4/CODEX-BRIEF.md`. The harness is
`tools/botlab/README.md`; the engine docs are `docs/*.md`. Electron only through `tools/botlab/run.sh` with
`BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3`. Never touch the user's app at
`/Users/danielosling/Desktop/1/inkwave` or any `dist/`.
