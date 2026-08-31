import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'
import { cn } from '../../lib/cn'
import type { ToastItem } from '../../types'

const icons: Record<ToastItem['type'], typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const styles: Record<ToastItem['type'], string> = {
  success: 'border-success/50 bg-surface-1 text-success',
  error: 'border-danger/50 bg-surface-1 text-danger',
  info: 'border-accent/50 bg-surface-1 text-accent',
  warning: 'border-warning/50 bg-surface-1 text-warning',
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div
      className={cn(
        'fixed inset-x-0 top-3 z-[9999] flex flex-col items-center gap-2.5 px-3',
        'sm:inset-x-auto sm:left-auto sm:right-4 sm:top-4 sm:items-end',
        'pointer-events-none',
      )}
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl border-2',
              'shadow-xl shadow-black/50 text-sm font-medium w-full max-w-md',
              'animate-[toast-in_0.25s_ease-out]',
              styles[toast.type],
            )}
          >
            <span
              className={cn(
                'shrink-0 mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center',
                toast.type === 'success' && 'bg-success/15',
                toast.type === 'error' && 'bg-danger/15',
                toast.type === 'info' && 'bg-accent/15',
                toast.type === 'warning' && 'bg-warning/15',
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={2.25} />
            </span>
            <p className="flex-1 leading-snug text-text-primary pt-1.5">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
