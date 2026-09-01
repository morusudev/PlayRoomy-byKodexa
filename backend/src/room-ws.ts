import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import { WebSocketServer, WebSocket } from 'ws'

type Role = 'owner' | 'admin' | 'controller' | 'viewer'

interface Participant {
  id: string
  name: string
  role: Role
  joinedAt: number
  socketId: string
}

interface PlayerState {
  videoId: string | null
  playing: boolean
  currentTime: number
  updatedAt: number
}

interface QueueItem {
  id: string
  videoId: string
  title: string
  addedBy: string
  addedByName: string
}

interface PlayHistoryItem {
  videoId: string
  title: string
}

interface RoomState {
  roomId: string
  passwordHash: string | null
  ownerId: string
  controllerId: string | null
  maxParticipants: number
  createdAt: number
  participants: Participant[]
  player: PlayerState
  queue: QueueItem[]
  playHistory: PlayHistoryItem[]
  currentVideoTitle: string | null
}

interface ClientSocket extends WebSocket {
  socketId: string
  roomId?: string
  userId?: string
}

type Inbound =
  | {
      type: 'join'
      roomId: string
      userId: string
      name: string
      create?: boolean
      passwordHash?: string | null
    }
  | {
      type: 'player'
      by: string
      action: string
      videoId?: string
      title?: string
      currentTime?: number
    }
  | { type: 'queue_prev'; by: string }
  | { type: 'chat'; by: string; text: string }
  | { type: 'reaction'; by: string; kind: string }
  | { type: 'queue_add'; by: string; videoId: string; title: string }
  | { type: 'queue_remove'; by: string; itemId: string }
  | { type: 'queue_skip'; by: string }
  | { type: 'queue_clear'; by: string }
  | { type: 'set_role'; by: string; targetId: string; role: Role }
  | { type: 'kick'; by: string; targetId: string }
  | { type: 'transfer_control'; by: string; targetId: string | null }
  | { type: 'ping' }

const ROLE_PRIORITY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  controller: 2,
  viewer: 1,
}

/** Tunable limits — safe defaults for 512 MB RAM on Discloud. */
export const serverLimits = {
  maxRooms: Number(process.env.MAX_ROOMS) || 120,
  maxConnections: Number(process.env.MAX_CONNECTIONS) || 350,
  maxParticipantsPerRoom: Number(process.env.MAX_PARTICIPANTS) || 20,
  maxQueueItems: Number(process.env.MAX_QUEUE_ITEMS) || 40,
  maxPlayHistory: 20,
  emptyRoomGraceMs: Number(process.env.EMPTY_ROOM_GRACE_MS) || 90_000,
  chatCooldownMs: 700,
  reactionCooldownMs: 450,
  statsIntervalMs: 60_000,
} as const

function canControl(p: Participant | undefined, room: RoomState): boolean {
  if (!p) return false
  if (p.id === room.ownerId) return true
  if (room.controllerId && p.id === room.controllerId) return true
  return p.role === 'admin' || p.role === 'controller'
}

function canChangeVideo(p: Participant | undefined, room: RoomState): boolean {
  if (!p) return false
  return p.id === room.ownerId || p.role === 'owner' || p.role === 'admin'
}

function canManageUsers(p: Participant | undefined, room: RoomState): boolean {
  if (!p) return false
  return p.id === room.ownerId || p.role === 'owner' || p.role === 'admin'
}

function canManageQueue(p: Participant | undefined, room: RoomState): boolean {
  if (!p) return false
  return (
    p.id === room.ownerId ||
    p.role === 'owner' ||
    p.role === 'admin' ||
    p.role === 'controller'
  )
}

