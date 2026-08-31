import type { Participant, Role } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Dropdown } from '../ui/Dropdown'
import { ROLE_ICON, ROLE_ICON_CLASS } from './roleIcons'
import { cn } from '../../lib/cn'
import { MoreVertical } from 'lucide-react'

interface ParticipantListProps {
  participants: Participant[]
  localUserId?: string
  ownerId: string
  controllerId: string | null
  canManage: boolean
  onSetRole: (userId: string, role: Role) => void
  onKick: (userId: string) => void
  onTransferControl: (userId: string) => void
  onReclaimControl: () => void
}

export function ParticipantList({
  participants,
  localUserId,
  ownerId,
  controllerId,
  canManage,
  onSetRole,
  onKick,
  onTransferControl,
  onReclaimControl,
}: ParticipantListProps) {
  const sorted = [...participants].sort((a, b) => {
    const order: Record<Role, number> = { owner: 0, admin: 1, controller: 2, viewer: 3 }
    return order[a.role] - order[b.role] || a.joinedAt - b.joinedAt
  })

  const controller = participants.find((p) => p.id === controllerId)

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto py-1">
      {controllerId && controller && (
        <div className="mx-2 mb-2 rounded-lg border border-accent/20 bg-accent/5 px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
            Controle do player
          </p>
          <p className="text-sm text-accent font-medium mt-0.5 truncate">{controller.name}</p>
          {localUserId === ownerId && (
            <button
              onClick={onReclaimControl}
              className="text-xs text-text-muted hover:text-text-primary mt-1 transition-colors"
            >
              Recuperar controle
            </button>
          )}
        </div>
      )}

      {sorted.map((p) => {
        const Icon = ROLE_ICON[p.role]
        return (
          <div
            key={p.id}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 mx-1 rounded-lg transition-colors',
              p.id === localUserId ? 'bg-surface-3' : 'hover:bg-surface-2',
            )}
          >
            <Icon className={cn('w-3.5 h-3.5 shrink-0', ROLE_ICON_CLASS[p.role])} strokeWidth={2} />
            <Avatar name={p.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {p.name}
                {p.id === localUserId && (
                  <span className="text-text-muted font-normal ml-1">(você)</span>
                )}
              </p>
            </div>
            <Badge role={p.role} />

            {canManage && p.id !== localUserId && p.role !== 'owner' && (
              <Dropdown
                trigger={
                  <button className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-4 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                }
                items={[
                  ...(p.role !== 'admin'
                    ? [{ label: 'Promover a Admin', onClick: () => onSetRole(p.id, 'admin') }]
                    : [{ label: 'Remover Admin', onClick: () => onSetRole(p.id, 'viewer') }]),
                  ...(p.role !== 'controller'
                    ? [
                        {
                          label: 'Permitir controlar o vídeo',
                          onClick: () => onSetRole(p.id, 'controller'),
                        },
                      ]
                    : [
                        {
                          label: 'Remover controle do vídeo',
                          onClick: () => onSetRole(p.id, 'viewer'),
                        },
                      ]),
                  {
                    label: 'Controle temporário do player',
                    onClick: () => onTransferControl(p.id),
                  },
                  { label: 'Expulsar', onClick: () => onKick(p.id), danger: true },
                ]}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
