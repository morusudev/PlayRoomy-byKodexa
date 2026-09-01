import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import {
  createYouTubePlayer,
  YT,
  YT_ERROR_MESSAGES,
  type YtPlayer,
} from '../services/youtube/player'
import type { PlayerState } from '../types'
import { getExpectedTime, shouldCorrectDrift } from '../utils/sync'

interface UseYouTubePlayerOptions {
  stageRef: RefObject<HTMLDivElement | null>
  size: { width: number; height: number }
  playerState: PlayerState | null
  isAuthority: boolean
  onPlay: (time: number) => void
  onPause: (time: number) => void
  onSeek: (time: number) => void
  onVideoEnded: () => void
  onError: (message: string) => void
}

function applyIframeSize(player: YtPlayer, width: number, height: number) {
  player.setSize(width, height)
  try {
    const iframe = player.getIframe()
    iframe.width = String(width)
    iframe.height = String(height)
    iframe.style.width = `${width}px`
    iframe.style.height = `${height}px`
    iframe.style.maxWidth = '100%'
    iframe.style.maxHeight = '100%'
    iframe.style.border = '0'
    iframe.style.display = 'block'
    iframe.style.position = 'absolute'
    iframe.style.inset = '0'
    iframe.style.transform = 'none'
  } catch {
    // ignore
  }
}

function applyRemotePlayback(
  player: YtPlayer,
  state: PlayerState,
  audio: { muted: boolean; volume: number },
) {
  const expected = Math.max(0, getExpectedTime(state))
  player.setVolume(audio.volume)

  if (state.playing) {
    player.mute()
    player.seekTo(expected, true)
    player.playVideo()
    window.setTimeout(() => {
      player.setVolume(audio.volume)
      if (audio.muted) player.mute()
      else player.unMute()
    }, 400)
  } else {
    player.pauseVideo()
    player.seekTo(state.currentTime, true)
    if (audio.muted) player.mute()
    else player.unMute()
  }
}

