import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'btn-shine bg-accent text-black hover:bg-accent-hover shadow-sm shadow-accent/25 hover:shadow-accent/35 hover:-translate-y-0.5',
  secondary:
    'bg-surface-3 text-text-primary hover:bg-surface-4 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-surface-3 hover:-translate-y-0.5',
  danger:
    'bg-danger/10 text-danger hover:bg-danger/20 hover:-translate-y-0.5',
  outline:
    'border border-border bg-transparent text-text-primary hover:bg-surface-2 hover:border-border hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/15',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        'disabled:opacity-50 disabled:pointer-events-none disabled:transform-none disabled:shadow-none',
        'active:translate-y-0 active:scale-[0.97]',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
