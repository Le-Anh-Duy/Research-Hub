import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export const VAULT_DIR = path.resolve(process.cwd(), '../vault')

// js-yaml (used internally by gray-matter) auto-parses bare date strings like
// "2026-07-06" into JS Date objects. Left alone, JSON.stringify turns those into
// "2026-07-06T00:00:00.000Z" on every response. Our schema only ever uses plain
// dates, so convert them back to yyyy-mm-dd strings after parsing.
function dateToPlainString<T>(value: T): T {
  if (value instanceof Date) return value.toISOString().slice(0, 10) as unknown as T
  if (Array.isArray(value)) return value.map(dateToPlainString) as unknown as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, dateToPlainString(v)]),
    ) as unknown as T
  }
  return value
}

function readDir<T extends Record<string, unknown>>(folder: string): (T & { body: string; path: string })[] {
  const dir = path.join(VAULT_DIR, folder)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8')
      const { data, content } = matter(raw)
      return { ...dateToPlainString(data as T), body: content.trim(), path: `${folder}/${f}` }
    })
}

function resolveVaultPath(relPath: string): string {
  const resolved = path.resolve(VAULT_DIR, relPath)
  if (resolved !== VAULT_DIR && !resolved.startsWith(VAULT_DIR + path.sep)) {
    throw new Error('Path escapes vault directory')
  }
  return resolved
}

// External roots let notes/experiments reference and edit files that live in a
// separate project folder (e.g. the real ML repo cloned/dev'd outside this vault),
// without moving the vault's write boundary to "anywhere on disk". Each root is
// registered explicitly (absolute path, validated to exist) and its own traversal
// check applies, same shape as resolveVaultPath but scoped to that one root.
const ROOTS_CONFIG_FILE = path.resolve(process.cwd(), 'local.config.json')
const EXTERNAL_PREFIX = 'external:'
const SKIP_DIRS = new Set(['.git', 'node_modules', '__pycache__', '.venv', 'venv', '.idea', '.vscode'])
const DOC_EXTENSIONS = ['.md', '.txt']

function readRootsConfig(): { name: string; path: string }[] {
  if (!fs.existsSync(ROOTS_CONFIG_FILE)) return []
  return JSON.parse(fs.readFileSync(ROOTS_CONFIG_FILE, 'utf-8'))
}

function writeRootsConfig(roots: { name: string; path: string }[]) {
  fs.writeFileSync(ROOTS_CONFIG_FILE, JSON.stringify(roots, null, 2))
}

// The vault's own code/ folder (reproducible-research scaffold: configs, src,
// notebooks) is always browsable as a root — no registration needed, since it's
// part of the project itself rather than a personal machine path. Docs dropped
// anywhere inside it (READMEs next to a training script, notes in configs/, etc.)
// get picked up automatically. Unlike user-added roots, this one can't be removed.
function getBuiltinRoots(): { name: string; path: string; builtin: true }[] {
  const codeDir = path.join(VAULT_DIR, 'code')
  return fs.existsSync(codeDir) ? [{ name: 'code', path: codeDir, builtin: true }] : []
}

export function listExternalRoots(): { name: string; path: string; builtin?: boolean }[] {
  return [...getBuiltinRoots(), ...readRootsConfig()]
}

export function addExternalRoot(name: string, rootPath: string): { name: string; path: string } {
  const resolved = path.resolve(rootPath)
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error('Đường dẫn không tồn tại hoặc không phải thư mục')
  }
  const roots = readRootsConfig()
  if (getBuiltinRoots().some((r) => r.name === name) || roots.some((r) => r.name === name)) {
    throw new Error('Tên root này đã tồn tại')
  }
  roots.push({ name, path: resolved })
  writeRootsConfig(roots)
  return { name, path: resolved }
}

export function removeExternalRoot(name: string) {
  if (getBuiltinRoots().some((r) => r.name === name)) {
    throw new Error('Không thể bỏ đăng ký thư mục mặc định này')
  }
  writeRootsConfig(readRootsConfig().filter((r) => r.name !== name))
}

function isExternalPath(p: string): boolean {
  return p.startsWith(EXTERNAL_PREFIX)
}

