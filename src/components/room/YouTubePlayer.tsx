import { useEffect, useRef, useState } from 'react'
import { PlayCircle, Volume2, VolumeX } from 'lucide-react'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import type { PlayerState } from '../../types'
import { cn } from '../../lib/cn'

interface YouTubePlayerProps {
  playerState: PlayerState | null
  isAuthority: boolean
  onPlay: (time: number) => void
  onPause: (time: number) => void
  onSeek: (time: number) => void
  onVideoEnded: () => void
  onError: (message: string) => void
}

export function YouTubePlayer({
  playerState,
  isAuthority,
  onPlay,
  onPause,
  onSeek,
  onVideoEnded,
  onError,
}: YouTubePlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const update = () => {
      const rect = host.getBoundingClientRect()
      const width = Math.max(0, Math.floor(rect.width))
      const height = Math.max(0, Math.floor(rect.height))
      if (width < 160 || height < 90) return
      setBox((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      )
    }

    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(host)
    window.addEventListener('resize', update)
    const t = window.setTimeout(update, 50)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
      window.clearTimeout(t)
    }
  }, [])

  const { isReady, muted, volume, toggleMute, changeVolume } = useYouTubePlayer({
    stageRef,
    size: box,
    playerState,
    isAuthority,
    onPlay,
    onPause,
    onSeek,
    onVideoEnded,
    onError,
  })

  const displayVol = muted ? 0 : volume

  return (
    <div className="flex flex-col w-full h-full min-h-[240px] gap-3">
      <div
        ref={hostRef}
        className="relative flex-1 min-h-0 bg-black rounded-xl overflow-hidden border border-border"
      >
        {!playerState?.videoId && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-1 text-text-muted pointer-events-none">
            <PlayCircle className="w-12 h-12 opacity-40" strokeWidth={1.25} />
            <div className="text-center px-4">
              <p className="text-sm font-medium text-text-secondary">Nenhum vídeo ainda</p>
              <p className="text-xs mt-1">Cole um link do YouTube acima para começar</p>
            </div>
          </div>
        )}

        <div
          ref={stageRef}
          className="absolute inset-0 z-0"
          style={{
            opacity: isReady ? 1 : 0,
            pointerEvents: isAuthority ? 'auto' : 'none',
          }}
        />

        {playerState?.videoId && (
          <div
            className={cn(
              'absolute top-3 left-3 z-20 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide pointer-events-none border shadow-lg',
              isAuthority
                ? 'bg-accent text-black border-accent'
                : 'bg-surface-2/95 text-text-primary border-border backdrop-blur-md',
            )}
          >
            {isAuthority ? 'Você controla o vídeo' : 'Só assistindo. Sync ativo'}
          </div>
        )}
      </div>

      {playerState?.videoId && (
        <div className="shrink-0 rounded-xl border-2 border-accent/35 bg-surface-2 px-4 py-3.5 shadow-[0_0_0_1px_rgba(61,214,140,0.08)]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Volume neste aparelho
            </p>
            <p className="text-sm font-display font-bold tabular-nums text-text-primary">
              {displayVol}%
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleMute()
              }}
              className={cn(
                'shrink-0 h-12 w-12 rounded-xl flex items-center justify-center transition-colors border',
                muted || volume === 0
                  ? 'bg-danger/15 border-danger/40 text-danger'
                  : 'bg-accent/15 border-accent/40 text-accent hover:bg-accent/25',
              )}
              title={muted ? 'Ativar som' : 'Mutar'}
              aria-label={muted ? 'Ativar som' : 'Mutar'}
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-6 h-6" strokeWidth={2.25} />
              ) : (
                <Volume2 className="w-6 h-6" strokeWidth={2.25} />
              )}
            </button>

            <div className="relative flex-1 h-12 flex items-center">
              <div className="absolute inset-x-0 h-3 rounded-full bg-surface-4 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-75"
                  style={{ width: `${displayVol}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={displayVol}
                onInput={(e) => changeVolume(Number((e.target as HTMLInputElement).value))}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="roomy-volume absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Volume só neste aparelho"
                aria-label="Volume local"
              />
              <div
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white border-2 border-accent shadow-md"
                style={{ left: `calc(${displayVol}% - 10px)` }}
              />
            </div>
          </div>

          <p className="mt-2.5 text-[11px] text-text-muted leading-snug">
            Mute e volume afetam só você. Play, pause e seek ficam com o host
            {isAuthority ? ' (você)' : ''}.
          </p>
        </div>
      )}
    </div>
  )
}
