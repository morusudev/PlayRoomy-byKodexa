import type { PlayerState } from '../types'

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
