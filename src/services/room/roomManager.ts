import {
  connectRoomSocket,
  passwordHashForRoom,
  type RoomSocket,
  type ServerMessage,
} from '../realtime/connection'
import type {
  ConnectionStatus,
  Participant,
  PlayerAction,
  QueueItem,
  ReactionKind,
  Role,
  RoomReaction,
  RoomState,
} from '../../types'
import { REACTION_KINDS } from '../../constants/reactions'
import { canControlPlayer } from '../../utils/permissions'
import {
  loadIdentity,
  loadRoomCreateOptions,
  saveIdentity,
  saveRoomCreateOptions,
  saveRoomAuth,
  clearRoomCreateOptions,
} from '../../utils/storage'
import { getBackendConnectionErrorMessage } from '../../config'
import { generateRoomId } from '../../utils/roomId'
import { applyPongSample, resetClockSync } from '../../utils/clockSync'

export interface RoomManagerCallbacks {
  onStateChange: (state: Partial<RoomManagerState>) => void
  onToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
}

export interface RoomManagerState {
  connectionStatus: ConnectionStatus
  roomState: RoomState | null
  localParticipant: Participant | null
  chatMessages: import('../../types').ChatMessage[]
  liveReactions: RoomReaction[]
  error: string | null
  isKicked: boolean
  peerCount: number
  waitingForHost: boolean
  needsPassword: boolean
}

const PING_INTERVAL_MS = 5000
const RECONNECT_BASE_MS = 800
const RECONNECT_MAX_MS = 12_000
const RECONNECT_MAX_ATTEMPTS = 20

function normalizePlayerState(state: RoomState): RoomState {
  if (typeof state.player.revision === 'number') return state
  return {
    ...state,
    player: { ...state.player, revision: 0 },
  }
}

export class RoomManager {
  private socket: RoomSocket | null = null
  private roomId: string
  private password?: string
  private disposed = false
  private userId = ''
  private nickname = ''
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private joinRetryTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private joinRetries = 0
  private reconnectAttempts = 0
  private lastPingSentAt = 0
  private reactionTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private callbacks: RoomManagerCallbacks
  private state: RoomManagerState = {
    connectionStatus: 'idle',
    roomState: null,
    localParticipant: null,
    chatMessages: [],
    liveReactions: [],
    error: null,
    isKicked: false,
    peerCount: 0,
    waitingForHost: false,
    needsPassword: false,
  }
  private lastJoinCreate = false
  private lastPasswordHash: string | null = null
  private everJoined = false

  constructor(roomId: string, callbacks: RoomManagerCallbacks, password?: string) {
    this.roomId = roomId
    this.password = password
    this.callbacks = callbacks
  }

  getState(): RoomManagerState {
    return this.state
  }

  private update(partial: Partial<RoomManagerState>) {
    this.state = { ...this.state, ...partial }
    this.callbacks.onStateChange(partial)
  }

  async connect(nickname: string): Promise<void> {
    this.nickname = nickname.trim() || 'Convidado'
    this.reconnectAttempts = 0
    resetClockSync()
    await this.openSocketAndJoin(false)
  }

  private async openSocketAndJoin(isReconnect: boolean): Promise<void> {
    if (this.disposed) return

    this.update({
      connectionStatus: isReconnect ? 'reconnecting' : 'connecting',
      error: isReconnect ? 'Reconectando…' : null,
      waitingForHost: false,
    })

    const createOptions = loadRoomCreateOptions(this.roomId)
    const isCreator = !!createOptions && !this.everJoined
    const pwd = (this.password || createOptions?.password)?.trim() || undefined
    const passwordHash = passwordHashForRoom(this.roomId, pwd)

    if (pwd) await saveRoomAuth(this.roomId, pwd)
    else await saveRoomAuth(this.roomId, undefined)

    const saved = loadIdentity(this.roomId)
    this.userId = saved?.id ?? crypto.randomUUID()
    saveIdentity({ id: this.userId, name: this.nickname, roomId: this.roomId })

    try {
      this.socket = await connectRoomSocket({
        onMessage: (msg) => {
          if (!this.disposed) this.handleServer(msg)
        },
        onClose: () => {
          if (this.disposed || this.state.isKicked) return
          this.clearPing()
          this.scheduleReconnect()
        },
        onError: (message) => {
          if (!this.disposed && !this.everJoined) {
            this.update({ connectionStatus: 'error', error: message })
          }
        },
      })
    } catch {
      if (this.everJoined) {
        this.scheduleReconnect()
        return
      }
      this.update({
        connectionStatus: 'error',
        error: getBackendConnectionErrorMessage(),
      })
      return
    }

    if (this.disposed) {
      this.socket.close()
      return
    }

    this.reconnectAttempts = 0
    this.socket.send({
      type: 'join',
      roomId: this.roomId,
      userId: this.userId,
      name: this.nickname,
      create: isCreator || this.lastJoinCreate,
      passwordHash: passwordHash ?? this.lastPasswordHash,
    })
    this.lastJoinCreate = isCreator || this.lastJoinCreate
    this.lastPasswordHash = passwordHash ?? this.lastPasswordHash
    this.joinRetries = 0

    if (!isCreator && !this.everJoined) {
      this.update({ waitingForHost: true })
    }

    this.startPing()
  }

