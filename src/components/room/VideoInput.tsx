import { useState } from 'react'
import { extractYouTubeVideoId } from '../../utils/youtube'
import { Button } from '../ui/Button'

interface VideoInputProps {
  onAdd: (videoId: string, title: string, toQueue?: boolean) => void
  canChangeVideo: boolean
  canAddToQueue: boolean
  disabled?: boolean
}

export function VideoInput({ onAdd, canChangeVideo, canAddToQueue, disabled }: VideoInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleAdd = (toQueue = false) => {
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      setError('URL do YouTube inválida')
      return
    }
    setError('')
    onAdd(videoId, `Vídeo ${videoId.slice(0, 6)}…`, toQueue)
    setUrl('')
  }

  if (!canChangeVideo && !canAddToQueue) return null

  return (
    <div className="shrink-0 flex flex-col sm:flex-row gap-2 px-3 py-2 border-b border-border-subtle bg-surface-1/50">
      <div className="flex-1 min-w-0">
        <input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError('')
          }}
          placeholder="Cole um link do YouTube (watch, shorts, youtu.be)..."
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd(false)
          }}
          className="h-9 w-full rounded-lg bg-surface-2 border border-border px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all disabled:opacity-50"
        />
        {error && <p className="text-xs text-danger mt-1 px-1">{error}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        {canChangeVideo && (
          <Button onClick={() => handleAdd(false)} disabled={disabled || !url.trim()} size="sm">
            Reproduzir
          </Button>
        )}
        {canAddToQueue && (
          <Button
            variant="secondary"
            onClick={() => handleAdd(true)}
            disabled={disabled || !url.trim()}
            size="sm"
          >
            + Fila
          </Button>
        )}
      </div>
    </div>
  )
}
