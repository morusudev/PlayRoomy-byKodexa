import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  ListMusic,
  Users,
  MessageSquare,
  MessageSquareOff,
  Radio,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Rewind,
  FastForward,
  Settings,
  Keyboard,
  X,
} from 'lucide-react'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import { useAutoHideControls } from '../../hooks/useAutoHideControls'
import { usePlayerFeedback } from '../../hooks/usePlayerFeedback'
import { useTheaterShortcuts, THEATER_SHORTCUTS } from '../../hooks/useTheaterShortcuts'
import { useCoarsePointer } from '../../hooks/useCoarsePointer'
import type { ChatMessage, Participant, PlayerState, QueueItem, Role } from '../../types'
import { ChatOverlay } from './ChatOverlay'
import { PlaylistPanel } from './PlaylistPanel'
import { ParticipantList } from './ParticipantList'
import { PlayerActionFlash } from './PlayerActionFlash'
import { cn } from '../../lib/cn'
import { qualityLabel } from '../../utils/youtubeQuality'

const SEEK_STEP_SEC = 15

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

interface WatchTheaterProps {
  playerState: PlayerState | null
  isAuthority: boolean
  chatMessages: ChatMessage[]
  localUserId?: string
  participants: Participant[]
  ownerId: string
  controllerId: string | null
  canManageUsers: boolean
  queue: QueueItem[]
  hasPreviousVideo: boolean
  canChangeVideo: boolean
  canManageQueue: boolean
  isOwner: boolean
  connected: boolean
  peerCount: number
  onPlay: (time: number) => void
  onPause: (time: number) => void
  onSeek: (time: number) => void
  onVideoEnded: () => void
  onError: (message: string) => void
  onSendChat: (text: string) => void
  onPlayNow: (videoId: string, title: string) => void
  onAddToQueue: (videoId: string, title: string) => void
  onRemoveFromQueue: (id: string) => void
  onSkipQueue: () => void
  onPrevQueue: () => void
  onClearQueue: () => void
  onSetRole: (userId: string, role: Role) => void
  onKick: (userId: string) => void
  onTransferControl: (userId: string) => void
  onReclaimControl: () => void
}

