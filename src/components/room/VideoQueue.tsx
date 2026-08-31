import type { QueueItem } from '../../types'
import { Button } from '../ui/Button'
import { getYouTubeThumbnail } from '../../utils/youtube'

interface VideoQueueProps {
  queue: QueueItem[]
  canManage: boolean
  isOwner: boolean
  onRemove: (id: string) => void
  onSkip: () => void
  onClear: () => void
}

export function VideoQueue({ queue, canManage, isOwner, onRemove, onSkip, onClear }: VideoQueueProps) {
  if (queue.length === 0) {
    return (
      <div className="px-3 py-4 text-center">
        <p className="text-text-muted text-sm">Fila vazia</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {isOwner && (
        <div className="flex gap-2 px-3 py-2 border-b border-border-subtle">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Pular
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Limpar
          </Button>
        </div>
      )}
      <div className="overflow-y-auto max-h-48">
        {queue.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-2 transition-colors group"
          >
            <span className="text-xs text-text-muted font-mono w-5">
              {String(i + 1).padStart(2, '0')}
            </span>
            <img
              src={getYouTubeThumbnail(item.videoId)}
              alt=""
              className="w-12 h-7 rounded object-cover bg-surface-3"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-primary truncate">{item.title}</p>
              <p className="text-[10px] text-text-muted">{item.addedByName}</p>
            </div>
            {canManage && isOwner && (
              <button
                onClick={() => onRemove(item.id)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger p-1 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
