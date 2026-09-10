/**
 * Estimates client↔server clock offset from ping/pong round-trips.
 * serverNow ≈ Date.now() + offset
 */

const EMA_ALPHA = 0.25
const MAX_SAMPLES = 12
const OUTLIER_RTT_MS = 2500

let clockOffsetMs = 0
let sampleCount = 0
let lastRttMs = 0

export function resetClockSync() {
  clockOffsetMs = 0
  sampleCount = 0
  lastRttMs = 0
}

export function getClockOffsetMs(): number {
  return clockOffsetMs
}

export function getLastRttMs(): number {
  return lastRttMs
}

/** Wall-clock aligned to the room server. */
export function getServerNow(clientNow = Date.now()): number {
  return clientNow + clockOffsetMs
}

/**
 * @param clientSentAt - Date.now() when the client sent ping
 * @param serverAt - server Date.now() stamped in pong
 * @param clientRecvAt - Date.now() when pong arrived
 */
export function applyPongSample(
  clientSentAt: number,
  serverAt: number,
  clientRecvAt = Date.now(),
): void {
  const rtt = Math.max(0, clientRecvAt - clientSentAt)
  if (rtt > OUTLIER_RTT_MS) return

  lastRttMs = rtt
  const oneWay = rtt / 2
  const sample = serverAt + oneWay - clientRecvAt

  if (sampleCount === 0) {
    clockOffsetMs = sample
  } else {
    clockOffsetMs = clockOffsetMs * (1 - EMA_ALPHA) + sample * EMA_ALPHA
  }

  sampleCount = Math.min(MAX_SAMPLES, sampleCount + 1)
}

export function hasReliableClock(): boolean {
  return sampleCount >= 2
}
