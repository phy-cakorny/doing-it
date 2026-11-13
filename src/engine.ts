// Rule-based "example mode" suggestion engine. It reads the prompt, guesses the
// app's domain, and ranks design-concept templates by relevance to the whole
// prompt and (more heavily) to the sentence currently being written.

export type Category = 'structure' | 'visual' | 'interaction' | 'usability' | 'accessibility'

export const CATEGORIES: Record<Category, { label: string; blurb: string }> = {
  structure: {
    label: 'Layout & structure',
    blurb: 'How screens are organized: layout, navigation, components, and what comes first.',
  },
  visual: {
    label: 'Visual design',
    blurb: 'Typography, spacing, color, and alignment that make the interface easy to scan.',
  },
  interaction: {
    label: 'Interaction states',
    blurb: 'What the app looks like while loading, when empty, after success, and when something fails.',
  },
  usability: {
    label: 'Usability',
    blurb: 'Proven rules of thumb that keep apps predictable, forgiving, and easy to learn.',
  },
  accessibility: {
    label: 'Accessibility',
    blurb: 'Making sure everyone can read, understand, and operate the interface.',
  },
}

export const CATEGORY_ORDER: Category[] = ['structure', 'visual', 'interaction', 'usability', 'accessibility']

export interface Suggestion {
  id: string
  category: Category
  /** Plain-language name of the underlying principle, e.g. "Error prevention". */
  principle?: string
  text: string
  /** Optional continuation of an in-progress sentence. */
  clause?: string
  why: string
  score: number
  /** Whether it matched the sentence currently being written. */
  sentenceMatch: boolean
}

interface Profile {
  key: string
  match: RegExp
  entity: string
  plural: string
  group: string
  dateField?: string
  action: string
  completable?: boolean
  extras?: Template[]
}

interface Ctx {
  e: string
  es: string
  E: string
  Es: string
  g: string
  d?: string
  a: string
  completable: boolean
}

interface Template {
  id: string
  category: Category
  principle?: string
  base: number
  triggers: string[]
  /** Prompt must match this to be eligible at all. */
  requires?: RegExp
  /** Skip if the prompt already covers the idea. */
  covers?: RegExp
  when?: (c: Ctx) => boolean
  text: (c: Ctx) => string
  clause?: (c: Ctx) => string
  why: (c: Ctx) => string
}

