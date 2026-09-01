import type { RoomState, ChatMessage, Role, RoomReaction } from '../../types'
import { getWebSocketUrl } from '../../config'
import { hashString } from '../../utils/storage'

export type ServerMessage =
  | { type: 'welcome'; yourId: string; peerCount: number; state: RoomState }
  | { type: 'state'; state: RoomState }
  | {
      type: 'user_joined'
      participant: { id: string; name: string; role: Role; joinedAt: number }
      state: RoomState
    }
  | { type: 'user_left'; id: string; state: RoomState }
  | { type: 'owner_migrated'; newOwnerId: string; previousOwnerId: string; state: RoomState }
  | { type: 'chat'; message: ChatMessage }
  | { type: 'reaction'; reaction: RoomReaction }
  | { type: 'kicked' }
  | { type: 'pong'; at: number }
  | { type: 'error'; code: string; message: string }

export type RoomConnectionHandlers = {
  onMessage: (msg: ServerMessage) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (message: string) => void
}

export interface RoomSocket {
  send: (data: unknown) => void
  close: () => void
  isOpen: () => boolean
}

export function connectRoomSocket(handlers: RoomConnectionHandlers): Promise<RoomSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(getWebSocketUrl())
    let settled = false

    const socket: RoomSocket = {
      send: (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data))
        }
      },
      close: () => {
        try {
          ws.close()
        } catch {
          // ignore
        }
      },
      isOpen: () => ws.readyState === WebSocket.OPEN,
    }

    ws.addEventListener('open', () => {
      if (!settled) {
        settled = true
        handlers.onOpen?.()
        resolve(socket)
      }
    })

    ws.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as ServerMessage
        handlers.onMessage(msg)
      } catch {
        // ignore
      }
    })

    ws.addEventListener('close', () => {
      handlers.onClose?.()
      if (!settled) {
        settled = true
        reject(new Error('WebSocket fechou antes de conectar'))
      }
    })

    ws.addEventListener('error', () => {
      handlers.onError?.('Falha ao conectar com o servidor PlayRoomy.')
      if (!settled) {
        settled = true
        reject(new Error('Falha WebSocket'))
      }
    })

    window.setTimeout(() => {
      if (!settled) {
        settled = true
        reject(new Error('Tempo esgotado ao conectar no servidor'))
        try {
          ws.close()
        } catch {
          // ignore
        }
      }
    }, 8000)
  })
}

export function passwordHashForRoom(roomId: string, password?: string): string | null {
  const pwd = password?.trim()
  if (!pwd) return null
  return hashString(`${roomId}::${pwd}::roomy`)
}
