const PARTICIPANTS = ['Ana', 'Leo', 'Você'] as const

export function TeaserFrame() {
  return (
    <div className="teaser-frame w-full max-w-md animate-fade-up animate-delay-3">
      <div className="teaser-glow rounded-xl border border-border bg-surface-1 overflow-hidden shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] animate-float">
        <div className="relative flex items-center justify-between px-3 py-2.5 border-b border-border-subtle bg-surface-2/80">
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-text-muted font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 animate-live-dot" />
            </span>
            Sala ao vivo
          </span>
          <span className="text-[10px] text-accent font-bold tabular-nums animate-fade-in animate-delay-4">
            3 pessoas
          </span>
        </div>

        <div className="relative aspect-video bg-[#0b0b0d]">
          <div className="absolute inset-0 teaser-scanlines opacity-30" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(61,214,140,0.12), transparent 70%)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-14 w-14 rounded-full border border-white/25 flex items-center justify-center animate-play-ring bg-black/30 backdrop-blur-sm">
              <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[13px] border-t-transparent border-b-transparent border-l-white/90 ml-0.5" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-10 bg-gradient-to-t from-black/85 to-transparent">
            <div className="h-1 rounded-full bg-white/15 overflow-hidden mb-2">
              <div className="h-full rounded-full bg-accent animate-progress-fill shadow-[0_0_12px_rgba(61,214,140,0.45)]" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/55 tabular-nums">
              <span>4:20</span>
              <span>12:08</span>
            </div>
          </div>
        </div>

        <div className="px-3 py-3 border-t border-border-subtle space-y-2.5 bg-surface-1/80">
          <div className="flex items-center gap-2 flex-wrap">
            {PARTICIPANTS.map((name, i) => (
              <span
                key={name}
                className="text-[10px] px-2.5 py-1 rounded-full border border-border-subtle text-text-secondary bg-surface-2/60 animate-chat-in"
                style={{ animationDelay: `${0.5 + i * 0.12}s` }}
              >
                {name}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-muted animate-chat-in animate-delay-5">
            <span className="text-accent font-semibold">Ana:</span> bora maratonar essa série
          </p>
          <p className="text-[11px] text-text-muted/80 animate-chat-in animate-delay-6">
            <span className="text-text-secondary font-medium">Leo:</span> já coloquei o próximo na fila
          </p>
        </div>
      </div>
    </div>
  )
}