const PROFILES: Profile[] = [
  {
    key: 'assignment',
    match: /\b(assignment|homework|coursework|syllabus)s?\b/i,
    entity: 'assignment',
    plural: 'assignments',
    group: 'course',
    dateField: 'due date',
    action: 'Add assignment',
    completable: true,
    extras: [
      {
        id: 'x-assign-week',
        category: 'structure',
        base: 2.2,
        triggers: ['week', 'calendar', 'schedule', 'view', 'due'],
        covers: /\b(week|calendar)\b/i,
        text: () => 'Offer a “This week” view that shows what’s due over the next seven days.',
        why: () => 'Students plan in weeks; a short horizon makes the workload feel manageable.',
      },
    ],
  },
  {
    key: 'task',
    match: /\b(task|to-?do|todo|chore|kanban|project management)s?\b/i,
    entity: 'task',
    plural: 'tasks',
    group: 'project',
    dateField: 'due date',
    action: 'New task',
    completable: true,
  },
  {
    key: 'habit',
    match: /\bhabits?\b/i,
    entity: 'habit',
    plural: 'habits',
    group: 'time of day',
    action: 'Add habit',
    completable: true,
    extras: [
      {
        id: 'x-habit-streak',
        category: 'visual',
        base: 2.4,
        triggers: ['streak', 'progress', 'track', 'daily'],
        covers: /\bstreak/i,
        text: () => 'Show each habit’s current streak next to its name so progress is visible at a glance.',
        why: () => 'Seeing progress is motivating and tells users the app recorded their check-ins.',
      },
    ],
  },
  {
    key: 'expense',
    match: /\b(expense|budget|spending|finance|transaction|money)s?\b/i,
    entity: 'expense',
    plural: 'expenses',
    group: 'category',
    dateField: 'date',
    action: 'Add expense',
    extras: [
      {
        id: 'x-expense-amount',
        category: 'visual',
        base: 2.4,
        triggers: ['amount', 'total', 'money', 'spend', 'balance'],
        text: () =>
          'Right-align amounts with consistent decimals, and show the monthly total in a large, bold number at the top.',
        why: () => 'Aligned numbers are easier to compare, and the total is the figure people check most.',
      },
    ],
  },
  {
    key: 'recipe',
    match: /\b(recipe|meal|cooking|ingredient)s?\b/i,
    entity: 'recipe',
    plural: 'recipes',
    group: 'meal type',
    action: 'Add recipe',
    extras: [
      {
        id: 'x-recipe-cook',
        category: 'structure',
        base: 2.2,
        triggers: ['step', 'ingredient', 'cook', 'instruction'],
        text: () => 'On a recipe page, list ingredients beside numbered steps so cooks can follow along without scrolling.',
        why: () => 'Keeping both visible avoids flipping back and forth with messy hands.',
      },
    ],
  },
  {
    key: 'booking',
    match: /\b(booking|appointment|reservation|schedul\w*|class(es)? booking|studio)\b/i,
    entity: 'booking',
    plural: 'bookings',
    group: 'day',
    dateField: 'time',
    action: 'Book a slot',
    extras: [
      {
        id: 'x-booking-slots',
        category: 'structure',
        base: 2.4,
        triggers: ['time', 'slot', 'available', 'calendar', 'book'],
        text: () => 'Show available time slots as tappable buttons grouped by day, and grey out ones that are full.',
        why: () => 'Picking from visible options is faster and prevents booking an unavailable time.',
      },
    ],
  },
  {
    key: 'inventory',
    match: /\b(inventory|stock|warehouse|supplies)\b/i,
    entity: 'product',
    plural: 'products',
    group: 'category',
    action: 'Add product',
    extras: [
      {
        id: 'x-inventory-low',
        category: 'visual',
        base: 2.4,
        triggers: ['stock', 'low', 'quantity', 'alert'],
        text: () => 'Highlight low-stock products with a clear “Low stock” badge and let users sort by quantity.',
        why: () => 'The most urgent information should stand out without users having to search for it.',
      },
    ],
  },
  {
    key: 'shop',
    match: /\b(shop|store|e-?commerce|marketplace|product catalog)\b/i,
    entity: 'product',
    plural: 'products',
    group: 'category',
    action: 'Add to cart',
  },
  {
    key: 'notes',
    match: /\b(note|journal|diary|notebook)s?\b/i,
    entity: 'note',
    plural: 'notes',
    group: 'folder or tag',
    dateField: 'last edited date',
    action: 'New note',
  },
  {
    key: 'event',
    match: /\b(event|meetup|conference|ticket)s?\b/i,
    entity: 'event',
    plural: 'events',
    group: 'date',
    dateField: 'date and time',
    action: 'Create event',
  },
  {
    key: 'workout',
    match: /\b(workout|fitness|exercise|gym|training)s?\b/i,
    entity: 'workout',
    plural: 'workouts',
    group: 'week',
    dateField: 'date',
    action: 'Log workout',
  },
  {
    key: 'crm',
    match: /\b(crm|contact|lead|client|customer)s?\b/i,
    entity: 'contact',
    plural: 'contacts',
    group: 'stage',
    dateField: 'next follow-up date',
    action: 'Add contact',
  },
  {
    key: 'job',
    match: /\b(job application|job search|applications?)\b/i,
    entity: 'application',
    plural: 'applications',
    group: 'status',
    dateField: 'applied date',
    action: 'Add application',
  },
  {
    key: 'reading',
    match: /\b(book|reading|library)s?\b/i,
    entity: 'book',
    plural: 'books',
    group: 'shelf (reading, want to read, finished)',
    action: 'Add book',
  },
]

