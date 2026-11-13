import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Maximize2, Pencil, Plus, X } from 'lucide-react'
import { CATEGORIES, type Suggestion } from '../engine'
import { CategoryTag } from './CategoryTag'
import { SuggestionPreview } from './SuggestionPreview'

interface Props {
  s: Suggestion
  onAdd: (text: string) => void
  onDismiss: () => void
  compact?: boolean
  priority?: 'Recommended first' | 'Consider next' | 'Optional polish'
}

export function SuggestionCard({
  s,
  onAdd,
  onDismiss,
  compact,
  priority,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [draft, setDraft] = useState(s.text)
  const ref = useRef<HTMLTextAreaElement>(null)
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!editing) setDraft(s.text)
  }, [s.text, editing])

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      ref.current.setSelectionRange(draft.length, draft.length)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  useEffect(() => {
    if (!previewing) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewing(false)
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleDialogKeys)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleDialogKeys)
    }
  }, [previewing])

  return (
    <article
      className={`group relative rounded-xl border border-stone-200 bg-white transition-colors hover:border-stone-300 ${
        compact ? 'p-3.5' : 'p-4'
      }`}
      aria-label={`${CATEGORIES[s.category].label} suggestion`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          {priority && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                priority === 'Recommended first'
                  ? 'bg-indigo-100 text-indigo-700'
                  : priority === 'Consider next'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-100 text-stone-500'
              }`}
            >
              {priority}
            </span>
          )}
          <CategoryTag category={s.category} principle={s.principle} />
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="-m-1 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
          aria-label="Dismiss suggestion"
          title="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {editing ? (
        <div>
          <label className="sr-only" htmlFor={`edit-${s.id}`}>
            Edit suggestion
          </label>
          <textarea
            id={`edit-${s.id}`}
            ref={ref}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (draft.trim()) onAdd(draft.trim())
              }
              if (e.key === 'Escape') setEditing(false)
            }}
            rows={3}
            className="w-full resize-none rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-[14px] leading-6 text-stone-900 focus:border-[var(--accent)] focus:bg-white focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={() => onAdd(draft.trim())}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-2.5 py-1.5 text-[13px] font-medium text-white hover:bg-stone-800 disabled:opacity-40"
            >
              <Check className="size-3.5" />
              Add edited
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[14.5px] leading-6 text-stone-900">{s.text}</p>
          <p className="mt-1.5 text-[13px] leading-5 text-stone-500">
            <span className="font-medium text-stone-600">Why: </span>
            {s.why}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAdd(s.text)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-soft)] px-2.5 py-1.5 text-[13px] font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-soft-hover)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            >
              <Plus className="size-3.5" />
              Add
            </button>
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              aria-expanded={previewing}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            >
              <Maximize2 className="size-3.5" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            >
              <Pencil className="size-3.5" />
              Edit first
            </button>
          </div>
        </>
      )}
      {previewing &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/55 p-2 backdrop-blur-[2px] sm:p-6"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setPreviewing(false)
            }}
          >
            <section
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`preview-title-${s.id}`}
              className="flex h-full max-h-[900px] w-full max-w-[1120px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl"
            >
              <header className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-200 px-4 py-3 sm:px-6 sm:py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CategoryTag category={s.category} principle={s.principle} />
                    <span className="hidden text-[11px] text-stone-400 sm:inline">
                      Expanded preview
                    </span>
                  </div>
                  <h2
                    id={`preview-title-${s.id}`}
                    className="mt-1 truncate text-[16px] font-semibold tracking-[-0.01em] text-stone-900"
                  >
                    See this suggestion in context
                  </h2>
                </div>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setPreviewing(false)}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  aria-label="Close full-screen preview"
                >
                  <X className="size-5" />
                </button>
              </header>

              <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[310px_minmax(0,1fr)] md:overflow-hidden">
                <aside className="order-2 flex flex-col border-t border-stone-200 p-4 md:order-1 md:border-t-0 md:border-r md:p-6">
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <p className="text-[10px] font-semibold tracking-[0.08em] text-[var(--accent-ink)] uppercase">
                      Would add to your prompt
                    </p>
                    <p className="mt-2 text-[15px] leading-6 text-stone-900">
                      {s.text}
                    </p>
                    <div className="mt-5 rounded-xl bg-stone-50 p-3.5">
                      <p className="text-[11px] font-semibold text-stone-600">
                        Why it helps
                      </p>
                      <p className="mt-1 text-[13px] leading-5 text-stone-500">
                        {s.why}
                      </p>
                    </div>
                    <p className="mt-4 text-[11px] leading-4 text-stone-400">
                      This preview is an example, not an extra requirement. Nothing is added until you choose Add.
                    </p>
                  </div>
                  <div className="mt-4 flex shrink-0 flex-wrap gap-2 border-t border-stone-100 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        onAdd(s.text)
                        setPreviewing(false)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)]"
                    >
                      <Plus className="size-3.5" />
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewing(false)
                        setEditing(true)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-[13px] font-medium text-stone-700 hover:bg-stone-50"
                    >
                      <Pencil className="size-3.5" />
                      Edit first
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewing(false)
                        onDismiss()
                      }}
                      className="rounded-lg px-3 py-2 text-[13px] font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                    >
                      Skip
                    </button>
                  </div>
                </aside>
                <main className="order-1 min-h-[280px] min-w-0 bg-stone-100 p-3 sm:p-5 md:order-2 md:min-h-0">
                  <SuggestionPreview suggestion={s} expanded />
                </main>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </article>
  )
}
