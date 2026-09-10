import type { PlayerState } from '../types'
import { YT } from '../services/youtube/player'
import type { YtPlayer } from '../services/youtube/player'
import { getServerNow } from './clockSync'

export type SyncApplyMode = 'desktop' | 'mobile'

/** Desktop: tight. Mobile: looser to avoid YT buffering loops, but still corrects. */
export const SYNC_THRESHOLDS = {
  desktop: {
    playSeek: 0.9,
    pauseSeek: 0.5,
    microSeekSkip: 0.2,
    driftCorrect: 1.0,
    driftIntervalMs: 2500,
  },
  mobile: {
    playSeek: 2.5,
    pauseSeek: 1.5,
    microSeekSkip: 0.75,
    driftCorrect: 2.5,
    driftIntervalMs: 4000,
  },
} as const

export function getExpectedTime(state: PlayerState, now = getServerNow()): number {
  if (!state.playing) return state.currentTime
  const elapsed = (now - state.updatedAt) / 1000
  return Math.max(0, state.currentTime + elapsed)
}

export function shouldCorrectDrift(
  localTime: number,
  remoteState: PlayerState,
  thresholdSec = SYNC_THRESHOLDS.desktop.driftCorrect,
): boolean {
  const expected = getExpectedTime(remoteState)
  return Math.abs(localTime - expected) > thresholdSec
}

export function playerStateKey(state: PlayerState): string {
  return `${state.revision}:${state.playing}:${state.videoId ?? ''}:${state.updatedAt}`
}

export function createPlayerState(
  partial: Partial<PlayerState> & Pick<PlayerState, 'videoId'>,
): PlayerState {
  return {
    playing: false,
    currentTime: 0,
    updatedAt: getServerNow(),
    revision: 0,
    ...partial,
  }
}

function isBufferingOrIdle(ytState: number): boolean {
  return (
    ytState === YT.PlayerState.BUFFERING ||
    ytState === YT.PlayerState.UNSTARTED ||
    ytState === YT.PlayerState.CUED
  )
}

function isLocallyPlaying(ytState: number): boolean {
  return ytState === YT.PlayerState.PLAYING || ytState === YT.PlayerState.BUFFERING
}

function restoreAudio(player: YtPlayer, audio: { muted: boolean; volume: number }, delayMs: number) {
  window.setTimeout(() => {
    player.setVolume(audio.volume)
    if (audio.muted) player.mute()
    else player.unMute()
  }, delayMs)
}

/**
 * Apply authoritative room playback to the local YouTube player.
 * Mobile uses wider thresholds; still seeks on large jumps / play-pause flips.
 */
export function applyRemotePlayback(
  player: YtPlayer,
  state: PlayerState,
  audio: { muted: boolean; volume: number },
  mode: SyncApplyMode = 'desktop',
  playingChanged = true,
) {
  const thresholds = SYNC_THRESHOLDS[mode]
  const ytState = player.getPlayerState()

  if (isBufferingOrIdle(ytState) && mode === 'mobile' && !playingChanged) {
    return
  }

  const expected = Math.max(0, getExpectedTime(state))
  const localTime = player.getCurrentTime()
  const playing = isLocallyPlaying(ytState)

  player.setVolume(audio.volume)

  if (state.playing) {
    const drift = Math.abs(localTime - expected)
    if (playingChanged || drift > thresholds.playSeek) {
      if (drift > thresholds.microSeekSkip) {
        player.seekTo(expected, true)
      }
    }
    if (!playing) {
      player.mute()
      player.playVideo()
      restoreAudio(player, audio, mode === 'mobile' ? 600 : 350)
    } else if (audio.muted) {
      player.mute()
    } else {
      player.unMute()
    }
    return
  }

  if (playing) {
    player.pauseVideo()
  }
  const pauseTarget = state.currentTime
  const pauseDrift = Math.abs(localTime - pauseTarget)
  if (playingChanged || pauseDrift > thresholds.pauseSeek) {
    if (pauseDrift > thresholds.microSeekSkip) {
      player.seekTo(pauseTarget, true)
    }
  }
  if (audio.muted) player.mute()
  else player.unMute()
}

/** Soft drift correction while playing (or paused position check). */
export function applyRemoteSeekOnly(
  player: YtPlayer,
  state: PlayerState,
  mode: SyncApplyMode = 'desktop',
) {
  const thresholds = SYNC_THRESHOLDS[mode]
  const ytState = player.getPlayerState()

  if (isBufferingOrIdle(ytState)) return

  const localTime = player.getCurrentTime()
  const target = state.playing ? Math.max(0, getExpectedTime(state)) : state.currentTime

  if (Math.abs(localTime - target) <= thresholds.driftCorrect) return
  player.seekTo(target, true)
}

/** True when local player already matches remote closely enough to skip re-apply. */
export function matchesRemoteClosely(
  player: YtPlayer,
  state: PlayerState,
  mode: SyncApplyMode = 'desktop',
): boolean {
  const thresholds = SYNC_THRESHOLDS[mode]
  const ytState = player.getPlayerState()
  const localPlaying = isLocallyPlaying(ytState)
  if (localPlaying !== state.playing && ytState !== YT.PlayerState.BUFFERING) {
    return false
  }
  const localTime = player.getCurrentTime()
  const target = state.playing ? getExpectedTime(state) : state.currentTime
  return Math.abs(localTime - target) <= thresholds.playSeek
}