function send(ws: WebSocket, data: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

function rememberCurrentVideo(room: RoomState) {
  const videoId = room.player.videoId
  if (!videoId) return
  room.playHistory.push({
    videoId,
    title: room.currentVideoTitle ?? 'Vídeo',
  })
  if (room.playHistory.length > serverLimits.maxPlayHistory) {
    room.playHistory.shift()
  }
}

function publicState(room: RoomState) {
  return {
    config: {
      roomId: room.roomId,
      isPrivate: !!room.passwordHash,
      hasPassword: !!room.passwordHash,
      maxParticipants: room.maxParticipants,
      createdAt: room.createdAt,
    },
    participants: room.participants.map(({ id, name, role, joinedAt }) => ({
      id,
      name,
      role,
      joinedAt,
    })),
    player: room.player,
    queue: room.queue,
    hasPreviousVideo: room.playHistory.length > 0,
    controllerId: room.controllerId,
    ownerId: room.ownerId,
  }
}

function broadcast(
  room: RoomState,
  sockets: Map<string, ClientSocket>,
  data: unknown,
  except?: string,
) {
  for (const p of room.participants) {
    if (except && p.socketId === except) continue
    const sock = sockets.get(p.socketId)
    if (sock) send(sock, data)
  }
}

function expectedTime(player: PlayerState, now = Date.now()) {
  if (!player.playing) return player.currentTime
  return player.currentTime + (now - player.updatedAt) / 1000
}

export type RoomyHttpServer = {
  on(
    event: 'upgrade',
    listener: (req: IncomingMessage, socket: Duplex, head: Buffer) => void,
  ): unknown
}

export type RoomServerStats = {
  rooms: number
  connections: number
  limits: typeof serverLimits
}

export type AttachRoomyOptions = {
  onBeforeUpgrade?: (req: IncomingMessage) => boolean
}

export function attachRoomyWss(httpServer: RoomyHttpServer, options: AttachRoomyOptions = {}) {
  const wss = new WebSocketServer({ noServer: true })
  const rooms = new Map<string, RoomState>()
  const sockets = new Map<string, ClientSocket>()
  const emptyTimers = new Map<string, ReturnType<typeof setTimeout>>()
  const chatCooldown = new Map<string, number>()
  const reactionCooldown = new Map<string, number>()
  const validReactions = new Set(['fire', 'heart', 'laugh', 'clap'])

  function getStats(): RoomServerStats {
    return {
      rooms: rooms.size,
      connections: sockets.size,
      limits: serverLimits,
    }
  }

  function cancelEmptyTimer(roomId: string) {
    const t = emptyTimers.get(roomId)
    if (t) {
      clearTimeout(t)
      emptyTimers.delete(roomId)
    }
  }

  function scheduleEmptyDelete(roomId: string) {
    cancelEmptyTimer(roomId)
    emptyTimers.set(
      roomId,
      setTimeout(() => {
        emptyTimers.delete(roomId)
        const room = rooms.get(roomId)
        if (room && room.participants.length === 0) {
          rooms.delete(roomId)
          console.log(`[playroomy] room ${roomId} expired`)
        }
      }, serverLimits.emptyRoomGraceMs),
    )
  }

  httpServer.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = req.url ?? ''
    if (!url.startsWith('/roomy-ws')) return

    if (options.onBeforeUpgrade && !options.onBeforeUpgrade(req)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
      socket.destroy()
      return
    }

    if (sockets.size >= serverLimits.maxConnections) {
      socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n')
      socket.destroy()
      return
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })

  wss.on('connection', (ws) => {
    const client = ws as ClientSocket
    client.socketId = crypto.randomUUID()
    sockets.set(client.socketId, client)

    client.on('message', (raw) => {
      let msg: Inbound
      try {
        msg = JSON.parse(String(raw)) as Inbound
      } catch {
        return
      }

      try {
        handleMessage(client, msg)
      } catch (err) {
        console.error('[playroomy-ws]', err)
        send(client, { type: 'error', code: 'internal', message: 'Erro interno do servidor.' })
      }
    })

    client.on('close', () => {
      handleDisconnect(client)
      sockets.delete(client.socketId)
    })
  })

  const statsTimer = setInterval(() => {
    const { rooms: roomCount, connections } = getStats()
    console.log(`[playroomy] stats rooms=${roomCount} connections=${connections}`)
  }, serverLimits.statsIntervalMs)

  if (typeof statsTimer === 'object' && 'unref' in statsTimer) {
    statsTimer.unref()
  }

  function handleDisconnect(client: ClientSocket) {
    const roomId = client.roomId
    if (!roomId) return
    const room = rooms.get(roomId)
    if (!room) return

    const leaving = room.participants.find((p) => p.socketId === client.socketId)
    if (!leaving) return

    room.participants = room.participants.filter((p) => p.socketId !== client.socketId)

    if (leaving.id === room.ownerId && room.participants.length > 0) {
      const sorted = [...room.participants].sort((a, b) => {
        const d = ROLE_PRIORITY[b.role] - ROLE_PRIORITY[a.role]
        return d !== 0 ? d : a.joinedAt - b.joinedAt
      })
      const next = sorted[0]!
      room.ownerId = next.id
      room.controllerId = null
      next.role = 'owner'
      broadcast(room, sockets, {
        type: 'owner_migrated',
        newOwnerId: next.id,
        previousOwnerId: leaving.id,
        state: publicState(room),
      })
    }

    if (room.participants.length === 0) {
      scheduleEmptyDelete(roomId)
      return
    }

    broadcast(room, sockets, {
      type: 'user_left',
      id: leaving.id,
      state: publicState(room),
    })
  }

  function handleMessage(client: ClientSocket, msg: Inbound) {
    switch (msg.type) {
      case 'ping':
        send(client, { type: 'pong', at: Date.now() })
        return
      case 'join':
        handleJoin(client, msg)
        return
      case 'player':
        handlePlayer(client, msg)
        return
      case 'chat':
        handleChat(client, msg)
        return
      case 'reaction':
        handleReaction(client, msg)
        return
      case 'queue_add':
        handleQueueAdd(client, msg)
        return
      case 'queue_remove':
        handleQueueRemove(client, msg)
        return
      case 'queue_skip':
        handleQueueSkip(client, msg)
        return
      case 'queue_prev':
        handleQueuePrev(client, msg)
        return
      case 'queue_clear':
        handleQueueClear(client, msg)
        return
      case 'set_role':
        handleSetRole(client, msg)
        return
      case 'kick':
        handleKick(client, msg)
        return
      case 'transfer_control':
        handleTransfer(client, msg)
        return
      default: {
        const _exhaustive: never = msg
        return _exhaustive
      }
    }
  }

  function handleJoin(client: ClientSocket, msg: Extract<Inbound, { type: 'join' }>) {
    const roomId = msg.roomId.trim()
    const name = msg.name.trim().slice(0, 24) || 'Convidado'
    const passwordHash = msg.passwordHash?.trim() || null
    let room = rooms.get(roomId)

    if (!room) {
      if (!msg.create) {
        send(client, {
          type: 'error',
          code: 'room_not_found',
          message: 'Sala não encontrada. O host precisa criar e manter a aba aberta.',
        })
        return
      }

      if (rooms.size >= serverLimits.maxRooms) {
        send(client, {
          type: 'error',
          code: 'server_busy',
          message: 'Servidor cheio no momento. Tente de novo em alguns minutos.',
        })
        return
      }

      room = {
        roomId,
        passwordHash,
        ownerId: msg.userId,
        controllerId: null,
        maxParticipants: serverLimits.maxParticipantsPerRoom,
        createdAt: Date.now(),
        participants: [],
        player: {
          videoId: null,
          playing: false,
          currentTime: 0,
          updatedAt: Date.now(),
        },
        queue: [],
        playHistory: [],
        currentVideoTitle: null,
      }
      rooms.set(roomId, room)
    } else if (room.passwordHash) {
      if (!passwordHash) {
        send(client, {
          type: 'error',
          code: 'password_required',
          message: 'Esta sala é privada. Digite a senha.',
        })
        return
      }
      if (passwordHash !== room.passwordHash) {
        send(client, {
          type: 'error',
          code: 'wrong_password',
          message: 'Senha incorreta.',
        })
        return
      }
    }

    cancelEmptyTimer(roomId)

    room.participants = room.participants.filter((p) => {
      if (p.id !== msg.userId) return true
      const old = sockets.get(p.socketId)
      if (old && old !== client) {
        try {
          old.close()
        } catch {
          // ignore
        }
      }
      return false
    })

    if (room.participants.length >= room.maxParticipants) {
      send(client, { type: 'error', code: 'room_full', message: 'Sala cheia.' })
      return
    }

    const isOwnerReturning =
      msg.userId === room.ownerId || (msg.create && room.participants.length === 0)
    const participant: Participant = {
      id: msg.userId,
      name,
      role: isOwnerReturning ? 'owner' : 'viewer',
      joinedAt: Date.now(),
      socketId: client.socketId,
    }

    if (isOwnerReturning) {
      room.ownerId = msg.userId
      participant.role = 'owner'
    }

    room.participants.push(participant)
    client.roomId = roomId
    client.userId = msg.userId

    send(client, {
      type: 'welcome',
      yourId: msg.userId,
      peerCount: room.participants.length - 1,
      state: publicState(room),
    })

    broadcast(
      room,
      sockets,
      {
        type: 'user_joined',
        participant: {
          id: participant.id,
          name: participant.name,
          role: participant.role,
          joinedAt: participant.joinedAt,
        },
        state: publicState(room),
      },
      client.socketId,
    )
  }

  function requireRoom(client: ClientSocket): RoomState | null {
    if (!client.roomId) return null
    return rooms.get(client.roomId) ?? null
  }

  function findActor(room: RoomState, userId: string) {
    return room.participants.find((p) => p.id === userId)
  }

  function handlePlayer(client: ClientSocket, msg: Extract<Inbound, { type: 'player' }>) {
    const room = requireRoom(client)
    if (!room) return
    const actor = findActor(room, msg.by)
    if (!actor) return

    const now = Date.now()
    let player = { ...room.player }

    switch (msg.action) {
      case 'PLAY':
        if (!canControl(actor, room)) return
        player = {
          ...player,
          playing: true,
          currentTime: msg.currentTime ?? expectedTime(player, now),
          updatedAt: now,
        }
        break
      case 'PAUSE':
        if (!canControl(actor, room)) return
        player = {
          ...player,
          playing: false,
          currentTime: msg.currentTime ?? expectedTime(player, now),
          updatedAt: now,
        }
        break
      case 'SEEK':
        if (!canControl(actor, room)) return
        player = {
          ...player,
          currentTime: msg.currentTime ?? player.currentTime,
          updatedAt: now,
        }
        break
      case 'VIDEO_CHANGE': {
        if (!canChangeVideo(actor, room) && !canControl(actor, room)) return
        const nextVideoId = msg.videoId ?? null
        if (!nextVideoId) return
        if (nextVideoId !== room.player.videoId) {
          rememberCurrentVideo(room)
        }
        room.currentVideoTitle =
          msg.title?.trim().slice(0, 120) || room.currentVideoTitle || 'Vídeo'
        player = {
          videoId: nextVideoId,
          playing: true,
          currentTime: 0,
          updatedAt: now,
        }
        break
      }
      case 'VIDEO_ENDED': {
        if (!canControl(actor, room) && !canChangeVideo(actor, room)) return
        const next = room.queue[0]
        if (next) {
          rememberCurrentVideo(room)
          room.queue = room.queue.slice(1)
          room.currentVideoTitle = next.title
          player = {
            videoId: next.videoId,
            playing: true,
            currentTime: 0,
            updatedAt: now,
          }
        } else {
          player = { ...player, playing: false, updatedAt: now }
        }
        break
      }
      case 'VIDEO_STOP': {
        if (!canChangeVideo(actor, room) && !canControl(actor, room)) return
        if (!room.player.videoId) return
        player = {
          videoId: null,
          playing: false,
          currentTime: 0,
          updatedAt: now,
        }
        room.currentVideoTitle = null
        break
      }
      default:
        return
    }

    room.player = player
    broadcast(room, sockets, { type: 'state', state: publicState(room) })
  }

  function handleChat(client: ClientSocket, msg: Extract<Inbound, { type: 'chat' }>) {
    const room = requireRoom(client)
    if (!room) return
    const actor = findActor(room, msg.by)
    if (!actor) return
    const text = msg.text.trim().slice(0, 500)
    if (!text) return

    const cooldownKey = `${room.roomId}:${actor.id}`
    const lastChat = chatCooldown.get(cooldownKey) ?? 0
    const now = Date.now()
    if (now - lastChat < serverLimits.chatCooldownMs) return
    chatCooldown.set(cooldownKey, now)

    broadcast(room, sockets, {
      type: 'chat',
      message: {
        id: crypto.randomUUID().slice(0, 10),
        userId: actor.id,
        userName: actor.name,
        text,
        timestamp: now,
      },
    })
  }

  function handleReaction(client: ClientSocket, msg: Extract<Inbound, { type: 'reaction' }>) {
    const room = requireRoom(client)
    if (!room) return
    const actor = findActor(room, msg.by)
    if (!actor) return
    const kind = msg.kind.trim()
    if (!validReactions.has(kind)) return

    const cooldownKey = `${room.roomId}:${actor.id}`
    const lastReaction = reactionCooldown.get(cooldownKey) ?? 0
    const now = Date.now()
    if (now - lastReaction < serverLimits.reactionCooldownMs) return
    reactionCooldown.set(cooldownKey, now)

    broadcast(room, sockets, {
      type: 'reaction',
      reaction: {
        id: crypto.randomUUID().slice(0, 10),
        userId: actor.id,
        userName: actor.name,
        kind,
        at: now,
        x: 18 + Math.floor(Math.random() * 64),
      },
    })
  }

  function handleQueueAdd(client: ClientSocket, msg: Extract<Inbound, { type: 'queue_add' }>) {
    const room = requireRoom(client)
    if (!room) return
    const actor = findActor(room, msg.by)
    if (!canManageQueue(actor, room)) return
    if (room.queue.length >= serverLimits.maxQueueItems) return
    room.queue.push({
      id: crypto.randomUUID().slice(0, 8),
      videoId: msg.videoId,
      title: msg.title.slice(0, 120),
      addedBy: actor!.id,
      addedByName: actor!.name,
    })
    broadcast(room, sockets, { type: 'state', state: publicState(room) })
  }

  function handleQueueRemove(
    client: ClientSocket,
    msg: Extract<Inbound, { type: 'queue_remove' }>,
  ) {
    const room = requireRoom(client)
    if (!room) return
    const actor = findActor(room, msg.by)
    if (!actor || (actor.id !== room.ownerId && actor.role !== 'owner')) return
    room.queue = room.queue.filter((q) => q.id !== msg.itemId)
    broadcast(room, sockets, { type: 'state', state: publicState(room) })
  }

  function handleQueueSkip(client: ClientSocket, msg: Extract<Inbound, { type: 'queue_skip' }>) {
    const room = requireRoom(client)
    if (!room) return
    const actor = findActor(room, msg.by)
    if (!actor || (!canManageQueue(actor, room) && !canControl(actor, room))) return
    const next = room.queue[0]
    if (!next) return
    rememberCurrentVideo(room)
    room.queue = room.queue.slice(1)
    room.currentVideoTitle = next.title
    room.player = {
      videoId: next.videoId,
      playing: true,
      currentTime: 0,
      updatedAt: Date.now(),
    }
    broadcast(room, sockets, { type: 'state', state: publicState(room) })
  }

  function handleQueuePrev(client: ClientSocket, msg: Extract<Inbound, { type: 'queue_prev' }>) {
    const room = requireRoom(client)
    if (!room) return
    const actor = findActor(room, msg.by)
    if (!actor || (!canManageQueue(actor, room) && !canControl(actor, room))) return
    const previous = room.playHistory.pop()
    if (!previous) return

    if (room.player.videoId) {
      room.queue.unshift({
        id: crypto.randomUUID().slice(0, 8),
        videoId: room.player.videoId,
        title: room.currentVideoTitle ?? 'Vídeo',
        addedBy: actor.id,
        addedByName: actor.name,
      })
    }

    room.currentVideoTitle = previous.title
    room.player = {
      videoId: previous.videoId,
      playing: true,
      currentTime: 0,
      updatedAt: Date.now(),
    }
    broadcast(room, sockets, { type: 'state', state: publicState(room) })
  }

  function handleQueueClear(client: ClientSocket, msg: Extract<Inbound, { type: 'queue_clear' }>) {
    const room = requireRoom(client)
    if (!room) return
    const actor = findActor(room, msg.by)
    if (!actor || (actor.id !== room.ownerId && actor.role !== 'owner')) return
    room.queue = []
    broadcast(room, sockets, { type: 'state', state: publicState(room) })
  }

  function handleSetRole(client: ClientSocket, msg: Extract<Inbound, { type: 'set_role' }>) {
    const room = requireRoom(client)
    if (!room) return
    const actor = findActor(room, msg.by)
    const target = findActor(room, msg.targetId)
    if (!canManageUsers(actor, room) || !target) return
    if (target.id === room.ownerId) return
    if (msg.role === 'owner') return
    if (actor!.role === 'admin' && msg.role === 'admin') return
    target.role = msg.role
    broadcast(room, sockets, { type: 'state', state: publicState(room) })
  }

  function handleKick(client: ClientSocket, msg: Extract<Inbound, { type: 'kick' }>) {
    const room = requireRoom(client)
    if (!room) return
    const actor = findActor(room, msg.by)
    const target = findActor(room, msg.targetId)
    if (!canManageUsers(actor, room) || !target) return
    if (target.id === room.ownerId) return
    if (actor!.role === 'admin' && target.role === 'admin') return

    const targetSock = sockets.get(target.socketId)
    room.participants = room.participants.filter((p) => p.id !== target.id)
    if (targetSock) {
      send(targetSock, { type: 'kicked' })
      targetSock.roomId = undefined
      try {
        targetSock.close()
      } catch {
        // ignore
      }
    }
    broadcast(room, sockets, { type: 'state', state: publicState(room) })
  }

  function handleTransfer(
    client: ClientSocket,
    msg: Extract<Inbound, { type: 'transfer_control' }>,
  ) {
    const room = requireRoom(client)
    if (!room) return
    const actor = findActor(room, msg.by)
    if (!actor || actor.id !== room.ownerId) return
    room.controllerId = msg.targetId
    broadcast(room, sockets, { type: 'state', state: publicState(room) })
  }

  return { wss, getStats }
}
