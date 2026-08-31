export function TeaserFrame() {
  return (
    <div className="teaser-frame w-full max-w-md">
      <div className="rounded-xl border border-border bg-surface-1 overflow-hidden shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-surface-2/80">
          <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">Sala ao vivo</span>
          <span className="text-[10px] text-accent font-medium">3 pessoas</span>
        </div>

        <div className="relative aspect-video bg-[#0b0b0d]">
          <div className="absolute inset-0 teaser-scanlines opacity-30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-l-[11px] border-t-transparent border-b-transparent border-l-white/90 ml-0.5" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-8 bg-gradient-to-t from-black/80 to-transparent">
            <div className="h-0.5 rounded-full bg-white/15 overflow-hidden mb-2">
              <div className="h-full w-[58%] rounded-full bg-accent" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/55 tabular-nums">
              <span>4:20</span>
              <span>12:08</span>
            </div>
          </div>
        </div>

        <div className="px-3 py-2.5 border-t border-border-subtle space-y-2">
          <div className="flex items-center gap-2">
            {['Ana', 'Leo', 'Você'].map((name, i) => (
              <span
                key={name}
                className="text-[10px] px-2 py-0.5 rounded-full border border-border-subtle text-text-secondary"
                style={{ opacity: 1 - i * 0.12 }}
              >
                {name}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-muted">
            <span className="text-accent font-medium">Ana:</span> bora maratonar essa série
          </p>
        </div>
      </div>
    </div>
  )
}