const STOP = new Set([
  'a', 'an', 'the', 'my', 'our', 'simple', 'small', 'new', 'web', 'mobile', 'personal', 'basic', 'modern',
  'nice', 'clean', 'little', 'online', 'internal', 'team', 'shared', 'cool', 'good', 'react', 'student',
])

function pluralize(w: string) {
  if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies'
  if (/(s|x|ch|sh)$/.test(w)) return w + 'es'
  return w + 's'
}

const an = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export interface Domain {
  label: string
  ctx: Ctx
  extras: Template[]
}

export function detectDomain(prompt: string): Domain {
  const p = PROFILES.find((pr) => pr.match.test(prompt))
  if (p) {
    return {
      label: p.key,
      extras: p.extras ?? [],
      ctx: {
        e: p.entity,
        es: p.plural,
        E: cap(p.entity),
        Es: cap(p.plural),
        g: p.group,
        d: p.dateField,
        a: p.action,
        completable: !!p.completable,
      },
    }
  }
  // Fallback: take the noun right before "tracker", "app", "dashboard", etc.
  const m = prompt.match(
    /([a-z-]+)\s+(?:tracker|manager|app|application|dashboard|planner|log|list|platform|tool|portal|system|site|website|organizer|directory)\b/i,
  )
  let e = 'item'
  if (m && !STOP.has(m[1].toLowerCase())) e = m[1].toLowerCase().replace(/s$/, '')
  const es = pluralize(e)
  return {
    label: e === 'item' ? 'general' : e,
    extras: [],
    ctx: { e, es, E: cap(e), Es: cap(es), g: 'category', d: undefined, a: `Add ${e}`, completable: false },
  }
}

