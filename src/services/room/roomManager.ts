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
  Role,
  RoomState,
} from '../../types'
import { canControlPlayer } from '../../utils/permissions'
import {
  loadIdentity,
  loadRoomCreateOptions,
  saveIdentity,
  saveRoomCreateOptions,
  saveRoomAuth,
  clearRoomCreateOptions,
} from '../../utils/storage'
import { generateRoomId } from '../../utils/roomId'

export interface RoomManagerCallbacks {
  onStateChange: (state: Partial<RoomManagerState>) => void
  onToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
}

export interface RoomManagerState {
  connectionStatus: ConnectionStatus
  roomState: RoomState | null
  localParticipant: Participant | null
  chatMessages: import('../../types').ChatMessage[]
  error: string | null
  isKicked: boolean
  peerCount: number
  waitingForHost: boolean
  needsPassword: boolean
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
  private joinRetries = 0
  private callbacks: RoomManagerCallbacks
  private state: RoomManagerState = {
    connectionStatus: 'idle',
    roomState: null,
    localParticipant: null,
    chatMessages: [],
    error: null,
    isKicked: false,
    peerCount: 0,
    waitingForHost: false,
    needsPassword: false,
  }
  private lastJoinCreate = false
  private lastPasswordHash: string | null = null

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
    this.update({ connectionStatus: 'connecting', error: null, waitingForHost: false })
    this.nickname = nickname.trim() || 'Convidado'

    const createOptions = loadRoomCreateOptions(this.roomId)
    const isCreator = !!createOptions
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
          if (this.disposed) return
          this.update({
            connectionStatus: 'disconnected',
            error: 'Conexão perdida. Recarregue a página ou entre de novo na sala.',
            waitingForHost: false,
          })
        },
        onError: (message) => {
          if (!this.disposed) {
            this.update({ connectionStatus: 'error', error: message })
          }
        },
      })
    } catch {
      this.update({
        connectionStatus: 'error',
        error:
          'Não conectou no servidor do host. Abra https://IP:5173 no PC do host (npm run dev) e use o mesmo link.',
      })
      return
    }

    if (this.disposed) {
      this.socket.close()
      return
    }

    this.socket.send({
      type: 'join',
      roomId: this.roomId,
      userId: this.userId,
      name: this.nickname,
      create: isCreator,
      passwordHash,
    })
    this.lastJoinCreate = isCreator
    this.lastPasswordHash = passwordHash
    this.joinRetries = 0

    // Keep create options until welcome — so refresh/HMR can recreate as host.
    if (!isCreator) {
      this.update({ waitingForHost: true })
    }

    this.pingTimer = setInterval(() => {
      this.socket?.send({ type: 'ping' })
    }, 15000)
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

        const hadVideo = !!msg.state.player.videoId
        this.update({
          connectionStatus: 'connected',
          roomState: msg.state,
          localParticipant: me,
          peerCount: Math.max(0, msg.state.participants.length - 1),
          waitingForHost: false,
          needsPassword: false,
          error: null,
        })
        this.joinRetries = 0
        if (this.joinRetryTimer) {
          clearTimeout(this.joinRetryTimer)
          this.joinRetryTimer = null
        }

        if (me.role === 'owner') {
          clearRoomCreateOptions(this.roomId)
          this.callbacks.onToast('Sala pronta. Compartilhe o convite HTTPS!', 'success')
        } else {
          this.callbacks.onToast(
            hadVideo ? 'Conectado. Sincronizando o video...' : 'Conectado à sala!',
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

        const state = msg.state
        const me = state.participants.find((p) => p.id === this.userId)
        this.update({
          roomState: state,
          localParticipant: me ?? this.state.localParticipant,
          peerCount: Math.max(0, state.participants.length - 1),
          waitingForHost: false,
          connectionStatus: 'connected',
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

          // Guest arrived early — retry join while host is still creating.
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

      case 'pong':
        break

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
    // Server already pushes full state; no-op
  }

  sendChat(text: string) {
    const local = this.state.localParticipant
    if (!local || !this.socket || !text.trim()) return
    this.socket.send({ type: 'chat', by: local.id, text: text.trim() })
  }

  changeVideo(videoId: string, title: string) {
    this.sendPlayerAction({ type: 'VIDEO_CHANGE', videoId, title })
    this.callbacks.onToast('Vídeo sincronizado na sala', 'success')
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
    if (this.pingTimer) clearInterval(this.pingTimer)
    if (this.joinRetryTimer) clearTimeout(this.joinRetryTimer)
    this.socket?.close()
    this.socket = null
    this.update({ connectionStatus: 'disconnected', waitingForHost: false })
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

// silence unused import if tree-shaken oddly
export type { QueueItem }
