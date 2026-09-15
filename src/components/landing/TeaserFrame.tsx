import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Pause, Play, Radio, Users } from 'lucide-react'
import { REACTION_OPTIONS } from '../../constants/reactions'
import type { ReactionKind } from '../../types'
import { cn } from '../../lib/cn'

const PARTICIPANTS = [
  { name: 'Ana', tone: 'bg-[#7dffb8]', initial: 'A' },
  { name: 'Leo', tone: 'bg-[#9ad4ff]', initial: 'L' },
  { name: 'Você', tone: 'bg-accent-bright', initial: 'V' },
] as const

const CHAT_LINES = [
  { user: 'Ana', text: 'abre o próximo, sync tá impecável' },
  { user: 'Leo', text: 'já tá na fila' },
  { user: 'Você', text: 'pausei. todo mundo no mesmo frame?' },
] as const

export function TeaserFrame() {
  const shellRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(true)
  const [chatIndex, setChatIndex] = useState(0)
  const [reaction, setReaction] = useState<ReactionKind | null>(null)
  const [scrub, setScrub] = useState(42)

  useEffect(() => {
    if (!playing) return undefined
    const chatTimer = window.setInterval(() => {
      setChatIndex((i) => (i + 1) % CHAT_LINES.length)
    }, 3400)
    const scrubTimer = window.setInterval(() => {
      setScrub((v) => (v >= 78 ? 28 : v + 0.35))
    }, 120)
    return () => {
      window.clearInterval(chatTimer)
      window.clearInterval(scrubTimer)
    }
  }, [playing])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return undefined
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return undefined

    const onMove = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width - 0.5
      const py = (event.clientY - rect.top) / rect.height - 0.5
      shell.style.setProperty('--tilt-x', `${(py * -6).toFixed(2)}deg`)
      shell.style.setProperty('--tilt-y', `${(px * 8).toFixed(2)}deg`)
    }
    const onLeave = () => {
      shell.style.setProperty('--tilt-x', '0deg')
      shell.style.setProperty('--tilt-y', '0deg')
    }

    shell.addEventListener('pointermove', onMove)
    shell.addEventListener('pointerleave', onLeave)
    return () => {
      shell.removeEventListener('pointermove', onMove)
      shell.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const triggerReaction = (id: ReactionKind) => {
    setReaction(id)
    window.setTimeout(() => setReaction(null), 1400)
  }

  const currentChat = CHAT_LINES[chatIndex]
  const activeReaction = REACTION_OPTIONS.find((item) => item.id === reaction)

  return (
    <div className="landing-stage w-full">
      <div
        ref={shellRef}
        className="landing-stage-shell relative overflow-hidden"
      >
        <div className="landing-stage-rim" aria-hidden />

        <header className="relative z-[1] flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="landing-live-dot" />
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/55 truncate">
              Sala ao vivo
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/50 font-medium tabular-nums">
            <span className="inline-flex items-center gap-1.5 text-accent-bright/90">
              <Radio className="w-3 h-3" />
              sync
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" />
              3
            </span>
          </div>
        </header>

        <div className="relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-[#050607]">
          <div className="landing-stage-screen absolute inset-0" />
          <div className="landing-stage-noise absolute inset-0 opacity-[0.35]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />

          <div className="absolute left-4 top-4 sm:left-5 sm:top-5 z-[1]">
            <p className="font-display text-[13px] sm:text-sm font-semibold tracking-tight text-white/90">
              Session · Friday Night
            </p>
            <p className="text-[10px] sm:text-[11px] text-white/40 mt-0.5 tracking-wide">
              Hosted with PlayRoomy
            </p>
          </div>

          {playing && (
            <div className="absolute inset-x-0 bottom-[4.5rem] flex items-end justify-center gap-[3px] px-10 h-10 pointer-events-none opacity-70">
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className="landing-eq-bar w-[2px] sm:w-[3px] rounded-full bg-accent-bright"
                  style={{ animationDelay: `${i * 0.07}s` }}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[2] group"
            aria-label={playing ? 'Pausar preview' : 'Reproduzir preview'}
          >
            <span className="landing-play-btn relative flex h-14 w-14 sm:h-[4.25rem] sm:w-[4.25rem] items-center justify-center rounded-full">
              {playing ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-black fill-black/20" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-black fill-black ml-0.5" />
              )}
            </span>
          </button>

          {activeReaction && (
            <span className="landing-reaction absolute right-7 top-10 z-[2]" key={activeReaction.id}>
              <activeReaction.Icon className="w-7 h-7 text-accent-bright" strokeWidth={2.25} />
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 px-4 sm:px-5 pb-3.5 pt-10 bg-gradient-to-t from-black to-transparent z-[1]">
            <div className="h-[3px] rounded-full bg-white/10 overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-accent-bright"
                style={{ width: `${scrub}%`, boxShadow: '0 0 12px rgba(107,255,179,0.45)' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/45 tabular-nums font-medium tracking-wide">
              <span>4:20</span>
              <span className="text-accent-bright/80">{playing ? 'ao vivo' : 'pausado'}</span>
              <span>12:08</span>
            </div>
          </div>
        </div>

        <div className="relative z-[1] px-4 sm:px-5 py-3.5 border-t border-white/[0.06] space-y-3 bg-black/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {PARTICIPANTS.map((person) => (
                <span
                  key={person.name}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03]"
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-black',
                      person.tone,
                    )}
                  >
                    {person.initial}
                  </span>
                  <span className="text-[10px] font-medium text-white/70">{person.name}</span>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 self-end sm:self-auto">
              {REACTION_OPTIONS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => triggerReaction(id)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white/55 bg-white/[0.04] border border-white/[0.08] hover:text-accent-bright hover:border-accent/40 hover:bg-accent/10 active:scale-95 transition-all duration-200"
                  aria-label={`Reagir: ${label}`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5 min-h-[48px] flex items-start gap-2">
            <MessageCircle className="w-3.5 h-3.5 text-accent-bright/80 shrink-0 mt-0.5" />
            <p key={chatIndex} className="landing-chat-line text-xs text-white/65 leading-relaxed">
              <span className="font-semibold text-white/90">{currentChat.user}</span>
              <span className="text-white/30"> · </span>
              {currentChat.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
