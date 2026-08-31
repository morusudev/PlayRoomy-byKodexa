import type { Plugin } from 'vite'
import { attachRoomyWss } from '../backend/src/room-ws.ts'

export { attachRoomyWss, serverLimits } from '../backend/src/room-ws.ts'
export type { RoomyHttpServer, RoomServerStats, AttachRoomyOptions } from '../backend/src/room-ws.ts'

export function roomyWsPlugin(): Plugin {
  return {
    name: 'roomy-ws',
    configureServer(server) {
      if (server.httpServer) {
        attachRoomyWss(server.httpServer)
        console.log('[playroomy] WebSocket rooms at /roomy-ws')
      }
    },
    configurePreviewServer(server) {
      if (server.httpServer) {
        attachRoomyWss(server.httpServer)
        console.log('[playroomy] WebSocket rooms at /roomy-ws (preview)')
      }
    },
  }
}
