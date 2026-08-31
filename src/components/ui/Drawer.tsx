import { type ReactNode, useEffect } from 'react'
import { cn } from '../../lib/cn'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  side?: 'left' | 'right' | 'bottom'
}

export function Drawer({ open, onClose, title, children, side = 'right' }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const sideClasses = {
    left: 'left-0 top-0 h-full w-80 translate-x-0',
    right: 'right-0 top-0 h-full w-80',
    bottom: 'bottom-0 left-0 right-0 h-[70dvh] rounded-t-2xl',
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed z-50 bg-surface-1 border-border flex flex-col transition-transform duration-300 ease-out',
          side === 'bottom' ? 'border-t' : side === 'left' ? 'border-r' : 'border-l',
          sideClasses[side],
          open
            ? 'translate-x-0 translate-y-0'
            : side === 'left'
              ? '-translate-x-full'
              : side === 'right'
                ? 'translate-x-full'
                : 'translate-y-full',
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
            <h3 className="font-semibold text-text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface-3 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
      </div>
    </>
  )
}
