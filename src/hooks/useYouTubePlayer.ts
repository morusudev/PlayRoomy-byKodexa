import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import {
  createYouTubePlayer,
  disableYouTubeCaptions,
  YT,
  YT_ERROR_MESSAGES,
  type YtPlayer,
} from '../services/youtube/player'
import type { PlayerState } from '../types'
import {
  getExpectedTime,
  applyRemotePlayback,
  applyRemoteSeekOnly,
  matchesRemoteClosely,
  playerStateKey,
  SYNC_THRESHOLDS,
  type SyncApplyMode,
} from '../utils/sync'

interface UseYouTubePlayerOptions {
  stageRef: RefObject<HTMLDivElement | null>
  size: { width: number; height: number }
  playerState: PlayerState | null
  canSendCommands: boolean
  isSyncDriver: boolean
  isCoarse?: boolean
  onPlay: (time: number) => void
  onPause: (time: number) => void
  onSeek: (time: number) => void
  onVideoEnded: () => void
  onError: (message: string) => void
}

function applyIframeStyles(player: YtPlayer) {
  try {
    const iframe = player.getIframe()
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.maxWidth = '100%'
    iframe.style.maxHeight = '100%'
    iframe.style.border = '0'
    iframe.style.display = 'block'
    iframe.style.position = 'absolute'
    iframe.style.inset = '0'
    iframe.style.transform = 'none'
    iframe.style.pointerEvents = 'none'
  } catch {
    // ignore
  }
}

function applyIframeSize(player: YtPlayer, width: number, height: number, cssOnly = false) {
  if (!cssOnly) {
    player.setSize(width, height)
  }
  applyIframeStyles(player)
}