export function useYouTubePlayer({
  stageRef,
  size,
  playerState,
  isAuthority,
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

  const ignoreLocalUntil = useRef(0)
  const loadedVideoId = useRef<string | null>(null)
  const lastRemoteKey = useRef('')
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const created = useRef(false)
  const audioRef = useRef({ muted: false, volume: 80 })

  const isAuthorityRef = useRef(isAuthority)
  const callbacksRef = useRef({ onPlay, onPause, onSeek, onVideoEnded, onError })
  const stateRef = useRef(playerState)
  const sizeRef = useRef(size)

  isAuthorityRef.current = isAuthority
  callbacksRef.current = { onPlay, onPause, onSeek, onVideoEnded, onError }
  stateRef.current = playerState
  sizeRef.current = size
  audioRef.current = { muted, volume }

  const silenceLocal = (ms: number) => {
    ignoreLocalUntil.current = Date.now() + ms
  }

  useEffect(() => {
    const readyToMount = size.width >= 160 && size.height >= 90
    if (!readyToMount) return
    if (created.current) return

    const stage = stageRef.current
    if (!stage) return

    created.current = true
    let cancelled = false

    stage.innerHTML = ''
    const mount = document.createElement('div')
    mountRef.current = mount
    mount.style.width = `${size.width}px`
    mount.style.height = `${size.height}px`
    mount.style.position = 'absolute'
    mount.style.inset = '0'
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
    }
    if (!isLanIp) {
      playerVars.origin = window.location.origin
    }

    createYouTubePlayer(mount, {
      width: size.width,
      height: size.height,
      playerVars,
      events: {
        onStateChange: (event) => {
          if (Date.now() < ignoreLocalUntil.current) return
          if (!isAuthorityRef.current) return

          const player = playerRef.current
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
            if (remote?.playing) return
            callbacksRef.current.onPlay(time)
            return
          }

          if (event.data === YT.PlayerState.PAUSED) {
            if (remote && !remote.playing) return
            if (pauseTimer.current) clearTimeout(pauseTimer.current)
            pauseTimer.current = setTimeout(() => {
              pauseTimer.current = null
              if (Date.now() < ignoreLocalUntil.current) return
              if (!isAuthorityRef.current) return
              const p = playerRef.current
              if (!p) return
              if (p.getPlayerState() !== YT.PlayerState.PAUSED) return
              callbacksRef.current.onPause(p.getCurrentTime())
            }, 280)
            return
          }

          if (event.data === YT.PlayerState.ENDED) {
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
      if (stageRef.current) stageRef.current.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width >= 160 && size.height >= 90])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady) return
    if (size.width < 160 || size.height < 90) return
    applyIframeSize(player, size.width, size.height)
  }, [size.width, size.height, isReady])

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

    silenceLocal(3000)
    applyIframeSize(player, sizeRef.current.width, sizeRef.current.height)

    const startAt = state.playing
      ? Math.max(0, getExpectedTime(state))
      : Math.max(0, state.currentTime)

    player.mute()
    player.loadVideoById(videoId, startAt)

    window.setTimeout(() => {
      if (!playerRef.current || loadedVideoId.current !== videoId) return
      const latest = stateRef.current
      if (!latest || latest.videoId !== videoId) return
      silenceLocal(2000)
      applyRemotePlayback(playerRef.current, latest, audioRef.current)
      lastRemoteKey.current = `${latest.playing}:${latest.updatedAt}`
    }, 500)
  }, [playerState?.videoId, isReady])

  useEffect(() => {
    if (isAuthority) return

    const player = playerRef.current
    const state = playerState
    if (!player || !isReady || !state?.videoId) return
    if (state.videoId !== loadedVideoId.current) return

    const key = `${state.playing}:${state.updatedAt}:${Math.floor(state.currentTime)}`
    if (key === lastRemoteKey.current) return
    lastRemoteKey.current = key

    silenceLocal(1200)
    applyRemotePlayback(player, state, audioRef.current)
  }, [
    isAuthority,
    isReady,
    playerState?.videoId,
    playerState?.playing,
    playerState?.updatedAt,
    playerState?.currentTime,
  ])

  useEffect(() => {
    if (isAuthority) return
    const id = window.setInterval(() => {
      const player = playerRef.current
      const state = stateRef.current
      if (!player || !state?.videoId || !state.playing) return
      if (state.videoId !== loadedVideoId.current) return
      if (shouldCorrectDrift(player.getCurrentTime(), state, 2)) {
        silenceLocal(800)
        player.seekTo(getExpectedTime(state), true)
      }
    }, 4000)
    return () => window.clearInterval(id)
  }, [isAuthority, isReady])

  useEffect(() => {
    if (!isAuthority) return
    const id = window.setInterval(() => {
      const player = playerRef.current
      const state = stateRef.current
      if (!player || !state?.videoId || !state.playing) return
      if (Date.now() < ignoreLocalUntil.current) return
      if (player.getPlayerState() !== YT.PlayerState.PLAYING) return
      callbacksRef.current.onSeek(player.getCurrentTime())
    }, 5000)
    return () => window.clearInterval(id)
  }, [isAuthority, isReady])

  const handleSeek = useCallback((time: number) => {
    if (!isAuthorityRef.current) return
    callbacksRef.current.onSeek(time)
  }, [])

  const toggleMute = useCallback(() => {
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
    if (!player) return
    if (!isAuthorityRef.current) return
    silenceLocal(600)
    const t = player.getCurrentTime()
    player.playVideo()
    callbacksRef.current.onPlay(t)
  }, [])

  const pause = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (!isAuthorityRef.current) return
    silenceLocal(600)
    const t = player.getCurrentTime()
    player.pauseVideo()
    callbacksRef.current.onPause(t)
  }, [])

  const seekBy = useCallback((delta: number) => {
    const player = playerRef.current
    if (!player) return
    if (!isAuthorityRef.current) return
    silenceLocal(600)
    const t = Math.max(0, player.getCurrentTime() + delta)
    player.seekTo(t, true)
    callbacksRef.current.onSeek(t)
  }, [])

  const seekTo = useCallback((time: number) => {
    const player = playerRef.current
    if (!player) return
    if (!isAuthorityRef.current) return
    silenceLocal(600)
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
      if (!isAuthorityRef.current && state?.playing) {
        current = getExpectedTime(state)
      } else if (!isAuthorityRef.current && state) {
        current = state.currentTime
      }

      setPlayback((prev) =>
        prev.current === current && prev.duration === duration
          ? prev
          : { current, duration },
      )
    }, 250)
    return () => window.clearInterval(id)
  }, [isReady])

  return {
    isReady,
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
