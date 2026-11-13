import type { Suggestion } from '../engine'

export function SuggestionPreview({
  suggestion,
  expanded = false,
}: {
  suggestion: Suggestion
  expanded?: boolean
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-stone-200 bg-stone-50 ${
        expanded ? "flex h-full min-h-0 flex-col" : "mt-3"
      }`}
    >
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-3 py-2">
        <span className="text-[10px] font-semibold tracking-[0.07em] text-stone-500 uppercase">
          Visual example
        </span>
        <span className="text-[10px] text-stone-400">Example only</span>
      </div>
      <div
        className={`overflow-auto [scrollbar-width:thin] ${
          expanded
            ? "min-h-0 flex-1 p-5 sm:p-8"
            : "h-[178px] p-3"
        }`}
        role="img"
        aria-label={`Visual example of: ${suggestion.text}`}
      >
        <div
          inert
          className={
            expanded
              ? "mx-auto w-[71.43%] origin-top scale-[1.4] sm:w-[55.56%] sm:scale-[1.8]"
              : ""
          }
        >
          <PreviewFor suggestion={suggestion} />
        </div>
      </div>
    </div>
  )
}

function PreviewFor({ suggestion: s }: { suggestion: Suggestion }) {
  if (s.id === 'v-type') return <TypePreview />
  if (s.id === 'v-spacing') return <SpacingPreview />
  if (['v-color', 'v-style'].includes(s.id)) return <ColorPreview />
  if (s.id === 'v-status' || s.id === 'v-emphasis') return <StatusPreview />
  if (s.id === 'v-align') return <AlignmentPreview />

  if (s.id === 'i-empty') return <EmptyPreview />
  if (s.id === 'i-loading') return <LoadingPreview />
  if (s.id === 'i-error' || s.id === 'f-login') return <ErrorPreview />
  if (s.id === 'i-success' || s.id === 'h-status') return <SuccessPreview />
  if (s.id === 'i-undo') return <UndoPreview />
  if (s.id === 'i-complete') return <CompletePreview />
  if (s.id === 'i-hover') return <HoverPreview />

  if (s.id === 'h-prevention') return <PreventionPreview />
  if (s.id === 'h-recognition') return <RecognitionPreview />
  if (s.id === 'h-control') return <ControlPreview />
  if (s.id === 'h-consistency') return <ConsistencyPreview />

  if (s.id === 'a-contrast') return <ContrastPreview />
  if (s.id === 'a-labels') return <LabelsPreview />
  if (s.id === 'a-keyboard') return <KeyboardPreview />
  if (s.id === 'a-targets') return <TargetsPreview />

  if (s.id === 'f-upload') return <UploadPreview />
  if (s.id === 'f-chart') return <ChartPreview />
  if (s.id === 'f-search') return <SearchPreview />
  if (s.id === 'f-checkout') return <CheckoutPreview />

  if (s.category === 'structure') return <StructurePreview id={s.id} />
  if (s.category === 'visual') return <ColorPreview />
  if (s.category === 'interaction') return <SuccessPreview />
  if (s.category === 'usability') return <ConsistencyPreview />
  return <KeyboardPreview />
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-[0_2px_8px_rgba(28,25,23,0.05)]">
      <div className="flex h-6 items-center gap-1 border-b border-stone-100 px-2">
        <span className="size-1.5 rounded-full bg-rose-300" />
        <span className="size-1.5 rounded-full bg-amber-300" />
        <span className="size-1.5 rounded-full bg-emerald-300" />
      </div>
      {children}
    </div>
  )
}

const Row = ({ title, meta }: { title: string; meta: string }) => (
  <div className="flex items-center justify-between gap-2 rounded-md border border-stone-100 bg-white px-2.5 py-2">
    <span className="truncate text-[9.5px] font-semibold text-stone-800">{title}</span>
    <span className="shrink-0 text-[8px] text-stone-400">{meta}</span>
  </div>
)

function TypePreview() {
  return (
    <AppShell>
      <div className="p-3">
        <p className="text-[7px] font-semibold tracking-[0.08em] text-indigo-600 uppercase">Assignments</p>
        <p className="mt-1 text-[18px] leading-5 font-semibold tracking-[-0.04em] text-stone-900">This week</p>
        <p className="mt-1 text-[9px] leading-4 text-stone-500">Three assignments need your attention.</p>
        <p className="mt-3 text-[10px] font-semibold text-stone-800">Due next</p>
        <div className="mt-1.5 space-y-1.5">
          <Row title="Calculus problem set" meta="Tomorrow" />
          <Row title="History essay" meta="Friday" />
        </div>
        <div className="mt-3 flex items-end gap-2 border-t border-stone-100 pt-2 text-stone-400">
          <span className="text-[14px] font-semibold">Title</span>
          <span className="text-[10px] font-medium">Section</span>
          <span className="text-[8px]">Body</span>
        </div>
      </div>
    </AppShell>
  )
}

function SpacingPreview() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <PreviewColumn title="Cramped" muted>
        <div className="space-y-px">
          <Row title="Calculus" meta="Tomorrow" />
          <Row title="History" meta="Friday" />
          <Row title="Biology" meta="Monday" />
        </div>
      </PreviewColumn>
      <PreviewColumn title="8px rhythm">
        <div className="space-y-2">
          <Row title="Calculus" meta="Tomorrow" />
          <Row title="History" meta="Friday" />
          <Row title="Biology" meta="Monday" />
        </div>
      </PreviewColumn>
    </div>
  )
}

function PreviewColumn({
  title,
  muted,
  children,
}: {
  title: string
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-lg border p-2 ${muted ? 'border-stone-200 bg-stone-100 opacity-70' : 'border-indigo-200 bg-white'}`}>
      <p className="mb-2 text-[8px] font-semibold text-stone-500 uppercase">{title}</p>
      {children}
    </div>
  )
}

