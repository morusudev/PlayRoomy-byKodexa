import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
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
  Keyboard,
  X,
  VideoOff,
  Pin,
  PinOff,
  Loader2,
} from 'lucide-react'
import {
  readFullscreenChatPref,
  storeFullscreenChatPref,
} from '../../constants/fullscreenChat'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import { useAutoHideControls } from '../../hooks/useAutoHideControls'
import { usePlayerFeedback } from '../../hooks/usePlayerFeedback'
import { useTheaterShortcuts, THEATER_SHORTCUTS } from '../../hooks/useTheaterShortcuts'
import { useCoarsePointer } from '../../hooks/useCoarsePointer'
import { useTheaterFullscreen } from '../../hooks/useTheaterFullscreen'
import { isSyncDriver as checkSyncDriver } from '../../utils/permissions'
import type { ChatMessage, Participant, PlayerState, QueueItem, Role, RoomReaction } from '../../types'
import { ChatOverlay } from './ChatOverlay'
import { PlaylistPanel } from './PlaylistPanel'
import { ParticipantList } from './ParticipantList'
import { PlayerActionFlash } from './PlayerActionFlash'
import { ReactionBar } from './ReactionBar'
import { ReactionBurst } from './ReactionBurst'
import { cn } from '../../lib/cn'

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
  liveReactions: RoomReaction[]
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
  onStopVideo: () => void
  onError: (message: string) => void
  onSendChat: (text: string) => void
  onSendReaction: (kind: RoomReaction['kind']) => void
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
  liveReactions,
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
  onStopVideo,
  onError,
  onSendChat,
  onSendReaction,
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
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [showPeople, setShowPeople] = useState(false)
  const [showSidebarChat, setShowSidebarChat] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  const [showChatOnVideo, setShowChatOnVideo] = useState(false)
  const [fullscreenChatPref, setFullscreenChatPref] = useState(readFullscreenChatPref)
  const [scrubbing, setScrubbing] = useState(false)
  const [scrubTime, setScrubTime] = useState(0)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [touching, setTouching] = useState(false)
  const [touchGrace, setTouchGrace] = useState(false)
  const zoneTapRef = useRef(0)
  const touchGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const localParticipant = useMemo(
    () => participants.find((p) => p.id === localUserId),
    [participants, localUserId],
  )

  const canDrive = isAuthority || isOwner || canChangeVideo
  const syncDriver = useMemo(
    () => checkSyncDriver(localParticipant, controllerId, ownerId),
    [localParticipant, controllerId, ownerId],
  )
  const hasVideo = !!playerState?.videoId
  const isCoarse = useCoarsePointer()
  const uiPinned = scrubbing || touching || touchGrace || showShortcutsHelp
  const { isFullscreen, isImmersive, toggle: toggleFullscreen } = useTheaterFullscreen(theaterRef)
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
  } = useYouTubePlayer({
      stageRef,
      size: box,
      playerState,
      canSendCommands: canDrive,
      isSyncDriver: syncDriver,
      isCoarse,
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
    showFeedback(`menos ${SEEK_STEP_SEC}s`, {
      large: true,
      toast: `Voltou ${SEEK_STEP_SEC} segundos`,
    })
  }, [canDrive, hasVideo, seekBy, showFeedback])

  const handleSeekForward = useCallback(() => {
    if (!canDrive || !hasVideo) return
    seekBy(SEEK_STEP_SEC)
    showFeedback(`mais ${SEEK_STEP_SEC}s`, {
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
    const entered = await toggleFullscreen()
    showFeedback(entered ? 'Tela cheia' : 'Sair', {
      toast: entered ? 'Modo tela cheia' : 'Saiu da tela cheia',
    })
  }, [showFeedback, toggleFullscreen])

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
    if (isFullscreen) {
      setShowChatOnVideo((open) => {
        const next = !open
        showFeedback(next ? 'Chat' : 'Fechar', {
          toast: next ? 'Chat no vídeo' : 'Chat fechado',
        })
        return next
      })
      return
    }

    const isLarge = window.matchMedia('(min-width: 1024px)').matches
    if (isLarge || isCoarse) {
      setShowSidebarChat((open) => {
        const next = !open
        showFeedback(next ? 'Chat' : 'Fechar', {
          toast: next ? 'Chat aberto' : 'Chat fechado',
        })
        if (next) setShowChatOnVideo(false)
        return next
      })
      return
    }
    setShowChatOnVideo((open) => {
      const next = !open
      showFeedback(next ? 'Chat' : 'Fechar', {
        toast: next ? 'Chat no vídeo' : 'Chat fechado',
      })
      if (next) setShowSidebarChat(false)
      return next
    })
  }, [isCoarse, isFullscreen, showFeedback])

  const chatActive = isFullscreen ? showChatOnVideo : showChatOnVideo || showSidebarChat

  const toggleFullscreenChatPref = useCallback(() => {
    setFullscreenChatPref((prev) => {
      const next = !prev
      storeFullscreenChatPref(next)
      showFeedback(next ? 'Chat em FS' : 'Chat FS off', {
        toast: next
          ? 'Chat abre automaticamente em tela cheia'
          : 'Chat não abre mais automaticamente em tela cheia',
      })
      if (!next && isFullscreen) setShowChatOnVideo(false)
      return next
    })
  }, [isFullscreen, showFeedback])

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

  const handleStopVideo = useCallback(() => {
    if (!hasVideo || !canChangeVideo) return
    onStopVideo()
    showFeedback('Removido', { toast: 'Vídeo removido da sala' })
  }, [canChangeVideo, hasVideo, onStopVideo, showFeedback])

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
      const minW = isCoarse ? 120 : 160
      const minH = isCoarse ? 68 : 90
      if (width < minW || height < minH) return
      setBox((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      )
    }

    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(host)
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    window.addEventListener('orientationchange', update)
    const t = window.setTimeout(update, 80)
    const t2 = window.setTimeout(update, 320)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
      window.removeEventListener('orientationchange', update)
      window.clearTimeout(t)
      window.clearTimeout(t2)
    }
  }, [isFullscreen, showPlaylist, showSidebarChat, showChatOnVideo, isCoarse])

  useEffect(() => {
    if (isFullscreen) {
      setShowSidebarChat(false)
      if (fullscreenChatPref) setShowChatOnVideo(true)
      else setShowChatOnVideo(false)
    }
  }, [fullscreenChatPref, isFullscreen])

  useEffect(() => {
    return () => {
      if (touchGraceTimerRef.current) clearTimeout(touchGraceTimerRef.current)
    }
  }, [])

  const finishScrub = () => {
    if (!scrubbing) return
    seekTo(scrubTime)
    setScrubbing(false)
    showFeedback(formatTime(scrubTime), { toast: `Posição: ${formatTime(scrubTime)}` })
  }

  const handleVideoTouchStart = () => {
    setTouching(true)
    setTouchGrace(true)
    if (touchGraceTimerRef.current) clearTimeout(touchGraceTimerRef.current)
    revealControls()
  }

  const handleVideoTouchEnd = () => {
    setTouching(false)
    revealControls()
    if (touchGraceTimerRef.current) clearTimeout(touchGraceTimerRef.current)
    touchGraceTimerRef.current = setTimeout(() => setTouchGrace(false), 2800)
  }

  const handleVideoTap = () => {
    if (!isCoarse || !hasVideo) return
    revealControls()
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

  const overlayBtn = cn('theater-dock-btn', isCoarse && 'theater-dock-btn-coarse')

  const dockBtnActive = (active: boolean) => cn(overlayBtn, active && 'is-active')
  const dockBtnAccent = (active: boolean) =>
    cn(overlayBtn, active ? 'is-accent' : undefined)

  const playBtnClass = cn(
    'rounded-xl flex items-center justify-center shrink-0 font-bold shadow-md transition-all duration-200 active:scale-95 touch-manipulation',
    isCoarse ? 'h-12 w-12' : 'h-9 w-9 sm:h-11 sm:w-11',
    hasVideo ? 'bg-accent text-black' : 'bg-white/10 text-white/40 cursor-not-allowed',
  )

  const transportControlsInner = canDrive ? (
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
      <button type="button" onClick={handleSeekBack} className={overlayBtn} title={`Voltar ${SEEK_STEP_SEC} segundos`}>
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
      <button type="button" onClick={handleSeekForward} className={overlayBtn} title={`Avançar ${SEEK_STEP_SEC} segundos`}>
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
      {canChangeVideo && (
        <>
          <div className="theater-dock-divider mx-0.5" aria-hidden />
          <button
            type="button"
            onClick={handleStopVideo}
            className={cn(overlayBtn, 'hover:text-red-300 hover:bg-red-500/20')}
            title="Retirar vídeo"
            aria-label="Retirar vídeo"
          >
            <VideoOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </>
      )}
    </>
  ) : (
    <span className="text-[10px] sm:text-[11px] text-white/60 px-1 shrink-0">Assistindo</span>
  )

  const transportControls = (
    <div className="theater-dock-group px-1.5 sm:px-2 py-1 gap-0.5 sm:gap-1 shadow-none bg-black/55">
      {transportControlsInner}
    </div>
  )

  const volumeControl = (
    <div className={cn('theater-dock-group', isCoarse ? 'max-w-[3.25rem]' : 'flex-1 min-w-0 max-w-[9rem] sm:max-w-[11rem]')}>
      <button type="button" onClick={handleMuteToggle} className={overlayBtn} aria-label="Volume" title="Mutar">
        {muted || volume === 0 ? (
          <VolumeX className="w-4 h-4 sm:w-4 sm:h-4" />
        ) : (
          <Volume2 className="w-4 h-4 sm:w-4 sm:h-4" />
        )}
      </button>
      {!isCoarse ? (
        <div
          className="theater-volume-track"
          style={{ '--vol-pct': `${displayVol}%` } as CSSProperties}
        >
          <div className="theater-volume-fill" aria-hidden />
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
      ) : null}
    </div>
  )

  const socialControls = (
    <div className="theater-dock-group shrink-0">
      <button
        type="button"
        onClick={handleToggleChat}
        className={dockBtnActive(chatActive)}
        title="Chat"
        aria-label="Chat"
      >
        {chatActive ? (
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        ) : (
          <MessageSquareOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        )}
      </button>
      {isFullscreen ? (
        <button
          type="button"
          onClick={toggleFullscreenChatPref}
          className={dockBtnActive(fullscreenChatPref)}
          title={
            fullscreenChatPref
              ? 'Desativar chat automático em tela cheia'
              : 'Ativar chat automático em tela cheia'
          }
          aria-label={
            fullscreenChatPref
              ? 'Desativar chat automático em tela cheia'
              : 'Ativar chat automático em tela cheia'
          }
        >
          {fullscreenChatPref ? (
            <Pin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <PinOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>
      ) : null}
      <button
        type="button"
        onClick={handleTogglePeople}
        className={dockBtnActive(showPeople)}
        aria-label="Participantes"
        title="Participantes"
      >
        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        {participants.length > 1 && (
          <span className="sr-only">{participants.length} participantes</span>
        )}
      </button>
    </div>
  )

  const roomControls = (
    <div className="theater-dock-group shrink-0">
      <button
        type="button"
        onClick={handleTogglePlaylist}
        className={cn(dockBtnAccent(showPlaylist), 'relative sm:w-auto sm:px-2.5 sm:gap-1.5')}
        title="Playlist"
        aria-label="Playlist"
      >
        <ListMusic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline text-[11px] font-semibold">
          {queue.length > 0 ? queue.length : ''}
        </span>
        {queue.length > 0 && (
          <span className="sm:hidden absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-accent text-[8px] font-bold text-black flex items-center justify-center">
            {queue.length}
          </span>
        )}
      </button>
    </div>
  )

  const settingsControls = (
    <div className="theater-dock-group shrink-0 relative">
      {!isCoarse ? (
        <button
          type="button"
          onClick={() => setShowShortcutsHelp((v) => !v)}
          className={dockBtnActive(showShortcutsHelp)}
          title="Atalhos"
          aria-label="Atalhos de teclado"
        >
          <Keyboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => void handleToggleFullscreen()}
        className={overlayBtn}
        aria-label="Tela cheia"
        title="Tela cheia"
      >
        {isFullscreen ? (
          <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        ) : (
          <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        )}
      </button>
    </div>
  )

  const reactionDock = (
    <div className="theater-dock-group shrink-0">
      <ReactionBar
        embedded
        compact={isCoarse}
        disabled={!connected}
        onReact={onSendReaction}
      />
    </div>
  )

  const utilityDock = (
    <div className="theater-dock flex-1 min-w-0 justify-end overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {volumeControl}
      {!isCoarse ? <div className="theater-dock-divider hidden sm:block" aria-hidden /> : null}
      {socialControls}
      {roomControls}
      {settingsControls}
    </div>
  )

  return (
    <div
      ref={theaterRef}
      className={cn(
        'w-full h-full min-h-0 flex flex-col lg:flex-row overflow-hidden bg-surface-0',
        isImmersive && 'theater-immersive',
        isFullscreen ? 'rounded-none' : 'lg:rounded-2xl lg:border lg:border-border-subtle lg:bg-surface-1',
      )}
    >
      <div className="relative flex flex-col min-h-0 flex-1 lg:min-w-0">
        <div
          ref={videoHostRef}
          className={cn(
            'group/video relative w-full bg-black overflow-hidden isolate touch-manipulation',
            'flex-1 min-h-0 max-lg:min-h-[52dvh] lg:min-h-[240px]',
          )}
          onMouseMove={hasVideo ? revealControls : undefined}
          onMouseEnter={hasVideo ? revealControls : undefined}
          onMouseLeave={hasVideo ? hideControls : undefined}
          onTouchStart={hasVideo ? handleVideoTouchStart : undefined}
          onTouchEnd={hasVideo ? handleVideoTouchEnd : undefined}
          onClick={hasVideo ? handleVideoTap : undefined}
        >
          {!hasVideo && (
            <div className="absolute inset-0 z-10 flex flex-col animate-fade-in">
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 pt-6 sm:pt-10">
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-accent/20 animate-play-ring" />
                  <Radio className="relative w-10 h-10 text-white/30 animate-float" />
                </div>
                <p className="text-sm sm:text-base text-white/55 text-center">Aguardando um vídeo</p>
              </div>
              {canDrive && connected && (
                <div className="shrink-0 px-6 pb-8 sm:pb-10 pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowPlaylist(true)}
                    className="interactive-card inline-flex items-center gap-3 px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-accent/12 border border-accent/35 text-accent font-bold text-sm sm:text-base hover:bg-accent hover:text-black group"
                    aria-label="Abrir playlist"
                  >
                    <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-accent/20 group-hover:bg-black/10 transition-colors">
                      <ListMusic className="w-5 h-5 sm:w-6 sm:h-6" />
                    </span>
                    <span>Abrir playlist</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div
            ref={stageRef}
            className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center pointer-events-none"
            style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.35s ease' }}
          />

          {hasVideo && !isReady && (
            <div className="absolute inset-0 z-[12] flex flex-col items-center justify-center gap-3 bg-black/85 pointer-events-none">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="text-sm text-white/70">Carregando vídeo...</p>
            </div>
          )}

          {hasVideo && (
            <div className="absolute inset-0 z-[5] pointer-events-none" aria-hidden />
          )}

          {hasVideo && isCoarse && canDrive && (
            <>
              <button
                type="button"
                className="absolute left-0 top-0 bottom-24 w-[34%] z-[8] touch-manipulation"
                aria-label={`Voltar ${SEEK_STEP_SEC} segundos`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleZoneTap('back')
                }}
              />
              <button
                type="button"
                className="absolute right-0 top-0 bottom-24 w-[34%] z-[8] touch-manipulation"
                aria-label={`Avançar ${SEEK_STEP_SEC} segundos`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleZoneTap('forward')
                }}
              />
            </>
          )}

          <PlayerActionFlash message={flashMessage} large={flashLarge} />
          <ReactionBurst reactions={liveReactions} />

          {canDrive && hasVideo && (
            <div className="absolute inset-0 z-[15] flex items-center justify-center pointer-events-none">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayPause()
                }}
                className={cn(
                  'rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 touch-manipulation pointer-events-auto',
                  isCoarse ? 'h-16 w-16' : 'h-14 w-14 sm:h-[4.25rem] sm:w-[4.25rem]',
                  'bg-black/60 backdrop-blur-md border border-white/25 text-white active:scale-95',
                  isCoarse
                    ? !isPlaying || controlsVisible
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-90 pointer-events-none'
                    : cn(
                        'opacity-0 scale-90 pointer-events-none',
                        'group-hover/video:opacity-100 group-hover/video:scale-100 group-hover/video:pointer-events-auto',
                        controlsVisible && 'opacity-100 scale-100 pointer-events-auto',
                      ),
                )}
                aria-label={isPlaying ? 'Pausar' : 'Play'}
                title={isPlaying ? 'Pausar' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className={cn(isCoarse ? 'w-8 h-8' : 'w-7 h-7 sm:w-8 sm:h-8')} strokeWidth={2.5} />
                ) : (
                  <Play className={cn(isCoarse ? 'w-8 h-8 ml-1' : 'w-7 h-7 sm:w-8 sm:h-8 ml-1')} fill="currentColor" />
                )}
              </button>
            </div>
          )}

          {hasVideo && (
            <div className={cn('absolute inset-x-0 bottom-0 z-[50] pointer-events-none', chromeClass)}>
              <div
                className={cn(
                  'bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-3 sm:pt-10 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-3.5 px-2 sm:px-4',
                  controlsVisible ? 'pointer-events-auto' : 'pointer-events-none',
                )}
              >
                {duration > 0 && (
                  <div className="mb-1 sm:mb-2.5">
                    <div className={cn('relative rounded-full bg-white/20', isCoarse ? 'h-3' : 'h-1 sm:h-2')}>
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

                <div className={cn('flex flex-col min-w-0', isCoarse ? 'gap-3' : 'gap-2.5 sm:gap-3')}>
                  <div className="flex justify-center">{transportControls}</div>
                  <div className="theater-dock min-w-0">
                    {reactionDock}
                    {utilityDock}
                  </div>
                </div>
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
                    <li>Toque na tela para mostrar os controles.</li>
                    <li>
                      Toque duas vezes na <strong className="text-text-primary">esquerda</strong> ou{' '}
                      <strong className="text-text-primary">direita</strong> do vídeo para mais ou menos{' '}
                      {SEEK_STEP_SEC} segundos.
                    </li>
                    <li>Botão de play grande aparece quando o vídeo está pausado.</li>
                    <li>Chat fixo embaixo do vídeo. Use o ícone de mensagem.</li>
                  </ul>
                ) : null}
              </div>
            </div>
          )}

          <div className={cn('absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20 flex items-center gap-1 sm:gap-2 pointer-events-none', chromeClass)}>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white animate-live-dot" />
              </span>
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
                syncDriver ? 'bg-accent/90 text-black font-semibold' : 'bg-black/50 text-white/70',
              )}
            >
              {syncDriver ? 'Você controla' : canDrive ? 'Pode controlar' : 'Sync'}
            </span>
          </div>

          {showChatOnVideo && (
            <div
              className={cn(
                'absolute z-[60] pointer-events-auto',
                isFullscreen
                  ? 'top-12 right-2 bottom-20 w-[min(92%,20rem)] sm:w-80'
                  : 'top-10 right-0 bottom-2 w-[min(92%,16rem)] sm:w-60',
              )}
            >
              <ChatOverlay
                messages={chatMessages}
                onSend={onSendChat}
                onReact={onSendReaction}
                reactionsEnabled={connected}
                localUserId={localUserId}
                variant="overlay"
                className="h-full rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                onClose={() => setShowChatOnVideo(false)}
                showFullscreenPref={isFullscreen}
                fullscreenChatPref={fullscreenChatPref}
                onToggleFullscreenChatPref={toggleFullscreenChatPref}
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
          <div className="lg:hidden flex flex-col min-h-[9rem] max-h-[38dvh] flex-1 shrink-0 border-t border-border-subtle bg-surface-1">
            <ChatOverlay
              messages={chatMessages}
              onSend={onSendChat}
              onReact={onSendReaction}
              reactionsEnabled={connected}
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
            onReact={onSendReaction}
            reactionsEnabled={connected}
            localUserId={localUserId}
            variant="panel"
          />
        </div>
      )}
    </div>
  )
}
