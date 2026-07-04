import { useState, type FormEvent } from 'react'

export function OnboardingForm({
  onSubmit,
  onSkip,
}: {
  onSubmit: (input: {
    projectName: string
    hypothesis: string
    milestoneTitle?: string
    taskTitle?: string
  }) => Promise<void>
  onSkip: () => void
}) {
  const [projectName, setProjectName] = useState('')
  const [hypothesis, setHypothesis] = useState('')
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = !!projectName.trim() && !!hypothesis.trim() && !submitting

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        projectName: projectName.trim(),
        hypothesis: hypothesis.trim(),
        milestoneTitle: milestoneTitle.trim() || undefined,
        taskTitle: taskTitle.trim() || undefined,
      })
      setSubmitting(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-8 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white border border-(--color-line) rounded-lg p-6 space-y-4">
        <div>
          <h2 className="font-serif text-xl">Chào mừng đến Research Hub</h2>
          <p className="text-sm opacity-60 mt-1">
            Vài câu hỏi nhanh để khởi tạo vault — sửa lại bất cứ lúc nào sau này cũng được.
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-mono uppercase tracking-wide opacity-60">Tên project *</span>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mt-1 w-full border border-(--color-line) rounded-md px-3 py-2 text-sm focus:outline-none focus:border-(--color-accent)"
            placeholder="vd: Phân loại văn bản tiếng Việt"
          />
        </label>

        <label className="block">
          <span className="text-xs font-mono uppercase tracking-wide opacity-60">
            Hướng nghiên cứu / giả thuyết ban đầu *
          </span>
          <textarea
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            rows={3}
            className="mt-1 w-full border border-(--color-line) rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-(--color-accent)"
            placeholder="Đang theo đuổi hướng nào, và vì sao"
          />
        </label>

        <label className="block">
          <span className="text-xs font-mono uppercase tracking-wide opacity-60">Mốc đầu tiên (tuỳ chọn)</span>
          <input
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            className="mt-1 w-full border border-(--color-line) rounded-md px-3 py-2 text-sm focus:outline-none focus:border-(--color-accent)"
          />
        </label>

        <label className="block">
          <span className="text-xs font-mono uppercase tracking-wide opacity-60">Việc đầu tiên cần làm (tuỳ chọn)</span>
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="mt-1 w-full border border-(--color-line) rounded-md px-3 py-2 text-sm focus:outline-none focus:border-(--color-accent)"
          />
        </label>

        {error && <p className="text-sm text-(--color-accent)">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={onSkip} className="text-xs opacity-50 hover:opacity-100 hover:underline">
            Bỏ qua, tự thiết lập
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="text-sm px-4 py-2 rounded-md bg-(--color-accent) text-white disabled:opacity-30"
          >
            {submitting ? 'Đang khởi tạo…' : 'Bắt đầu'}
          </button>
        </div>
      </form>
    </div>
  )
}
