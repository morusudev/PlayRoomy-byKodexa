import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../../types'
import { Button } from '../ui/Button'
import { Send } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ChatProps {
  messages: ChatMessage[]
  onSend: (text: string) => void
  localUserId?: string
}

export function Chat({ messages, onSend, localUserId }: ChatProps) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 min-h-0">
        {messages.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">
            Nenhuma mensagem ainda
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            <span
              className={cn(
                'text-xs font-semibold',
                msg.userId === localUserId ? 'text-accent' : 'text-text-secondary',
              )}
            >
              {msg.userName}
            </span>
            <p className="text-sm text-text-primary break-words leading-relaxed">{msg.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 p-2 border-t border-border-subtle flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mensagem..."
          maxLength={500}
          className="flex-1 h-9 rounded-lg bg-surface-2 border border-border px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <Button type="submit" size="sm" disabled={!text.trim()} className="px-3">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
