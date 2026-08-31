import { cn } from '../../lib/cn'
import type { Role } from '../../types'
import { ROLE_LABELS } from '../../types'

const roleStyles: Record<Role, string> = {
  owner: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  controller: 'bg-accent/10 text-accent border-accent/20',
  viewer: 'bg-surface-4 text-text-muted border-border',
}

interface BadgeProps {
  role?: Role
  children?: React.ReactNode
  className?: string
}

export function Badge({ role, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border',
        role ? roleStyles[role] : 'bg-surface-3 text-text-secondary border-border',
        className,
      )}
    >
      {children ?? (role ? ROLE_LABELS[role] : null)}
    </span>
  )
}
