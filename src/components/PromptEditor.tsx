import { forwardRef, useImperativeHandle, useRef } from "react"

interface Props {
  value: string
  ghost: string
  onChange: (v: string, caret: number) => void
  onCaret: (caret: number) => void
  onAccept: () => void
  onDismiss: () => void
  onCycle: (dir: 1 | -1) => void
}

export interface PromptEditorHandle {
  focusEnd: () => void
}

const SHARED =
  "px-6 pt-6 pb-5 text-[17px] leading-[30px] font-sans whitespace-pre-wrap [overflow-wrap:anywhere] tracking-[-0.005em]"

// A textarea layered over a mirror div. The mirror reproduces the text in
// transparent ink and appends the ghost suggestion in grey, so the ghost
// appears exactly where the caret is.
export const PromptEditor = forwardRef<PromptEditorHandle, Props>(
  function PromptEditor(
    { value, ghost, onChange, onCaret, onAccept, onDismiss, onCycle },
    ref,
  ) {
    const ta = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => ({
      focusEnd: () => {
        const el = ta.current
        if (!el) return
        el.focus()
        requestAnimationFrame(() => {
          el.setSelectionRange(el.value.length, el.value.length)
          onCaret(el.value.length)
        })
      },
    }))

    return (
      <div className="relative">
        <div
          aria-hidden
          className={`${SHARED} min-h-[90px] text-transparent select-none`}
        >
          {value}
          {ghost && <span className="text-stone-400">{ghost}</span>}
          {"\u200b"}
        </div>
        <textarea
          ref={ta}
          value={value}
          aria-label="Describe the app you want to build"
          aria-describedby="ghost-status editor-keys"
          placeholder="Describe the app you want to build… e.g. “Create a student assignment tracker”"
          spellCheck
          onChange={(e) => onChange(e.target.value, e.target.selectionStart)}
          onSelect={(e) => onCaret(e.currentTarget.selectionStart)}
          onKeyDown={(e) => {
            if (!ghost) return
            if (e.key === "Tab" && !e.shiftKey) {
              e.preventDefault()
              onAccept()
            } else if (e.key === "Escape") {
              e.preventDefault()
              onDismiss()
            } else if (
              e.altKey &&
              (e.code === "BracketRight" || e.code === "BracketLeft")
            ) {
              e.preventDefault()
              onCycle(e.code === "BracketRight" ? 1 : -1)
            }
          }}
          className={`${SHARED} absolute inset-0 h-full w-full resize-none overflow-hidden bg-transparent text-stone-900 caret-[var(--accent)] placeholder:text-stone-400 focus:outline-none`}
        />
      </div>
    )
  },
)
