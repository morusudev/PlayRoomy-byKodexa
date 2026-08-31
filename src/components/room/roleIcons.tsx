import { Crown, Shield, Gamepad2, User } from 'lucide-react'
import type { Role } from '../../types'
import type { LucideIcon } from 'lucide-react'

export const ROLE_ICON: Record<Role, LucideIcon> = {
  owner: Crown,
  admin: Shield,
  controller: Gamepad2,
  viewer: User,
}

export const ROLE_ICON_CLASS: Record<Role, string> = {
  owner: 'text-amber-400',
  admin: 'text-sky-400',
  controller: 'text-accent',
  viewer: 'text-text-muted',
}