function resolveExternalPath(encoded: string): string {
  const withoutPrefix = encoded.slice(EXTERNAL_PREFIX.length)
  const slashIdx = withoutPrefix.indexOf('/')
  const rootName = slashIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, slashIdx)
  const relPath = slashIdx === -1 ? '' : withoutPrefix.slice(slashIdx + 1)

  const root = listExternalRoots().find((r) => r.name === rootName)
  if (!root) throw new Error(`Không tìm thấy external root: ${rootName}`)

  const resolved = path.resolve(root.path, relPath)
  if (resolved !== root.path && !resolved.startsWith(root.path + path.sep)) {
    throw new Error('Path escapes external root')
  }
  return resolved
}

export function listExternalFiles(): { path: string; folder: string; title: string }[] {
  const roots = listExternalRoots()
  const results: { path: string; folder: string; title: string }[] = []

  for (const root of roots) {
    if (!fs.existsSync(root.path)) continue
    const walk = (sub: string) => {
      for (const entry of fs.readdirSync(path.join(root.path, sub), { withFileTypes: true })) {
        if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue
        const rel = path.posix.join(sub, entry.name)
        if (entry.isDirectory()) {
          walk(rel)
        } else if (DOC_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
          results.push({ path: `${EXTERNAL_PREFIX}${root.name}/${rel}`, folder: `external:${root.name}`, title: rel })
        }
      }
    }
    walk('.')
  }

  return results
}

export function listAllFiles(): { path: string; folder: string; title: string }[] {
  const folders = ['notes', 'tasks', 'experiments', 'references', 'milestones']
  const files: { path: string; folder: string; title: string }[] = []

  for (const folder of folders) {
    const dir = path.join(VAULT_DIR, folder)
    if (!fs.existsSync(dir)) continue
    const walk = (sub: string) => {
      for (const entry of fs.readdirSync(path.join(dir, sub), { withFileTypes: true })) {
        const rel = path.posix.join(sub, entry.name)
        if (entry.isDirectory()) {
          walk(rel)
        } else if (entry.name.endsWith('.md')) {
          const raw = fs.readFileSync(path.join(dir, rel), 'utf-8')
          const { data } = matter(raw)
          files.push({ path: `${folder}/${rel}`, folder, title: (data.title as string) ?? entry.name })
        }
      }
    }
    walk('.')
  }

  if (fs.existsSync(path.join(VAULT_DIR, 'current-direction.md'))) {
    files.push({ path: 'current-direction.md', folder: 'root', title: 'Current Direction' })
  }

  return files
}

export function buildIdIndex(): { id: string; path: string; title: string }[] {
  const folders = ['notes', 'tasks', 'experiments', 'references', 'milestones', 'sessions']
  const items: { id: string; path: string; title: string }[] = []

  for (const folder of folders) {
    const dir = path.join(VAULT_DIR, folder)
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.md')) continue
      const { data } = matter(fs.readFileSync(path.join(dir, f), 'utf-8'))
      const id = f.slice(0, -3)
      const title = (data.title as string) ?? (data.goal as string) ?? id
      items.push({ id, path: `${folder}/${f}`, title })
    }
  }

  if (fs.existsSync(path.join(VAULT_DIR, 'current-direction.md'))) {
    items.push({ id: 'current-direction', path: 'current-direction.md', title: 'Current Direction' })
  }

  return items
}

export function getBacklinks(targetId: string): { path: string; title: string }[] {
  const index = buildIdIndex()
  const escaped = targetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const linkPattern = new RegExp(`\\[\\[${escaped}\\]\\]`)
  const results: { path: string; title: string }[] = []

  for (const item of index) {
    if (item.id === targetId) continue
    const raw = fs.readFileSync(resolveVaultPath(item.path), 'utf-8')
    const { data, content } = matter(raw)

    let matched = linkPattern.test(content)
    if (!matched) {
      const scalarFields = [data.linked_experiment, data.parent_experiment, data.merged_into]
      const arrayFields = [data.linked_tasks, data.linked_experiments, data.relevant_to]
      matched =
        scalarFields.includes(targetId) || arrayFields.some((arr) => Array.isArray(arr) && arr.includes(targetId))
    }
    if (matched) results.push({ path: item.path, title: item.title })
  }

  return results
}

export function readRawFile(relPath: string): string {
  const fullPath = isExternalPath(relPath) ? resolveExternalPath(relPath) : resolveVaultPath(relPath)
  return fs.readFileSync(fullPath, 'utf-8')
}

