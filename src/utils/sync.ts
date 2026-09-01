import type { PlayerState } from '../types'
import { YT } from '../services/youtube/player'
import type { YtPlayer } from '../services/youtube/player'

export type SyncApplyMode = 'desktop' | 'mobile'

export function getExpectedTime(state: PlayerState, now = Date.now()): number {
  if (!state.playing) return state.currentTime
  const elapsed = (now - state.updatedAt) / 1000
  return state.currentTime + elapsed
}

export function shouldCorrectDrift(
  localTime: number,
  remoteState: PlayerState,
  thresholdSec = 1.5,
): boolean {
  const expected = getExpectedTime(remoteState)
  return Math.abs(localTime - expected) > thresholdSec
}

export function createPlayerState(
  partial: Partial<PlayerState> & Pick<PlayerState, 'videoId'>,
): PlayerState {
  return {
    playing: false,
    currentTime: 0,
    updatedAt: Date.now(),
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

/** Apply remote room state — mobile mode avoids micro-seeks that flash the YT play overlay. */
export function applyRemotePlayback(
  player: YtPlayer,
  state: PlayerState,
  audio: { muted: boolean; volume: number },
  mode: SyncApplyMode = 'desktop',
  playingChanged = true,
) {
  const mobile = mode === 'mobile'
  const ytState = player.getPlayerState()

  if (isBufferingOrIdle(ytState) && mobile && !playingChanged) {
    return
  }

  const expected = Math.max(0, getExpectedTime(state))
  const localTime = player.getCurrentTime()
  const playing = isLocallyPlaying(ytState)
  const playSeekThreshold = mobile ? 5 : 1.5
  const pauseSeekThreshold = mobile ? 2.5 : 0.75

  player.setVolume(audio.volume)

  if (state.playing) {
    if (playingChanged || Math.abs(localTime - expected) > playSeekThreshold) {
      if (Math.abs(localTime - expected) > (mobile ? 0.5 : 0.25)) {
        player.seekTo(expected, true)
      }
    }
    if (!playing) {
      player.mute()
      player.playVideo()
      restoreAudio(player, audio, mobile ? 500 : 350)
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
  if (playingChanged || Math.abs(localTime - state.currentTime) > pauseSeekThreshold) {
    if (Math.abs(localTime - state.currentTime) > 0.4) {
      player.seekTo(state.currentTime, true)
    }
  }
  if (audio.muted) player.mute()
  else player.unMute()
}

export function applyRemoteSeekOnly(
  player: YtPlayer,
  state: PlayerState,
  mode: SyncApplyMode = 'desktop',
) {
  const mobile = mode === 'mobile'
  const ytState = player.getPlayerState()
  if (isBufferingOrIdle(ytState)) return

  const localTime = player.getCurrentTime()
  const target = state.playing ? Math.max(0, getExpectedTime(state)) : state.currentTime
  const threshold = mobile ? 6 : 2

  if (Math.abs(localTime - target) <= threshold) return
  player.seekTo(target, true)
}
