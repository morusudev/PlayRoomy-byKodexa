import { useEffect, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-md rounded-xl bg-surface-1 border border-border shadow-2xl',
          'animate-scale-in',
          className,
        )}
      >
        {title && (
          <div className="px-5 pt-5 pb-3 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
