import { useCallback, useEffect, useRef, useState } from 'react'
import { Send, X, Pin, PinOff } from 'lucide-react'
import type { ChatMessage, ReactionKind } from '../../types'
import { ReactionBar } from './ReactionBar'
import { cn } from '../../lib/cn'

interface ChatOverlayProps {
  messages: ChatMessage[]
  onSend: (text: string) => void
  onReact?: (kind: ReactionKind) => void
  reactionsEnabled?: boolean
  localUserId?: string
  variant?: 'panel' | 'overlay'
  className?: string
  onClose?: () => void
  showFullscreenPref?: boolean
  fullscreenChatPref?: boolean
  onToggleFullscreenChatPref?: () => void
}

function resetIosViewportZoom() {
  window.setTimeout(() => {
    window.scrollTo(0, 0)
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
  }, 100)
}

export function ChatOverlay({
  messages,
  onSend,
  onReact,
  reactionsEnabled = true,
  localUserId,
  variant = 'panel',
  className,
  onClose,
  showFullscreenPref,
  fullscreenChatPref,
  onToggleFullscreenChatPref,
}: ChatOverlayProps) {
  const [text, setText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const stickToBottomRef = useRef(true)

  const updateStickToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distance < 56
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const submitMessage = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    stickToBottomRef.current = true
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }, [onSend, text])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMessage()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    submitMessage()
  }

  const handleInputBlur = () => {
    resetIosViewportZoom()
  }

  const isOverlay = variant === 'overlay'

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-0 max-h-full overflow-hidden',
        isOverlay
          ? 'bg-gradient-to-l from-black/90 via-black/60 to-transparent'
          : 'bg-surface-1',
        className,
      )}
    >
      <div className="shrink-0 px-3 py-2 border-b border-border-subtle/50 flex items-center justify-between gap-2">
        <p
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest',
            isOverlay ? 'text-white/50' : 'text-text-muted',
          )}
        >
          Chat
        </p>
        {(onClose || showFullscreenPref) && (
          <div className="flex items-center gap-0.5">
            {showFullscreenPref && onToggleFullscreenChatPref ? (
              <button
                type="button"
                onClick={onToggleFullscreenChatPref}
                className={cn(
                  'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
                  isOverlay
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-3',
                  fullscreenChatPref && 'text-accent',
                )}
                title={
                  fullscreenChatPref
                    ? 'Não abrir chat ao entrar em tela cheia'
                    : 'Abrir chat ao entrar em tela cheia'
                }
                aria-label={
                  fullscreenChatPref
                    ? 'Não abrir chat ao entrar em tela cheia'
                    : 'Abrir chat ao entrar em tela cheia'
                }
              >
                {fullscreenChatPref ? (
                  <Pin className="w-3.5 h-3.5" />
                ) : (
                  <PinOff className="w-3.5 h-3.5" />
                )}
              </button>
            ) : null}
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
                  isOverlay
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-3',
                )}
                aria-label="Fechar chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={updateStickToBottom}
        className="chat-messages-scroll flex-1 min-h-0 px-3 py-2 space-y-2"
      >
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
          'shrink-0 p-2 border-t space-y-2',
          isOverlay ? 'border-white/10' : 'border-border-subtle',
        )}
      >
        {onReact ? (
          <ReactionBar
            compact
            disabled={!reactionsEnabled}
            onReact={onReact}
            className="justify-start px-0.5"
          />
        ) : null}
        <div
          className={cn(
            'flex gap-2 rounded-lg p-1',
            isOverlay ? 'bg-black/50 border border-white/10' : 'bg-surface-2 border border-border',
          )}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            placeholder="Mensagem..."
            maxLength={500}
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="on"
            className={cn(
              'chat-input-field flex-1 min-w-0 bg-transparent px-2 py-1.5 text-base leading-normal focus:outline-none',
              isOverlay
                ? 'text-white placeholder:text-white/40'
                : 'text-text-primary placeholder:text-text-muted',
            )}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="shrink-0 h-9 w-9 rounded-md bg-accent text-black flex items-center justify-center disabled:opacity-40"
            aria-label="Enviar"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  )
}
