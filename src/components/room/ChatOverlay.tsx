import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import type { ChatMessage } from '../../types'
import { cn } from '../../lib/cn'

interface ChatOverlayProps {
  messages: ChatMessage[]
  onSend: (text: string) => void
  localUserId?: string
  variant?: 'panel' | 'overlay'
  className?: string
}

export function ChatOverlay({
  messages,
  onSend,
  localUserId,
  variant = 'panel',
  className,
}: ChatOverlayProps) {
  const [text, setText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  const isOverlay = variant === 'overlay'

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-0',
        isOverlay
          ? 'bg-gradient-to-l from-black/90 via-black/60 to-transparent'
          : 'bg-surface-1',
        className,
      )}
    >
      <div className="shrink-0 px-3 py-2 border-b border-border-subtle/50">
        <p
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest',
            isOverlay ? 'text-white/50' : 'text-text-muted',
          )}
        >
          Chat
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <p
            className={cn(
              'text-xs text-center py-6',
              isOverlay ? 'text-white/40' : 'text-text-muted',
            )}
          >
            Nenhuma mensagem ainda
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm leading-snug">
            <span
              className={cn(
                'font-semibold mr-1',
                msg.userId === localUserId
                  ? 'text-accent'
                  : isOverlay
                    ? 'text-white/90'
                    : 'text-text-secondary',
              )}
            >
              {msg.userName}
            </span>
            <span className={cn(isOverlay ? 'text-white/85' : 'text-text-primary', 'break-words')}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn(
          'shrink-0 p-2 border-t',
          isOverlay ? 'border-white/10' : 'border-border-subtle',
        )}
      >
        <div
          className={cn(
            'flex gap-2 rounded-lg p-1',
            isOverlay ? 'bg-black/50 border border-white/10' : 'bg-surface-2 border border-border',
          )}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mensagem..."
            maxLength={500}
            className={cn(
              'flex-1 min-w-0 bg-transparent px-2 py-1.5 text-sm focus:outline-none',
              isOverlay
                ? 'text-white placeholder:text-white/40'
                : 'text-text-primary placeholder:text-text-muted',
            )}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="shrink-0 h-8 w-8 rounded-md bg-accent text-black flex items-center justify-center disabled:opacity-40"
            aria-label="Enviar"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  )
}