function ColorPreview() {
  return (
    <AppShell>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-stone-900">Assignments</p>
            <p className="text-[8px] text-stone-500">Neutral content, one clear accent</p>
          </div>
          <button className="rounded-md bg-indigo-600 px-2 py-1 text-[8px] font-semibold text-white">Add assignment</button>
        </div>
        <div className="mt-3 space-y-1.5">
          <Row title="Calculus problem set" meta="Tomorrow" />
          <Row title="History essay" meta="Friday" />
        </div>
        <div className="mt-3 flex gap-1.5">
          {['bg-indigo-600', 'bg-stone-900', 'bg-stone-400', 'bg-stone-200', 'bg-white'].map((color) => (
            <span key={color} className={`h-5 flex-1 rounded border border-stone-200 ${color}`} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}

function StatusPreview() {
  const rows = [
    ['Calculus problem set', 'Overdue', 'bg-rose-50 text-rose-700'],
    ['History essay', 'In progress', 'bg-amber-50 text-amber-700'],
    ['Biology lab notes', 'Done', 'bg-emerald-50 text-emerald-700'],
  ]
  return (
    <AppShell>
      <div className="space-y-2 p-3">
        <p className="text-[11px] font-semibold text-stone-900">Assignments</p>
        {rows.map(([title, status, color]) => (
          <div key={title} className="flex items-center justify-between rounded-md border border-stone-100 px-2.5 py-2">
            <span className="text-[9px] font-medium text-stone-800">{title}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[7px] font-semibold ${color}`}>{status}</span>
          </div>
        ))}
        <p className="text-[8px] text-stone-400">Color and text work together.</p>
      </div>
    </AppShell>
  )
}

function AlignmentPreview() {
  return (
    <AppShell>
      <div className="p-3">
        <div className="border-l border-dashed border-indigo-300 pl-2">
          <p className="text-[14px] font-semibold text-stone-900">This week</p>
          <p className="mt-1 text-[8px] text-stone-500">Everything shares one clear left edge.</p>
          <div className="mt-3 space-y-2">
            <Row title="Calculus problem set" meta="Tomorrow" />
            <Row title="History essay" meta="Friday" />
          </div>
          <button className="mt-3 rounded bg-indigo-600 px-2 py-1 text-[8px] font-semibold text-white">Add assignment</button>
        </div>
      </div>
    </AppShell>
  )
}

function StructurePreview({ id }: { id: string }) {
  const isForm = id === 's-form'
  const isNav = id === 's-nav'
  return (
    <AppShell>
      <div className="flex min-h-[145px]">
        {isNav && (
          <div className="w-14 border-r border-stone-100 bg-stone-50 p-2">
            {['Home', 'Courses', 'Calendar'].map((item, index) => (
              <p key={item} className={`mb-2 rounded px-1 py-1 text-[7px] ${index === 0 ? 'bg-indigo-100 text-indigo-700' : 'text-stone-400'}`}>
                {item}
              </p>
            ))}
          </div>
        )}
        <div className="min-w-0 flex-1 p-3">
          <p className="text-[12px] font-semibold text-stone-900">{isForm ? 'Add assignment' : 'Assignments'}</p>
          {isForm ? (
            <div className="mt-3 space-y-2">
              <MiniField label="Assignment name" />
              <MiniField label="Due date" />
              <button className="rounded bg-indigo-600 px-2 py-1 text-[8px] font-semibold text-white">Save</button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <p className="mb-1 text-[7px] font-bold text-stone-400 uppercase">Math</p>
                <Row title="Calculus problem set" meta="Tomorrow" />
              </div>
              <div>
                <p className="mb-1 text-[7px] font-bold text-stone-400 uppercase">History</p>
                <Row title="History essay" meta="Friday" />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function MiniField({ label }: { label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[7px] font-medium text-stone-600">{label}</span>
      <span className="block h-6 rounded border border-stone-200 bg-white" />
    </label>
  )
}

function EmptyPreview() {
  return (
    <AppShell>
      <div className="grid min-h-[145px] place-items-center p-4 text-center">
        <div>
          <div className="mx-auto grid size-9 place-items-center rounded-full bg-indigo-50 text-[15px] text-indigo-500">+</div>
          <p className="mt-2 text-[10px] font-semibold text-stone-800">No assignments yet</p>
          <p className="mt-1 text-[8px] text-stone-500">Add your first assignment to get organized.</p>
          <button className="mt-2 rounded bg-indigo-600 px-2 py-1 text-[8px] font-semibold text-white">Add assignment</button>
        </div>
      </div>
    </AppShell>
  )
}

function LoadingPreview() {
  return (
    <AppShell>
      <div className="space-y-2 p-3">
        <div className="h-3 w-20 animate-pulse rounded bg-stone-200" />
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-md border border-stone-100 p-2">
            <div className="h-2 w-2/3 animate-pulse rounded bg-stone-200" />
            <div className="mt-2 h-1.5 w-1/3 animate-pulse rounded bg-stone-100" />
          </div>
        ))}
      </div>
    </AppShell>
  )
}

function ErrorPreview() {
  return (
    <AppShell>
      <div className="p-3">
        <MiniField label="Assignment name" />
        <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2">
          <p className="text-[8px] font-semibold text-rose-700">Couldn’t save this assignment</p>
          <p className="mt-0.5 text-[7px] text-rose-600">Your work is still here. Check your connection and try again.</p>
          <button className="mt-2 rounded border border-rose-300 bg-white px-2 py-1 text-[7px] font-semibold text-rose-700">Try again</button>
        </div>
      </div>
    </AppShell>
  )
}

function SuccessPreview() {
  return (
    <AppShell>
      <div className="relative min-h-[145px] p-3">
        <p className="text-[11px] font-semibold">Assignments</p>
        <div className="mt-3 space-y-2">
          <Row title="Calculus problem set" meta="Tomorrow" />
          <Row title="History essay" meta="Friday" />
        </div>
        <div className="absolute right-3 bottom-3 left-3 flex items-center gap-2 rounded-md bg-emerald-700 px-2.5 py-2 text-white shadow-lg">
          <span className="text-[9px]">✓</span>
          <span className="text-[8px] font-medium">Assignment saved</span>
        </div>
      </div>
    </AppShell>
  )
}

function UndoPreview() {
  return (
    <AppShell>
      <div className="grid min-h-[145px] place-items-end p-3">
        <div className="flex w-full items-center justify-between rounded-md bg-stone-900 px-3 py-2.5 text-white shadow-lg">
          <span className="text-[8px]">Assignment deleted</span>
          <span className="text-[8px] font-semibold text-indigo-300">Undo</span>
        </div>
      </div>
    </AppShell>
  )
}

function CompletePreview() {
  return (
    <AppShell>
      <div className="space-y-2 p-3">
        <p className="text-[11px] font-semibold">Today</p>
        <div className="flex items-center gap-2 rounded-md border border-stone-100 px-2 py-2">
          <span className="grid size-4 place-items-center rounded border border-indigo-500 bg-indigo-600 text-[8px] text-white">✓</span>
          <span className="text-[9px] text-stone-400 line-through">Submit history essay</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-stone-100 px-2 py-2">
          <span className="size-4 rounded border border-stone-300" />
          <span className="text-[9px] text-stone-800">Finish lab notes</span>
        </div>
      </div>
    </AppShell>
  )
}

function HoverPreview() {
  return (
    <AppShell>
      <div className="grid min-h-[145px] place-items-center p-3">
        <div className="flex gap-3">
          <div className="rounded-md border border-stone-200 px-3 py-2 text-[8px] text-stone-500">Default</div>
          <div className="rounded-md border border-indigo-400 bg-indigo-50 px-3 py-2 text-[8px] font-semibold text-indigo-700 shadow-sm">Hover</div>
          <div className="rounded-md bg-indigo-700 px-3 py-2 text-[8px] font-semibold text-white shadow-inner">Pressed</div>
        </div>
      </div>
    </AppShell>
  )
}

function PreventionPreview() {
  return (
    <AppShell>
      <div className="p-3">
        <MiniField label="Assignment name *" />
        <p className="mt-1 text-[7px] text-rose-600">Enter a name before saving.</p>
        <div className="mt-2 opacity-40">
          <MiniField label="Due date *" />
        </div>
        <button className="mt-3 cursor-not-allowed rounded bg-stone-300 px-2 py-1 text-[8px] font-semibold text-white">Save assignment</button>
      </div>
    </AppShell>
  )
}

function RecognitionPreview() {
  return (
    <AppShell>
      <div className="p-3">
        <p className="text-[8px] font-medium text-stone-700">Choose a course</p>
        <div className="mt-2 space-y-1.5">
          {['Math 201', 'World History', 'Biology'].map((course, index) => (
            <div key={course} className={`flex items-center justify-between rounded-md border px-2 py-2 text-[8px] ${index === 0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-stone-200 bg-white text-stone-700'}`}>
              {course}
              {index === 0 && <span>✓</span>}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

function ControlPreview() {
  return (
    <AppShell>
      <div className="grid min-h-[145px] place-items-center bg-stone-900/10 p-3">
        <div className="w-full max-w-[170px] rounded-lg bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold">Edit assignment</p>
            <span className="text-[10px] text-stone-400">×</span>
          </div>
          <div className="my-3 h-6 rounded border border-stone-200" />
          <div className="flex justify-end gap-1.5">
            <button className="rounded px-2 py-1 text-[7px] text-stone-500">Cancel</button>
            <button className="rounded bg-indigo-600 px-2 py-1 text-[7px] text-white">Save</button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function ConsistencyPreview() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {['Assignments', 'Courses'].map((title) => (
        <PreviewColumn key={title} title={title}>
          <p className="mb-2 text-[10px] font-semibold">{title}</p>
          <Row title={title === 'Assignments' ? 'Add assignment' : 'Add course'} meta="+" />
          <button className="mt-2 w-full rounded bg-indigo-600 py-1 text-[7px] font-semibold text-white">Save</button>
        </PreviewColumn>
      ))}
    </div>
  )
}

function ContrastPreview() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-lg border border-stone-200 bg-white p-3">
        <p className="text-[8px] font-semibold text-stone-300">Low contrast</p>
        <p className="mt-2 text-[7px] leading-4 text-stone-300">Due tomorrow at 9:00 AM</p>
        <span className="mt-3 inline-block rounded bg-stone-100 px-2 py-1 text-[7px] text-stone-300">Hard to read</span>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-white p-3">
        <p className="text-[8px] font-semibold text-stone-900">AA contrast</p>
        <p className="mt-2 text-[7px] leading-4 text-stone-600">Due tomorrow at 9:00 AM</p>
        <span className="mt-3 inline-block rounded bg-indigo-600 px-2 py-1 text-[7px] font-semibold text-white">Readable</span>
      </div>
    </div>
  )
}

function LabelsPreview() {
  return (
    <AppShell>
      <div className="space-y-3 p-3">
        <MiniField label="Assignment name" />
        <MiniField label="Due date" />
        <div className="flex items-center gap-2">
          <button className="grid size-7 place-items-center rounded border border-stone-200 text-[10px]">⋮</button>
          <span className="text-[8px] text-stone-500">Screen reader label: More options</span>
        </div>
      </div>
    </AppShell>
  )
}

function KeyboardPreview() {
  return (
    <AppShell>
      <div className="p-3">
        <p className="text-[9px] font-semibold">Visible keyboard focus</p>
        <div className="mt-4 flex gap-2">
          <button className="rounded border-2 border-indigo-600 bg-white px-2 py-1.5 text-[8px] font-semibold text-indigo-700 outline-2 outline-offset-2 outline-indigo-200">Add assignment</button>
          <button className="rounded border border-stone-200 px-2 py-1.5 text-[8px] text-stone-500">Filter</button>
        </div>
        <div className="mt-5 flex items-center gap-2 text-[7px] text-stone-500">
          <kbd className="rounded border border-stone-300 bg-stone-50 px-1.5 py-1 font-mono">Tab</kbd>
          moves focus
          <kbd className="ml-2 rounded border border-stone-300 bg-stone-50 px-1.5 py-1 font-mono">Enter</kbd>
          activates
        </div>
      </div>
    </AppShell>
  )
}

function TargetsPreview() {
  return (
    <AppShell>
      <div className="flex min-h-[145px] items-center justify-center gap-3 p-3">
        {['＋', '✓', '⋮'].map((icon) => (
          <button key={icon} className="grid size-11 place-items-center rounded-xl border border-stone-200 bg-white text-[14px] text-stone-700 shadow-sm">
            {icon}
          </button>
        ))}
        <span className="absolute mt-16 text-[7px] text-stone-400">44 × 44px minimum</span>
      </div>
    </AppShell>
  )
}

function UploadPreview() {
  return (
    <AppShell>
      <div className="p-3">
        <div className="flex items-center gap-2 rounded-md border border-stone-200 p-2">
          <div className="size-9 rounded bg-indigo-100" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[8px] font-medium">assignment-notes.pdf</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded bg-stone-100">
              <div className="h-full w-2/3 rounded bg-indigo-500" />
            </div>
            <p className="mt-1 text-[7px] text-stone-400">Uploading · 67%</p>
          </div>
          <span className="text-[10px] text-stone-400">×</span>
        </div>
      </div>
    </AppShell>
  )
}

function ChartPreview() {
  const bars = [35, 70, 48, 90]
  return (
    <AppShell>
      <div className="p-3">
        <p className="text-[9px] font-semibold">Assignments completed</p>
        <div className="mt-3 flex h-20 items-end gap-3 border-b border-l border-stone-200 px-3">
          {bars.map((height, index) => (
            <div key={height} className="flex flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-[6px] text-stone-400">{height}%</span>
              <div className="w-full rounded-t bg-indigo-500" style={{ height: `${height}%` }} />
              <span className="absolute mt-4 text-[6px] text-stone-400">W{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

function SearchPreview() {
  return (
    <AppShell>
      <div className="p-3">
        <div className="rounded-md border border-indigo-300 bg-white px-2 py-1.5 text-[8px] text-stone-700">calculus</div>
        <div className="mt-3 rounded-md border border-stone-100 p-2 text-[9px] text-stone-700">
          <mark className="bg-amber-100 text-stone-900">Calculus</mark> problem set
          <p className="mt-1 text-[7px] text-stone-400">Math · Due tomorrow</p>
        </div>
      </div>
    </AppShell>
  )
}

function CheckoutPreview() {
  return (
    <AppShell>
      <div className="p-3">
        <p className="text-[10px] font-semibold">Order summary</p>
        <div className="mt-3 space-y-2 text-[8px]">
          <div className="flex justify-between text-stone-500"><span>Monthly plan</span><span>$12.00</span></div>
          <div className="flex justify-between text-stone-500"><span>Tax</span><span>$1.20</span></div>
          <div className="flex justify-between border-t border-stone-200 pt-2 font-semibold text-stone-900"><span>Total</span><span>$13.20</span></div>
        </div>
        <button className="mt-3 w-full rounded bg-indigo-600 py-1.5 text-[8px] font-semibold text-white">Pay $13.20</button>
      </div>
    </AppShell>
  )
}