const T: Template[] = [
  // ---------- Layout & structure ----------
  {
    id: 's-group',
    category: 'structure',
    principle: 'Information hierarchy',
    base: 2.6,
    triggers: ['list', 'show', 'view', 'dashboard', 'see', 'organize', 'track', 'tracker', 'page', 'all'],
    covers: /\bgroup(ed|s)? by\b/i,
    text: (c) => `Group ${c.es} by ${c.g} so related items stay together.`,
    clause: (c) => `, grouped by ${c.g}`,
    why: () => 'Grouping mirrors how people think about their work, so they find things without scanning everything.',
  },
  {
    id: 's-date',
    category: 'structure',
    principle: 'Information hierarchy',
    base: 2.5,
    triggers: ['due', 'date', 'deadline', 'when', 'list', 'show', 'track', 'tracker'],
    when: (c) => !!c.d,
    covers: /\b(prominent|overdue)\b/i,
    text: (c) =>
      /due|follow-up/.test(c.d ?? '')
        ? `Show ${c.d}s prominently on each ${c.e}, and highlight anything overdue or coming up soon.`
        : `Show the ${c.d} on each ${c.e} in the same, easy-to-scan spot.`,
    clause: (c) => ` with ${c.d}s shown prominently`,
    why: () => 'Time is usually what people need to act on first, so it deserves visual priority.',
  },
  {
    id: 's-primary',
    category: 'structure',
    principle: 'Visual emphasis',
    base: 2.4,
    triggers: ['add', 'create', 'new', 'button', 'make', 'log', 'book'],
    covers: /\bprimary action\b/i,
    text: (c) => `Make the primary action “${c.a}” easy to find — one clear button at the top of the main view.`,
    why: () => 'When the main action is obvious, new users can get started without hunting through menus.',
  },
  {
    id: 's-hierarchy',
    category: 'structure',
    principle: 'Information hierarchy',
    base: 1.6,
    triggers: ['card', 'item', 'details', 'row', 'list', 'each', 'info', 'information'],
    text: (c) =>
      `On each ${c.e}, put the most important information first: the name${c.d ? `, then the ${c.d}` : ''}, then secondary details in smaller text.`,
    why: () => 'A clear reading order lets people scan a list and understand each item in a second.',
  },
  {
    id: 's-nav',
    category: 'structure',
    principle: 'Navigation',
    base: 1.4,
    triggers: ['nav', 'navigation', 'page', 'pages', 'section', 'menu', 'tabs', 'sidebar', 'screens', 'settings'],
    covers: /\b(sidebar|navigation|nav bar|navbar)\b/i,
    text: () => 'Use a simple navigation with no more than 4–5 main sections — a sidebar on desktop, a bottom bar on mobile.',
    why: () => 'Fewer, clearly named sections make it easy to know where you are and where to go next.',
  },
  {
    id: 's-detail',
    category: 'structure',
    principle: 'Component choice',
    base: 1.3,
    triggers: ['details', 'click', 'open', 'edit', 'view', 'more'],
    text: (c) => `Open a ${c.e}’s full details in a side panel so users don’t lose their place in the list.`,
    why: () => 'Keeping the list visible behind the details preserves context and makes quick edits faster.',
  },
  {
    id: 's-filters',
    category: 'structure',
    principle: 'Component choice',
    base: 1.5,
    triggers: ['search', 'filter', 'find', 'sort', 'many', 'lot', 'list'],
    covers: /\bfilter/i,
    text: (c) => `Add a search box and a few simple filters (for example by ${c.g}) above the list.`,
    clause: (c) => `, with search and filters by ${c.g}`,
    why: () => 'As the list grows, filters keep it usable without endless scrolling.',
  },
  {
    id: 's-summary',
    category: 'structure',
    principle: 'Information hierarchy',
    base: 1.4,
    triggers: ['dashboard', 'overview', 'home', 'summary', 'stats', 'main'],
    covers: /\bsummary\b/i,
    text: (c) =>
      c.d
        ? `Start the main screen with a short summary — how many ${c.es} are upcoming and overdue — before the full list.`
        : `Start the main screen with a short summary of key numbers before the full list of ${c.es}.`,
    why: () => 'A summary answers “how am I doing?” instantly, before people dig into details.',
  },
  {
    id: 's-form',
    category: 'structure',
    principle: 'Component choice',
    base: 1.5,
    triggers: ['form', 'add', 'create', 'input', 'field', 'fields', 'enter', 'new'],
    text: (c) =>
      `Keep the “${c.a}” form short: one column, required fields first, and optional fields tucked under “More options”.`,
    why: () => 'Short forms feel quick to complete and reduce the chance people give up halfway.',
  },
  {
    id: 's-responsive',
    category: 'structure',
    principle: 'Layout',
    base: 1.1,
    triggers: ['mobile', 'phone', 'responsive', 'tablet', 'desktop'],
    covers: /\bresponsive\b/i,
    text: () => 'Make the layout responsive: a single column on phones, with the main action reachable by thumb.',
    why: () => 'Many people will open the app on their phone; it should work there without pinching and zooming.',
  },

  // ---------- Visual design ----------
  {
    id: 'v-type',
    category: 'visual',
    principle: 'Typography',
    base: 1.3,
    triggers: ['font', 'fonts', 'text', 'typography', 'heading', 'title', 'readable', 'design', 'look'],
    text: () =>
      'Use a clear type scale: one large page title, medium section headings, and regular body text — no more than 3–4 sizes.',
    why: () => 'A small, consistent set of sizes makes the hierarchy obvious and the page look intentional.',
  },
  {
    id: 'v-spacing',
    category: 'visual',
    principle: 'Spacing',
    base: 1.3,
    triggers: ['spacing', 'layout', 'clean', 'minimal', 'padding', 'cluttered', 'design', 'simple'],
    text: () => 'Use consistent spacing (multiples of 8px) and generous whitespace between groups of content.',
    why: () => 'Even spacing groups related things together and makes the interface feel calm instead of cramped.',
  },
  {
    id: 'v-color',
    category: 'visual',
    principle: 'Color',
    base: 1.4,
    triggers: ['color', 'colour', 'colors', 'theme', 'brand', 'style', 'button', 'look', 'design'],
    covers: /\baccent colou?r\b/i,
    text: () => 'Use one accent color for primary actions and keep the rest of the palette neutral.',
    why: () => 'When only important actions are colorful, people instantly know where to click.',
  },
  {
    id: 'v-status',
    category: 'visual',
    principle: 'Color',
    base: 1.6,
    triggers: ['status', 'overdue', 'priority', 'done', 'complete', 'tag', 'label', 'progress', 'state'],
    text: () => 'Show status with a color and a text label together (e.g. “Overdue” in red, “Done” in green) — never color alone.',
    why: () => 'Labels make status clear for everyone, including people who can’t easily tell colors apart.',
  },
  {
    id: 'v-emphasis',
    category: 'visual',
    principle: 'Visual emphasis',
    base: 1.5,
    triggers: ['important', 'priority', 'urgent', 'highlight', 'today', 'soon', 'attention'],
    when: (c) => !!c.d || c.completable,
    text: (c) =>
      `Visually emphasize ${c.es} that need attention now${/due|follow-up/.test(c.d ?? '') ? ` (due today or overdue)` : ''}, and fade completed ones.`,
    why: () => 'Emphasis guides the eye to what matters right now instead of treating every item equally.',
  },
  {
    id: 'v-align',
    category: 'visual',
    principle: 'Alignment',
    base: 0.9,
    triggers: ['align', 'grid', 'layout', 'columns', 'table'],
    text: () => 'Align content to a simple grid with consistent left edges so the page feels orderly.',
    why: () => 'Shared edges create invisible lines the eye can follow, which makes pages easier to scan.',
  },
  {
    id: 'v-style',
    category: 'visual',
    principle: 'Overall style',
    base: 1.1,
    triggers: ['clean', 'modern', 'minimal', 'simple', 'look', 'style', 'design', 'beautiful', 'nice'],
    text: () => 'Aim for a calm, modern look: light background, subtle borders, rounded corners, and minimal shadows.',
    why: () => 'Giving the AI a concrete style direction prevents a generic or cluttered result.',
  },

  // ---------- Interaction states ----------
  {
    id: 'i-empty',
    category: 'interaction',
    principle: 'Empty state',
    base: 1.9,
    triggers: ['list', 'empty', 'first', 'start', 'new', 'none', 'show', 'view'],
    covers: /\bempty state\b/i,
    text: (c) =>
      `When there are no ${c.es} yet, show a friendly empty state that explains what to do and includes a “${c.a}” button.`,
    why: () => 'First-time users see an empty screen before anything else — it should guide them, not look broken.',
  },
  {
    id: 'i-loading',
    category: 'interaction',
    principle: 'Loading state',
    base: 1.2,
    triggers: ['load', 'loading', 'fetch', 'data', 'api', 'sync', 'server', 'database'],
    covers: /\b(skeleton|loading state)\b/i,
    text: (c) => `Show placeholder skeletons while ${c.es} are loading instead of a blank screen.`,
    why: () => 'A visible loading state reassures people that the app is working and hasn’t frozen.',
  },
  {
    id: 'i-hover',
    category: 'interaction',
    principle: 'Hover & pressed states',
    base: 1.0,
    triggers: ['button', 'buttons', 'click', 'hover', 'row', 'card', 'link', 'interactive'],
    covers: /\bhover\b/i,
    text: () => 'Give buttons and clickable rows clear hover and pressed states so it’s obvious what can be clicked.',
    why: () => 'Visual feedback on hover confirms an element is interactive before the user commits.',
  },
  {
    id: 'i-success',
    category: 'interaction',
    principle: 'Success state',
    base: 1.5,
    triggers: ['save', 'add', 'create', 'submit', 'saved', 'done'],
    covers: /\b(toast|success message)\b/i,
    text: (c) => `After saving ${an(c.e)} ${c.e}, show a brief “${c.E} saved” message and highlight it in the list.`,
    clause: (c) => `, showing a brief “${c.E} saved” confirmation`,
    why: () => 'Confirming success removes doubt about whether the action actually worked.',
  },
  {
    id: 'i-error',
    category: 'interaction',
    principle: 'Error state',
    base: 1.5,
    triggers: ['error', 'fail', 'fails', 'save', 'submit', 'network', 'form', 'wrong'],
    covers: /\berror message/i,
    text: () =>
      'If something fails to save, show a clear error message near the problem with a “Try again” button — and keep what the user typed.',
    why: () => 'Specific, recoverable errors keep people from losing work or getting stuck.',
  },
  {
    id: 'i-undo',
    category: 'interaction',
    principle: 'User control',
    base: 1.8,
    triggers: ['delete', 'remove', 'archive', 'trash', 'clear', 'deleting'],
    covers: /\bundo\b/i,
    text: (c) => `Show a confirmation with an undo option after deleting ${an(c.e)} ${c.e}.`,
    clause: () => `, with an undo option right after deleting`,
    why: () => 'Undo is friendlier than “Are you sure?” dialogs and makes accidental deletes harmless.',
  },
  {
    id: 'i-complete',
    category: 'interaction',
    principle: 'Feedback',
    base: 1.7,
    triggers: ['done', 'complete', 'completed', 'finish', 'check', 'mark', 'track'],
    when: (c) => c.completable,
    covers: /\bcheckbox\b/i,
    text: (c) => `Let users mark ${an(c.e)} ${c.e} as done with a single click on a checkbox, with a subtle animation.`,
    clause: () => ` that can be checked off with one click`,
    why: () => 'The most frequent action should be the fastest one — and a small reward feels good.',
  },

  // ---------- Usability heuristics ----------
  {
    id: 'h-status',
    category: 'usability',
    principle: 'Visibility of system status',
    base: 1.3,
    triggers: ['save', 'sync', 'upload', 'load', 'progress', 'auto', 'saving', 'processing'],
    text: () => 'Always show what’s happening: “Saving…” / “Saved” indicators and progress for anything that takes time.',
    why: () => 'People trust an app more when it tells them what it’s doing instead of leaving them guessing.',
  },
  {
    id: 'h-consistency',
    category: 'usability',
    principle: 'Consistency',
    base: 1.0,
    triggers: ['button', 'buttons', 'pages', 'screens', 'consistent', 'action', 'actions'],
    text: () => 'Use the same words, button styles, and placement for the same actions on every screen.',
    why: () => 'Consistency means users learn the app once instead of relearning each screen.',
  },
  {
    id: 'h-prevention',
    category: 'usability',
    principle: 'Error prevention',
    base: 1.4,
    triggers: ['form', 'date', 'input', 'field', 'enter', 'type', 'add', 'create'],
    text: (c) =>
      `Prevent mistakes: disable “Save” until required fields are filled${c.d ? ` and use a date picker for the ${c.d}` : ''}.`,
    why: () => 'It’s better to stop errors before they happen than to explain them afterward.',
  },
  {
    id: 'h-recognition',
    category: 'usability',
    principle: 'Recognition rather than recall',
    base: 1.3,
    triggers: ['select', 'choose', 'pick', 'category', 'tag', 'dropdown', 'type', 'course', 'project'],
    text: (c) => `Let users pick ${an(c.g)} ${c.g.split(' ')[0]} from a list of existing ones instead of typing it from memory.`,
    why: () => 'Choosing from visible options is easier than remembering exact names, and avoids typos and duplicates.',
  },
  {
    id: 'h-control',
    category: 'usability',
    principle: 'User control and freedom',
    base: 1.1,
    triggers: ['dialog', 'modal', 'cancel', 'edit', 'delete', 'back', 'popup', 'close'],
    text: () => 'Every dialog and form should have a clear “Cancel” or close option, and pressing Escape should close it.',
    why: () => 'People explore more confidently when they know they can always back out.',
  },

  // ---------- Accessibility ----------
  {
    id: 'a-contrast',
    category: 'accessibility',
    principle: 'Readable contrast',
    base: 1.2,
    triggers: ['color', 'colour', 'text', 'theme', 'dark', 'contrast', 'light', 'readable', 'grey', 'gray'],
    covers: /\bcontrast\b/i,
    text: () => 'Make sure text has strong contrast against its background (at least 4.5:1, the WCAG AA standard).',
    why: () => 'Light-grey-on-white text is a common AI default that’s hard to read for many people.',
  },
  {
    id: 'a-labels',
    category: 'accessibility',
    principle: 'Clear labels',
    base: 1.3,
    triggers: ['form', 'input', 'field', 'fields', 'icon', 'icons', 'button', 'label', 'enter'],
    covers: /\bvisible label/i,
    text: () => 'Give every form field a visible label (not just placeholder text), and give icon-only buttons a text label for screen readers.',
    why: () => 'Placeholders disappear when you type, and unlabeled icons are invisible to screen-reader users.',
  },
  {
    id: 'a-keyboard',
    category: 'accessibility',
    principle: 'Keyboard navigation',
    base: 1.1,
    triggers: ['keyboard', 'shortcut', 'shortcuts', 'dialog', 'modal', 'navigation', 'form', 'tab'],
    covers: /\bkeyboard\b/i,
    text: () => 'Make everything usable with a keyboard: logical tab order, a visible focus outline, and Enter/Escape in dialogs.',
    why: () => 'Keyboard support helps power users and is essential for people who can’t use a mouse.',
  },
  {
    id: 'a-targets',
    category: 'accessibility',
    principle: 'Touch targets',
    base: 0.8,
    triggers: ['mobile', 'phone', 'touch', 'tap', 'button', 'buttons'],
    text: () => 'Make buttons and tap targets at least 44×44px so they’re easy to hit on touch screens.',
    why: () => 'Small targets lead to mis-taps, especially on phones and for people with limited dexterity.',
  },

  // ---------- Feature-specific (only when mentioned) ----------
  {
    id: 'f-login',
    category: 'interaction',
    principle: 'Error state',
    base: 2.0,
    requires: /\b(log ?in|sign ?in|sign ?up|auth\w*|account|password)/i,
    triggers: ['login', 'log', 'sign', 'account', 'password', 'auth'],
    text: () =>
      'On the sign-in screen, show friendly, specific errors (“That password doesn’t match”) and keep the email filled in after a failed attempt.',
    why: () => 'Clear errors and not re-typing everything make a frustrating moment much less so.',
  },
  {
    id: 'f-upload',
    category: 'interaction',
    principle: 'Visibility of system status',
    base: 2.0,
    requires: /\b(upload|file|image|photo|attachment|document)s?\b/i,
    triggers: ['upload', 'file', 'image', 'photo', 'attach', 'attachment'],
    text: () => 'Show upload progress and a small preview of each file, with a clear way to remove it.',
    why: () => 'Uploads take time; progress and previews confirm the right file is on its way.',
  },
  {
    id: 'f-chart',
    category: 'visual',
    principle: 'Data visualization',
    base: 2.0,
    requires: /\b(chart|graph|analytics|stats|statistics|report|insight)s?\b/i,
    triggers: ['chart', 'graph', 'analytics', 'stats', 'report', 'trend'],
    text: () => 'Label charts clearly, start bar charts at zero, and show exact values when hovering over a point.',
    why: () => 'Well-labeled charts can be understood at a glance without misleading anyone.',
  },
  {
    id: 'f-notify',
    category: 'usability',
    principle: 'User control and freedom',
    base: 1.9,
    requires: /\b(notif\w*|remind\w*|alert|email)s?\b/i,
    triggers: ['notification', 'notifications', 'remind', 'reminder', 'reminders', 'alert', 'email'],
    text: () => 'Let users choose which reminders they get and when, and keep each one short with a direct link to act.',
    why: () => 'Too many notifications get ignored; giving people control keeps the useful ones welcome.',
  },
  {
    id: 'f-search',
    category: 'interaction',
    principle: 'Empty state',
    base: 1.8,
    requires: /\b(search|find)\b/i,
    triggers: ['search', 'find', 'results'],
    text: () => 'Update search results as users type, highlight the matching words, and suggest what to try when nothing matches.',
    why: () => 'Instant results and helpful “no results” messages keep people from hitting dead ends.',
  },
  {
    id: 'f-checkout',
    category: 'usability',
    principle: 'Visibility of system status',
    base: 2.0,
    requires: /\b(pay\w*|checkout|cart|buy|order|purchase)\b/i,
    triggers: ['pay', 'payment', 'checkout', 'cart', 'buy', 'order'],
    text: () => 'Show a clear order summary with the total before payment, and confirm success with an order number.',
    why: () => 'No surprises at checkout builds trust; a confirmation proves the order went through.',
  },
  {
    id: 'f-chat',
    category: 'interaction',
    principle: 'Visibility of system status',
    base: 2.0,
    requires: /\b(chat|messag\w*|conversation|inbox)\b/i,
    triggers: ['chat', 'message', 'messages', 'send', 'conversation'],
    text: () => 'Show “sending” and “sent” states for messages, and keep the message box pinned to the bottom of the screen.',
    why: () => 'People need to know their message was delivered, and typing should always be one tap away.',
  },
  {
    id: 'f-settings',
    category: 'structure',
    principle: 'Information hierarchy',
    base: 1.7,
    requires: /\b(settings|preferences|profile)\b/i,
    triggers: ['settings', 'preferences', 'profile', 'options'],
    text: () => 'Group settings into a few labeled sections and save changes automatically with a small “Saved” confirmation.',
    why: () => 'Sections make settings findable, and auto-save removes the “did I click save?” worry.',
  },
]

