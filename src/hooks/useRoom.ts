import { useEffect, useRef, useState, useCallback } from 'react'
import { RoomManager, type RoomManagerState } from '../services/room/roomManager'
import { useToastStore } from '../store/toastStore'
import type { Role, ReactionKind } from '../types'
import { canControlPlayer } from '../utils/permissions'

const initialState: RoomManagerState = {
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

export function useRoom(roomId: string, nickname: string, password?: string) {
  const managerRef = useRef<RoomManager | null>(null)
  const [state, setState] = useState<RoomManagerState>(initialState)
  const addToast = useToastStore((s) => s.addToast)

  useEffect(() => {
    if (!roomId || !nickname) return

    setState(initialState)

    const manager = new RoomManager(
      roomId,
      {
        onStateChange: (partial) => setState((s) => ({ ...s, ...partial })),
        onToast: addToast,
      },
      password,
    )

    managerRef.current = manager
    void manager.connect(nickname)

    return () => {
      manager.disconnect()
      if (managerRef.current === manager) {
        managerRef.current = null
      }
    }
  }, [roomId, nickname, password, addToast])

  const sendPlay = useCallback((time: number) => {
    managerRef.current?.sendPlayerAction({ type: 'PLAY', currentTime: time })
  }, [])

  const sendPause = useCallback((time: number) => {
    managerRef.current?.sendPlayerAction({ type: 'PAUSE', currentTime: time })
  }, [])

  const sendSeek = useCallback((time: number) => {
    managerRef.current?.sendPlayerAction({ type: 'SEEK', currentTime: time })
  }, [])

  const sendVideoEnded = useCallback(() => {
    managerRef.current?.sendPlayerAction({ type: 'VIDEO_ENDED' })
  }, [])

  const stopVideo = useCallback(() => {
    managerRef.current?.stopVideo()
  }, [])

  const changeVideo = useCallback((videoId: string, title: string) => {
    managerRef.current?.changeVideo(videoId, title)
  }, [])

  const sendChat = useCallback((text: string) => {
    managerRef.current?.sendChat(text)
  }, [])

  const sendReaction = useCallback((kind: ReactionKind) => {
    managerRef.current?.sendReaction(kind)
  }, [])

  const addToQueue = useCallback((videoId: string, title: string) => {
    managerRef.current?.addToQueue(videoId, title)
  }, [])

  const removeFromQueue = useCallback((id: string) => {
    managerRef.current?.removeFromQueue(id)
  }, [])

  const skipQueue = useCallback(() => {
    managerRef.current?.skipQueue()
  }, [])

  const prevQueue = useCallback(() => {
    managerRef.current?.prevQueue()
  }, [])

  const clearQueue = useCallback(() => {
    managerRef.current?.clearQueue()
  }, [])

  const setRole = useCallback((targetId: string, role: Role) => {
    managerRef.current?.setRole(targetId, role)
  }, [])

  const kickUser = useCallback((targetId: string) => {
    managerRef.current?.kickUser(targetId)
  }, [])

  const transferControl = useCallback((targetId: string | null) => {
    managerRef.current?.transferControl(targetId)
  }, [])

  const reclaimControl = useCallback(() => {
    managerRef.current?.reclaimControl()
  }, [])

  const requestSync = useCallback(() => {
    managerRef.current?.requestSync()
  }, [])

  const claimHost = useCallback(() => {
    managerRef.current?.claimHost()
  }, [])

  const submitPassword = useCallback((password: string) => {
    void managerRef.current?.submitPassword(password)
  }, [])

  const canControl =
    state.localParticipant && state.roomState
      ? canControlPlayer(
          state.localParticipant,
          state.roomState.controllerId,
          state.roomState.ownerId,
        )
      : false

  return {
    ...state,
    sendPlay,
    sendPause,
    sendSeek,
    sendVideoEnded,
    stopVideo,
    changeVideo,
    sendChat,
    sendReaction,
    addToQueue,
    removeFromQueue,
    skipQueue,
    prevQueue,
    clearQueue,
    setRole,
    kickUser,
    transferControl,
    reclaimControl,
    requestSync,
    claimHost,
    submitPassword,
    canControl,
  }
}
