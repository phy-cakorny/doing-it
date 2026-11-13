import { useRef, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react"

export type FollowupDecisionKind = "color" | "usability"

interface ColorPalette {
  background: string
  surface: string
  text: string
  accent: string
}

export interface FollowupChoice {
  id: string
  title: string
  caption: string
  promptText: string
  palette?: ColorPalette
}

interface Props {
  kind: FollowupDecisionKind
  onAdd: (choice: FollowupChoice, text: string) => void
  onSkip: () => void
}

const COLOR_CHOICES: FollowupChoice[] = [
  {
    id: "color-indigo",
    title: "Calm indigo",
    caption: "Focused and dependable, with a cool accent.",
    promptText:
      "Use a calm indigo color scheme with warm white backgrounds, dark neutral text, and indigo reserved for primary actions.",
    palette: {
      background: "#F8F7F4",
      surface: "#FFFFFF",
      text: "#25243A",
      accent: "#4F46E5",
    },
  },
  {
    id: "color-warm",
    title: "Warm terracotta",
    caption: "Friendly and welcoming, with softer contrast.",
    promptText:
      "Use a warm terracotta color scheme with cream backgrounds, deep brown text, and terracotta reserved for primary actions.",
    palette: {
      background: "#FFF8ED",
      surface: "#FFFDF8",
      text: "#432C24",
      accent: "#C45F3C",
    },
  },
  {
    id: "color-dark",
    title: "Dark slate",
    caption: "Focused and technical, designed for low light.",
    promptText:
      "Use a dark slate color scheme with high-contrast light text and a bright cyan accent for primary actions and focus states.",
    palette: {
      background: "#111827",
      surface: "#1F2937",
      text: "#F8FAFC",
      accent: "#22D3EE",
    },
  },
]

const USABILITY_CHOICES: FollowupChoice[] = [
  {
    id: "usability-undo",
    title: "Include undo",
    caption: "Let people recover immediately from accidental deletes.",
    promptText:
      "After destructive actions, show a brief confirmation with an Undo option so users can recover from mistakes.",
  },
  {
    id: "usability-basic",
    title: "No undo",
    caption: "Keep the interaction basic without a recovery step.",
    promptText:
      "Keep destructive actions simple without an undo interaction; clearly label permanent actions before they happen.",
  },
]

function palettePrompt(title: string, palette: ColorPalette) {
  return `Use a ${title.toLowerCase()} color scheme with ${palette.background} for page backgrounds, ${palette.surface} for surfaces, ${palette.text} for text, and ${palette.accent} for primary actions, links, and focus states.`
}

export function FollowupDecisionGallery({ kind, onAdd, onSkip }: Props) {
  const choices = kind === "color" ? COLOR_CHOICES : USABILITY_CHOICES
  const [mobileIndex, setMobileIndex] = useState(0)
  const [selected, setSelected] = useState<FollowupChoice | null>(null)
  const [draft, setDraft] = useState("")
  const [editing, setEditing] = useState(false)
  const [palette, setPalette] = useState<ColorPalette | null>(null)
  const touchStart = useRef<number | null>(null)

  const title =
    kind === "color"
      ? "Choose a starting palette, then make it yours"
      : "Should the app include an undo safety net?"
  const helper =
    kind === "color"
      ? "Each option includes editable background, surface, text, and accent colors."
      : "Choose whether people can recover after a destructive action."

  function choose(choice: FollowupChoice) {
    setSelected(choice)
    setPalette(choice.palette ? { ...choice.palette } : null)
    setDraft(
      choice.palette
        ? palettePrompt(choice.title, choice.palette)
        : choice.promptText,
    )
    setEditing(false)
  }

  function updatePalette(token: keyof ColorPalette, value: string) {
    if (!selected || !palette) return
    const next = { ...palette, [token]: value.toUpperCase() }
    setPalette(next)
    setDraft(palettePrompt(selected.title, next))
  }

  function resetPalette() {
    if (!selected?.palette) return
    const next = { ...selected.palette }
    setPalette(next)
    setDraft(palettePrompt(selected.title, next))
  }

  function move(direction: -1 | 1) {
    setMobileIndex(
      (current) => (current + direction + choices.length) % choices.length,
    )
  }

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_30px_-20px_rgba(28,25,23,0.25)]">
      <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-[var(--accent-ink)] uppercase">
              {kind === "usability" ? "Consider next" : "Optional polish"}
            </p>
            <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-stone-900">
              {title}
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-stone-500">
              {helper}
            </p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          >
            Skip
          </button>
        </div>
      </div>

      <div
        className={`hidden gap-3 p-4 sm:grid sm:p-5 ${
          choices.length === 3
            ? "grid-cols-3"
            : "mx-auto max-w-[540px] grid-cols-2"
        }`}
      >
        {choices.map((choice) => (
          <DecisionCard
            key={choice.id}
            choice={choice}
            kind={kind}
            active={selected?.id === choice.id}
            onClick={() => choose(choice)}
          />
        ))}
      </div>

      <div
        className="p-4 sm:hidden"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return
          const delta = event.changedTouches[0].clientX - touchStart.current
          if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1)
          touchStart.current = null
        }}
      >
        <DecisionCard
          choice={choices[mobileIndex]}
          kind={kind}
          active={selected?.id === choices[mobileIndex].id}
          onClick={() => choose(choices[mobileIndex])}
        />
        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => move(-1)}
            className="grid size-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 hover:border-stone-400"
            aria-label="Previous option"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-12 text-center text-[12.5px] font-medium tabular-nums text-stone-600">
            {mobileIndex + 1} of {choices.length}
          </span>
          <button
            type="button"
            onClick={() => move(1)}
            className="grid size-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 hover:border-stone-400"
            aria-label="Next option"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {selected && (
        <div className="border-t border-stone-200 bg-[var(--accent-soft)]/55 px-5 py-4 sm:px-6">
          {kind === "color" && palette && (
            <PaletteEditor
              palette={palette}
              original={selected.palette}
              onChange={updatePalette}
              onReset={resetPalette}
            />
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`${kind}-prompt-sentence`}
                className="block text-[11px] font-semibold tracking-[0.07em] text-[var(--accent-ink)] uppercase"
              >
                {kind === "color"
                  ? "Palette prompt detail:"
                  : "Would add to your prompt:"}
              </label>
              {editing ? (
                <textarea
                  id={`${kind}-prompt-sentence`}
                  autoFocus
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="mt-2 w-full resize-none rounded-lg border border-indigo-200 bg-white px-3 py-2 text-[14px] leading-6 text-stone-900 focus:border-[var(--accent)] focus:outline-none"
                />
              ) : (
                <p className="mt-1 text-[14.5px] leading-6 text-stone-900">
                  {draft}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null)
                setEditing(false)
              }}
              className="rounded-md p-1 text-stone-400 hover:bg-white/70 hover:text-stone-700"
              aria-label="Close proposed prompt addition"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={() => onAdd(selected, draft.trim())}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              <Check className="size-3.5" />
              Add
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-stone-700 hover:bg-white/70"
            >
              <Pencil className="size-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-stone-600 hover:bg-white/70"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function DecisionCard({
  choice,
  kind,
  active,
  onClick,
}: {
  choice: FollowupChoice
  kind: FollowupDecisionKind
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-w-0 rounded-xl border p-2 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
        active
          ? "border-[var(--accent)] bg-indigo-50/50 shadow-[0_0_0_1px_var(--accent)]"
          : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-sm"
      }`}
    >
      <div className="h-[176px] overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-2.5">
        {kind === "color" && choice.palette ? (
          <ColorPreview palette={choice.palette} />
        ) : (
          <UsabilityPreview includeUndo={choice.id === "usability-undo"} />
        )}
      </div>
      <div className="px-1 pt-3 pb-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13.5px] font-semibold text-stone-900">
            {choice.title}
          </h3>
          <span
            className={`grid size-4 shrink-0 place-items-center rounded-full border ${
              active
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-stone-300"
            }`}
            aria-hidden
          >
            {active && <Check className="size-2.5" />}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-[18px] text-stone-500">
          {choice.caption}
        </p>
        {choice.palette && (
          <div
            className="mt-2 flex items-center gap-1"
            aria-label={`${choice.title} palette`}
          >
            {Object.values(choice.palette).map((color, index) => (
              <span
                key={color}
                className="h-3 flex-1 rounded-[3px] border border-black/10"
                style={{ backgroundColor: color }}
                title={["Background", "Surface", "Text", "Accent"][index]}
              />
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function PaletteEditor({
  palette,
  original,
  onChange,
  onReset,
}: {
  palette: ColorPalette
  original?: ColorPalette
  onChange: (token: keyof ColorPalette, value: string) => void
  onReset: () => void
}) {
  const tokens: { key: keyof ColorPalette; label: string }[] = [
    { key: "background", label: "Background" },
    { key: "surface", label: "Surface" },
    { key: "text", label: "Text" },
    { key: "accent", label: "Accent" },
  ]
  const changed =
    !!original &&
    tokens.some(
      ({ key }) => palette[key].toLowerCase() !== original[key].toLowerCase(),
    )

  return (
    <div className="mb-4 rounded-xl border border-indigo-200/80 bg-white p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12.5px] font-semibold text-stone-800">
            Customize palette
          </p>
          <p className="mt-0.5 text-[11.5px] text-stone-500">
            Click any color to adjust it. The preview and prompt update
            together.
          </p>
        </div>
        {changed && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tokens.map(({ key, label }) => (
          <label
            key={key}
            className="group flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-2 hover:border-stone-300"
          >
            <span className="relative size-7 shrink-0 overflow-hidden rounded-md border border-black/10 shadow-sm">
              <span
                className="absolute inset-0"
                style={{ backgroundColor: palette[key] }}
              />
              <input
                type="color"
                value={palette[key]}
                onChange={(event) => onChange(key, event.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label={`Change ${label.toLowerCase()} color`}
              />
            </span>
            <span className="min-w-0">
              <span className="block text-[10.5px] font-medium text-stone-500">
                {label}
              </span>
              <span className="block truncate font-mono text-[10.5px] text-stone-800">
                {palette[key]}
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-3 h-[150px] overflow-hidden rounded-lg border border-black/10">
        <ColorPreview palette={palette} />
      </div>
    </div>
  )
}

function ColorPreview({ palette }: { palette: ColorPalette }) {
  return (
    <div
      className="h-full overflow-hidden rounded-md"
      style={{ backgroundColor: palette.background, color: palette.text }}
    >
      <div className="flex items-center justify-between border-b border-black/10 px-2.5 py-2">
        <span className="text-[9px] font-semibold">Assignments</span>
        <span
          className="rounded px-1.5 py-1 text-[6px] font-semibold text-white"
          style={{ backgroundColor: palette.accent }}
        >
          Add
        </span>
      </div>
      <div className="p-2.5">
        <p className="text-[12px] font-semibold">This week</p>
        <p className="mt-0.5 text-[7px] opacity-60">
          3 assignments need attention
        </p>
        <div className="mt-3 space-y-2">
          {[
            ["Calculus problem set", "Tomorrow"],
            ["History essay", "Friday"],
          ].map(([title, date], index) => (
            <div
              key={title}
              className="rounded-md border border-black/10 p-2"
              style={{ backgroundColor: palette.surface }}
            >
              <p className="truncate text-[8px] font-semibold">{title}</p>
              <div className="mt-1 flex items-center justify-between">
                <span
                  className="h-1.5 w-8 rounded"
                  style={{
                    backgroundColor: palette.accent,
                    opacity: index ? 0.35 : 1,
                  }}
                />
                <span className="text-[6px] opacity-60">{date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function UsabilityPreview({ includeUndo }: { includeUndo: boolean }) {
  return (
    <div className="relative h-full overflow-hidden rounded-md border border-stone-200 bg-white p-3">
      <p className="text-[10px] font-semibold text-stone-900">Assignments</p>
      <div className="mt-3 space-y-2">
        <div className="rounded-md border border-stone-100 px-2 py-2">
          <p className="text-[8px] font-medium text-stone-800">History essay</p>
          <p className="mt-1 text-[6px] text-stone-400">Due Friday</p>
        </div>
        <div className="rounded-md border border-dashed border-stone-200 px-2 py-2 text-[7px] text-stone-300 line-through">
          Calculus problem set
        </div>
      </div>
      {includeUndo ? (
        <div className="absolute right-2.5 bottom-2.5 left-2.5 flex items-center justify-between rounded-md bg-stone-900 px-2.5 py-2 text-white shadow-lg">
          <span className="text-[7px]">Assignment deleted</span>
          <span className="text-[7px] font-semibold text-indigo-300">Undo</span>
        </div>
      ) : (
        <div className="absolute right-2.5 bottom-2.5 left-2.5 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-2">
          <p className="text-[7px] font-medium text-stone-600">
            Assignment deleted
          </p>
          <p className="mt-0.5 text-[6px] text-stone-400">
            This action can’t be undone.
          </p>
        </div>
      )}
    </div>
  )
}
