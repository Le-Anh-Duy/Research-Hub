import { useState, type ReactNode } from 'react'
import type {
  Task,
  Experiment,
  Reference,
  Milestone,
  Note,
  Session,
  ResumeState,
  VaultFile,
  TaskStatus,
  ItemKind,
  ExternalRoot,
} from '../types'

const FOLDER_LABEL: Record<string, string> = {
  tasks: 'Tasks',
  experiments: 'Experiments',
  references: 'References',
  milestones: 'Milestones',
  root: 'Direction',
}

const STALE_DAYS = 7

function daysAgo(iso: string) {
  if (!iso) return Infinity
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function timeAgo(iso: string) {
  if (!iso) return ''
  const days = daysAgo(iso)
  if (days <= 0) return 'hôm nay'
  if (days === 1) return 'hôm qua'
  return `${days} ngày trước`
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="border-b border-(--color-line)">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 px-3 py-2 font-mono text-[11px] uppercase tracking-wide opacity-60 hover:opacity-100"
      >
        <span className="w-3 inline-block">{open ? '▾' : '▸'}</span>
        {title}
      </button>
      {open && <div className="px-3 pb-3 space-y-1">{children}</div>}
    </div>
  )
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'in-progress',
  'in-progress': 'done',
  blocked: 'todo',
  done: 'todo',
}

const STATUS_DOT: Record<TaskStatus, string> = {
  todo: 'bg-(--color-line)',
  'in-progress': 'bg-(--color-warn)',
  blocked: 'bg-(--color-accent)',
  done: 'bg-(--color-good)',
}

const ITEM_TYPES: { kind: ItemKind; label: string; icon: string }[] = [
  { kind: 'note', label: 'Note', icon: '📝' },
  { kind: 'task', label: 'Task', icon: '☑' },
  { kind: 'experiment', label: 'Experiment', icon: '🧪' },
  { kind: 'reference', label: 'Reference', icon: '📚' },
  { kind: 'milestone', label: 'Milestone', icon: '🎯' },
]