  private startPing() {
    this.clearPing()
    const sendPing = () => {
      if (!this.socket?.isOpen()) return
      this.lastPingSentAt = Date.now()
      this.socket.send({ type: 'ping', clientTime: this.lastPingSentAt })
    }
    sendPing()
    this.pingTimer = setInterval(sendPing, PING_INTERVAL_MS)
  }

  private clearPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  private scheduleReconnect() {
    if (this.disposed || this.state.isKicked) return
    if (this.reconnectTimer) return

    if (this.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      this.update({
        connectionStatus: 'disconnected',
        error: 'Conexão perdida com o servidor. Atualize a página para tentar de novo.',
        waitingForHost: false,
      })
      return
    }

    const attempt = this.reconnectAttempts
    this.reconnectAttempts += 1
    const delay = Math.min(
      RECONNECT_MAX_MS,
      RECONNECT_BASE_MS * Math.pow(1.6, attempt) + Math.random() * 250,
    )

    this.update({
      connectionStatus: 'reconnecting',
      error: 'Conexão instável — reconectando…',
    })

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.openSocketAndJoin(true)
    }, delay)
  }

  private handleServer(msg: ServerMessage) {
    switch (msg.type) {
      case 'welcome': {
        const me =
          msg.state.participants.find((p) => p.id === msg.yourId) ??
          ({
            id: msg.yourId,
            name: this.nickname,
            role: 'viewer' as Role,
            joinedAt: Date.now(),
          } satisfies Participant)

        const state = normalizePlayerState(msg.state)
        const hadVideo = !!state.player.videoId
        const wasReconnect = this.everJoined
        this.everJoined = true

        this.update({
          connectionStatus: 'connected',
          roomState: state,
          localParticipant: me,
          peerCount: Math.max(0, state.participants.length - 1),
          waitingForHost: false,
          needsPassword: false,
          error: null,
        })
        this.joinRetries = 0
        if (this.joinRetryTimer) {
          clearTimeout(this.joinRetryTimer)
          this.joinRetryTimer = null
        }

        if (wasReconnect) {
          this.callbacks.onToast('Reconectado — sync restaurado', 'success')
        } else if (me.role === 'owner') {
          clearRoomCreateOptions(this.roomId)
          this.callbacks.onToast('Sala pronta. Compartilhe o convite HTTPS!', 'success')
        } else {
          this.callbacks.onToast(
            hadVideo ? 'Conectado. Sincronizando o vídeo...' : 'Conectado à sala!',
            'success',
          )
        }
        break
      }

      case 'state':
      case 'user_joined':
      case 'user_left':
      case 'owner_migrated': {
        const prevRole = this.state.localParticipant?.role
        const prevController = this.state.roomState?.controllerId ?? null
        const leftName =
          msg.type === 'user_left'
            ? this.state.roomState?.participants.find((p) => p.id === msg.id)?.name
            : undefined

        const state = normalizePlayerState(msg.state)
        const me = state.participants.find((p) => p.id === this.userId)
        this.update({
          roomState: state,
          localParticipant: me ?? this.state.localParticipant,
          peerCount: Math.max(0, state.participants.length - 1),
          waitingForHost: false,
          connectionStatus: 'connected',
          error: null,
        })

        if (msg.type === 'user_joined' && msg.participant.id !== this.userId) {
          this.callbacks.onToast(`${msg.participant.name} entrou na sala`, 'success')
        }
        if (msg.type === 'user_left' && msg.id !== this.userId) {
          this.callbacks.onToast(
            leftName ? `${leftName} saiu da sala` : 'Alguém saiu da sala',
            'info',
          )
        }
        if (msg.type === 'owner_migrated' && msg.newOwnerId === this.userId) {
          this.callbacks.onToast('Você é o novo host.', 'info')
        }

        if (me && prevRole && me.role !== prevRole) {
          if (me.role === 'controller' || me.role === 'admin') {
            this.callbacks.onToast('Você pode controlar o vídeo agora', 'success')
          } else if (prevRole === 'controller' || prevRole === 'admin') {
            this.callbacks.onToast('Seu controle do vídeo foi removido', 'warning')
          }
        }

        if (me && state.controllerId !== prevController && state.controllerId === me.id) {
          this.callbacks.onToast('Controle temporário do player recebido', 'success')
        }
        if (me && prevController === me.id && state.controllerId !== me.id) {
          this.callbacks.onToast('Controle temporário encerrado', 'info')
        }
        break
      }

      case 'chat':
        this.update({
          chatMessages: [...this.state.chatMessages, msg.message].slice(-100),
        })
        break

      case 'reaction':
        this.pushReaction(msg.reaction)
        break

      case 'kicked':
        this.update({ isKicked: true, connectionStatus: 'disconnected' })
        this.callbacks.onToast('Você foi expulso da sala.', 'error')
        this.disconnect()
        break

      case 'error':
        if (msg.code === 'room_not_found') {
          const createOptions = loadRoomCreateOptions(this.roomId)
          if (createOptions || this.lastJoinCreate) {
            this.socket?.send({
              type: 'join',
              roomId: this.roomId,
              userId: this.userId,
              name: this.nickname,
              create: true,
              passwordHash: passwordHashForRoom(
                this.roomId,
                this.password || createOptions?.password,
              ),
            })
            return
          }

          if (this.joinRetries < 15 && this.socket?.isOpen()) {
            this.joinRetries += 1
            this.update({
              connectionStatus: 'connected',
              waitingForHost: true,
              error: 'Aguardando o host abrir a sala...',
            })
            if (this.joinRetryTimer) clearTimeout(this.joinRetryTimer)
            this.joinRetryTimer = setTimeout(() => {
              if (this.disposed || this.state.roomState) return
              this.socket?.send({
                type: 'join',
                roomId: this.roomId,
                userId: this.userId,
                name: this.nickname,
                create: false,
                passwordHash: this.lastPasswordHash,
              })
            }, 1500)
            return
          }

          this.update({
            connectionStatus: 'connected',
            waitingForHost: true,
            error: msg.message,
          })
          return
        }

        if (msg.code === 'password_required' || msg.code === 'wrong_password') {
          this.update({
            connectionStatus: 'connected',
            waitingForHost: false,
            needsPassword: true,
            error: msg.code === 'wrong_password' ? 'Senha incorreta. Tente de novo.' : null,
          })
          return
        }

        this.update({
          connectionStatus: 'error',
          waitingForHost: false,
          error: msg.message,
        })
        this.callbacks.onToast(msg.message, 'error')
        break

      case 'pong': {
        const sentAt =
          typeof msg.clientTime === 'number' && Number.isFinite(msg.clientTime)
            ? msg.clientTime
            : this.lastPingSentAt
        if (sentAt > 0 && typeof msg.at === 'number') {
          applyPongSample(sentAt, msg.at)
        }
        break
      }

      default: {
        const _exhaustive: never = msg
        void _exhaustive
        break
      }
    }
  }

  /** Guest: retry join after typing the room password. */
  async submitPassword(password: string) {
    const pwd = password.trim()
    if (!pwd || !this.socket?.isOpen()) return
    this.password = pwd
    this.lastPasswordHash = passwordHashForRoom(this.roomId, pwd)
    await saveRoomAuth(this.roomId, pwd)
    this.update({ needsPassword: false, error: null, connectionStatus: 'connecting' })
    this.socket.send({
      type: 'join',
      roomId: this.roomId,
      userId: this.userId,
      name: this.nickname,
      create: false,
      passwordHash: this.lastPasswordHash,
    })
  }

  /** If room wasn't created yet, become host (only when server said room_not_found). */
  claimHost() {
    if (!this.socket?.isOpen()) return
    this.lastJoinCreate = true
    this.socket.send({
      type: 'join',
      roomId: this.roomId,
      userId: this.userId,
      name: this.nickname,
      create: true,
      passwordHash: passwordHashForRoom(this.roomId, this.password),
    })
  }

  sendPlayerAction(action: Omit<PlayerAction, 'by' | 'at'>) {
    const local = this.state.localParticipant
    if (!local || !this.socket) return
    this.socket.send({
      type: 'player',
      by: local.id,
      action: action.type,
      videoId: action.videoId,
      title: action.title,
      currentTime: action.currentTime,
    })
  }

  requestSync() {
    // Full state is authoritative; ask server for a fresh ping + clients already
    // re-apply on the latest revision via the player hook.
    if (this.socket?.isOpen()) {
      this.lastPingSentAt = Date.now()
      this.socket.send({ type: 'ping', clientTime: this.lastPingSentAt })
    }
  }

  sendChat(text: string) {
    const local = this.state.localParticipant
    if (!local || !this.socket || !text.trim()) return
    this.socket.send({ type: 'chat', by: local.id, text: text.trim() })
  }

  sendReaction(kind: ReactionKind) {
    const local = this.state.localParticipant
    if (!local || !this.socket || !REACTION_KINDS.has(kind)) return
    this.socket.send({ type: 'reaction', by: local.id, kind })
  }

  private pushReaction(reaction: RoomReaction) {
    const list = [...this.state.liveReactions, reaction].slice(-32)
    this.update({ liveReactions: list })

    const existing = this.reactionTimers.get(reaction.id)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(() => {
      this.reactionTimers.delete(reaction.id)
      this.update({
        liveReactions: this.state.liveReactions.filter((item) => item.id !== reaction.id),
      })
    }, 2400)
    this.reactionTimers.set(reaction.id, timer)
  }

  changeVideo(videoId: string, title: string) {
    this.sendPlayerAction({ type: 'VIDEO_CHANGE', videoId, title })
    this.callbacks.onToast('Vídeo sincronizado na sala', 'success')
  }

  stopVideo() {
    this.sendPlayerAction({ type: 'VIDEO_STOP' })
    this.callbacks.onToast('Vídeo removido da sala', 'success')
  }

  addToQueue(videoId: string, title: string) {
    const local = this.state.localParticipant
    if (!local || !this.socket) return
    this.socket.send({
      type: 'queue_add',
      by: local.id,
      videoId,
      title,
    })
  }

  removeFromQueue(itemId: string) {
    const local = this.state.localParticipant
    if (!local || !this.socket) return
    this.socket.send({ type: 'queue_remove', by: local.id, itemId })
  }

  skipQueue() {
    const local = this.state.localParticipant
    if (!local || !this.socket) return
    this.socket.send({ type: 'queue_skip', by: local.id })
  }

  prevQueue() {
    const local = this.state.localParticipant
    if (!local || !this.socket) return
    this.socket.send({ type: 'queue_prev', by: local.id })
  }

  clearQueue() {
    const local = this.state.localParticipant
    if (!local || !this.socket) return
    this.socket.send({ type: 'queue_clear', by: local.id })
  }

  setRole(targetId: string, role: Role) {
    const local = this.state.localParticipant
    if (!local || !this.socket) return
    this.socket.send({ type: 'set_role', by: local.id, targetId, role })
  }

  kickUser(targetId: string) {
    const local = this.state.localParticipant
    if (!local || !this.socket) return
    this.socket.send({ type: 'kick', by: local.id, targetId })
  }

  transferControl(targetId: string | null) {
    const local = this.state.localParticipant
    if (!local || !this.socket) return
    this.socket.send({ type: 'transfer_control', by: local.id, targetId })
  }

  reclaimControl() {
    this.transferControl(null)
  }

  canLocalControl(): boolean {
    const local = this.state.localParticipant
    const roomState = this.state.roomState
    if (!local || !roomState) return false
    return canControlPlayer(local, roomState.controllerId, roomState.ownerId)
  }

  disconnect() {
    this.disposed = true
    this.clearPing()
    if (this.joinRetryTimer) clearTimeout(this.joinRetryTimer)
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    for (const timer of this.reactionTimers.values()) {
      clearTimeout(timer)
    }
    this.reactionTimers.clear()
    this.socket?.close()
    this.socket = null
    resetClockSync()
    this.update({ connectionStatus: 'disconnected', waitingForHost: false, liveReactions: [] })
  }

  static async prepareRoom(
    options: import('../../types').RoomCreateOptions,
  ): Promise<string> {
    const roomId = generateRoomId()
    await saveRoomAuth(roomId, options.password)
    saveRoomCreateOptions(roomId, options)
    return roomId
  }
}

export type { QueueItem }
