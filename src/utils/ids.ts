import { nanoid } from 'nanoid'

export function generateUserId(): string {
  return nanoid(12)
}

export function generateMessageId(): string {
  return nanoid(10)
}

export function generateQueueItemId(): string {
  return nanoid(8)
}
