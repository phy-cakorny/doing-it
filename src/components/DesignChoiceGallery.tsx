import { useRef, useState } from "react"
import { Check, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react"

export interface LayoutChoice {
  id: string
  title: string
  caption: string
  promptText: string
  view: "primary" | "secondary" | "tertiary"
}

interface Props {
  entity: string
  plural: string
  group: string
  domainLabel: string
  onAdd: (choice: LayoutChoice, text: string) => void
  onSkip: () => void
  priorityLabel?: string
}

interface PreviewItem {
  name: string
  primary: string
  secondary: string
  tertiary: string
  badge: string
  meta: string
  tone: "sky" | "amber" | "emerald"
}

interface DecisionContext {
  question: string
  impact: string
  choices: LayoutChoice[]
  items: PreviewItem[]
}

function getDecisionContext(
  domainLabel: string,
  entity: string,
  plural: string,
  group: string,
): DecisionContext {
  if (domainLabel === "booking") {
    return {
      question: "How should customers find an available time?",
      impact:
        "Availability is the core of a booking flow, so this choice affects whether customers can book quickly and confidently.",
      choices: [
        {
          id: "layout-booking-day",
          title: "By day",
          caption: "Compare every available service on a chosen day.",
          promptText:
            "Show available booking slots grouped by day, with the time, service, and remaining availability visible on each slot.",
          view: "primary",
        },
        {
          id: "layout-booking-service",
          title: "By service",
          caption: "Choose a service first, then see its available times.",
          promptText:
            "Let customers choose a service first, then show the available days and times for that service.",
          view: "secondary",
        },
        {
          id: "layout-booking-next",
          title: "Next available",
          caption: "Reach the soonest open slot with the fewest steps.",
          promptText:
            "Place the next available booking slots first across all services, with filters for service and day.",
          view: "tertiary",
        },
      ],
      items: [
        {
          name: "Yoga Basics",
          primary: "Monday",
          secondary: "Yoga",
          tertiary: "Next available",
          badge: "3 spots",
          meta: "9:00 AM",
          tone: "sky",
        },
        {
          name: "Private consultation",
          primary: "Tuesday",
          secondary: "Consultation",
          tertiary: "Later today",
          badge: "1 spot",
          meta: "2:30 PM",
          tone: "amber",
        },
        {
          name: "Evening Flow",
          primary: "Wednesday",
          secondary: "Yoga",
          tertiary: "This week",
          badge: "5 spots",
          meta: "6:00 PM",
          tone: "emerald",
        },
      ],
    }
  }

  if (domainLabel === "expense") {
    return {
      question: "What should people see first when checking their spending?",
      impact:
        "People open a budget app to understand their money quickly, so the first view should answer the question they care about most.",
      choices: [
        {
          id: "layout-expense-category",
          title: "By category",
          caption: "See where money is going across spending groups.",
          promptText:
            "Group expenses by category and show each category total before the individual transactions.",
          view: "primary",
        },
        {
          id: "layout-expense-recent",
          title: "Recent activity",
          caption: "Verify the latest transactions first.",
          promptText:
            "Show the most recent expenses first, grouped by date, with amount and category easy to scan.",
          view: "secondary",
        },
        {
          id: "layout-expense-budget",
          title: "Budget health",
          caption: "Spot categories that are close to or over budget.",
          promptText:
            "Organize expenses by budget status—Within budget, Watch, and Over budget—so risks stand out immediately.",
          view: "tertiary",
        },
      ],
      items: [
        {
          name: "Groceries",
          primary: "Food",
          secondary: "Today",
          tertiary: "Watch",
          badge: "Food",
          meta: "$68.20",
          tone: "amber",
        },
        {
          name: "Train pass",
          primary: "Transport",
          secondary: "Yesterday",
          tertiary: "Within budget",
          badge: "Travel",
          meta: "$24.00",
          tone: "sky",
        },
        {
          name: "Coffee",
          primary: "Dining",
          secondary: "Monday",
          tertiary: "Over budget",
          badge: "Dining",
          meta: "$4.50",
          tone: "emerald",
        },
      ],
    }
  }

  if (domainLabel === "inventory") {
    return {
      question: "How should staff spot products that need attention?",
      impact:
        "Inventory screens are most useful when urgent stock problems are visible before routine items.",
      choices: [
        {
          id: "layout-inventory-urgency",
          title: "By stock urgency",
          caption: "Put out-of-stock and low-stock products first.",
          promptText:
            "Order products by stock urgency, showing Out of stock and Low stock items before products with healthy inventory.",
          view: "tertiary",
        },
        {
          id: "layout-inventory-category",
          title: "By category",
          caption: "Review related products together.",
          promptText:
            "Group inventory by product category and show the current quantity on every row.",
          view: "primary",
        },
        {
          id: "layout-inventory-location",
          title: "By location",
          caption: "See what is stored in each area.",
          promptText:
            "Group inventory by storage location, with stock warnings visible within each location.",
          view: "secondary",
        },
      ],
      items: [
        {
          name: "Sourdough loaf",
          primary: "Bread",
          secondary: "Front shelf",
          tertiary: "Low stock",
          badge: "Bread",
          meta: "3 left",
          tone: "amber",
        },
        {
          name: "Croissant",
          primary: "Pastry",
          secondary: "Display case",
          tertiary: "Out of stock",
          badge: "Pastry",
          meta: "0 left",
          tone: "sky",
        },
        {
          name: "Coffee beans",
          primary: "Pantry",
          secondary: "Back room",
          tertiary: "In stock",
          badge: "Pantry",
          meta: "18 bags",
          tone: "emerald",
        },
      ],
    }
  }

  if (domainLabel === "assignment") {
    return {
      question: "How should students find their assignments?",
      impact:
        "This has the biggest impact on how quickly students can spot the work they need.",
      choices: [
        {
          id: "layout-assignment-course",
          title: "By course",
          caption: "See everything for one class together.",
          promptText:
            "Group assignments by course and show due dates prominently within each course.",
          view: "primary",
        },
        {
          id: "layout-assignment-deadline",
          title: "By deadline",
          caption: "See what’s due next across all courses.",
          promptText:
            "Order assignments by due date across all courses, with overdue and upcoming work highlighted.",
          view: "secondary",
        },
        {
          id: "layout-assignment-status",
          title: "By status",
          caption: "Scan what’s to do, in progress, or done.",
          promptText:
            "Group assignments by status—To do, In progress, and Done—so progress is easy to scan.",
          view: "tertiary",
        },
      ],
      items: [
        {
          name: "Calculus problem set",
          primary: "Math",
          secondary: "Due next",
          tertiary: "To do",
          badge: "Math",
          meta: "Tomorrow",
          tone: "sky",
        },
        {
          name: "History essay",
          primary: "History",
          secondary: "Later this week",
          tertiary: "In progress",
          badge: "History",
          meta: "Friday",
          tone: "amber",
        },
        {
          name: "Biology lab notes",
          primary: "Biology",
          secondary: "Next week",
          tertiary: "Done",
          badge: "Biology",
          meta: "Monday",
          tone: "emerald",
        },
      ],
    }
  }

  const title = entity === "item" ? "item" : entity
  const groupLabel = group.split(" (")[0]
  const groupTitle = groupLabel.charAt(0).toUpperCase() + groupLabel.slice(1)
  return {
    question: `What should help people find the right ${title}?`,
    impact: `This sets the main information hierarchy, so people can find ${plural} without scanning everything.`,
    choices: [
      {
        id: `layout-${domainLabel}-group`,
        title: `By ${groupLabel}`,
        caption: `Keep related ${plural} together by ${groupLabel}.`,
        promptText: `Group ${plural} by ${groupLabel} so related items stay together.`,
        view: "primary",
      },
      {
        id: `layout-${domainLabel}-priority`,
        title: "By priority",
        caption: `See which ${plural} need attention next.`,
        promptText: `Order ${plural} by priority so the next item needing attention appears first.`,
        view: "secondary",
      },
      {
        id: `layout-${domainLabel}-status`,
        title: "By status",
        caption: `Scan the progress of every ${title} at a glance.`,
        promptText: `Group ${plural} by status—To do, In progress, and Done—so progress is easy to scan.`,
        view: "tertiary",
      },
    ],
    items: [
      {
        name: `${title.charAt(0).toUpperCase() + title.slice(1)} one`,
        primary: `${groupTitle} A`,
        secondary: "High priority",
        tertiary: "To do",
        badge: "Type A",
        meta: "Today",
        tone: "sky",
      },
      {
        name: `${title.charAt(0).toUpperCase() + title.slice(1)} two`,
        primary: `${groupTitle} B`,
        secondary: "Medium priority",
        tertiary: "In progress",
        badge: "Type B",
        meta: "Friday",
        tone: "amber",
      },
      {
        name: `${title.charAt(0).toUpperCase() + title.slice(1)} three`,
        primary: `${groupTitle} C`,
        secondary: "Low priority",
        tertiary: "Done",
        badge: "Type C",
        meta: "Next week",
        tone: "emerald",
      },
    ],
  }
}

export function DesignChoiceGallery({
  entity,
  plural,
  group,
  domainLabel,
  onAdd,
  onSkip,
  priorityLabel = "Recommended first",
}: Props) {
  const context = getDecisionContext(domainLabel, entity, plural, group)
  const choices = context.choices
  const [mobileIndex, setMobileIndex] = useState(0)
  const [selected, setSelected] = useState<LayoutChoice | null>(null)
  const [draft, setDraft] = useState("")
  const [editing, setEditing] = useState(false)
  const touchStart = useRef<number | null>(null)

  function choose(choice: LayoutChoice) {
    setSelected(choice)
    setDraft(choice.promptText)
    setEditing(false)
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
              {priorityLabel}
            </p>
            <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-stone-900">
              {context.question}
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-stone-500">
              Compare the same items three ways. Choose one to see exactly what
              it adds.
            </p>
            <p className="mt-1 text-[12px] leading-5 text-stone-500">
              {context.impact}
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

      {/* Desktop: compare every option at once. */}
      <div className="hidden grid-cols-3 gap-3 p-4 sm:grid sm:p-5">
        {choices.map((choice) => (
          <ChoiceCard
            key={choice.id}
            choice={choice}
            items={context.items}
            active={selected?.id === choice.id}
            onClick={() => choose(choice)}
          />
        ))}
      </div>

      {/* Mobile: one focused option, swipeable with explicit controls. */}
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
        <ChoiceCard
          choice={choices[mobileIndex]}
          items={context.items}
          active={selected?.id === choices[mobileIndex].id}
          onClick={() => choose(choices[mobileIndex])}
        />
        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => move(-1)}
            className="grid size-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 hover:border-stone-400"
            aria-label="Previous layout option"
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
            aria-label="Next layout option"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {selected && (
        <div className="border-t border-stone-200 bg-[var(--accent-soft)]/55 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="layout-prompt-sentence"
                className="block text-[11px] font-semibold tracking-[0.07em] text-[var(--accent-ink)] uppercase"
              >
                Would add to your prompt:
              </label>
              {editing ? (
                <textarea
                  id="layout-prompt-sentence"
                  autoFocus
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="mt-2 w-full resize-none rounded-lg border border-indigo-200 bg-white px-3 py-2 text-[14px] leading-6 text-stone-900 focus:border-[var(--accent)] focus:outline-none"
                />
              ) : (
                <p
                  id="layout-prompt-sentence"
                  className="mt-1 text-[14.5px] leading-6 text-stone-900"
                >
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

function ChoiceCard({
  choice,
  items,
  active,
  onClick,
}: {
  choice: LayoutChoice
  items: PreviewItem[]
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
      <div className="h-[176px] overflow-y-auto rounded-lg border border-stone-200 bg-stone-50 p-2.5 [scrollbar-width:thin]">
        <MiniPreview view={choice.view} items={items} />
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
          <span className="font-medium text-stone-700">{choice.title}:</span>{" "}
          {choice.caption.charAt(0).toLowerCase() + choice.caption.slice(1)}
        </p>
      </div>
    </button>
  )
}

function MiniPreview({
  view,
  items,
}: {
  view: LayoutChoice["view"]
  items: PreviewItem[]
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name}>
          <PreviewHeading>{item[view]}</PreviewHeading>
          <PreviewRow item={item} emphasizeMeta={view === "secondary"} />
        </div>
      ))}
    </div>
  )
}

function PreviewHeading({ children }: { children: string }) {
  return (
    <p className="mb-1 text-[8px] font-bold tracking-[0.08em] text-stone-400 uppercase">
      {children}
    </p>
  )
}

function PreviewRow({
  item,
  emphasizeMeta,
}: {
  item: PreviewItem
  emphasizeMeta?: boolean
}) {
  const tones = {
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
  }
  return (
    <div className="rounded-md border border-stone-200 bg-white px-2 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <p className="truncate text-[9.5px] font-semibold text-stone-800">
        {item.name}
      </p>
      <div className="mt-1 flex items-center justify-between gap-1">
        <span
          className={`rounded px-1 py-0.5 text-[7.5px] font-medium ${tones[item.tone]}`}
        >
          {item.badge}
        </span>
        <span
          className={`text-[8px] ${
            emphasizeMeta ? "font-semibold text-rose-600" : "text-stone-400"
          }`}
        >
          {item.meta}
        </span>
      </div>
    </div>
  )
}