function words(s: string) {
  return s.toLowerCase().match(/[a-z]+/g) ?? []
}

function hits(triggers: string[], ws: string[]) {
  let n = 0
  for (const t of triggers) if (ws.some((w) => w === t || (t.length > 3 && w.startsWith(t)))) n++
  return n
}

export interface ComputeInput {
  prompt: string
  sentence: string
  exclude: Set<string>
}

export function computeSuggestions({ prompt, sentence, exclude }: ComputeInput): {
  domain: Domain
  list: Suggestion[]
} {
  const domain = detectDomain(prompt)
  const c = domain.ctx
  const promptWords = words(prompt)
  const sentenceWords = words(sentence)
  const list: Suggestion[] = []

  for (const t of [...domain.extras, ...T]) {
    if (exclude.has(t.id)) continue
    if (t.requires && !t.requires.test(prompt)) continue
    if (t.covers && t.covers.test(prompt)) continue
    if (t.when && !t.when(c)) continue
    const sHits = hits(t.triggers, sentenceWords)
    const pHits = hits(t.triggers, promptWords)
    const score = t.base + sHits * 3 + Math.min(pHits, 3) * 0.8
    list.push({
      id: t.id,
      category: t.category,
      principle: t.principle,
      text: t.text(c),
      clause: t.clause?.(c),
      why: t.why(c),
      score,
      sentenceMatch: sHits > 0,
    })
  }
  list.sort((a, b) => b.score - a.score)
  return { domain, list }
}

/** Returns the text of the sentence the caret is in (up to the caret) and whether it is finished. */
export function currentSentence(text: string, caret: number) {
  const before = text.slice(0, caret)
  const trimmed = before.replace(/\s+$/, '')
  const finished = trimmed.length === 0 || /[.!?:]$/.test(trimmed) || /\n\s*$/.test(before)
  const parts = trimmed.split(/(?<=[.!?])\s+|\n+/)
  let last = parts[parts.length - 1] ?? ''
  // If the last sentence is finished, it's still the "context" sentence.
  if (!last && parts.length > 1) last = parts[parts.length - 2]
  return { sentence: last, finished }
}

export function buildRefinedPrompt(original: string, details: { category: Category; text: string }[]) {
  const base = original.trim()
  if (!details.length) return base
  const sections = CATEGORY_ORDER.map((cat) => {
    const items = details.filter((d) => d.category === cat && d.text.trim())
    if (!items.length) return ''
    return `${CATEGORIES[cat].label}:\n${items.map((d) => `- ${d.text.trim()}`).join('\n')}`
  }).filter(Boolean)
  return `${base}\n\nDesign and UX details:\n\n${sections.join('\n\n')}`
}
