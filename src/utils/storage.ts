import type { LocalIdentity, RoomCreateOptions } from '../types'

const IDENTITY_KEY = 'roomy:identity'
const AUTH_KEY_PREFIX = 'roomy:auth:'
const CREATE_KEY_PREFIX = 'roomy:create:'
const PRIVATE_FLAG_PREFIX = 'roomy:private:'

export function isSecureCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

/** Deterministic hash that works on HTTP LAN (no crypto.subtle). */
export function hashString(input: string): string {
  // FNV-1a 32-bit × 4 rounds over rotating input — good enough for room channel ids
  let h1 = 0x811c9dc5
  let h2 = 0x811c9dc5 ^ 0x9e3779b9
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 ^= c
    h1 = Math.imul(h1, 0x01000193)
    h2 ^= c + i
    h2 = Math.imul(h2, 0x01000193)
  }
  const a = (h1 >>> 0).toString(16).padStart(8, '0')
  const b = (h2 >>> 0).toString(16).padStart(8, '0')
  return `${a}${b}`
}

export function saveIdentity(identity: LocalIdentity): void {
  sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
}

export function loadIdentity(roomId: string): LocalIdentity | null {
  try {
    const raw = sessionStorage.getItem(IDENTITY_KEY)
    if (!raw) return null
    const identity = JSON.parse(raw) as LocalIdentity
    return identity.roomId === roomId ? identity : null
  } catch {
    return null
  }
}

export function clearIdentity(): void {
  sessionStorage.removeItem(IDENTITY_KEY)
}

/**
 * Derives a shared channel token for private rooms.
 * Never throws — works on localhost AND http://192.168.x.x (no SubtleCrypto).
 */
export async function deriveRoomSecret(roomId: string, password?: string): Promise<string> {
  const pwd = password?.trim()
  if (!pwd) {
    return ''
  }

  if (isSecureCryptoAvailable()) {
    try {
      const encoder = new TextEncoder()
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(pwd),
        'PBKDF2',
        false,
        ['deriveBits'],
      )
      const salt = encoder.encode(`roomy-salt-${roomId}`)
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
        keyMaterial,
        128,
      )
      return Array.from(new Uint8Array(bits))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    } catch {
      // fall through to sync hash
    }
  }

  return hashString(`${roomId}::${pwd}::roomy`)
}

export async function saveRoomAuth(roomId: string, password?: string): Promise<void> {
  const pwd = password?.trim()
  if (!pwd) {
    sessionStorage.removeItem(`${AUTH_KEY_PREFIX}${roomId}`)
    sessionStorage.removeItem(`${PRIVATE_FLAG_PREFIX}${roomId}`)
    return
  }
  const secret = await deriveRoomSecret(roomId, pwd)
  sessionStorage.setItem(`${AUTH_KEY_PREFIX}${roomId}`, secret)
  sessionStorage.setItem(`${PRIVATE_FLAG_PREFIX}${roomId}`, '1')
}

export function getRoomAuth(roomId: string): string | null {
  return sessionStorage.getItem(`${AUTH_KEY_PREFIX}${roomId}`)
}

export function isPrivateRoomSession(roomId: string): boolean {
  return sessionStorage.getItem(`${PRIVATE_FLAG_PREFIX}${roomId}`) === '1'
}

export function saveRoomCreateOptions(roomId: string, options: RoomCreateOptions): void {
  sessionStorage.setItem(`${CREATE_KEY_PREFIX}${roomId}`, JSON.stringify(options))
}

export function loadRoomCreateOptions(roomId: string): RoomCreateOptions | null {
  try {
    const raw = sessionStorage.getItem(`${CREATE_KEY_PREFIX}${roomId}`)
    if (!raw) return null
    return JSON.parse(raw) as RoomCreateOptions
  } catch {
    return null
  }
}

export function clearRoomCreateOptions(roomId: string): void {
  sessionStorage.removeItem(`${CREATE_KEY_PREFIX}${roomId}`)
}
