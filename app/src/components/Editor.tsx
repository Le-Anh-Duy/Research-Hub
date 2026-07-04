import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { marked } from 'marked'
import { api } from '../api'
import type { LinkIndexEntry, Backlink } from '../types'

function splitFrontmatter(raw: string): { frontmatter: string | null; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { frontmatter: null, body: raw }
  return { frontmatter: match[1], body: raw.slice(match[0].length) }
}

function pathToId(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.md$/, '')
}

function escapeLinkText(text: string): string {
  return text.replace(/[[\]]/g, '\\$&')
}

function renderWikilinks(text: string, linkIndex: LinkIndexEntry[]): string {
  const byId = new Map(linkIndex.map((e) => [e.id, e]))
  return text.replace(/\[\[([a-zA-Z0-9_-]+)\]\]/g, (whole, id) => {
    const entry = byId.get(id)
    if (!entry) return whole
    return `[${escapeLinkText(entry.title)}](#wikilink:${encodeURIComponent(entry.path)})`
  })
}

export function Editor({
  path,
  linkIndex,
  onNavigate,
}: {
  path: string | null
  linkIndex: LinkIndexEntry[]
  onNavigate: (path: string) => void
}) {
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [saving, setSaving] = useState(false)
  const [backlinks, setBacklinks] = useState<Backlink[]>([])

  const [linkQuery, setLinkQuery] = useState<string | null>(null)
  const [linkQueryStart, setLinkQueryStart] = useState(0)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const loadedPathRef = useRef<string | null>(null)
  const contentRef = useRef('')
  const savedRef = useRef('')
  contentRef.current = content
  savedRef.current = savedContent

  useEffect(() => {
    if (!path) return
    let cancelled = false
    api.getFile(path).then((f) => {
      if (cancelled) return
      setContent(f.content)
      setSavedContent(f.content)
      setMode('edit')
      loadedPathRef.current = path
    })
    api.backlinks(pathToId(path)).then((b) => {
      if (!cancelled) setBacklinks(b)
    })
    return () => {
      cancelled = true
      const prevPath = loadedPathRef.current
      if (prevPath && contentRef.current !== savedRef.current) {
        api.saveFile(prevPath, contentRef.current)
      }
      loadedPathRef.current = null
    }
  }, [path])

  const dirty = content !== savedContent
  const { frontmatter, body } = useMemo(() => splitFrontmatter(content), [content])
  const previewHtml = useMemo(
    () => marked.parse(renderWikilinks(body, linkIndex)) as string,
    [body, linkIndex],
  )

  useEffect(() => {
    if (!path || content === savedContent) return
    setSaving(true)
    const t = setTimeout(async () => {
      await api.saveFile(path, content)
      setSavedContent(content)
      setSaving(false)
    }, 800)
    return () => clearTimeout(t)
  }, [content, savedContent, path])

  const suggestions = useMemo(() => {
    if (linkQuery === null) return []
    const q = linkQuery.toLowerCase()
    return linkIndex.filter((e) => e.id.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)).slice(0, 8)
  }, [linkQuery, linkIndex])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)

    const cursor = e.target.selectionStart
    const uptoCursor = value.slice(0, cursor)
    const openIdx = uptoCursor.lastIndexOf('[[')
    if (openIdx === -1) {
      setLinkQuery(null)
      return
    }
    const between = uptoCursor.slice(openIdx + 2)
    if (between.includes(']') || between.includes('\n')) {
      setLinkQuery(null)
      return
    }
    setLinkQuery(between)
    setLinkQueryStart(openIdx)
    setActiveSuggestion(0)
  }

  const insertLink = (entry: LinkIndexEntry) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const cursor = textarea.selectionStart
    const before = content.slice(0, linkQueryStart)
    const after = content.slice(cursor)
    const inserted = `[[${entry.id}]]`
    setContent(before + inserted + after)
    setLinkQuery(null)
    requestAnimationFrame(() => {
      const pos = before.length + inserted.length
      textarea.focus()
      textarea.setSelectionRange(pos, pos)
    })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (linkQuery === null || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestion((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestion((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      insertLink(suggestions[activeSuggestion])
    } else if (e.key === 'Escape') {
      setLinkQuery(null)
    }
  }

  const handlePreviewClick = (e: MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a')
    if (!anchor) return
    const href = anchor.getAttribute('href') ?? ''
    if (href.startsWith('#wikilink:')) {
      e.preventDefault()
      onNavigate(decodeURIComponent(href.slice('#wikilink:'.length)))
    }
  }

  if (!path) {
    return (
      <div className="h-full flex items-center justify-center text-sm opacity-50 p-8 text-center">
        Chọn 1 file bên trái, hoặc bấm "+ Mới" để bắt đầu viết.
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-(--color-line) shrink-0">
        <span className="font-mono text-xs opacity-60">{path}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono opacity-40">{saving ? 'Đang lưu…' : dirty ? 'Chưa lưu' : 'Đã lưu'}</span>
          <button
            onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
            className="text-xs font-mono px-2.5 py-1 rounded border border-(--color-line) hover:bg-(--color-paper)"
          >
            {mode === 'edit' ? 'Preview' : 'Edit'}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {mode === 'edit' ? (
          <div className="relative h-full">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
            />
            {linkQuery !== null && suggestions.length > 0 && (
              <div className="absolute bottom-4 left-4 w-72 bg-white border border-(--color-line) rounded-md shadow-md overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={s.path}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertLink(s)
                    }}
                    className={`block w-full text-left text-sm px-2.5 py-1.5 truncate ${
                      i === activeSuggestion ? 'bg-(--color-accent-soft) text-(--color-accent)' : 'hover:bg-(--color-paper)'
                    }`}
                  >
                    <span className="font-mono text-xs opacity-50 mr-1.5">{s.id}</span>
                    {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {frontmatter && (
              <pre className="font-mono text-xs px-4 py-3 bg-(--color-paper) border-b border-(--color-line) whitespace-pre-wrap opacity-70">
                {frontmatter}
              </pre>
            )}
            <div
              className="markdown-body p-4 text-sm"
              onClick={handlePreviewClick}
              // Content is authored by the user themselves in their own local vault, not
              // untrusted third-party input.
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </div>

      {backlinks.length > 0 && (
        <div className="border-t border-(--color-line) px-4 py-2.5 shrink-0 max-h-32 overflow-y-auto">
          <div className="font-mono text-[11px] uppercase tracking-wide opacity-50 mb-1.5">
            Backlinks ({backlinks.length})
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {backlinks.map((b) => (
              <button key={b.path} onClick={() => onNavigate(b.path)} className="text-sm hover:underline text-left">
                ← {b.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
