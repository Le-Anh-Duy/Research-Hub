# AGENT.md — onboarding guide for AI agents

This is **Research Hub**: a local Markdown vault for a single researcher, with
a dashboard at `app/` (React + Express) that reads/writes `vault/` directly.
No database — everything is a `.md` file with frontmatter.

Only follow this file when the user **explicitly asks** to be onboarded (e.g.
"read AGENT.md and help me set up this project"). Don't run this flow
automatically at the start of every session — only when clearly requested.

## Step 1 — Check whether the vault is already onboarded

Look at `vault/tasks/`, `vault/experiments/`, `vault/notes/`,
`vault/milestones/`. If **any** of them contains a `.md` file (not counting
`vault/_templates/`), the vault is already in use — don't onboard again.
Instead, ask the user what they need help with (e.g. read
`vault/current-direction.md` to understand the current direction, then help
from there).

If all of them are empty, the vault is "fresh" — continue to step 2.

## Step 2 — Quick interview

Ask the user (natural conversation, order doesn't need to be rigid):

1. What's the name of the research project?
2. What's the initial research direction / hypothesis — what are you testing, and why?
3. (Optional) What's the first milestone you want to hit?
4. (Optional) What's the first concrete task to start on right away?

Don't ask for anything else at this stage (no need for a specific
experiment/reference yet — the user can create those later via the "+ New"
button in the app; keep onboarding lightweight).

## Step 3 — Write the files

Use today's real date (not the placeholder dates shown in the templates).

**`vault/current-direction.md`** — overwrite entirely:

```
---
updated: <YYYY-MM-DD>
---

# <Project name>

## Current hypothesis

<the research direction / hypothesis the user just described>

## Changelog (pivot log)

- **<YYYY-MM-DD>**: Started the research hub for "<Project name>".
```

**If a first milestone was given** — create `vault/milestones/milestone-001.md`.
Read `vault/_templates/milestone.md` to get the exact fields (don't guess the
schema — always read the matching template file before writing, since the
schema may have evolved since this file was written). Leave `target_date` as
`null` if the user didn't give a specific date.

**If a first task was given** — create `vault/tasks/task-001.md` the same
way, based on `vault/_templates/task.md`.

Apply this rule to **every** content type: before manually creating a note,
experiment, reference, milestone, or task, always read the matching file in
`vault/_templates/` first — that's the source of truth for the schema, not
this file.

## Step 4 — Done

Tell the user:
- `current-direction.md` has been created (plus milestone/task if provided).
- Run `npm install` then `npm run dev` inside `app/` to open the dashboard
  (client at `localhost:5173`, API server at `localhost:3001`).
- If the project involves experiment code: see `vault/code/README.md` — the
  vault already ships a reproducible-research scaffold (real logic lives
  locally in `code/src/`, one config per run in `code/configs/`, Colab
  notebooks are orchestration-only).

## Other notes

- Other ways to onboard (no agent needed): `cd app && npm run vault:onboard`
  (a terminal script asking the same 4 questions), or just open the
  dashboard directly — if the vault is empty, the app shows an onboarding
  form automatically.
- To wipe everything and start over: `cd app && npm run vault:reset` (asks
  for confirmation before deleting; the vault is tracked in git, so it's
  still recoverable if run by mistake).
- For architecture/API details, see `README.md` at the repo root.
