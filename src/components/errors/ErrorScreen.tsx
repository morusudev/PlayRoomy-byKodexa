import type { ReactNode } from 'react'
import { PlayRoomyLogo } from '../brand/PlayRoomyLogo'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

interface ErrorScreenProps {
  code?: string
  title: string
  message: string
  hint?: string
  icon?: ReactNode
  primaryLabel?: string
  onPrimary?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  className?: string
}

export function ErrorScreen({
  code,
  title,
  message,
  hint,
  icon,
  primaryLabel = 'Voltar ao início',
  onPrimary,
  secondaryLabel,
  onSecondary,
  className,
}: ErrorScreenProps) {
  return (
    <div
      className={cn(
        'min-h-full flex flex-col items-center justify-center px-6 py-12 bg-surface-0 relative overflow-hidden',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgb(57 255 163 / 0.18), transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md text-center space-y-6 animate-fade-up">
        <PlayRoomyLogo size="md" className="mx-auto" />

        {icon ? <div className="flex justify-center">{icon}</div> : null}

        {code ? (
          <p className="font-display text-6xl sm:text-7xl font-bold text-accent/90 tracking-tight">
            {code}
          </p>
        ) : null}

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">{title}</h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">{message}</p>
          {hint ? (
            <p className="text-xs text-text-muted font-mono bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 break-all">
              {hint}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onPrimary ? (
            <Button className="w-full sm:w-auto min-w-[10rem]" onClick={onPrimary}>
              {primaryLabel}
            </Button>
          ) : null}
          {onSecondary && secondaryLabel ? (
            <Button
              variant="outline"
              className="w-full sm:w-auto min-w-[10rem]"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
