const ROOM_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
const ROOM_ID_LENGTH = 8

export function generateRoomId(): string {
  const bytes = new Uint8Array(ROOM_ID_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ROOM_ID_CHARS[b % ROOM_ID_CHARS.length]).join('')
}

export function isValidRoomId(id: string): boolean {
  if (id.length !== ROOM_ID_LENGTH) return false
  return [...id].every((c) => ROOM_ID_CHARS.includes(c))
}
