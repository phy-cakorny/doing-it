import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  BookOpenText,
  Check,
  ChevronDown,
  Copy,
  Eye,
  FlaskConical,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react"
import {
  CATEGORIES,
  CATEGORY_ORDER,
  buildRefinedPrompt,
  computeSuggestions,
  currentSentence,
  type Category,
  type Suggestion,
} from "./engine"
import {
  PromptEditor,
  type PromptEditorHandle,
} from "./components/PromptEditor"
import { SuggestionCard } from "./components/SuggestionCard"
import { CategoryTag, CATEGORY_COLOR } from "./components/CategoryTag"
import {
  DesignChoiceGallery,
  type LayoutChoice,
} from "./components/DesignChoiceGallery"
import {
  FollowupDecisionGallery,
  type FollowupChoice,
  type FollowupDecisionKind,
} from "./components/FollowupDecisionGallery"
import { VisualDirectionSection } from "./components/VisualDirectionSection"

interface Detail {
  key: string
  sugId: string
  category: Category
  text: string
  label?: string
}

const STARTERS = [
  "Create a student assignment tracker",
  "A personal budget app to log expenses",
  "A booking page for a small yoga studio",
  "An inventory dashboard for a neighborhood bakery",
]

const STORAGE = "prompt-refiner:v1"

function load() {
  try {
    const raw = localStorage.getItem(STORAGE)
    if (raw)
      return JSON.parse(raw) as {
        text: string
        details: Detail[]
        dismissed: string[]
        inline: string[]
      }
  } catch {
    /* ignore */
  }
  return null
}

