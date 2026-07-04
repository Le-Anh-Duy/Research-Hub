import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from './api'
import type {
  Task,
  Experiment,
  Reference,
  Milestone,
  CurrentDirection,
  ResumeState,
  TaskStatus,
  VaultFile,
  Note,
  Session,
  ItemKind,
  LinkIndexEntry,
  ExternalRoot,
} from './types'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { OnboardingForm } from './components/OnboardingForm'

export default function App() {
  const [files, setFiles] = useState<VaultFile[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [references, setReferences] = useState<Reference[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [linkIndex, setLinkIndex] = useState<LinkIndexEntry[]>([])
  const [roots, setRoots] = useState<ExternalRoot[]>([])
  const [externalFiles, setExternalFiles] = useState<VaultFile[]>([])
  const [direction, setDirection] = useState<CurrentDirection | null>(null)
  const [resume, setResume] = useState<ResumeState | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [justOnboarded, setJustOnboarded] = useState(false)

  const initializedRef = useRef(false)

  const load = useCallback(async () => {
    const [f, t, e, r, m, n, s, li, ro, ef, d, res] = await Promise.all([
      api.files(),
      api.tasks(),
      api.experiments(),
      api.references(),
      api.milestones(),
      api.notes(),
      api.sessions(),
      api.linkIndex(),
      api.roots(),
      api.externalFiles(),
      api.currentDirection(),
      api.resume(),
    ])
    setFiles(f)
    setTasks(t)
    setExperiments(e)
    setReferences(r)
    setMilestones(m)
    setNotes(n)
    setSessions(s)
    setLinkIndex(li)
    setRoots(ro)
    setExternalFiles(ef)
    setDirection(d)
    setResume(res)
    setLoading(false)

    if (!initializedRef.current) {
      initializedRef.current = true
      const today = new Date().toISOString().slice(0, 10)
      const todaySession = s.find((sess) => sess.date === today)
      if (todaySession) {
        setSelected(todaySession.path)
      } else {
        const created = await api.sessionToday()
        setSessions(await api.sessions())
        setSelected(created.path)
      }
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    await api.updateTaskStatus(id, status)
    load()
  }

  const handleCreateItem = async (kind: ItemKind, title: string) => {
    const { path } = await api.createItem(kind, title)
    await load()
    setSelected(path)
  }

  const handleAddRoot = async (name: string, rootPath: string) => {
    await api.addRoot(name, rootPath)
    await load()
  }

  const handleRemoveRoot = async (name: string) => {
    await api.removeRoot(name)
    await load()
  }

  const handleOnboard = async (input: {
    projectName: string
    hypothesis: string
    milestoneTitle?: string
    taskTitle?: string
  }) => {
    await api.onboard(input)
    await load()
    setJustOnboarded(true)
  }

  const vaultFresh =
    !justOnboarded &&
    tasks.length === 0 &&
    experiments.length === 0 &&
    notes.length === 0 &&
    milestones.length === 0

  if (loading || !resume) {
    return <div className="h-screen flex items-center justify-center opacity-60">Đang tải vault…</div>
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-(--color-line) shrink-0">
        <h1 className="font-serif text-lg">Research Hub</h1>
        {direction && (
          <p className="text-xs opacity-60 truncate max-w-xl hidden md:block">
            {direction.body.split('\n').find((l) => l.trim() && !l.startsWith('#')) ?? ''}
          </p>
        )}
      </header>
      <div className="flex flex-1 min-h-0">
        <Sidebar
          files={files}
          tasks={tasks}
          experiments={experiments}
          references={references}
          milestones={milestones}
          notes={notes}
          sessions={sessions}
          roots={roots}
          externalFiles={externalFiles}
          resume={resume}
          selected={selected}
          onSelect={setSelected}
          onStatusChange={handleStatusChange}
          onCreateItem={handleCreateItem}
          onAddRoot={handleAddRoot}
          onRemoveRoot={handleRemoveRoot}
        />
        <main className="flex-1 min-w-0">
          {vaultFresh && !onboardingDismissed ? (
            <OnboardingForm onSubmit={handleOnboard} onSkip={() => setOnboardingDismissed(true)} />
          ) : (
            <Editor path={selected} linkIndex={linkIndex} onNavigate={setSelected} />
          )}
        </main>
      </div>
    </div>
  )
}