export function writeRawFile(relPath: string, content: string) {
  const fullPath = isExternalPath(relPath) ? resolveExternalPath(relPath) : resolveVaultPath(relPath)
  fs.writeFileSync(fullPath, content)
}

export function readTasks() {
  return readDir<import('../src/types').Task>('tasks')
}

export function readExperiments() {
  return readDir<import('../src/types').Experiment>('experiments')
}

export function readReferences() {
  return readDir<import('../src/types').Reference>('references')
}

export function readMilestones() {
  return readDir<import('../src/types').Milestone>('milestones')
}

export function readNotes() {
  return readDir<import('../src/types').Note>('notes')
}

export function readSessions() {
  return readDir<import('../src/types').Session>('sessions')
}

export function readCurrentDirection() {
  const file = path.join(VAULT_DIR, 'current-direction.md')
  if (!fs.existsSync(file)) return { updated: '', body: '' }
  const { data, content } = matter(fs.readFileSync(file, 'utf-8'))
  const clean = dateToPlainString(data)
  return { updated: (clean.updated as string) ?? '', body: content.trim() }
}

const ITEM_CONFIG: Record<import('../src/types').ItemKind, { folder: string; prefix: string }> = {
  note: { folder: 'notes', prefix: 'note' },
  task: { folder: 'tasks', prefix: 'task' },
  experiment: { folder: 'experiments', prefix: 'exp' },
  reference: { folder: 'references', prefix: 'ref' },
  milestone: { folder: 'milestones', prefix: 'milestone' },
}

function nextNumberedId(folder: string, prefix: string): string {
  const dir = path.join(VAULT_DIR, folder)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const re = new RegExp(`^${prefix}-(\\d+)\\.md$`)
  const nums = fs
    .readdirSync(dir)
    .map((f) => f.match(re))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => parseInt(m[1], 10))
  return `${prefix}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`
}

