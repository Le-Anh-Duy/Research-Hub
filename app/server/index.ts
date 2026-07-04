import express from 'express'
import cors from 'cors'
import { execSync } from 'node:child_process'
import path from 'node:path'
import type { ItemKind } from '../src/types.ts'
import {
  VAULT_DIR,
  readTasks,
  readExperiments,
  readReferences,
  readMilestones,
  readNotes,
  readCurrentDirection,
  writeTaskStatus,
  listAllFiles,
  readRawFile,
  writeRawFile,
  createItem,
  readSessions,
  getOrCreateTodaySession,
  writeSessionStatus,
  getTopNextAction,
  buildIdIndex,
  getBacklinks,
  listExternalRoots,
  addExternalRoot,
  removeExternalRoot,
  listExternalFiles,
  isVaultFresh,
  applyOnboarding,
} from './vault.ts'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/tasks', (_req, res) => res.json(readTasks()))
app.get('/api/experiments', (_req, res) => res.json(readExperiments()))
app.get('/api/references', (_req, res) => res.json(readReferences()))
app.get('/api/milestones', (_req, res) => res.json(readMilestones()))
app.get('/api/current-direction', (_req, res) => res.json(readCurrentDirection()))
app.get('/api/notes', (_req, res) => res.json(readNotes()))
app.get('/api/sessions', (_req, res) => res.json(readSessions()))

app.post('/api/sessions/today', (_req, res) => {
  const top = getTopNextAction()
  res.json(getOrCreateTodaySession(top?.text ?? '', top?.experimentId ?? null))
})

app.patch('/api/sessions/:id', (req, res) => {
  writeSessionStatus(req.params.id, req.body.status)
  res.json({ ok: true })
})

app.patch('/api/tasks/:id', (req, res) => {
  writeTaskStatus(req.params.id, req.body.status)
  res.json({ ok: true })
})

app.get('/api/files', (_req, res) => res.json(listAllFiles()))
app.get('/api/link-index', (_req, res) => res.json(buildIdIndex()))
app.get('/api/backlinks', (req, res) => res.json(getBacklinks(req.query.id as string)))

app.get('/api/roots', (_req, res) => res.json(listExternalRoots()))
app.post('/api/roots', (req, res) => {
  const { name, path: rootPath } = req.body as { name: string; path: string }
  try {
    res.json(addExternalRoot(name, rootPath))
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
})
app.delete('/api/roots/:name', (req, res) => {
  try {
    removeExternalRoot(req.params.name)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
})
app.get('/api/external-files', (_req, res) => res.json(listExternalFiles()))

app.get('/api/onboarding-status', (_req, res) => res.json({ fresh: isVaultFresh() }))
app.post('/api/onboarding', (req, res) => {
  const { projectName, hypothesis, milestoneTitle, taskTitle } = req.body as {
    projectName: string
    hypothesis: string
    milestoneTitle?: string
    taskTitle?: string
  }
  if (!projectName?.trim() || !hypothesis?.trim()) {
    res.status(400).json({ error: 'Cần có tên project và hypothesis' })
    return
  }
  res.json(applyOnboarding({ projectName: projectName.trim(), hypothesis: hypothesis.trim(), milestoneTitle, taskTitle }))
})

app.get('/api/file', (req, res) => {
  const relPath = req.query.path as string
  try {
    res.json({ path: relPath, content: readRawFile(relPath) })
  } catch {
    res.status(404).json({ error: 'File not found' })
  }
})

app.put('/api/file', (req, res) => {
  const { path: relPath, content } = req.body as { path: string; content: string }
  try {
    writeRawFile(relPath, content)
    res.json({ ok: true })
  } catch {
    res.status(400).json({ error: 'Could not write file' })
  }
})

app.post('/api/items', (req, res) => {
  const { kind, title } = req.body as { kind: ItemKind; title: string }
  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Title required' })
    return
  }
  res.json(createItem(kind, title.trim()))
})

app.get('/api/resume', (_req, res) => {
  const tasks = readTasks()
  const experiments = readExperiments()
  const notes = readNotes()

  let lastCommit = null
  try {
    const repoRoot = path.resolve(VAULT_DIR, '..')
    const out = execSync('git log -1 --format=%s%x1f%cI -- vault', {
      cwd: repoRoot,
      encoding: 'utf-8',
    }).trim()
    if (out) {
      const [message, date] = out.split('\x1f')
      lastCommit = { message, date }
    }
  } catch {
    lastCommit = null
  }

  const dated = [
    ...tasks.map((t) => ({ type: 'task', id: t.id, title: t.title, updated: t.updated ?? t.created })),
    ...experiments.map((e) => ({ type: 'experiment', id: e.id, title: e.title, updated: e.updated ?? e.created })),
    ...notes.map((n) => ({ type: 'note', id: n.id, title: n.title, updated: n.updated ?? n.created })),
  ].sort((a, b) => (a.updated < b.updated ? 1 : -1))
  const lastEditedItem = dated[0] ?? null

  const pendingTasks = tasks.filter((t) => t.status === 'in-progress' || t.status === 'blocked')

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const staleExperiments = experiments.filter(
    (e) => e.status === 'running' && new Date(e.updated) < twoDaysAgo,
  )

  const nextActions: { source: string; text: string }[] = []
  for (const e of experiments) {
    if (e.status === 'running' && e.branch_type === 'main' && e.next_action) {
      nextActions.push({ source: `Experiment ${e.id}`, text: e.next_action })
    }
  }
  const topTask = tasks
    .filter((t) => t.status === 'todo')
    .sort((a, b) => (a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0))[0]
  if (topTask) nextActions.push({ source: `Task ${topTask.id}`, text: topTask.title })

  res.json({ lastCommit, lastEditedItem, pendingTasks, staleExperiments, nextActions })
})

const PORT = 3001
app.listen(PORT, () => console.log(`Vault API listening on http://localhost:${PORT}`))
