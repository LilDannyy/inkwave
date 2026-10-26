# INKWAVE (branch `new-stages`, the integration branch)
Read `tools/botlab/jobs/batch5/COMMON.md` first: the standing orders for every builder (how to run tests, git identity,
what never to touch). Each work package has its own worktree and brief under `tools/botlab/jobs/batch5/`; this branch
carries what the lead has accepted or shipped as PUBLIC BETA. The harness is `tools/botlab/README.md`; the engine docs
`docs/*.md`. Electron only through `tools/botlab/run.sh` with `BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3`.
Never touch the user's app at `/Users/danielosling/Desktop/1/inkwave` or any `dist/`.
