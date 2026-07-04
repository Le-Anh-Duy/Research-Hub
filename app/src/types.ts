export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done'
export type Priority = 'high' | 'medium' | 'low'
export type BranchType = 'main' | 'exploratory' | 'spike'
export type ExperimentStatus = 'running' | 'success' | 'failed' | 'abandoned' | 'merged'
export type ReferenceStatus = 'to-read' | 'skimmed' | 'digested'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: Priority
  due?: string
  linked_experiment?: string
  created: string
  updated?: string
  body: string
  path: string
}

export interface Experiment {
  id: string
  title: string
  parent_experiment: string | null
  branch_type: BranchType
  status: ExperimentStatus
  merged_into: string | null
  code_commit: string | null
  config_file: string | null
  colab_url: string | null
  next_action: string | null
  created: string
  updated: string
  body: string
  path: string
}

export interface Reference {
  id: string
  title: string
  citation_key: string
  url: string
  tags: string[]
  relevant_to: string[]
  status: ReferenceStatus
  created: string
  body: string
  path: string
}

export interface Milestone {
  id: string
  title: string
  target_date: string
  status: 'planned' | 'active' | 'done'
  linked_tasks: string[]
  linked_experiments: string[]
  created: string
  body: string
  path: string
}

export interface CurrentDirection {
  updated: string
  body: string
}

export interface Note {
  id: string
  title: string
  tags: string[]
  linked_experiment?: string | null
  created: string
  updated?: string
  body: string
  path: string
}

export interface Session {
  id: string
  date: string
  goal: string
  linked_experiment: string | null
  status: 'open' | 'closed'
  created: string
  updated: string
  body: string
  path: string
}

export type ItemKind = 'note' | 'task' | 'experiment' | 'reference' | 'milestone'

export interface VaultFile {
  path: string
  folder: string
  title: string
}

export interface LinkIndexEntry {
  id: string
  path: string
  title: string
}

export interface Backlink {
  path: string
  title: string
}

export interface ExternalRoot {
  name: string
  path: string
  builtin?: boolean
}

export interface ResumeState {
  lastCommit: { message: string; date: string } | null
  lastEditedItem: { type: string; id: string; title: string; updated: string } | null
  pendingTasks: Task[]
  staleExperiments: Experiment[]
  nextActions: { source: string; text: string }[]
}
