import { ArrowUpRight, LogIn } from 'lucide-react'

type JoinHeaderButtonProps = {
  onClick: () => void
}

export function JoinHeaderButton({ onClick }: JoinHeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="landing-nav-join group inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold text-black"
    >
      <LogIn className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
      Entrar
      <ArrowUpRight className="w-3.5 h-3.5 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  )
}
