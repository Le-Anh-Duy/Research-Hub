import type {
  Task,
  Experiment,
  Reference,
  Milestone,
  CurrentDirection,
  ResumeState,
  VaultFile,
  Note,
  Session,
  ItemKind,
  LinkIndexEntry,
  Backlink,
  ExternalRoot,
} from './types'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  return res.json()
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error ?? `Failed to post ${url}`)
  }
  return res.json()
}

export const api = {
  tasks: () => get<Task[]>('/api/tasks'),
  experiments: () => get<Experiment[]>('/api/experiments'),
  references: () => get<Reference[]>('/api/references'),
  milestones: () => get<Milestone[]>('/api/milestones'),
  currentDirection: () => get<CurrentDirection>('/api/current-direction'),
  resume: () => get<ResumeState>('/api/resume'),
  updateTaskStatus: async (id: string, status: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  },
  files: () => get<VaultFile[]>('/api/files'),
  getFile: (path: string) => get<{ path: string; content: string }>(`/api/file?path=${encodeURIComponent(path)}`),
  saveFile: async (path: string, content: string) => {
    const res = await fetch('/api/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    })
    if (!res.ok) throw new Error('Failed to save file')
  },
  createItem: (kind: ItemKind, title: string) => post<{ path: string; id: string }>('/api/items', { kind, title }),
  linkIndex: () => get<LinkIndexEntry[]>('/api/link-index'),
  backlinks: (id: string) => get<Backlink[]>(`/api/backlinks?id=${encodeURIComponent(id)}`),
  notes: () => get<Note[]>('/api/notes'),
  sessions: () => get<Session[]>('/api/sessions'),
  sessionToday: () => post<{ path: string; id: string }>('/api/sessions/today', {}),
  updateSessionStatus: async (id: string, status: string) => {
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  },
  roots: () => get<ExternalRoot[]>('/api/roots'),
  addRoot: (name: string, path: string) => post<ExternalRoot>('/api/roots', { name, path }),
  removeRoot: async (name: string) => {
    const res = await fetch(`/api/roots/${encodeURIComponent(name)}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.error ?? 'Failed to remove root')
    }
  },
  externalFiles: () => get<VaultFile[]>('/api/external-files'),
  onboardingStatus: () => get<{ fresh: boolean }>('/api/onboarding-status'),
  onboard: (input: { projectName: string; hypothesis: string; milestoneTitle?: string; taskTitle?: string }) =>
    post<{ milestone?: { path: string; id: string }; task?: { path: string; id: string } }>('/api/onboarding', input),
}
