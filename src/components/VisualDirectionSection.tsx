import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  ChevronDown,
  FileImage,
  ImagePlus,
  Paperclip,
  RefreshCw,
  Trash2,
} from "lucide-react"

type AssetRole = "use" | "inspiration"

interface AssetReference {
  id: string
  file: File
  url: string
  role: AssetRole
  description: string
}

interface Props {
  acceptedText?: string
  onAdd: (text: string) => void
}

const STYLES = [
  {
    id: "editorial",
    name: "Editorial",
    advantage: "Strong storytelling and clear reading hierarchy.",
    instruction:
      "Use editorial typography with a confident serif for major headings, a readable sans-serif for interface text, generous whitespace, and a restrained neutral palette.",
  },
  {
    id: "product",
    name: "Modern product",
    advantage: "Feels focused, efficient, and familiar to app users.",
    instruction:
      "Use clean sans-serif typography, structured 8px spacing, neutral surfaces, and one high-contrast accent color for primary actions.",
  },
  {
    id: "playful",
    name: "Warm & playful",
    advantage: "Feels approachable without losing clarity.",
    instruction:
      "Use rounded sans-serif typography, warm accessible colors, generous shapes, friendly imagery, and clear visual emphasis on the primary action.",
  },
] as const

export function VisualDirectionSection({ acceptedText, onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [lookAndFeel, setLookAndFeel] = useState("")
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [assets, setAssets] = useState<AssetReference[]>([])
  const [draft, setDraft] = useState("")
  const [draftEdited, setDraftEdited] = useState(false)
  const [dragging, setDragging] = useState(false)
  const assetUrls = useRef<string[]>([])

  useEffect(
    () => () => {
      assetUrls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  const proposed = useMemo(
    () => buildVisualInstruction(lookAndFeel, selectedStyle, assets),
    [lookAndFeel, selectedStyle, assets],
  )

  useEffect(() => {
    if (!draftEdited) setDraft(proposed)
  }, [proposed, draftEdited])

  function addFiles(files: FileList | null) {
    if (!files) return
    const next = [...files].map((file) => {
      const url = URL.createObjectURL(file)
      assetUrls.current.push(url)
      return {
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        url,
        role: "inspiration" as const,
        description: "",
      }
    })
    setAssets((current) => [...current, ...next])
    setDraftEdited(false)
  }

  function updateAsset(id: string, patch: Partial<AssetReference>) {
    setAssets((current) =>
      current.map((asset) => (asset.id === id ? { ...asset, ...patch } : asset)),
    )
    setDraftEdited(false)
  }

  function removeAsset(id: string) {
    setAssets((current) => {
      const asset = current.find((item) => item.id === id)
      if (asset) URL.revokeObjectURL(asset.url)
      return current.filter((item) => item.id !== id)
    })
    setDraftEdited(false)
  }

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-stone-50 sm:px-6"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
            <FileImage className="size-4" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-stone-900">
                Visual direction & assets
              </h2>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                Optional
              </span>
              {acceptedText && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <Check className="size-3" />
                  Added
                </span>
              )}
            </div>
            <p className="mt-1 text-[12.5px] leading-5 text-stone-500">
              Share your own aesthetic direction, logo, screenshots, moodboards, or brand references.
            </p>
          </div>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-stone-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-7 border-t border-stone-200 px-5 py-5 sm:px-6">
            <div>
              <div>
                <h3 className="text-[13px] font-semibold text-stone-800">
                  Visual references
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-stone-500">
                  Upload logos, screenshots, moodboards, brand assets, or inspiration.
                </p>
              </div>

              <label
                className={`mt-3 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-5 text-center transition-all ${
                  dragging
                    ? "border-violet-600 bg-violet-100 shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    : "border-violet-300 bg-violet-50/70 hover:border-violet-500 hover:bg-violet-50"
                }`}
                onDragEnter={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={(event) => {
                  if (event.currentTarget.contains(event.relatedTarget as Node))
                    return
                  setDragging(false)
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragging(false)
                  addFiles(event.dataTransfer.files)
                }}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-violet-700 text-white shadow-sm">
                  <ImagePlus className="size-5" />
                </span>
                <span className="mt-3 text-[14px] font-semibold text-violet-900">
                  Upload visual references
                </span>
                <span className="mt-1 text-[11.5px] text-violet-700">
                  Choose files or drag and drop · Images and PDFs
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(event) => {
                    addFiles(event.target.files)
                    event.target.value = ""
                  }}
                />
              </label>

              {assets.length > 0 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50"
                    >
                      <div className="flex gap-3 p-3">
                        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-stone-200 bg-white">
                          {asset.file.type.startsWith("image/") ? (
                            <img
                              src={asset.url}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <Paperclip className="size-5 text-stone-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium text-stone-800">
                            {asset.file.name}
                          </p>
                          <div className="mt-2 flex gap-1">
                            {(
                              [
                                ["use", "Use in my app"],
                                ["inspiration", "Style inspiration"],
                              ] as const
                            ).map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => updateAsset(asset.id, { role: value })}
                                className={`rounded-full px-2 py-1 text-[9.5px] font-medium ${
                                  asset.role === value
                                    ? "bg-stone-900 text-white"
                                    : "bg-white text-stone-500 hover:text-stone-800"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAsset(asset.id)}
                          className="rounded-md p-1.5 text-stone-400 hover:bg-white hover:text-rose-600"
                          aria-label={`Remove ${asset.file.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <div className="border-t border-stone-200 p-2.5">
                        <label
                          htmlFor={`asset-${asset.id}`}
                          className="sr-only"
                        >
                          Description for {asset.file.name}
                        </label>
                        <input
                          id={`asset-${asset.id}`}
                          value={asset.description}
                          onChange={(event) =>
                            updateAsset(asset.id, {
                              description: event.target.value,
                            })
                          }
                          placeholder="Optional description (we won’t analyze the image)"
                          className="w-full rounded-md border border-stone-200 bg-white px-2.5 py-2 text-[11.5px] text-stone-800 placeholder:text-stone-400 focus:border-[var(--accent)] focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {assets.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11.5px] leading-5 text-amber-800">
                  Copied text can include filenames and your descriptions, but it cannot transfer image files. You’ll also need to attach the originals in your AI coding tool.
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="look-and-feel"
                className="text-[13px] font-semibold text-stone-800"
              >
                What should your app look and feel like?
              </label>
              <p className="mt-1 text-[12px] leading-5 text-stone-500">
                Use your own words. The prototype preserves them instead of guessing what you mean.
              </p>
              <textarea
                id="look-and-feel"
                rows={3}
                value={lookAndFeel}
                onChange={(event) => {
                  setLookAndFeel(event.target.value)
                  setDraftEdited(false)
                }}
                placeholder="For example: calm and editorial, like an independent magazine, but still practical for daily use."
                className="mt-2 w-full resize-y rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-3 text-[14px] leading-6 text-stone-900 placeholder:text-stone-400 focus:border-[var(--accent)] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[13px] font-semibold text-stone-800">
                  Or start with a visual style
                </h3>
                <span className="text-[11px] text-stone-400">Choose at most one</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      setSelectedStyle((current) =>
                        current === style.id ? null : style.id,
                      )
                      setDraftEdited(false)
                    }}
                    aria-pressed={selectedStyle === style.id}
                    className={`rounded-xl border p-2 text-left transition-all ${
                      selectedStyle === style.id
                        ? "border-[var(--accent)] bg-indigo-50/50 shadow-[0_0_0_1px_var(--accent)]"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <StylePreview id={style.id} />
                    <div className="px-1 pt-2.5 pb-1">
                      <p className="text-[12.5px] font-semibold text-stone-900">
                        {style.name}
                      </p>
                      <p className="mt-1 text-[11px] leading-4 text-stone-500">
                        {style.advantage}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {(proposed || draft || acceptedText) && (
              <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="visual-instruction"
                    className="text-[11px] font-semibold tracking-[0.06em] text-violet-800 uppercase"
                  >
                    Proposed visual instruction
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftEdited(false)
                      setDraft(proposed)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 hover:underline"
                  >
                    <RefreshCw className="size-3" />
                    Refresh from my choices
                  </button>
                </div>
                <textarea
                  id="visual-instruction"
                  rows={6}
                  value={draft || acceptedText || ""}
                  onChange={(event) => {
                    setDraft(event.target.value)
                    setDraftEdited(true)
                  }}
                  className="mt-2 w-full resize-y rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-[13px] leading-5 text-stone-900 focus:border-violet-500 focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-violet-700">
                    Editable and optional. Your direction takes priority over generic visual suggestions.
                  </p>
                  <button
                    type="button"
                    disabled={!(draft || acceptedText || "").trim()}
                    onClick={() => onAdd((draft || acceptedText || "").trim())}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-violet-800 disabled:opacity-40"
                  >
                    <Check className="size-3.5" />
                    {acceptedText ? "Update prompt instruction" : "Add to prompt"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function buildVisualInstruction(
  lookAndFeel: string,
  selectedStyle: string | null,
  assets: AssetReference[],
) {
  const parts: string[] = []
  const style = STYLES.find((item) => item.id === selectedStyle)
  if (style) parts.push(style.instruction)
  if (lookAndFeel.trim()) {
    parts.push(
      `Honor this user-provided look-and-feel direction: “${lookAndFeel.trim()}”`,
    )
  }
  if (assets.length) {
    const references = assets
      .map((asset) => {
        const role =
          asset.role === "use" ? "Use in the app" : "Style inspiration"
        const description = asset.description.trim()
          ? ` — ${asset.description.trim()}`
          : " — no description provided"
        return `${role}: ${asset.file.name}${description}`
      })
      .join("; ")
    parts.push(
      `User-provided visual references: ${references}. Prioritize these references over generic visual defaults. The original files must also be attached to the AI coding tool.`,
    )
  }
  return parts.join(" ")
}

function StylePreview({ id }: { id: string }) {
  if (id === "editorial") {
    return (
      <div className="h-24 rounded-lg bg-[#f5f0e8] px-3 py-2.5 text-[#29231f]">
        <p className="text-[5px] font-semibold tracking-[0.18em] text-[#796b5d] uppercase">
          The daily brief
        </p>
        <p className="mt-1.5 max-w-28 font-serif text-[15px] leading-[15px]">
          A clearer way to plan your week
        </p>
        <div className="mt-2 h-px bg-[#9e8f7d]" />
        <p className="mt-1.5 max-w-32 font-serif text-[6px] leading-[9px] text-[#655a50]">
          Strong headlines lead into calm, readable supporting detail.
        </p>
      </div>
    )
  }
  if (id === "playful") {
    return (
      <div className="h-24 rounded-lg bg-[#fff5df] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-[#55382c]">Hello there!</p>
          <span className="size-5 rounded-full bg-[#f28c6f]" />
        </div>
        <div className="mt-3 rounded-xl bg-white p-2 shadow-sm">
          <div className="h-1.5 w-16 rounded-full bg-[#7c6dd8]" />
          <div className="mt-1.5 h-1 w-10 rounded-full bg-[#ead9b9]" />
        </div>
      </div>
    )
  }
  return (
    <div className="h-24 rounded-lg bg-[#f7f8fa] p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-slate-900">Overview</p>
        <span className="rounded bg-indigo-600 px-1.5 py-1 text-[5px] font-semibold text-white">
          Add item
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="h-10 rounded border border-slate-200 bg-white" />
        <div className="h-10 rounded border border-slate-200 bg-white" />
      </div>
    </div>
  )
}
