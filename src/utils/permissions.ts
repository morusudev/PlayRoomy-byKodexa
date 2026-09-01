import type { Participant, Role } from '../types'
import { ROLE_PRIORITY } from '../types'

export function canControlPlayer(
  participant: Participant | undefined,
  controllerId: string | null,
  ownerId: string,
): boolean {
  if (!participant) return false
  if (participant.id === ownerId) return true
  if (controllerId && participant.id === controllerId) return true
  return participant.role === 'admin' || participant.role === 'controller'
}

/** Who drives local playback without applying remote state (everyone else follows the room). */
export function resolveSyncDriverId(
  controllerId: string | null,
  ownerId: string,
): string {
  return controllerId ?? ownerId
}

export function isSyncDriver(
  participant: Participant | undefined,
  controllerId: string | null,
  ownerId: string,
): boolean {
  if (!participant) return false
  return participant.id === resolveSyncDriverId(controllerId, ownerId)
}

export function canChangeVideo(participant: Participant | undefined, ownerId: string): boolean {
  if (!participant) return false
  return (
    participant.id === ownerId ||
    participant.role === 'owner' ||
    participant.role === 'admin'
  )
}

export function canManageUsers(participant: Participant | undefined, ownerId: string): boolean {
  if (!participant) return false
  return participant.id === ownerId || participant.role === 'owner' || participant.role === 'admin'
}

export function canManageQueue(participant: Participant | undefined, ownerId: string): boolean {
  if (!participant) return false
  return (
    participant.id === ownerId ||
    participant.role === 'owner' ||
    participant.role === 'admin' ||
    participant.role === 'controller'
  )
}

export function canGrantRole(
  actor: Participant | undefined,
  target: Participant | undefined,
  newRole: Role,
  ownerId: string,
): boolean {
  if (!actor || !target) return false
  if (actor.id !== ownerId && actor.role !== 'owner') {
    if (actor.role === 'admin') {
      return newRole === 'controller' || newRole === 'viewer'
    }
    return false
  }
  if (target.id === ownerId) return false
  if (newRole === 'owner') return false
  return true
}

export function canKick(actor: Participant | undefined, target: Participant | undefined, ownerId: string): boolean {
  if (!actor || !target) return false
  if (target.id === ownerId) return false
  if (actor.id === ownerId || actor.role === 'owner') return true
  if (actor.role === 'admin' && target.role !== 'admin') return true
  return false
}

export function canTransferControl(actor: Participant | undefined, ownerId: string): boolean {
  if (!actor) return false
  return actor.id === ownerId || actor.role === 'owner'
}

export function pickNextOwner(participants: Participant[], leavingId: string): Participant | null {
  const remaining = participants.filter((p) => p.id !== leavingId)
  if (remaining.length === 0) return null

  const sorted = [...remaining].sort((a, b) => {
    const roleDiff = ROLE_PRIORITY[b.role] - ROLE_PRIORITY[a.role]
    if (roleDiff !== 0) return roleDiff
    return a.joinedAt - b.joinedAt
  })

  return sorted[0] ?? null
}

export function validatePlayerActionRole(
  participant: Participant | undefined,
  actionType: string,
  controllerId: string | null,
  ownerId: string,
): boolean {
  switch (actionType) {
    case 'PLAY':
    case 'PAUSE':
    case 'SEEK':
      return canControlPlayer(participant, controllerId, ownerId)
    case 'VIDEO_CHANGE':
    case 'VIDEO_STOP':
    case 'VIDEO_ENDED':
      return canChangeVideo(participant, ownerId) || canControlPlayer(participant, controllerId, ownerId)
    default:
      return false
  }
}
