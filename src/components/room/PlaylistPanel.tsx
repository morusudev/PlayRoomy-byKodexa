import { useState } from 'react'
import { ListMusic, Play, Plus, SkipForward, Trash2, X } from 'lucide-react'
import type { QueueItem } from '../../types'
import { extractYouTubeVideoId, getYouTubeThumbnail } from '../../utils/youtube'
import { cn } from '../../lib/cn'

interface PlaylistPanelProps {
  open: boolean
  onClose: () => void
  queue: QueueItem[]
  canChangeVideo: boolean
  canManageQueue: boolean
  isOwner: boolean
  disabled?: boolean
  onPlayNow: (videoId: string, title: string) => void
  onAddToQueue: (videoId: string, title: string) => void
  onRemove: (id: string) => void
  onSkip: () => void
  onClear: () => void
}

export function PlaylistPanel({
  open,
  onClose,
  queue,
  canChangeVideo,
  canManageQueue,
  isOwner,
  disabled,
  onPlayNow,
  onAddToQueue,
  onRemove,
  onSkip,
  onClear,
}: PlaylistPanelProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const canAdd = canChangeVideo || canManageQueue

  const submit = (toQueue: boolean) => {
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      setError('Link inválido')
      return
    }
    setError('')
    const title = `Vídeo ${videoId.slice(0, 8)}`
    if (toQueue) onAddToQueue(videoId, title)
    else onPlayNow(videoId, title)
    setUrl('')
  }

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="absolute inset-0 z-30 bg-black/50 lg:bg-black/30"
        onClick={onClose}
        aria-label="Fechar playlist"
      />
      <div className="absolute inset-y-0 left-0 z-40 w-full sm:max-w-sm flex flex-col bg-surface-1 border-r border-border shadow-2xl animate-scale-in">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-accent" />
          <h3 className="font-display font-bold text-sm">Playlist</h3>
          <span className="text-xs text-text-muted">{queue.length} na fila</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-3 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          aria-label="Fechar playlist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {canAdd && (
        <div className="shrink-0 p-3 border-b border-border-subtle space-y-2">
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError('')
            }}
            disabled={disabled}
            placeholder="Colar link do YouTube..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit(false)
            }}
            className="w-full h-10 rounded-lg bg-surface-2 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
          />
          {error && <p className="text-xs text-danger px-1">{error}</p>}
          <div className="flex gap-2">
            {canChangeVideo && (
              <button
                type="button"
                disabled={disabled || !url.trim()}
                onClick={() => submit(false)}
                className="flex-1 h-10 rounded-lg bg-accent text-black text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] btn-shine"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Tocar agora
              </button>
            )}
            {canManageQueue && (
              <button
                type="button"
                disabled={disabled || !url.trim()}
                onClick={() => submit(true)}
                className="flex-1 h-10 rounded-lg bg-surface-3 border border-border text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] hover:bg-surface-4"
              >
                <Plus className="w-3.5 h-3.5" />
                Na fila
              </button>
            )}
          </div>
        </div>
      )}

      {isOwner && queue.length > 0 && (
        <div className="shrink-0 flex gap-2 px-3 py-2 border-b border-border-subtle">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-text-secondary hover:text-accent flex items-center gap-1"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Pular
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-text-secondary hover:text-danger flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {queue.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-10 px-4">
            Nenhum vídeo na fila. Adicione links acima.
          </p>
        ) : (
          queue.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle/50',
                'hover:bg-surface-2/80 transition-colors group',
              )}
            >
              <span className="text-xs font-mono text-text-muted w-5">{i + 1}</span>
              <img
                src={getYouTubeThumbnail(item.videoId)}
                alt=""
                className="w-16 h-9 rounded-md object-cover bg-surface-3 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{item.title}</p>
                <p className="text-[11px] text-text-muted">{item.addedByName}</p>
              </div>
              {canManageQueue && isOwner && (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-danger transition-all"
                  aria-label="Remover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
      </div>
    </>
  )
}