export function useYouTubePlayer({
  stageRef,
  size,
  playerState,
  canSendCommands,
  isSyncDriver,
  isCoarse = false,
  onPlay,
  onPause,
  onSeek,
  onVideoEnded,
  onError,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<YtPlayer | null>(null)
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [needsGesture, setNeedsGesture] = useState(false)

  const ignoreLocalUntil = useRef(0)
  const loadedVideoId = useRef<string | null>(null)
  const lastRemoteKey = useRef('')
  const lastRemotePlaying = useRef<boolean | null>(null)
  const lastAppliedRevision = useRef(-1)
  const suppressEchoUntil = useRef(0)
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const created = useRef(false)
  const audioRef = useRef({ muted: false, volume: 80 })
  const userActivatedRef = useRef(false)
  const lastAppliedSize = useRef({ width: 0, height: 0 })

  const canSendRef = useRef(canSendCommands)
  const isSyncDriverRef = useRef(isSyncDriver)
  const callbacksRef = useRef({ onPlay, onPause, onSeek, onVideoEnded, onError })
  const stateRef = useRef(playerState)
  const sizeRef = useRef(size)

  const syncMode: SyncApplyMode = isCoarse ? 'mobile' : 'desktop'
  const minWidth = isCoarse ? 100 : 160
  const minHeight = isCoarse ? 56 : 90
  const loadSettleMs = isCoarse ? 550 : 500
  const playbackTickMs = isCoarse ? 1000 : 400
  const driftIntervalMs = SYNC_THRESHOLDS[syncMode].driftIntervalMs

  canSendRef.current = canSendCommands
  isSyncDriverRef.current = isSyncDriver
  callbacksRef.current = { onPlay, onPause, onSeek, onVideoEnded, onError }
  stateRef.current = playerState
  sizeRef.current = size
  audioRef.current = { muted, volume }

  const silenceLocal = (ms: number) => {
    ignoreLocalUntil.current = Date.now() + ms
  }

  /** After we send a command, skip re-applying the echo if we already match. */
  const markLocalCommand = (ms = 900) => {
    silenceLocal(ms)
    suppressEchoUntil.current = Date.now() + ms
  }

  const checkGestureNeeded = useCallback(() => {
    const player = playerRef.current
    const state = stateRef.current
    if (!player || !state?.playing || isSyncDriverRef.current) {
      setNeedsGesture(false)
      return
    }
    window.setTimeout(() => {
      const p = playerRef.current
      const s = stateRef.current
      if (!p || !s?.playing) return
      const yt = p.getPlayerState()
      if (yt !== YT.PlayerState.PLAYING && yt !== YT.PlayerState.BUFFERING) {
        setNeedsGesture(true)
      } else {
        setNeedsGesture(false)
      }
    }, 700)
  }, [])

  const activatePlayback = useCallback(() => {
    userActivatedRef.current = true
    setNeedsGesture(false)
    const player = playerRef.current
    const state = stateRef.current
    if (!player || !state?.videoId) return
    silenceLocal(1200)
    applyRemotePlayback(player, state, audioRef.current, syncMode, true)
    checkGestureNeeded()
  }, [checkGestureNeeded, syncMode])

  useEffect(() => {
    const readyToMount = size.width >= minWidth && size.height >= minHeight
    if (!readyToMount) return
    if (created.current) return

    const stage = stageRef.current
    if (!stage) return

    created.current = true
    let cancelled = false

    stage.innerHTML = ''
    const mount = document.createElement('div')
    mountRef.current = mount
    mount.className = 'theater-yt-mount'
    mount.style.width = '100%'
    mount.style.height = '100%'
    mount.style.position = 'absolute'
    mount.style.inset = '0'
    mount.style.overflow = 'hidden'
    stage.appendChild(mount)

    const host = window.location.hostname
    const isLanIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host === 'localhost'
    const playerVars: Record<string, string | number> = {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      fs: 0,
      playsinline: 1,
      enablejsapi: 1,
      disablekb: 1,
      iv_load_policy: 3,
      cc_load_policy: 0,
    }
    if (!isLanIp) {
      playerVars.origin = window.location.origin
    }

    createYouTubePlayer(mount, {
      width: size.width,
      height: size.height,
      host: isLanIp ? undefined : 'https://www.youtube-nocookie.com',
      playerVars,
      events: {
        onReady: () => {
          const player = playerRef.current
          if (player) disableYouTubeCaptions(player)
        },
        onStateChange: (event) => {
          const player = playerRef.current
          if (player) disableYouTubeCaptions(player)

          if (Date.now() < ignoreLocalUntil.current) return
          // Only the sync driver publishes spontaneous YT play/pause/ended.
          // Other controllers use explicit UI commands (play/pause/seekTo).
          if (!isSyncDriverRef.current) return

          if (!player) return

          if (
            event.data === YT.PlayerState.BUFFERING ||
            event.data === YT.PlayerState.CUED ||
            event.data === YT.PlayerState.UNSTARTED
          ) {
            return
          }

          const time = player.getCurrentTime()
          const remote = stateRef.current

          if (event.data === YT.PlayerState.PLAYING) {
            if (pauseTimer.current) {
              clearTimeout(pauseTimer.current)
              pauseTimer.current = null
            }
            setNeedsGesture(false)
            if (remote?.playing) return
            markLocalCommand(800)
            callbacksRef.current.onPlay(time)
            return
          }

          if (event.data === YT.PlayerState.PAUSED) {
            if (remote && !remote.playing) return
            if (pauseTimer.current) clearTimeout(pauseTimer.current)
            pauseTimer.current = setTimeout(() => {
              pauseTimer.current = null
              if (Date.now() < ignoreLocalUntil.current) return
              if (!isSyncDriverRef.current) return
              const p = playerRef.current
              if (!p) return
              if (p.getPlayerState() !== YT.PlayerState.PAUSED) return
              markLocalCommand(800)
              callbacksRef.current.onPause(p.getCurrentTime())
            }, 280)
            return
          }

          if (event.data === YT.PlayerState.ENDED) {
            markLocalCommand(800)
            callbacksRef.current.onVideoEnded()
          }
        },
        onError: (event) => {
          const msg = YT_ERROR_MESSAGES[event.data] ?? 'Erro ao reproduzir o vídeo.'
          callbacksRef.current.onError(msg)
        },
      },
    }).then((player) => {
      if (cancelled) {
        player.destroy()
        created.current = false
        return
      }
      playerRef.current = player
      disableYouTubeCaptions(player)
      applyIframeSize(player, sizeRef.current.width, sizeRef.current.height)
      setIsReady(true)
    })

    return () => {
      cancelled = true
      if (pauseTimer.current) clearTimeout(pauseTimer.current)
      playerRef.current?.destroy()
      playerRef.current = null
      mountRef.current = null
      created.current = false
      setIsReady(false)
      loadedVideoId.current = null
      lastRemoteKey.current = ''
      lastRemotePlaying.current = null
      lastAppliedRevision.current = -1
      if (stageRef.current) stageRef.current.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width >= minWidth && size.height >= minHeight, minWidth, minHeight])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady) return
    if (size.width < minWidth || size.height < minHeight) return

    const dw = Math.abs(size.width - lastAppliedSize.current.width)
    const dh = Math.abs(size.height - lastAppliedSize.current.height)
    if (dw < 24 && dh < 24 && lastAppliedSize.current.width > 0) {
      applyIframeStyles(player)
      return
    }
    lastAppliedSize.current = { width: size.width, height: size.height }
    if (!isCoarse) {
      applyIframeSize(player, size.width, size.height)
    } else {
      applyIframeStyles(player)
    }
  }, [size.width, size.height, isReady, minWidth, minHeight, isCoarse])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady) return
    player.setVolume(volume)
    if (muted || volume === 0) player.mute()
    else player.unMute()
  }, [muted, volume, isReady])

  useEffect(() => {
    const player = playerRef.current
    const state = playerState
    const videoId = state?.videoId ?? null
    if (!player || !isReady || !state) return

    if (!videoId) {
      if (loadedVideoId.current) {
        loadedVideoId.current = null
        lastRemoteKey.current = ''
        lastRemotePlaying.current = null
        lastAppliedRevision.current = -1
        try {
          player.stopVideo()
        } catch {
          // ignore
        }
      }
      return
    }

    if (videoId === loadedVideoId.current) return

    loadedVideoId.current = videoId
    lastRemoteKey.current = ''
    lastRemotePlaying.current = null
    lastAppliedRevision.current = -1

    silenceLocal(3000)

    const startAt = state.playing
      ? Math.max(0, getExpectedTime(state))
      : Math.max(0, state.currentTime)

    if (isCoarse) {
      player.cueVideoById(videoId, startAt)
    } else if (state.playing) {
      player.mute()
      player.loadVideoById(videoId, startAt)
    } else {
      player.cueVideoById(videoId, startAt)
    }

    window.setTimeout(() => {
      if (!playerRef.current || loadedVideoId.current !== videoId) return
      const latest = stateRef.current
      if (!latest || latest.videoId !== videoId) return
      silenceLocal(2000)
      applyRemotePlayback(playerRef.current, latest, audioRef.current, syncMode, true)
      disableYouTubeCaptions(playerRef.current)
      lastRemoteKey.current = playerStateKey(latest)
      lastRemotePlaying.current = latest.playing
      lastAppliedRevision.current = latest.revision ?? 0
      checkGestureNeeded()
    }, loadSettleMs)
  }, [playerState?.videoId, isReady, loadSettleMs, syncMode, checkGestureNeeded])

  // Everyone follows authoritative server state — including the sync driver —
  // so a controller seek is never overwritten by a stale local timeline.
  useEffect(() => {
    const player = playerRef.current
    const state = playerState
    if (!player || !isReady || !state?.videoId) return
    if (state.videoId !== loadedVideoId.current) return

    const revision = state.revision ?? 0
    const key = playerStateKey(state)
    if (key === lastRemoteKey.current) return

    const playingChanged = lastRemotePlaying.current !== state.playing
    const isEchoWindow = Date.now() < suppressEchoUntil.current
    const alreadyClose = matchesRemoteClosely(player, state, syncMode)

    lastRemoteKey.current = key
    lastRemotePlaying.current = state.playing
    lastAppliedRevision.current = revision

    // Skip server echo of our own command when local player already matches.
    if (isEchoWindow && alreadyClose) {
      return
    }

    silenceLocal(isCoarse ? 1800 : 1000)

    if (playingChanged || !alreadyClose) {
      applyRemotePlayback(player, state, audioRef.current, syncMode, playingChanged)
      disableYouTubeCaptions(player)
      checkGestureNeeded()
      return
    }

    applyRemoteSeekOnly(player, state, syncMode)
  }, [
    isReady,
    isCoarse,
    syncMode,
    playerState?.videoId,
    playerState?.playing,
    playerState?.updatedAt,
    playerState?.revision,
    playerState?.currentTime,
    checkGestureNeeded,
  ])

  // Periodic drift correction for all clients while video is loaded.
  useEffect(() => {
    if (!isReady) return
    const id = window.setInterval(() => {
      const player = playerRef.current
      const state = stateRef.current
      if (!player || !state?.videoId) return
      if (state.videoId !== loadedVideoId.current) return
      if (Date.now() < ignoreLocalUntil.current) return
      if (Date.now() < suppressEchoUntil.current) return
      applyRemoteSeekOnly(player, state, syncMode)
    }, driftIntervalMs)
    return () => window.clearInterval(id)
  }, [isReady, syncMode, driftIntervalMs])

  useEffect(() => {
    if (!isReady) return
    const id = window.setInterval(() => {
      const player = playerRef.current
      if (!player || !loadedVideoId.current) return
      disableYouTubeCaptions(player)
    }, isCoarse ? 1200 : 2500)
    return () => window.clearInterval(id)
  }, [isReady, isCoarse])

  const handleSeek = useCallback((time: number) => {
    if (!canSendRef.current) return
    markLocalCommand()
    callbacksRef.current.onSeek(time)
  }, [])

  const toggleMute = useCallback(() => {
    userActivatedRef.current = true
    setMuted((prev) => {
      const next = !prev
      const player = playerRef.current
      if (player) {
        if (next) player.mute()
        else player.unMute()
      }
      return next
    })
  }, [])

  const changeVolume = useCallback((value: number) => {
    userActivatedRef.current = true
    const vol = Math.max(0, Math.min(100, Math.round(value)))
    setVolume(vol)
    const player = playerRef.current
    if (!player) return
    player.setVolume(vol)
    if (vol === 0) {
      player.mute()
      setMuted(true)
      return
    }
    if (audioRef.current.muted) {
      player.unMute()
      setMuted(false)
    }
  }, [])

  const play = useCallback(() => {
    const player = playerRef.current
    if (!player || !canSendRef.current) return
    userActivatedRef.current = true
    markLocalCommand()
    const t = player.getCurrentTime()
    player.playVideo()
    callbacksRef.current.onPlay(t)
    setNeedsGesture(false)
  }, [])

  const pause = useCallback(() => {
    const player = playerRef.current
    if (!player || !canSendRef.current) return
    userActivatedRef.current = true
    markLocalCommand()
    const t = player.getCurrentTime()
    player.pauseVideo()
    callbacksRef.current.onPause(t)
  }, [])

  const seekBy = useCallback((delta: number) => {
    const player = playerRef.current
    if (!player || !canSendRef.current) return
    userActivatedRef.current = true
    markLocalCommand()
    const t = Math.max(0, player.getCurrentTime() + delta)
    player.seekTo(t, true)
    callbacksRef.current.onSeek(t)
  }, [])

  const seekTo = useCallback((time: number) => {
    const player = playerRef.current
    if (!player || !canSendRef.current) return
    userActivatedRef.current = true
    markLocalCommand()
    const duration = player.getDuration()
    const t =
      duration > 0
        ? Math.min(Math.max(0, time), duration)
        : Math.max(0, time)
    player.seekTo(t, true)
    callbacksRef.current.onSeek(t)
  }, [])

  const [playback, setPlayback] = useState({ current: 0, duration: 0 })

  useEffect(() => {
    if (!isReady) return
    const id = window.setInterval(() => {
      const player = playerRef.current
      const state = stateRef.current
      if (!player || !loadedVideoId.current) return

      const duration = player.getDuration() || 0
      let current = player.getCurrentTime() || 0

      // Progress bar follows room authority so scrub UI stays shared.
      if (state?.playing) {
        current = getExpectedTime(state)
      } else if (state) {
        current = state.currentTime
      }

      const rounded = Math.floor(current)
      setPlayback((prev) =>
        prev.current === rounded && prev.duration === duration
          ? prev
          : { current: rounded, duration },
      )
    }, playbackTickMs)
    return () => window.clearInterval(id)
  }, [isReady, playbackTickMs])

  return {
    isReady,
    needsGesture,
    activatePlayback,
    handleSeek,
    playerRef,
    muted,
    volume,
    toggleMute,
    changeVolume,
    play,
    pause,
    seekBy,
    seekTo,
    playback,
  }
}
