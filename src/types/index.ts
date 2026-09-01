export type Role = 'owner' | 'admin' | 'controller' | 'viewer'

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error'

export type RoomError =
  | 'room_not_found'
  | 'room_full'
  | 'wrong_password'
  | 'kicked'
  | 'host_left'
  | 'connection_failed'
  | 'invalid_video'
  | 'youtube_error'
  | null

export interface Participant {
  id: string
  name: string
  role: Role
  joinedAt: number
  peerId?: string
}

export interface PlayerState {
  videoId: string | null
  playing: boolean
  currentTime: number
  updatedAt: number
}

export type PlayerEventType =
  | 'PLAY'
  | 'PAUSE'
  | 'SEEK'
  | 'VIDEO_CHANGE'
  | 'VIDEO_STOP'
  | 'SYNC_REQUEST'
  | 'SYNC_RESPONSE'
  | 'VIDEO_ENDED'

export interface PlayerAction {
  type: PlayerEventType
  videoId?: string
  title?: string
  currentTime?: number
  by: string
  at: number
}

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: number
}

export type ReactionKind = 'fire' | 'heart' | 'laugh' | 'clap'

export interface RoomReaction {
  id: string
  userId: string
  userName: string
  kind: ReactionKind
  at: number
  x: number
}

export interface QueueItem {
  id: string
  videoId: string
  title: string
  addedBy: string
  addedByName: string
}

export interface RoomConfig {
  roomId: string
  isPrivate: boolean
  hasPassword: boolean
  maxParticipants: number
  createdAt: number
}

export interface RoomState {
  config: RoomConfig
  participants: Participant[]
  player: PlayerState
  queue: QueueItem[]
  hasPreviousVideo: boolean
  controllerId: string | null
  ownerId: string
}

export interface LocalIdentity {
  id: string
  name: string
  roomId: string
}

export interface RoomCreateOptions {
  isPrivate: boolean
  password?: string
  nickname: string
}

export interface RoomJoinOptions {
  roomId: string
  nickname: string
  password?: string
}

export type RoomEvent =
  | { type: 'HELLO'; payload: { participant: Participant; config?: RoomConfig } }
  | { type: 'WELCOME'; payload: { state: RoomState; yourId: string } }
  | { type: 'USER_JOINED'; payload: Participant }
  | { type: 'USER_LEFT'; payload: { id: string; peerId?: string } }
  | { type: 'USER_UPDATED'; payload: Participant }
  | { type: 'USER_KICKED'; payload: { targetId: string; by: string } }
  | { type: 'ROLE_CHANGED'; payload: { targetId: string; role: Role; by: string } }
  | { type: 'CONTROL_TRANSFERRED'; payload: { controllerId: string | null; by: string } }
  | { type: 'PLAYER_ACTION'; payload: PlayerAction }
  | { type: 'PLAYER_STATE'; payload: PlayerState }
  | { type: 'SYNC_REQUEST'; payload: { from: string } }
  | { type: 'SYNC_RESPONSE'; payload: { to: string; state: PlayerState } }
  | { type: 'CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'QUEUE_UPDATED'; payload: QueueItem[] }
  | { type: 'OWNER_MIGRATED'; payload: { newOwnerId: string; previousOwnerId: string } }
  | { type: 'ROOM_CLOSED'; payload: { reason: string } }
  | { type: 'HOST_ANNOUNCE'; payload: { ownerId: string; roomId: string; createdAt: number; participantCount: number } }
  | { type: 'PING'; payload: { from: string; at: number } }
  | { type: 'PONG'; payload: { from: string; at: number } }

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export const ROLE_PRIORITY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  controller: 2,
  viewer: 1,
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'OWNER',
  admin: 'ADMIN',
  controller: 'CONTROLLER',
  viewer: 'VIEWER',
}

export const MAX_PARTICIPANTS = 20
export const MAX_CHAT_LENGTH = 500
export const CHAT_RATE_LIMIT = 3
export const CHAT_RATE_WINDOW_MS = 2000
export const DRIFT_THRESHOLD_SEC = 1.5
export const SYNC_INTERVAL_MS = 8000