export function createItem(kind: import('../src/types').ItemKind, title: string): { path: string; id: string } {
  const { folder, prefix } = ITEM_CONFIG[kind]
  const id = nextNumberedId(folder, prefix)
  const today = new Date().toISOString().slice(0, 10)
  const escapedTitle = title.replace(/"/g, '\\"')

  const templates: Record<typeof kind, string> = {
    note: `---\nid: ${id}\ntitle: "${escapedTitle}"\ntags: []\ncreated: ${today}\nupdated: ${today}\n---\n\n`,
    task: `---\nid: ${id}\ntitle: "${escapedTitle}"\nstatus: todo\npriority: medium\ncreated: ${today}\nupdated: ${today}\n---\n\n`,
    experiment: `---\nid: ${id}\ntitle: "${escapedTitle}"\nparent_experiment: null\nbranch_type: main\nstatus: running\nmerged_into: null\ncode_commit: null\nconfig_file: null\ncolab_url: null\nnext_action: null\ncreated: ${today}\nupdated: ${today}\n---\n\n## Hypothesis\n\n\n## Kết quả\n\n\n## Ghi chú\n\n`,
    reference: `---\nid: ${id}\ntitle: "${escapedTitle}"\ncitation_key: ${id}\nurl: ""\ntags: []\nrelevant_to: []\nstatus: to-read\ncreated: ${today}\n---\n\n`,
    milestone: `---\nid: ${id}\ntitle: "${escapedTitle}"\ntarget_date: null\nstatus: planned\nlinked_tasks: []\nlinked_experiments: []\ncreated: ${today}\n---\n\n`,
  }

  fs.writeFileSync(path.join(VAULT_DIR, folder, `${id}.md`), templates[kind])
  return { path: `${folder}/${id}.md`, id }
}

// A vault is "fresh" (not yet onboarded) if none of the content folders have
// anything in them yet — more robust than string-matching the placeholder text
// in current-direction.md, which different onboarding paths might phrase differently.
export function isVaultFresh(): boolean {
  return (
    readTasks().length === 0 &&
    readExperiments().length === 0 &&
    readNotes().length === 0 &&
    readMilestones().length === 0
  )
}

export function applyOnboarding(input: {
  projectName: string
  hypothesis: string
  milestoneTitle?: string
  taskTitle?: string
}): { milestone?: { path: string; id: string }; task?: { path: string; id: string } } {
  const today = new Date().toISOString().slice(0, 10)

  fs.writeFileSync(
    path.join(VAULT_DIR, 'current-direction.md'),
    `---\nupdated: ${today}\n---\n\n# ${input.projectName}\n\n## Current hypothesis\n\n${input.hypothesis}\n\n## Changelog (pivot log)\n\n- **${today}**: Khởi tạo research hub cho "${input.projectName}".\n`,
  )

  const result: { milestone?: { path: string; id: string }; task?: { path: string; id: string } } = {}
  if (input.milestoneTitle?.trim()) {
    result.milestone = createItem('milestone', input.milestoneTitle.trim())
  }
  if (input.taskTitle?.trim()) {
    result.task = createItem('task', input.taskTitle.trim())
  }
  return result
}

export function getOrCreateTodaySession(
  goal: string,
  linkedExperiment: string | null,
): { path: string; id: string } {
  const dir = path.join(VAULT_DIR, 'sessions')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const today = new Date().toISOString().slice(0, 10)
  const id = `session-${today}`
  const file = path.join(dir, `${id}.md`)
  if (fs.existsSync(file)) return { path: `sessions/${id}.md`, id }

  const escapedGoal = goal.replace(/"/g, '\\"')
  const content = `---\nid: ${id}\ndate: ${today}\ngoal: "${escapedGoal}"\nlinked_experiment: ${linkedExperiment ?? 'null'}\nstatus: open\ncreated: ${today}\nupdated: ${today}\n---\n\n## Mục tiêu\n${goal}\n\n## Log\n\n\n## Kết quả / Quyết định\n\n`
  fs.writeFileSync(file, content)
  return { path: `sessions/${id}.md`, id }
}

export function writeSessionStatus(id: string, status: string) {
  const dir = path.join(VAULT_DIR, 'sessions')
  const file = fs.readdirSync(dir).find((f) => f.startsWith(id))
  if (!file) throw new Error(`Session ${id} not found`)
  const fullPath = path.join(dir, file)
  const raw = fs.readFileSync(fullPath, 'utf-8')
  const today = new Date().toISOString().slice(0, 10)

  const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!frontmatterMatch) throw new Error(`Session ${id} has no frontmatter`)
  let fm = frontmatterMatch[1]
  fm = /^status:.*$/m.test(fm) ? fm.replace(/^status:.*$/m, `status: ${status}`) : `${fm}\nstatus: ${status}`
  fm = /^updated:.*$/m.test(fm) ? fm.replace(/^updated:.*$/m, `updated: ${today}`) : `${fm}\nupdated: ${today}`

  const updatedRaw = raw.replace(frontmatterMatch[1], fm)
  fs.writeFileSync(fullPath, updatedRaw)
}

export function getTopNextAction(): { text: string; experimentId: string | null } | null {
  for (const e of readExperiments()) {
    if (e.status === 'running' && e.branch_type === 'main' && e.next_action) {
      return { text: e.next_action, experimentId: e.id }
    }
  }
  const topTask = readTasks()
    .filter((t) => t.status === 'todo')
    .sort((a, b) => (a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0))[0]
  if (topTask) return { text: topTask.title, experimentId: topTask.linked_experiment ?? null }
  return null
}

export function writeTaskStatus(id: string, status: string) {
  const dir = path.join(VAULT_DIR, 'tasks')
  const file = fs.readdirSync(dir).find((f) => f.startsWith(id))
  if (!file) throw new Error(`Task ${id} not found`)
  const fullPath = path.join(dir, file)
  const raw = fs.readFileSync(fullPath, 'utf-8')
  const today = new Date().toISOString().slice(0, 10)

  // Surgical line replace instead of full matter.stringify: re-serializing the whole
  // frontmatter through js-yaml turns plain date strings (e.g. "2026-07-06") into
  // Date objects, which then dump as "2026-07-06T00:00:00.000Z" and corrupt every
  // other date field in the file.
  const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!frontmatterMatch) throw new Error(`Task ${id} has no frontmatter`)
  let fm = frontmatterMatch[1]
  fm = /^status:.*$/m.test(fm) ? fm.replace(/^status:.*$/m, `status: ${status}`) : `${fm}\nstatus: ${status}`
  fm = /^updated:.*$/m.test(fm) ? fm.replace(/^updated:.*$/m, `updated: ${today}`) : `${fm}\nupdated: ${today}`

  const updatedRaw = raw.replace(frontmatterMatch[1], fm)
  fs.writeFileSync(fullPath, updatedRaw)
}
