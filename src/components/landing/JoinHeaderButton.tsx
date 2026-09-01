import { LogIn } from 'lucide-react'

type JoinHeaderButtonProps = {
  onClick: () => void
}

export function JoinHeaderButton({ onClick }: JoinHeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-join-cta group relative shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-sm text-black overflow-hidden"
    >
      <span className="btn-join-cta-glow" aria-hidden />
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-black/15 group-hover:bg-black/10 transition-colors">
        <LogIn className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
      <span className="relative">Entrar</span>
    </button>
  )
}