export default function App() {
  const saved = useMemo(load, [])
  const [text, setText] = useState(saved?.text ?? "")
  const [caret, setCaret] = useState(saved?.text.length ?? 0)
  const [settled, setSettled] = useState(text)
  const [details, setDetails] = useState<Detail[]>(saved?.details ?? [])
  const [dismissed, setDismissed] = useState<string[]>(saved?.dismissed ?? [])
  const [inlineAccepted, setInlineAccepted] = useState<string[]>(
    saved?.inline ?? [],
  )
  const [ghostIdx, setGhostIdx] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelFilter, setPanelFilter] = useState<Category | "all">("all")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(
    null,
  )
  const [choiceSkipped, setChoiceSkipped] = useState(false)
  const [colorSkipped, setColorSkipped] = useState(false)
  const [usabilitySkipped, setUsabilitySkipped] = useState(false)
  const [moreRecommendationsOpen, setMoreRecommendationsOpen] = useState(false)
  const editor = useRef<PromptEditorHandle>(null)
  const guidanceRef = useRef<HTMLDivElement>(null)

  // "Settle" typing: suggestions update shortly after the user pauses.
  useEffect(() => {
    if (settled === text) return
    const t = setTimeout(() => setSettled(text), 450)
    return () => clearTimeout(t)
  }, [text, settled])

  useEffect(() => {
    localStorage.setItem(
      STORAGE,
      JSON.stringify({ text, details, dismissed, inline: inlineAccepted }),
    )
  }, [text, details, dismissed, inlineAccepted])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const typing = settled !== text
  const wordCount = (settled.match(/\S+/g) ?? []).length
  const ready = wordCount >= 3
  const caretForSettled = Math.min(caret, settled.length)
  const { sentence, finished } = currentSentence(settled, caretForSettled)

  const exclude = useMemo(
    () =>
      new Set([
        ...dismissed,
        ...inlineAccepted,
        ...details.map((d) => d.sugId),
      ]),
    [dismissed, inlineAccepted, details],
  )

  const { domain, list } = useMemo(
    () => computeSuggestions({ prompt: settled, sentence, exclude }),
    [settled, sentence, exclude],
  )

  // Inline autocomplete only helps finish wording already in progress. Larger
  // product decisions live in the explicit choice gallery below the editor.
  const caretAtEnd = caret === text.length
  const ghostCandidates = useMemo(() => {
    if (!ready || finished) return []
    return list
      .filter((s) => {
        if (!s.sentenceMatch || !s.clause || s.category === "structure")
          return false
        if (s.id === "i-success")
          return /\b(save|saved|submit|submitted|add|added)\b/i.test(sentence)
        if (s.id === "i-undo")
          return /\b(delete|remove|archive|trash)\b/i.test(sentence)
        if (s.id === "i-complete")
          return /\b(done|complete|completed|check|mark)\b/i.test(sentence)
        return true
      })
      .slice(0, 5)
  }, [list, finished, ready])

  useEffect(() => setGhostIdx(0), [settled])

  const ghostSug: Suggestion | undefined =
    !typing && caretAtEnd && ghostCandidates.length
      ? ghostCandidates[ghostIdx % ghostCandidates.length]
      : undefined

  const ghostText = useMemo(() => {
    if (!ghostSug) return ""
    const endsWithSpace = /\s$/.test(text)
    if (!finished && ghostSug.clause) {
      return endsWithSpace
        ? ghostSug.clause.replace(/^[,\s]+/, "")
        : ghostSug.clause
    }
    return (endsWithSpace || text.length === 0 ? "" : " ") + ghostSug.text
  }, [ghostSug, text, finished])

  const refined = buildRefinedPrompt(text, details)

  function acceptGhost() {
    if (!ghostSug) return
    let base = text
    let insert = ghostText
    if (!finished && ghostSug.clause && !/\s$/.test(text))
      base = text.replace(/\s+$/, "")
    if (!finished && ghostSug.clause) insert = ghostText + "."
    const next = base + insert + " "
    setText(next)
    setSettled(next)
    setCaret(next.length)
    setInlineAccepted((a) => [...a, ghostSug.id])
    editor.current?.focusEnd()
  }

  function dismiss(id: string) {
    setDismissed((d) => [...d, id])
    setToast({
      msg: "Suggestion dismissed",
      undo: () => setDismissed((d) => d.filter((x) => x !== id)),
    })
  }

  function addDetail(s: Suggestion, textValue: string, label?: string) {
    const key = `${s.id}-${Date.now()}`
    setDetails((d) => [
      ...d,
      { key, sugId: s.id, category: s.category, text: textValue, label },
    ])
    setToast({
      msg: "Added to design details",
      undo: () => setDetails((d) => d.filter((x) => x.key !== key)),
    })
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(refined)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = refined
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function startWith(s: string) {
    const next = s + ". "
    setText(next)
    setSettled(next)
    setCaret(next.length)
    editor.current?.focusEnd()
  }

  function resetAll() {
    setText("")
    setSettled("")
    setCaret(0)
    setDetails([])
    setDismissed([])
    setInlineAccepted([])
    setChoiceSkipped(false)
    setColorSkipped(false)
    setUsabilitySkipped(false)
    setMoreRecommendationsOpen(false)
    editor.current?.focusEnd()
  }

  const layoutDetail = details.find((detail) =>
    detail.sugId.startsWith("layout-"),
  )
  const colorDetail = details.find((detail) =>
    detail.sugId.startsWith("color-"),
  )
  const usabilityDetail = details.find((detail) =>
    detail.sugId.startsWith("usability-"),
  )
  const visualDirectionDetail = details.find(
    (detail) => detail.sugId === "visual-direction",
  )
  const layoutResolved = !!layoutDetail || choiceSkipped
  const colorResolved =
    !!colorDetail || colorSkipped || !!visualDirectionDetail
  const usabilityResolved = !!usabilityDetail || usabilitySkipped
  const guidanceList = visualDirectionDetail
    ? list.filter((suggestion) =>
        !["v-color", "v-style", "v-type"].includes(suggestion.id),
      )
    : list

  function addLayoutChoice(choice: LayoutChoice, promptText: string) {
    const suggestion: Suggestion = {
      id: choice.id,
      category: "structure",
      principle: "Layout",
      text: promptText,
      why: "",
      score: 0,
      sentenceMatch: false,
    }
    addDetail(suggestion, promptText, `Layout: ${choice.title}`)
    setChoiceSkipped(false)
  }

  function addFollowupChoice(
    kind: FollowupDecisionKind,
    choice: FollowupChoice,
    promptText: string,
  ) {
    const suggestion: Suggestion = {
      id: choice.id,
      category: kind === "color" ? "visual" : "usability",
      principle: kind === "color" ? "Color" : "User control",
      text: promptText,
      why: "",
      score: 0,
      sentenceMatch: false,
    }
    const label = `${kind === "color" ? "Color" : "Usability"}: ${choice.title}`
    addDetail(suggestion, promptText, label)
    if (kind === "color") setColorSkipped(false)
    else setUsabilitySkipped(false)
  }

  function addVisualDirection(textValue: string) {
    if (visualDirectionDetail) {
      setDetails((current) =>
        current.map((detail) =>
          detail.key === visualDirectionDetail.key
            ? { ...detail, text: textValue }
            : detail,
        ),
      )
      setToast({ msg: "Visual direction updated" })
      return
    }
    const suggestion: Suggestion = {
      id: "visual-direction",
      category: "visual",
      principle: "User-provided direction",
      text: textValue,
      why: "",
      score: 0,
      sentenceMatch: false,
    }
    addDetail(suggestion, textValue, "Visual direction: Custom")
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[var(--bg)]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-lg bg-stone-900 text-white">
              <Sparkles className="size-4" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              Do It
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {(text || details.length > 0) && (
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-stone-600 hover:bg-stone-200/60 hover:text-stone-900"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Start over</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const opening = !panelOpen
                setPanelOpen(opening)
                if (opening) {
                  requestAnimationFrame(() =>
                    guidanceRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    }),
                  )
                }
              }}
              aria-expanded={panelOpen}
              aria-controls="guidance-panel"
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-[13px] font-medium text-stone-800 hover:border-stone-400"
            >
              <BookOpenText className="size-4" />
              Design guidance
              {ready && (
                <span className="rounded-full bg-stone-100 px-1.5 text-[11px] tabular-nums text-stone-600">
                  {guidanceList.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        <main className="min-w-0 flex-1 px-4 pt-10 pb-24 sm:px-6 sm:pt-14">
          <div className="mx-auto max-w-[760px]">
            <div className="mb-8">
              <h1 className="text-[32px] leading-[1.15] font-semibold tracking-[-0.025em] text-stone-900 sm:text-[38px]">
                Turn a rough idea into a
                <br className="hidden sm:block" /> design-aware prompt.
              </h1>
              <p className="mt-3 max-w-[560px] text-[15.5px] leading-7 text-stone-600">
                Write what you want to build. As you type, you’ll get
                suggestions for layout, visual design, states, usability, and
                accessibility. Nothing is added unless you accept it.
                Suggestions are rule-based examples, not live AI.
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-2.5 py-0.5 text-[12px] font-medium text-amber-800 sm:hidden">
                <FlaskConical className="size-3.5" />
                Example suggestions · no live AI
              </p>
            </div>

            {/* Editor card */}
            <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.12)] focus-within:border-stone-300 focus-within:shadow-[0_1px_2px_rgba(28,25,23,0.04),0_12px_32px_-12px_rgba(28,25,23,0.18)]">
              <PromptEditor
                ref={editor}
                value={text}
                ghost={ghostText}
                onChange={(v, c) => {
                  setText(v)
                  setCaret(c)
                }}
                onCaret={setCaret}
                onAccept={acceptGhost}
                onDismiss={() =>
                  ghostSug && setDismissed((d) => [...d, ghostSug.id])
                }
                onCycle={(dir) =>
                  setGhostIdx(
                    (i) =>
                      (i + dir + ghostCandidates.length) %
                      Math.max(ghostCandidates.length, 1),
                  )
                }
              />

              {/* Ghost explanation strip */}
              <div
                id="ghost-status"
                aria-live="polite"
                className={`grid transition-[grid-template-rows] duration-200 ${
                  ghostSug ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  {ghostSug && (
                    <div className="mx-6 mb-3 flex flex-col gap-1 rounded-lg bg-stone-50 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                      <CategoryTag
                        category={ghostSug.category}
                        principle={ghostSug.principle}
                      />
                      <p className="min-w-0 flex-1 text-[13px] leading-5 text-stone-600">
                        <span className="sr-only">
                          Suggestion: {ghostText}.{" "}
                        </span>
                        {ghostSug.why}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-3 sm:px-5">
                <div
                  id="editor-keys"
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-stone-500"
                >
                  {ghostSug ? (
                    <>
                      <span>
                        <Kbd>Tab</Kbd> accept
                      </span>
                      <span>
                        <Kbd>Esc</Kbd> dismiss
                      </span>
                      {ghostCandidates.length > 1 && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            setGhostIdx((i) => (i + 1) % ghostCandidates.length)
                          }
                          className="hover:text-stone-800"
                        >
                          <Kbd>Alt</Kbd>
                          <Kbd>]</Kbd> next (
                          {(ghostIdx % ghostCandidates.length) + 1}/
                          {ghostCandidates.length})
                        </button>
                      )}
                    </>
                  ) : typing && ready ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                      Reading your prompt…
                    </span>
                  ) : !ready ? (
                    <span>Write a few words to get suggestions.</span>
                  ) : (
                    <span>
                      Inline autocomplete appears when it can finish the wording
                      you’re typing.
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen((o) => !o)}
                    disabled={!text.trim()}
                    aria-expanded={previewOpen}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <Eye className="size-4" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={copy}
                    disabled={!text.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40 disabled:hover:bg-[var(--accent)]"
                  >
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    {copied ? "Copied" : "Copy refined prompt"}
                  </button>
                </div>
              </div>
            </section>

            {/* Accepted choices stay visibly attached to the editor. */}
            {details.length > 0 && (
              <div
                className="mt-3 flex flex-wrap items-center gap-2"
                aria-label="Added prompt details"
              >
                <span className="mr-1 text-[12px] font-medium text-stone-500">
                  Added to prompt
                </span>
                {details.map((detail) => (
                  <span
                    key={detail.key}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-1 pr-1.5 pl-3 text-[12.5px] font-medium text-[var(--accent-ink)]"
                    title={detail.text}
                  >
                    <span className="truncate">
                      {detail.label ??
                        `${CATEGORIES[detail.category].label}: ${detail.text}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const removed = detail
                        setDetails((all) =>
                          all.filter((item) => item.key !== removed.key),
                        )
                        setToast({
                          msg: "Prompt detail removed",
                          undo: () => setDetails((all) => [...all, removed]),
                        })
                      }}
                      className="grid size-5 shrink-0 place-items-center rounded-full text-indigo-400 hover:bg-indigo-100 hover:text-indigo-800"
                      aria-label={`Remove ${detail.label ?? detail.text}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* The first consequential choice is visible without opening another panel. */}
            {ready && !layoutDetail && !choiceSkipped && (
              <DesignChoiceGallery
                key={domain.label}
                entity={domain.ctx.e}
                plural={domain.ctx.es}
                group={domain.ctx.g}
                domainLabel={domain.label}
                onAdd={addLayoutChoice}
                onSkip={() => {
                  setChoiceSkipped(true)
                  setToast({
                    msg: "Layout choice skipped",
                    undo: () => setChoiceSkipped(false),
                  })
                }}
                priorityLabel="Recommended first"
              />
            )}
            {ready && layoutResolved && !usabilityResolved && (
              <FollowupDecisionGallery
                kind="usability"
                onAdd={(choice, promptText) =>
                  addFollowupChoice("usability", choice, promptText)
                }
                onSkip={() => {
                  setUsabilitySkipped(true)
                  setToast({
                    msg: "Usability choice skipped",
                    undo: () => setUsabilitySkipped(false),
                  })
                }}
              />
            )}
            {ready &&
              layoutResolved &&
              usabilityResolved &&
              !colorResolved && (
                <FollowupDecisionGallery
                  kind="color"
                  onAdd={(choice, promptText) =>
                    addFollowupChoice("color", choice, promptText)
                  }
                  onSkip={() => {
                    setColorSkipped(true)
                    setToast({
                      msg: "Color choice skipped",
                      undo: () => setColorSkipped(false),
                    })
                  }}
                />
              )}

            {ready && (
              <DesignReadinessSummary details={details} prompt={text} />
            )}

            {ready &&
              (!layoutResolved || !usabilityResolved || !colorResolved) && (
                <RecommendationPreviewQueue
                  open={moreRecommendationsOpen}
                  onToggle={() =>
                    setMoreRecommendationsOpen((current) => !current)
                  }
                  layoutResolved={layoutResolved}
                  usabilityResolved={usabilityResolved}
                  colorResolved={colorResolved}
                />
              )}

            {ready &&
              layoutResolved &&
              usabilityResolved &&
              colorResolved && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-[12.5px] font-medium text-stone-700">
                      Core decisions complete
                    </p>
                    <p className="text-[11.5px] text-stone-500">
                      Layout, color, and usability have been considered.
                    </p>
                  </div>
                  {(choiceSkipped || colorSkipped || usabilitySkipped) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (choiceSkipped) setChoiceSkipped(false)
                        else if (usabilitySkipped) setUsabilitySkipped(false)
                        else setColorSkipped(false)
                      }}
                      className="text-[12.5px] font-medium text-[var(--accent-ink)] hover:underline"
                    >
                      Revisit skipped choice
                    </button>
                  )}
                </div>
              )}

            {ready && (
              <VisualDirectionSection
                acceptedText={visualDirectionDetail?.text}
                onAdd={addVisualDirection}
              />
            )}

            {/* Starters */}
            {!text.trim() && (
              <div className="mt-5">
                <p className="mb-2.5 text-[12.5px] font-medium text-stone-500">
                  Or start from an example
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => startWith(s)}
                      className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-[13.5px] text-stone-700 hover:border-stone-300 hover:text-stone-900"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            {previewOpen && text.trim() && (
              <section className="mt-5 rounded-2xl border border-stone-200 bg-stone-900 text-stone-100">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <h2 className="text-[13px] font-medium text-stone-300">
                    Refined prompt preview
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(false)}
                    className="rounded-md p-1 text-stone-400 hover:bg-white/10 hover:text-white"
                    aria-label="Close preview"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <pre className="max-h-[420px] overflow-auto px-5 py-4 font-mono text-[13px] leading-6 whitespace-pre-wrap">
                  {refined}
                </pre>
              </section>
            )}

            <div ref={guidanceRef} className="scroll-mt-20">
              <GuidanceSection
                open={panelOpen}
                onToggle={() => setPanelOpen((open) => !open)}
                ready={ready}
                list={guidanceList}
                filter={panelFilter}
                setFilter={setPanelFilter}
                dismissedCount={dismissed.length}
                onRestore={() => setDismissed([])}
                onAdd={addDetail}
                onDismiss={dismiss}
              />
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-stone-900 py-2.5 pr-2.5 pl-4 text-[13.5px] text-white shadow-lg"
        >
          {toast.msg}
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo?.()
                setToast(null)
              }}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-[13px] font-medium hover:bg-white/20"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="mr-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-stone-300 bg-stone-50 px-1 font-mono text-[10.5px] text-stone-600">
      {children}
    </kbd>
  )
}

function RecommendationPreviewQueue({
  open,
  onToggle,
  layoutResolved,
  usabilityResolved,
  colorResolved,
}: {
  open: boolean
  onToggle: () => void
  layoutResolved: boolean
  usabilityResolved: boolean
  colorResolved: boolean
}) {
  const upcoming: { label: string; title: string; why: string }[] = []
  if (!layoutResolved && !usabilityResolved) {
    upcoming.push({
      label: "Consider next",
      title: "Protect users from accidental actions",
      why: "A recovery choice matters more than visual polish because it prevents lost work.",
    })
  }
  if (!colorResolved && (!layoutResolved || !usabilityResolved)) {
    upcoming.push({
      label: "Optional polish",
      title: "Choose a visual identity",
      why: "A deliberate palette makes the app feel specific instead of relying on a generic default.",
    })
  }

  if (!upcoming.length) return null

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-[var(--accent-ink)] hover:bg-indigo-50"
        aria-expanded={open}
      >
        See {upcoming.length} more recommendation
        {upcoming.length > 1 ? "s" : ""}
        <ChevronDown
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {upcoming.slice(0, 2).map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  item.label === "Consider next"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {item.label}
              </span>
              <p className="mt-2 text-[13px] font-semibold text-stone-800">
                {item.title}
              </p>
              <p className="mt-1 text-[11.5px] leading-5 text-stone-500">
                {item.why}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DesignReadinessSummary({
  details,
  prompt,
}: {
  details: Detail[]
  prompt: string
}) {
  const checks = [
    {
      label: "Layout",
      done: details.some(
        (detail) =>
          detail.category === "structure" ||
          detail.sugId.startsWith("layout-"),
      ) || /\b(layout|sidebar|navigation|grid|dashboard|group(ed)? by)\b/i.test(prompt),
    },
    {
      label: "Usability",
      done:
        details.some((detail) => detail.category === "usability") ||
        /\b(undo|confirmation|prevent mistakes|easy to use)\b/i.test(prompt),
    },
    {
      label: "Visual identity",
      done: details.some(
        (detail) =>
          detail.category === "visual" ||
          detail.sugId.startsWith("color-") ||
          detail.sugId === "visual-direction",
      ) || /\b(colou?r|theme|typography|font|visual style|look and feel)\b/i.test(prompt),
    },
    {
      label: "Interaction states",
      done:
        details.some((detail) => detail.category === "interaction") ||
        /\b(loading|empty state|hover|success|error state)\b/i.test(prompt),
    },
    {
      label: "Accessibility",
      done:
        details.some((detail) => detail.category === "accessibility") ||
        /\b(accessib|contrast|keyboard|screen reader|focus state)\b/i.test(prompt),
    },
  ]
  const complete = checks.filter((item) => item.done)
  const remaining = checks.filter((item) => !item.done)

  return (
    <section className="mt-4 rounded-xl border border-stone-200 bg-white px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[12.5px] font-semibold text-stone-800">
              Design readiness
            </p>
            <span className="text-[11px] tabular-nums text-stone-400">
              {complete.length} of {checks.length}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] leading-5 text-stone-500">
            {remaining.length
              ? `Still unspecified: ${remaining.map((item) => item.label).join(", ")}.`
              : "The important design categories are covered."}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {checks.map((item) => (
          <span
            key={item.label}
            className={`h-1.5 flex-1 rounded-full ${
              item.done ? "bg-emerald-500" : "bg-stone-200"
            }`}
          />
        ))}
      </div>
    </section>
  )
}

function GuidanceSection(props: {
  open: boolean
  onToggle: () => void
  ready: boolean
  list: Suggestion[]
  filter: Category | "all"
  setFilter: (c: Category | "all") => void
  dismissedCount: number
  onRestore: () => void
  onAdd: (s: Suggestion, t: string) => void
  onDismiss: (id: string) => void
}) {
  const {
    open,
    onToggle,
    ready,
    list,
    filter,
    setFilter,
    dismissedCount,
    onRestore,
    onAdd,
    onDismiss,
  } = props

  const cats = filter === "all" ? CATEGORY_ORDER : [filter]

  return (
    <section
      id="guidance-panel"
      aria-label="Design guidance"
      className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_30px_-22px_rgba(28,25,23,0.28)]"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-stone-50 sm:px-6"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-600">
            <BookOpenText className="size-4" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-stone-900">More design guidance</h2>
            <p className="mt-1 text-[12.5px] leading-5 text-stone-500">
              Browse {ready ? list.length : "layout, visual, interaction, usability, and accessibility"} suggestions with visual previews.
              {ready && " Ranked by relevance and likely impact for this app."}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-2 text-[12px] font-medium text-stone-500">
          {open ? "Collapse" : "Expand"}
          <ChevronDown
            className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-stone-200 bg-[var(--panel)]/55 px-4 pt-4 pb-6 sm:px-5">
            <div
              className="flex gap-1 overflow-x-auto pb-4"
              role="tablist"
              aria-label="Filter by topic"
            >
              {(["all", ...CATEGORY_ORDER] as const).map((c) => {
                const count =
                  c === "all"
                    ? list.length
                    : list.filter((s) => s.category === c).length
                const active = filter === c
                return (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(c)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      active
                        ? "bg-stone-900 text-white"
                        : "text-stone-600 hover:bg-stone-200/70"
                    }`}
                  >
                    {c !== "all" && (
                      <span
                        className={`size-1.5 rounded-full ${CATEGORY_COLOR[c]}`}
                        aria-hidden
                      />
                    )}
                    {c === "all" ? "All" : CATEGORIES[c].label}
                    {ready && (
                      <span
                        className={active ? "text-white/60" : "text-stone-400"}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {!ready ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {CATEGORY_ORDER.map((c) => (
                  <div
                    key={c}
                    className="rounded-xl border border-stone-200 bg-white p-4"
                  >
                    <CategoryTag category={c} />
                    <p className="mt-1.5 text-[13px] leading-5 text-stone-500">
                      {CATEGORIES[c].blurb}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {cats.map((c) => {
                  const items = list.filter((s) => s.category === c)
                  if (!items.length && filter === "all") return null
                  return (
                    <section key={c}>
                      <div className="mb-3">
                        <h3 className="text-[13px] font-semibold text-stone-800">
                          {CATEGORIES[c].label}
                        </h3>
                        <p className="mt-0.5 text-[12.5px] leading-5 text-stone-500">
                          {CATEGORIES[c].blurb}
                        </p>
                      </div>
                      {items.length ? (
                        <div className="grid items-start gap-3 sm:grid-cols-2">
                          {items.map((s) => (
                            <SuggestionCard
                              key={s.id}
                              s={s}
                              priority={
                                list.indexOf(s) === 0
                                  ? "Recommended first"
                                  : list.indexOf(s) < 3
                                    ? "Consider next"
                                    : "Optional polish"
                              }
                              onAdd={(t) => onAdd(s, t)}
                              onDismiss={() => onDismiss(s.id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-5 text-center text-[12.5px] text-stone-500">
                          All suggestions in this topic are added or dismissed.
                        </p>
                      )}
                    </section>
                  )
                })}
                {dismissedCount > 0 && (
                  <button
                    type="button"
                    onClick={onRestore}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-stone-600 hover:text-stone-900"
                  >
                    <RotateCcw className="size-3.5" />
                    Restore {dismissedCount} dismissed suggestion
                    {dismissedCount > 1 ? "s" : ""}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
