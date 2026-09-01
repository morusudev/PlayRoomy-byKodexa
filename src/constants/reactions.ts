import type { LucideIcon } from 'lucide-react'
import { Flame, HandMetal, Heart, Laugh } from 'lucide-react'
import type { ReactionKind } from '../types'

export type ReactionOption = {
  id: ReactionKind
  label: string
  Icon: LucideIcon
}

export const REACTION_OPTIONS: ReactionOption[] = [
  { id: 'fire', label: 'Fogo', Icon: Flame },
  { id: 'heart', label: 'Curtir', Icon: Heart },
  { id: 'laugh', label: 'Rir', Icon: Laugh },
  { id: 'clap', label: 'Aplaudir', Icon: HandMetal },
]

export const REACTION_KINDS = new Set<ReactionKind>(REACTION_OPTIONS.map((r) => r.id))

export function getReactionOption(kind: ReactionKind): ReactionOption {
  const found = REACTION_OPTIONS.find((r) => r.id === kind)
  if (!found) {
    return REACTION_OPTIONS[0]
  }
  return found
}
