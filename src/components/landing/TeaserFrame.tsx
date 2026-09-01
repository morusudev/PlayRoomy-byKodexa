import { useEffect, useState } from 'react'
import {
  MessageCircle,
  Pause,
  Play,
  Radio,
  Users,
  Zap,
} from 'lucide-react'
import { REACTION_OPTIONS } from '../../constants/reactions'
import type { ReactionKind } from '../../types'
import { cn } from '../../lib/cn'

const PARTICIPANTS = [
  { name: 'Ana', tone: 'bg-emerald-400', active: true },
  { name: 'Leo', tone: 'bg-sky-400', active: true },
  { name: 'Você', tone: 'bg-accent-bright', active: true },
] as const

const CHAT_LINES = [
  { user: 'Ana', text: 'bora maratonar essa série', accent: true },
  { user: 'Leo', text: 'já coloquei o próximo na fila', accent: false },
  { user: 'Ana', text: 'perfeito, sync tá liso', accent: true },
] as const

export function TeaserFrame() {
  const [playing, setPlaying] = useState(true)
  const [chatIndex, setChatIndex] = useState(0)
  const [reaction, setReaction] = useState<ReactionKind | null>(null)

  useEffect(() => {
    if (!playing) return undefined
    const timer = window.setInterval(() => {
      setChatIndex((i) => (i + 1) % CHAT_LINES.length)
    }, 3200)
    return () => window.clearInterval(timer)
  }, [playing])

  const triggerReaction = (id: ReactionKind) => {
    setReaction(id)
    window.setTimeout(() => setReaction(null), 1400)
  }

  const currentChat = CHAT_LINES[chatIndex]
  const activeReaction = REACTION_OPTIONS.find((item) => item.id === reaction)

  return (
    <div className="teaser-frame w-full max-w-lg animate-fade-up animate-delay-3">
      <div className="teaser-shell relative rounded-2xl border border-accent/25 overflow-hidden shadow-[0_24px_80px_-20px_rgba(61,214,140,0.3)] backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_28px_90px_-20px_rgba(107,255,179,0.38)]">
        <div className="teaser-shell-glow" aria-hidden />

        <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/8 bg-black/35">
          <span className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-live-dot" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/70 font-bold">
              Sala ao vivo
            </span>
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/15 text-[9px] font-bold text-accent-bright uppercase tracking-wide">
              <Zap className="w-3 h-3" />
              Sync
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-accent-bright font-bold tabular-nums">
              <Users className="w-3 h-3" />
              3
            </span>
          </div>
        </div>

        <div className="relative aspect-video sm:aspect-[16/10] overflow-hidden bg-[#050506]">
          <div className="teaser-video-bg absolute inset-0" />
          <div className="absolute inset-0 teaser-scanlines opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />

          {playing && (
            <div className="absolute inset-x-0 bottom-16 flex items-end justify-center gap-1 px-8 h-12 pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="teaser-bar w-1 rounded-full bg-accent-bright/80"
                  style={{ animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group"
            aria-label={playing ? 'Pausar preview' : 'Reproduzir preview'}
          >
            <span className="absolute inset-0 rounded-full bg-accent-bright/20 blur-xl scale-150 opacity-60 group-hover:opacity-90 transition-opacity" />
            <span className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-white/25 bg-black/45 backdrop-blur-md transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
              {playing ? (
                <Pause className="w-6 h-6 sm:w-7 sm:h-7 text-accent-bright fill-accent-bright/20" />
              ) : (
                <Play className="w-6 h-6 sm:w-7 sm:h-7 text-accent-bright fill-accent-bright ml-0.5" />
              )}
            </span>
          </button>

          {activeReaction && (
            <span className="teaser-reaction absolute right-6 top-8" key={activeReaction.id}>
              <activeReaction.Icon className="w-7 h-7 text-accent-bright" strokeWidth={2.25} />
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-12 bg-gradient-to-t from-black/90 to-transparent">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
              <div
                className={cn(
                  'h-full rounded-full bg-gradient-to-r from-accent to-accent-bright teaser-progress',
                  playing ? 'teaser-progress-active' : '',
                )}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/60 tabular-nums font-medium">
              <span>4:20</span>
              <span className="inline-flex items-center gap-1 text-accent-bright/90">
                <Radio className="w-3 h-3" />
                {playing ? 'Reproduzindo' : 'Pausado'}
              </span>
              <span>12:08</span>
            </div>
          </div>
        </div>

        <div className="relative px-4 py-3.5 border-t border-white/8 bg-black/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {PARTICIPANTS.map((person, i) => (
                <button
                  key={person.name}
                  type="button"
                  className={cn(
                    'teaser-avatar group/avatar relative flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border transition-all duration-300',
                    person.active
                      ? 'border-accent/30 bg-white/5 hover:border-accent-bright/50 hover:bg-accent/10'
                      : 'border-white/10 bg-white/5 opacity-60',
                  )}
                  style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-black',
                      person.tone,
                    )}
                  >
                    {person.name[0]}
                  </span>
                  <span className="text-[10px] font-semibold text-white/80 group-hover/avatar:text-white">
                    {person.name}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 self-end sm:self-auto">
              {REACTION_OPTIONS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => triggerReaction(id)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-accent-bright/85 bg-white/5 border border-white/10 hover:border-accent-bright/40 hover:bg-accent/10 hover:text-accent-bright hover:scale-105 active:scale-95 transition-all duration-200"
                  aria-label={`Reagir: ${label}`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-black/30 px-3 py-2.5 min-h-[52px] flex items-start gap-2">
            <MessageCircle className="w-3.5 h-3.5 text-accent-bright shrink-0 mt-0.5" />
            <p key={chatIndex} className="teaser-chat-line text-xs text-white/75 leading-relaxed">
              <span
                className={cn(
                  'font-bold',
                  currentChat.accent ? 'text-accent-bright' : 'text-white/90',
                )}
              >
                {currentChat.user}:
              </span>{' '}
              {currentChat.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
