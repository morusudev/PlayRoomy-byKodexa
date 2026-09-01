import { useEffect, useState } from 'react'
import type { RoomReaction } from '../../types'
import { getReactionOption } from '../../constants/reactions'
import { cn } from '../../lib/cn'

type ReactionBurstProps = {
  reactions: RoomReaction[]
  className?: string
}

const LIFETIME_MS = 2200

export function ReactionBurst({ reactions, className }: ReactionBurstProps) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (reactions.length === 0) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 120)
    return () => window.clearInterval(timer)
  }, [reactions.length])

  const visible = reactions.filter((r) => now - r.at < LIFETIME_MS)

  if (visible.length === 0) return null

  return (
    <div className={cn('pointer-events-none absolute inset-0 z-[22] overflow-hidden', className)}>
      {visible.map((reaction) => {
        const { Icon } = getReactionOption(reaction.kind)
        const age = now - reaction.at
        const progress = age / LIFETIME_MS
        const y = 72 - progress * 58
        const scale = 0.85 + (1 - progress) * 0.35
        const opacity = progress < 0.12 ? progress / 0.12 : 1 - (progress - 0.12) / 0.88

        return (
          <div
            key={reaction.id}
            className="absolute flex flex-col items-center gap-0.5"
            style={{
              left: `${reaction.x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity: Math.max(0, opacity),
            }}
          >
            <Icon className="w-8 h-8 sm:w-9 sm:h-9 text-accent-bright drop-shadow-[0_0_12px_rgba(107,255,179,0.55)]" strokeWidth={2.25} />
            <span className="text-[9px] font-bold text-white/80 bg-black/50 px-1.5 py-0.5 rounded-md max-w-[5rem] truncate">
              {reaction.userName}
            </span>
          </div>
        )
      })}
    </div>
  )
}
