import { CATEGORIES, type Category } from '../engine'

export const CATEGORY_COLOR: Record<Category, string> = {
  structure: 'bg-sky-500',
  visual: 'bg-violet-500',
  interaction: 'bg-amber-500',
  usability: 'bg-emerald-500',
  accessibility: 'bg-rose-500',
}

export function CategoryTag({ category, principle }: { category: Category; principle?: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-stone-500">
      <span className={`size-1.5 shrink-0 rounded-full ${CATEGORY_COLOR[category]}`} aria-hidden />
      <span className="truncate">
        {CATEGORIES[category].label}
        {principle && principle !== CATEGORIES[category].label && (
          <span className="text-stone-400"> · {principle}</span>
        )}
      </span>
    </span>
  )
}
