import { cn } from '../../lib/cn'

interface PlayerActionFlashProps {
  message: string | null
  large?: boolean
}

export function PlayerActionFlash({ message, large }: PlayerActionFlashProps) {
  if (!message) return null

  return (
    <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center px-4">
      <div
        key={message}
        className={cn(
          'rounded-2xl bg-black/80 backdrop-blur-md text-white font-display font-bold shadow-2xl',
          'animate-[player-flash_0.95s_ease-out_forwards]',
          large ? 'text-2xl sm:text-5xl px-6 py-4 sm:px-8 sm:py-5' : 'text-sm sm:text-xl px-4 py-2 sm:px-5 sm:py-3',
        )}
      >
        {message}
      </div>
    </div>
  )
}
