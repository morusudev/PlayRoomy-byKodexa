import type { PlayerState } from '../types'
import { YT } from '../services/youtube/player'
import type { YtPlayer } from '../services/youtube/player'

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

/** Apply remote room state without redundant seek/play cycles that stutter mobile. */
export function applyRemotePlayback(
  player: YtPlayer,
  state: PlayerState,
  audio: { muted: boolean; volume: number },
) {
  const expected = Math.max(0, getExpectedTime(state))
  const localTime = player.getCurrentTime()
  const ytState = player.getPlayerState()
  const isLocallyPlaying =
    ytState === YT.PlayerState.PLAYING || ytState === YT.PlayerState.BUFFERING

  player.setVolume(audio.volume)

  if (state.playing) {
    if (Math.abs(localTime - expected) > 1.5) {
      player.seekTo(expected, true)
    }
    if (!isLocallyPlaying) {
      player.mute()
      player.playVideo()
      window.setTimeout(() => {
        player.setVolume(audio.volume)
        if (audio.muted) player.mute()
        else player.unMute()
      }, 350)
    } else {
      if (audio.muted) player.mute()
      else player.unMute()
    }
    return
  }

  if (isLocallyPlaying) {
    player.pauseVideo()
  }
  if (Math.abs(localTime - state.currentTime) > 0.75) {
    player.seekTo(state.currentTime, true)
  }
  if (audio.muted) player.mute()
  else player.unMute()
}
