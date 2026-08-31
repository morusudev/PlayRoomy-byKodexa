import type { ConnectionStatus } from '../../types'
import { cn } from '../../lib/cn'

const config: Record<
  ConnectionStatus,
  { label: string; color: string; pulse?: boolean }
> = {
  idle: { label: 'Aguardando', color: 'bg-text-muted' },
  connecting: { label: 'Conectando...', color: 'bg-warning', pulse: true },
  connected: { label: 'Conectado', color: 'bg-success' },
  reconnecting: { label: 'Reconectando...', color: 'bg-warning', pulse: true },
  disconnected: { label: 'Desconectado', color: 'bg-danger' },
  error: { label: 'Erro', color: 'bg-danger' },
}

interface ConnectionBadgeProps {
  status: ConnectionStatus
}

export function ConnectionBadge({ status }: ConnectionBadgeProps) {
  const { label, color, pulse } = config[status]

  return (
    <div className="flex items-center gap-2 text-xs text-text-muted">
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              color,
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', color)} />
      </span>
      {label}
    </div>
  )
}
