import { cn } from '../../lib/cn'

type LogoSize = 'sm' | 'md' | 'lg' | 'hero'

const sizeClass: Record<LogoSize, string> = {
  sm: 'text-[15px] tracking-[0.02em]',
  md: 'text-xl tracking-[0.01em]',
  lg: 'text-2xl tracking-tight',
  hero: 'text-[1.85rem] min-[400px]:text-[2.15rem] sm:text-[2.45rem] tracking-[-0.03em]',
}

type PlayRoomyLogoProps = {
  size?: LogoSize
  className?: string
}

export function PlayRoomyLogo({ size = 'md', className }: PlayRoomyLogoProps) {
  return (
    <span
      className={cn(
        'font-display font-extrabold leading-none select-none',
        sizeClass[size],
        className,
      )}
    >
      Play<span className="text-accent">Roomy</span>
    </span>
  )
}
