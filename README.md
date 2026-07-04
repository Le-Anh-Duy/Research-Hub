🇬🇧 English | **🇻🇳 [Tiếng Việt](README.vi.md)**

# Research Hub

A personal, local-first dashboard for a single researcher — notes, tasks,
experiments (with git-like branching), references, milestones, and
experiment code, all in one place. No database: everything is a Markdown
file in `vault/`, synced through git like any other repo.

## Structure

```
vault/
  current-direction.md   # current research direction — the single source of truth
  notes/                  # free-form brainstorming
  tasks/                  # things to do
  experiments/            # experiments, with parent_experiment for branching
  references/              # papers / reading list
  milestones/              # big milestones
  sessions/                # one file per work day, auto-created on dashboard open
  code/                    # reproducible-research scaffold (see code/README.md)
  _templates/              # schema reference for each content type — NOT real content
app/                       # the dashboard itself (React + Express), runs locally
```

## Getting started (after cloning)

```
cd app
npm install
```

The vault starts empty (templates only). Pick **one of three ways** to seed it:

1. **Use an AI agent** (Claude Code or similar): open a terminal in this repo
   and ask the agent to *"read AGENT.md and help me onboard"*. It will ask a
   few questions (project name, research direction, first milestone/task if
   any) and create the files for you.
2. **Terminal script**: `npm run vault:onboard` — asks the same questions
   directly in the terminal, no agent needed.
3. **In the app itself**: run `npm run dev`, open `http://localhost:5173` — if
   the vault is still empty, the dashboard shows an onboarding form automatically.

All three paths produce the same result: `vault/current-direction.md` filled
in, plus (if you provide them) a first milestone and a first task.

## Daily use

```
cd app
npm run dev
```

- Client: `http://localhost:5173`, API: `http://localhost:3001`.
- Sidebar: **Sessions** (one file per work day, goal auto-filled from the
  running experiment's `next_action`), **Notes** (highlights notes feeding
  the active research thread, dims stale ones), **Tasks / Experiments /
  References / Milestones**, **External** (browse and edit `.md`/`.txt`
  files directly, either inside `code/` or in a registered outside project
  folder).
- Type `[[id]]` in a note to cross-link — it renders as a clickable link and
  shows up in the "Backlinks" panel of the file it points to.
- The **"+ New"** button creates the right kind of content (Note / Task /
  Experiment / Reference / Milestone) with the correct frontmatter already
  filled in.

## Resetting the vault

To wipe everything and start clean again (e.g. after experimenting with the
app):

```
cd app
npm run vault:reset
```

Asks for confirmation before deleting anything. The vault is tracked in git,
so an accidental run can still be recovered with `git checkout -- vault/`
(as long as you haven't committed over it).

## Content schema

See `vault/_templates/*.md` — that's the source of truth for the frontmatter
schema of each content type (note/task/experiment/reference/milestone/
session), with every field annotated.
