import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../../types'
import { cn } from '../../lib/cn'

const TOAST_TTL_MS = 5000
const MAX_VISIBLE = 3

interface ToastItem {
  id: string
  userName: string
  text: string
}

interface ChatNotificationStackProps {
  messages: ChatMessage[]
  localUserId?: string
  chatOpen: boolean
  onOpenChat: () => void
  className?: string
}

export function ChatNotificationStack({
  messages,
  localUserId,
  chatOpen,
  onOpenChat,
  className,
}: ChatNotificationStackProps) {
  const initializedRef = useRef(false)
  const lastSeenIdRef = useRef<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    if (chatOpen) {
      setToasts([])
      if (messages.length > 0) {
        lastSeenIdRef.current = messages[messages.length - 1]!.id
      }
      initializedRef.current = true
    }
  }, [chatOpen, messages])

  useEffect(() => {
    if (messages.length === 0) return
    const latest = messages[messages.length - 1]!

    if (!initializedRef.current) {
      initializedRef.current = true
      lastSeenIdRef.current = latest.id
      return
    }

    if (latest.id === lastSeenIdRef.current) return
    lastSeenIdRef.current = latest.id

    if (chatOpen || latest.userId === localUserId) return

    const item: ToastItem = {
      id: latest.id,
      userName: latest.userName,
      text: latest.text,
    }

    setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), item])

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== item.id))
    }, TOAST_TTL_MS)
  }, [messages, chatOpen, localUserId])

  if (toasts.length === 0) return null

  return (
    <div
      className={cn(
        'absolute z-[45] flex flex-col gap-2 pointer-events-none',
        className,
      )}
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenChat()
          }}
          className="pointer-events-auto animate-chat-in max-w-[min(18rem,88vw)] rounded-xl border border-white/15 bg-black/82 backdrop-blur-md px-3 py-2.5 text-left shadow-xl active:scale-[0.98] transition-transform"
        >
          <p className="text-[11px] font-semibold text-accent truncate">{toast.userName}</p>
          <p className="text-xs text-white/90 line-clamp-2 leading-snug mt-0.5">{toast.text}</p>
        </button>
      ))}
    </div>
  )
}