export function WatchTheater({
  playerState,
  isAuthority,
  chatMessages,
  localUserId,
  participants,
  ownerId,
  controllerId,
  canManageUsers,
  queue,
  hasPreviousVideo,
  canChangeVideo,
  canManageQueue,
  isOwner,
  connected,
  peerCount,
  onPlay,
  onPause,
  onSeek,
  onVideoEnded,
  onError,
  onSendChat,
  onPlayNow,
  onAddToQueue,
  onRemoveFromQueue,
  onSkipQueue,
  onPrevQueue,
  onClearQueue,
  onSetRole,
  onKick,
  onTransferControl,
  onReclaimControl,
}: WatchTheaterProps) {
  const theaterRef = useRef<HTMLDivElement>(null)
  const videoHostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [showPeople, setShowPeople] = useState(false)
  const [showSidebarChat, setShowSidebarChat] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  const [showChatOnVideo, setShowChatOnVideo] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  const [scrubTime, setScrubTime] = useState(0)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [touching, setTouching] = useState(false)
  const qualityMenuRef = useRef<HTMLDivElement>(null)
  const zoneTapRef = useRef(0)

  const canDrive = isAuthority || isOwner || canChangeVideo
  const hasVideo = !!playerState?.videoId
  const isCoarse = useCoarsePointer()
  const uiPinned = scrubbing || showQualityMenu || touching || showShortcutsHelp
  const { flashMessage, flashLarge, showFeedback } = usePlayerFeedback()
  const { controlsVisible, revealControls, hideControls } = useAutoHideControls(
    uiPinned,
    hasVideo,
    isCoarse,
  )
  const chromeClass = cn(
    'transition-opacity duration-300 ease-out',
    controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
  )

  const {
    isReady,
    muted,
    volume,
    toggleMute,
    changeVolume,
    play,
    pause,
    seekBy,
    seekTo,
    playback,
    qualities,
    quality,
    changeQuality,
  } = useYouTubePlayer({
      stageRef,
      size: box,
      playerState,
      isAuthority: canDrive,
      onPlay,
      onPause,
      onSeek,
      onVideoEnded,
      onError,
    })

  const displayVol = muted ? 0 : volume
  const isPlaying = playerState?.playing ?? false
  const canPlaylistNav = canDrive && (canManageQueue || isOwner)
  const canGoNext = canPlaylistNav && queue.length > 0
  const canGoPrevious = canPlaylistNav && hasPreviousVideo
  const duration = playback.duration
  const currentTime = scrubbing ? scrubTime : playback.current
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const handleSeekBack = useCallback(() => {
    if (!canDrive || !hasVideo) return
    seekBy(-SEEK_STEP_SEC)
    showFeedback(`−${SEEK_STEP_SEC}s`, {
      large: true,
      toast: `Voltou ${SEEK_STEP_SEC} segundos`,
    })
  }, [canDrive, hasVideo, seekBy, showFeedback])

  const handleSeekForward = useCallback(() => {
    if (!canDrive || !hasVideo) return
    seekBy(SEEK_STEP_SEC)
    showFeedback(`+${SEEK_STEP_SEC}s`, {
      large: true,
      toast: `Avançou ${SEEK_STEP_SEC} segundos`,
    })
  }, [canDrive, hasVideo, seekBy, showFeedback])

  const handlePlayPause = useCallback(() => {
    if (!hasVideo || !canDrive) return
    if (isPlaying) {
      pause()
      showFeedback('Pausado', { toast: 'Vídeo pausado' })
    } else {
      play()
      showFeedback('Play', { toast: 'Reproduzindo' })
    }
  }, [canDrive, hasVideo, isPlaying, pause, play, showFeedback])

  const handleMuteToggle = useCallback(() => {
    const willMute = !(muted || volume === 0)
    toggleMute()
    showFeedback(willMute ? 'Mudo' : 'Som on', {
      toast: willMute ? 'Som desativado' : 'Som ativado',
    })
  }, [muted, volume, toggleMute, showFeedback])

  const handleVolumeUp = useCallback(() => {
    const base = muted ? 0 : volume
    const next = Math.min(100, base + 10)
    changeVolume(next)
    showFeedback(`${next}%`, { toast: `Volume ${next}%` })
  }, [changeVolume, muted, showFeedback, volume])

  const handleVolumeDown = useCallback(() => {
    const base = muted ? 0 : volume
    const next = Math.max(0, base - 10)
    changeVolume(next)
    showFeedback(`${next}%`, { toast: `Volume ${next}%` })
  }, [changeVolume, muted, showFeedback, volume])

  const handlePrevVideo = useCallback(() => {
    if (!canGoPrevious) return
    onPrevQueue()
    showFeedback('Anterior', { toast: 'Vídeo anterior' })
  }, [canGoPrevious, onPrevQueue, showFeedback])

  const handleNextVideo = useCallback(() => {
    if (!canGoNext) return
    onSkipQueue()
    showFeedback('Próximo', { toast: 'Próximo vídeo' })
  }, [canGoNext, onSkipQueue, showFeedback])

  const handleToggleFullscreen = useCallback(async () => {
    if (!theaterRef.current) return
    if (!document.fullscreenElement) {
      await theaterRef.current.requestFullscreen()
      showFeedback('Tela cheia', { toast: 'Modo tela cheia' })
    } else {
      await document.exitFullscreen()
      showFeedback('Sair', { toast: 'Saiu da tela cheia' })
    }
  }, [showFeedback])

  const handleTogglePlaylist = useCallback(() => {
    setShowPlaylist((open) => {
      const next = !open
      showFeedback(next ? 'Playlist' : 'Fechar', {
        toast: next ? 'Playlist aberta' : 'Playlist fechada',
      })
      if (next) setShowPeople(false)
      return next
    })
  }, [showFeedback])

  const handleToggleChat = useCallback(() => {
    if (isCoarse) {
      setShowSidebarChat((open) => {
        const next = !open
        showFeedback(next ? 'Chat' : 'Fechar', {
          toast: next ? 'Chat aberto' : 'Chat fechado',
        })
        return next
      })
      return
    }
    setShowChatOnVideo((open) => {
      const next = !open
      showFeedback(next ? 'Chat' : 'Fechar', {
        toast: next ? 'Chat no vídeo' : 'Chat fechado',
      })
      return next
    })
  }, [isCoarse, showFeedback])

  const handleTogglePeople = useCallback(() => {
    setShowPeople((open) => {
      const next = !open
      showFeedback(next ? 'Pessoas' : 'Fechar', {
        toast: next ? 'Participantes' : 'Painel fechado',
      })
      if (next) setShowPlaylist(false)
      return next
    })
  }, [showFeedback])

  const handleToggleQuality = useCallback(() => {
    revealControls()
    setShowQualityMenu((open) => {
      const next = !open
      showFeedback(next ? 'Qualidade' : 'Fechar', {
        toast: next ? 'Menu de qualidade' : 'Menu fechado',
      })
      return next
    })
  }, [revealControls, showFeedback])

  const handleQualitySelect = useCallback(
    (level: string) => {
      changeQuality(level)
      setShowQualityMenu(false)
      showFeedback(qualityLabel(level), {
        toast: `Qualidade: ${qualityLabel(level)}`,
      })
    },
    [changeQuality, showFeedback],
  )

  useTheaterShortcuts({
    enabled: hasVideo,
    onPlayPause: handlePlayPause,
    onSeekBack: handleSeekBack,
    onSeekForward: handleSeekForward,
    onPrevVideo: handlePrevVideo,
    onNextVideo: handleNextVideo,
    onToggleMute: handleMuteToggle,
    onVolumeUp: handleVolumeUp,
    onVolumeDown: handleVolumeDown,
    onToggleFullscreen: () => void handleToggleFullscreen(),
    onTogglePlaylist: handleTogglePlaylist,
    onToggleChat: handleToggleChat,
    onToggleQuality: handleToggleQuality,
    onToggleHelp: () => setShowShortcutsHelp((v) => !v),
    canDrive,
    canGoPrevious,
    canGoNext,
  })

  useEffect(() => {
    const host = videoHostRef.current
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
    const t = window.setTimeout(update, 80)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
      window.clearTimeout(t)
    }
  }, [isFullscreen, showPlaylist, showSidebarChat, showChatOnVideo])

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    if (!showQualityMenu) return
    const onPointerDown = (event: PointerEvent) => {
      if (!qualityMenuRef.current?.contains(event.target as Node)) {
        setShowQualityMenu(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showQualityMenu])

  const finishScrub = () => {
    if (!scrubbing) return
    seekTo(scrubTime)
    setScrubbing(false)
    showFeedback(formatTime(scrubTime), { toast: `Posição: ${formatTime(scrubTime)}` })
  }

  const handleZoneTap = (direction: 'back' | 'forward') => {
    const now = Date.now()
    if (now - zoneTapRef.current < 380) {
      if (direction === 'back') handleSeekBack()
      else handleSeekForward()
      zoneTapRef.current = 0
      return
    }
    zoneTapRef.current = now
    revealControls()
  }

  const overlayBtn =
    'h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center text-white/90 hover:text-white hover:bg-white/15 active:bg-white/20 transition-colors shrink-0 touch-manipulation'

  const playBtnClass = cn(
    'rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 font-bold shadow-md transition-transform active:scale-95 touch-manipulation',
    'h-9 w-9 sm:h-11 sm:w-11',
    hasVideo ? 'bg-accent text-black hover:bg-accent-hover' : 'bg-white/10 text-white/40 cursor-not-allowed',
  )

  const transportControls = canDrive ? (
    <>
      <button
        type="button"
        onClick={handlePrevVideo}
        disabled={!canGoPrevious}
        className={cn(overlayBtn, !canGoPrevious && 'opacity-40 cursor-not-allowed')}
        title="Vídeo anterior"
      >
        <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
      <button type="button" onClick={handleSeekBack} className={overlayBtn} title={`-${SEEK_STEP_SEC}s`}>
        <Rewind className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
      <button
        type="button"
        onClick={handlePlayPause}
        disabled={!hasVideo}
        className={playBtnClass}
        title={isPlaying ? 'Pausar' : 'Play'}
        aria-label={isPlaying ? 'Pausar' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
        ) : (
          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        )}
      </button>
      <button type="button" onClick={handleSeekForward} className={overlayBtn} title={`+${SEEK_STEP_SEC}s`}>
        <FastForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
      <button
        type="button"
        onClick={handleNextVideo}
        disabled={!canGoNext}
        className={cn(overlayBtn, !canGoNext && 'opacity-40 cursor-not-allowed')}
        title="Próximo vídeo"
      >
        <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </>
  ) : (
    <span className="text-[10px] sm:text-[11px] text-white/60 px-1 shrink-0">Assistindo</span>
  )

  const utilityControls = (
    <>
      <button type="button" onClick={handleMuteToggle} className={overlayBtn} aria-label="Volume" title="Mutar">
        {muted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </button>
      <div className="relative w-14 sm:w-24 h-8 flex items-center shrink-0 hidden sm:flex">
        <div className="absolute inset-x-0 h-1 rounded-full bg-white/25 overflow-hidden">
          <div className="h-full rounded-full bg-accent" style={{ width: `${displayVol}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={displayVol}
          onInput={(e) => changeVolume(Number(e.currentTarget.value))}
          onChange={(e) => changeVolume(Number(e.target.value))}
          className="roomy-volume absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Volume local"
        />
      </div>
      <div ref={qualityMenuRef} className="relative shrink-0">
        <button
          type="button"
          onClick={handleToggleQuality}
          className={cn(overlayBtn, 'sm:gap-1 sm:px-2 sm:w-auto sm:min-w-9', showQualityMenu && 'bg-white/15')}
          title="Qualidade"
          aria-label="Qualidade"
        >
          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline text-[10px] font-semibold tabular-nums">{qualityLabel(quality)}</span>
        </button>
        {showQualityMenu && (
          <div
            className={cn(
              'rounded-lg border border-white/15 bg-black/95 py-1 shadow-xl backdrop-blur-sm',
              isCoarse
                ? 'fixed inset-x-2 bottom-[max(3.25rem,env(safe-area-inset-bottom))] z-[60] max-h-[40vh] overflow-y-auto'
                : 'absolute bottom-full right-0 mb-2 min-w-[9rem]',
            )}
          >
            {qualities.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-white/60">Carregando…</p>
            ) : (
              qualities.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleQualitySelect(level)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-xs hover:bg-white/10 transition-colors touch-manipulation',
                    level === quality ? 'text-accent font-semibold' : 'text-white/90',
                  )}
                >
                  {qualityLabel(level)}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleToggleChat}
        className={cn(overlayBtn, (showChatOnVideo || (isCoarse && showSidebarChat)) && 'bg-accent/25 text-accent')}
        title="Chat"
      >
        {showChatOnVideo || (isCoarse && showSidebarChat) ? (
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        ) : (
          <MessageSquareOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        )}
      </button>
      <button
        type="button"
        onClick={() => setShowSidebarChat((v) => !v)}
        className={cn('hidden lg:flex', overlayBtn, showSidebarChat && 'bg-white/15')}
        title="Painel de chat"
      >
        <MessageSquare className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handleTogglePlaylist}
        className={cn(
          overlayBtn,
          'relative sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5 sm:text-xs sm:font-semibold',
          showPlaylist ? 'bg-accent text-black' : 'bg-white/10 text-white/90 hover:bg-white/20 sm:bg-transparent sm:hover:bg-white/15',
        )}
        title="Playlist"
      >
        <ListMusic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">
          Playlist{queue.length > 0 ? ` (${queue.length})` : ''}
        </span>
        {isCoarse && queue.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-accent text-[8px] font-bold text-black flex items-center justify-center">
            {queue.length}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={handleTogglePeople}
        className={cn(overlayBtn, showPeople && 'bg-white/15')}
        aria-label="Pessoas"
      >
        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
      <button
        type="button"
        onClick={() => setShowShortcutsHelp((v) => !v)}
        className={cn(overlayBtn, showShortcutsHelp && 'bg-white/15')}
        title={isCoarse ? 'Dicas' : 'Atalhos'}
        aria-label={isCoarse ? 'Dicas de uso' : 'Atalhos de teclado'}
      >
        <Keyboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
      <button
        type="button"
        onClick={() => void handleToggleFullscreen()}
        className={overlayBtn}
        aria-label="Tela cheia"
        title="Tela cheia"
      >
        {isFullscreen ? <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </button>
    </>
  )

  return (
    <div
      ref={theaterRef}
      className={cn(
        'w-full h-full min-h-0 flex flex-col lg:flex-row overflow-hidden',
        'rounded-lg sm:rounded-xl lg:rounded-2xl border border-border-subtle bg-surface-1',
        isFullscreen && 'rounded-none',
      )}
    >
      <div className="relative flex flex-col min-h-0 flex-1 lg:min-w-0">
        <div
          ref={videoHostRef}
          className={cn(
            'relative w-full bg-black overflow-hidden isolate touch-manipulation',
            'aspect-video lg:aspect-auto lg:flex-1 lg:min-h-[240px]',
          )}
          onMouseMove={hasVideo ? revealControls : undefined}
          onMouseEnter={hasVideo ? revealControls : undefined}
          onMouseLeave={hasVideo ? hideControls : undefined}
          onTouchStart={
            hasVideo
              ? () => {
                  setTouching(true)
                  revealControls()
                }
              : undefined
          }
          onTouchEnd={
            hasVideo
              ? () => {
                  setTouching(false)
                  revealControls()
                }
              : undefined
          }
        >
          {!hasVideo && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
              <Radio className="w-10 h-10 text-white/25" />
              <p className="text-sm text-white/50">Aguardando um vídeo</p>
              {canDrive && connected && (
                <button
                  type="button"
                  onClick={() => setShowPlaylist(true)}
                  className="text-xs text-accent hover:underline"
                >
                  Abrir playlist
                </button>
              )}
            </div>
          )}

          <div
            ref={stageRef}
            className="absolute inset-0 z-0 overflow-hidden"
            style={{ opacity: isReady ? 1 : 0, pointerEvents: 'none' }}
          />

          {hasVideo && (
            <div className="absolute inset-0 z-[5] pointer-events-none" aria-hidden />
          )}

          {hasVideo && isCoarse && canDrive && (
            <>
              <button
                type="button"
                className="absolute left-0 top-0 bottom-14 w-[38%] z-[8] touch-manipulation"
                aria-label={`Voltar ${SEEK_STEP_SEC} segundos`}
                onClick={() => handleZoneTap('back')}
              />
              <button
                type="button"
                className="absolute right-0 top-0 bottom-14 w-[38%] z-[8] touch-manipulation"
                aria-label={`Avançar ${SEEK_STEP_SEC} segundos`}
                onClick={() => handleZoneTap('forward')}
              />
            </>
          )}

          <PlayerActionFlash message={flashMessage} large={flashLarge} />

          {canDrive && hasVideo && !isPlaying && !isCoarse && (
            <button
              type="button"
              onClick={handlePlayPause}
              className={cn(
                'absolute z-[15] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-accent text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform pointer-events-auto',
                chromeClass,
              )}
              aria-label="Play"
            >
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
            </button>
          )}

          {hasVideo && (
            <div className={cn('absolute inset-x-0 bottom-0 z-[50] pointer-events-none', chromeClass)}>
              <div
                className={cn(
                  'bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-2 sm:pt-14 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:pb-3 px-1.5 sm:px-3',
                  controlsVisible ? 'pointer-events-auto' : 'pointer-events-none',
                )}
              >
                {duration > 0 && (
                  <div className="mb-1 sm:mb-2.5">
                    <div className="relative h-1 sm:h-2 rounded-full bg-white/20">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-accent"
                        style={{ width: `${progressPct}%` }}
                      />
                      {canDrive ? (
                        <input
                          type="range"
                          min={0}
                          max={duration}
                          step={0.1}
                          value={currentTime}
                          onPointerDown={() => {
                            setScrubbing(true)
                            setScrubTime(currentTime)
                          }}
                          onInput={(e) => setScrubTime(Number(e.currentTarget.value))}
                          onPointerUp={finishScrub}
                          onPointerCancel={finishScrub}
                          onBlur={finishScrub}
                          className="roomy-volume absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          aria-label="Posição do vídeo"
                        />
                      ) : (
                        <div className="absolute inset-0" aria-hidden />
                      )}
                    </div>
                    <div className="mt-0.5 flex justify-between text-[9px] sm:text-[11px] text-white/60 tabular-nums leading-none">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                )}

                {isCoarse ? (
                  <div className="flex items-center gap-1 min-w-0">
                    <div className="flex items-center gap-0.5 shrink-0">{transportControls}</div>
                    <div className="h-4 w-px bg-white/15 shrink-0" />
                    <div className="flex items-center gap-0.5 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {utilityControls}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-2">{transportControls}</div>
                    <div className="flex items-center gap-2">
                      {utilityControls}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {showShortcutsHelp && (
            <div className="absolute inset-0 z-[55] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
              <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-surface-1 p-4 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">
                  {isCoarse ? 'Dicas de uso' : 'Atalhos de teclado'}
                </h3>
                  <button
                    type="button"
                    onClick={() => setShowShortcutsHelp(false)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-3"
                    aria-label="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <ul className={cn('space-y-2 max-h-[50vh] overflow-y-auto', isCoarse && 'hidden sm:block')}>
                  {THEATER_SHORTCUTS.map((item) => (
                    <li
                      key={item.keys}
                      className="flex items-center justify-between gap-3 text-xs border-b border-border-subtle/60 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-text-secondary">{item.label}</span>
                      <kbd className="shrink-0 rounded-md bg-surface-3 px-2 py-1 font-mono text-[10px] text-text-primary">
                        {item.keys}
                      </kbd>
                    </li>
                  ))}
                </ul>
                {isCoarse ? (
                  <ul className="space-y-2 text-xs text-text-secondary">
                    <li>Toque na tela para mostrar ou esconder os controles.</li>
                    <li>
                      Toque duas vezes na <strong className="text-text-primary">esquerda</strong> ou{' '}
                      <strong className="text-text-primary">direita</strong> do vídeo para ±{SEEK_STEP_SEC}s.
                    </li>
                    <li>Botões maiores e barra de progresso mais grossa para o dedo.</li>
                    <li>Chat fixo embaixo do vídeo. Use o ícone de mensagem.</li>
                  </ul>
                ) : null}
              </div>
            </div>
          )}

          <div className={cn('absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20 flex items-center gap-1 sm:gap-2 pointer-events-none', chromeClass)}>
            <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold uppercase">
              Live
            </span>
            {peerCount > 0 && (
              <span className="hidden sm:inline text-[11px] text-white/80 bg-black/50 px-1.5 py-0.5 rounded">
                {peerCount + 1} online
              </span>
            )}
            <span
              className={cn(
                'text-[9px] sm:text-[11px] px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded',
                canDrive ? 'bg-accent/90 text-black font-semibold' : 'bg-black/50 text-white/70',
              )}
            >
              {canDrive ? 'Você controla' : 'Sync'}
            </span>
          </div>

          {showChatOnVideo && (
            <div className="absolute top-10 right-0 bottom-2 z-30 w-[min(92%,16rem)] sm:w-60 pointer-events-auto">
              <ChatOverlay
                messages={chatMessages}
                onSend={onSendChat}
                localUserId={localUserId}
                variant="overlay"
                className="h-full rounded-lg overflow-hidden"
              />
            </div>
          )}

          <PlaylistPanel
            open={showPlaylist}
            onClose={() => setShowPlaylist(false)}
            queue={queue}
            canChangeVideo={canChangeVideo}
            canManageQueue={canManageQueue}
            isOwner={isOwner}
            disabled={!connected}
            onPlayNow={onPlayNow}
            onAddToQueue={onAddToQueue}
            onRemove={onRemoveFromQueue}
            onSkip={onSkipQueue}
            onClear={onClearQueue}
          />

          {showPeople && (
            <div className="absolute inset-0 z-40 bg-surface-1/98">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
                <span className="text-sm font-semibold">Participantes</span>
                <button type="button" onClick={() => setShowPeople(false)} className="text-xs text-text-muted">
                  Fechar
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(100%-40px)]">
                <ParticipantList
                  participants={participants}
                  localUserId={localUserId}
                  ownerId={ownerId}
                  controllerId={controllerId}
                  canManage={canManageUsers}
                  onSetRole={onSetRole}
                  onKick={onKick}
                  onTransferControl={onTransferControl}
                  onReclaimControl={onReclaimControl}
                />
              </div>
            </div>
          )}
        </div>

        {!isFullscreen && showSidebarChat && !showChatOnVideo && (
          <div className="lg:hidden flex flex-col h-36 max-h-[30vh] shrink-0 border-t border-border-subtle bg-surface-1">
            <ChatOverlay
              messages={chatMessages}
              onSend={onSendChat}
              localUserId={localUserId}
              variant="panel"
            />
          </div>
        )}
      </div>

      {!isFullscreen && showSidebarChat && !showChatOnVideo && (
        <div className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col min-h-0 border-l border-border-subtle bg-surface-1">
          <ChatOverlay
            messages={chatMessages}
            onSend={onSendChat}
            localUserId={localUserId}
            variant="panel"
          />
        </div>
      )}
    </div>
  )
}