function NewItemMenu({ onCreate }: { onCreate: (kind: ItemKind, title: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-mono px-2 py-1.5 rounded border border-(--color-line) hover:bg-(--color-paper) w-full text-left"
      >
        + Mới {open ? '▾' : '▸'}
      </button>
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-(--color-line) rounded-md shadow-md overflow-hidden">
          {ITEM_TYPES.map((t) => (
            <button
              key={t.kind}
              onClick={() => {
                setOpen(false)
                const title = window.prompt(`Tên ${t.label} mới:`)
                if (title && title.trim()) onCreate(t.kind, title.trim())
              }}
              className="flex items-center gap-2 w-full text-left text-sm px-2.5 py-1.5 hover:bg-(--color-paper)"
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ExternalSection({
  roots,
  externalFiles,
  selected,
  onSelect,
  onAddRoot,
  onRemoveRoot,
}: {
  roots: ExternalRoot[]
  externalFiles: VaultFile[]
  selected: string | null
  onSelect: (path: string) => void
  onAddRoot: (name: string, path: string) => Promise<void>
  onRemoveRoot: (name: string) => Promise<void>
}) {
  const grouped: Record<string, VaultFile[]> = {}
  for (const f of externalFiles) {
    grouped[f.folder] ??= []
    grouped[f.folder].push(f)
  }

  const handleAdd = async () => {
    const name = window.prompt('Tên gợi nhớ cho thư mục (vd: ml-project):')
    if (!name || !name.trim()) return
    const rootPath = window.prompt('Đường dẫn tuyệt đối tới thư mục:')
    if (!rootPath || !rootPath.trim()) return
    try {
      await onAddRoot(name.trim(), rootPath.trim())
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không thêm được thư mục này')
    }
  }

  const handleRemove = async (name: string) => {
    try {
      await onRemoveRoot(name)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không bỏ đăng ký được')
    }
  }

  return (
    <Section title="External">
      <button
        onClick={handleAdd}
        className="text-xs font-mono px-2 py-1 mb-2 rounded border border-(--color-line) hover:bg-(--color-paper) w-full text-left"
      >
        + Thêm thư mục ngoài
      </button>
      {roots.map((root) => (
        <div key={root.name} className="mb-2">
          <div className="flex items-center justify-between px-1 mb-0.5">
            <span className="text-[10px] uppercase tracking-wide opacity-40 truncate" title={root.path}>
              {root.name}
              {root.builtin && <span className="ml-1 opacity-60">(mặc định)</span>}
            </span>
            {!root.builtin && (
              <button
                onClick={() => handleRemove(root.name)}
                className="text-[10px] opacity-40 hover:opacity-100 hover:text-(--color-accent)"
                title="Bỏ đăng ký thư mục này"
              >
                ✕
              </button>
            )}
          </div>
          {(grouped[`external:${root.name}`] ?? []).map((f) => (
            <button
              key={f.path}
              onClick={() => onSelect(f.path)}
              className={`block w-full text-left text-sm px-2 py-1 rounded truncate ${
                selected === f.path ? 'bg-(--color-accent-soft) text-(--color-accent)' : 'hover:bg-(--color-line)/30'
              }`}
              title={f.title}
            >
              {f.title}
            </button>
          ))}
        </div>
      ))}
    </Section>
  )
}

export function Sidebar({
  files,
  tasks,
  experiments,
  references,
  milestones,
  notes,
  sessions,
  roots,
  externalFiles,
  resume,
  selected,
  onSelect,
  onStatusChange,
  onCreateItem,
  onAddRoot,
  onRemoveRoot,
}: {
  files: VaultFile[]
  tasks: Task[]
  experiments: Experiment[]
  references: Reference[]
  milestones: Milestone[]
  notes: Note[]
  sessions: Session[]
  roots: ExternalRoot[]
  externalFiles: VaultFile[]
  resume: ResumeState
  selected: string | null
  onSelect: (path: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onCreateItem: (kind: ItemKind, title: string) => void
  onAddRoot: (name: string, path: string) => Promise<void>
  onRemoveRoot: (name: string) => void
}) {
  const grouped: Record<string, VaultFile[]> = {}
  for (const f of files) {
    if (f.folder === 'notes') continue
    grouped[f.folder] ??= []
    grouped[f.folder].push(f)
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if ((a.status === 'done') === (b.status === 'done')) return 0
    return a.status === 'done' ? 1 : -1
  })

  const sortedSessions = [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1))
  const today = new Date().toISOString().slice(0, 10)

  // Notes linked to a currently-running experiment are "live" — they're feeding
  // the active thread of research, not just archived brainstorm.
  const activeExpIds = new Set(experiments.filter((e) => e.status === 'running').map((e) => e.id))
  const sortedNotes = [...notes].sort((a, b) => {
    const aActive = a.linked_experiment && activeExpIds.has(a.linked_experiment)
    const bActive = b.linked_experiment && activeExpIds.has(b.linked_experiment)
    if (aActive !== bActive) return aActive ? -1 : 1
    return daysAgo(a.updated ?? a.created) - daysAgo(b.updated ?? b.created)
  })

  return (
    <aside className="w-72 shrink-0 border-r border-(--color-line) overflow-y-auto bg-white">
      <div className="p-2 border-b border-(--color-line)">
        <NewItemMenu onCreate={onCreateItem} />
      </div>

      <Section title="Sessions" defaultOpen>
        {sortedSessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.path)}
            className={`flex items-center gap-1.5 w-full text-left text-sm px-2 py-1 rounded truncate ${
              selected === s.path ? 'bg-(--color-accent-soft) text-(--color-accent)' : 'hover:bg-(--color-line)/30'
            } ${s.status === 'closed' ? 'opacity-50' : ''}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                s.status === 'closed' ? 'bg-(--color-good)' : 'bg-(--color-warn)'
              }`}
            />
            <span className="truncate">
              {s.date} {s.date === today && <span className="opacity-60">(hôm nay)</span>}
            </span>
          </button>
        ))}
      </Section>

      <Section title="Notes" defaultOpen>
        {sortedNotes.map((n) => {
          const active = !!(n.linked_experiment && activeExpIds.has(n.linked_experiment))
          const stale = !active && daysAgo(n.updated ?? n.created) > STALE_DAYS
          return (
            <button
              key={n.path}
              onClick={() => onSelect(n.path)}
              className={`flex items-center gap-1.5 w-full text-left text-sm px-2 py-1 rounded truncate ${
                selected === n.path ? 'bg-(--color-accent-soft) text-(--color-accent)' : 'hover:bg-(--color-line)/30'
              } ${stale ? 'opacity-40' : ''}`}
            >
              {active && <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent) shrink-0" title="Đang nuôi hướng active" />}
              <span className="truncate">{n.title}</span>
            </button>
          )
        })}
      </Section>

      <Section title="Resume" defaultOpen>
        <div className="text-xs space-y-1.5">
          {resume.lastCommit ? (
            <p>
              <span className="opacity-70">{resume.lastCommit.message}</span>
              <br />
              <span className="opacity-40">{timeAgo(resume.lastCommit.date)}</span>
            </p>
          ) : (
            <p className="opacity-40">Chưa có commit nào.</p>
          )}
          {resume.nextActions[0] && <p className="opacity-70">→ {resume.nextActions[0].text}</p>}
          {(resume.pendingTasks.length > 0 || resume.staleExperiments.length > 0) && (
            <p className="text-(--color-warn)">
              {resume.pendingTasks.length + resume.staleExperiments.length} việc đang chờ
            </p>
          )}
        </div>
      </Section>

      <Section title="Tasks" defaultOpen>
        {sortedTasks.map((t) => (
          <div key={t.id} className="flex items-center gap-1.5 text-sm">
            <button
              onClick={() => onStatusChange(t.id, NEXT_STATUS[t.status])}
              className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[t.status]}`}
              title={t.status}
            />
            <button
              onClick={() => onSelect(t.path)}
              className={`text-left truncate hover:underline ${t.status === 'done' ? 'opacity-40 line-through' : ''}`}
            >
              {t.title}
            </button>
          </div>
        ))}
      </Section>

      <Section title="Experiments">
        {experiments.map((e) => (
          <button
            key={e.id}
            onClick={() => onSelect(e.path)}
            className="block w-full text-left text-sm truncate hover:underline"
          >
            {e.status === 'running' ? '● ' : e.status === 'success' || e.status === 'merged' ? '✓ ' : e.status === 'failed' ? '✕ ' : '⊘ '}
            {e.title}
          </button>
        ))}
      </Section>

      <Section title="References">
        {references.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r.path)}
            className="block w-full text-left text-sm truncate hover:underline"
          >
            {r.status === 'to-read' ? '○ ' : '● '}
            {r.title}
          </button>
        ))}
      </Section>

      <Section title="Milestones">
        {milestones.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.path)}
            className="block w-full text-left text-sm truncate hover:underline"
          >
            {m.title}
          </button>
        ))}
      </Section>

      <ExternalSection
        roots={roots}
        externalFiles={externalFiles}
        selected={selected}
        onSelect={onSelect}
        onAddRoot={onAddRoot}
        onRemoveRoot={onRemoveRoot}
      />

      <Section title="Files (raw)">
        {Object.entries(grouped).map(([folder, items]) => (
          <div key={folder} className="mb-2">
            <div className="text-[10px] uppercase tracking-wide opacity-40 mb-0.5 px-1">
              {FOLDER_LABEL[folder] ?? folder}
            </div>
            {items.map((f) => (
              <button
                key={f.path}
                onClick={() => onSelect(f.path)}
                className={`block w-full text-left text-sm px-2 py-1 rounded truncate ${
                  selected === f.path ? 'bg-(--color-accent-soft) text-(--color-accent)' : 'hover:bg-(--color-line)/30'
                }`}
              >
                {f.title}
              </button>
            ))}
          </div>
        ))}
      </Section>
    </aside>
  )
}
