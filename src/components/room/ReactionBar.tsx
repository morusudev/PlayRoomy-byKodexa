import { REACTION_OPTIONS } from '../../constants/reactions'
import type { ReactionKind } from '../../types'
import { cn } from '../../lib/cn'

type ReactionBarProps = {
  onReact: (kind: ReactionKind) => void
  disabled?: boolean
  compact?: boolean
  embedded?: boolean
  className?: string
}

export function ReactionBar({ onReact, disabled, compact, embedded, className }: ReactionBarProps) {
  return (
    <div
      className={cn(
        'flex items-center',
        compact ? 'gap-0.5' : 'gap-1.5',
        className,
      )}
    >
      {REACTION_OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => onReact(id)}
          className={cn(
            'rounded-lg flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
            embedded
              ? 'theater-dock-btn text-accent-bright/90 hover:text-accent-bright'
              : cn(
                  'text-accent-bright/90 border bg-white/5 border-white/10 hover:border-accent-bright/45 hover:bg-accent/15 hover:text-accent-bright',
                  compact ? 'h-7 w-7' : 'h-8 w-8 sm:h-9 sm:w-9',
                ),
          )}
          aria-label={`Reagir: ${label}`}
          title={label}
        >
          <Icon className={cn(compact || embedded ? 'w-3.5 h-3.5' : 'w-4 h-4')} strokeWidth={2.25} />
        </button>
      ))}
    </div>
  )
}
