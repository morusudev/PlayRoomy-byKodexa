import { useEffect, useRef } from 'react'

export const THEATER_SHORTCUTS = [
  { keys: 'Espaço ou K', label: 'Play ou pausar' },
  { keys: 'J ou esquerda', label: 'Voltar 15 segundos' },
  { keys: 'L ou direita', label: 'Avançar 15 segundos' },
  { keys: 'Shift P', label: 'Vídeo anterior' },
  { keys: 'Shift N', label: 'Próximo vídeo' },
  { keys: 'M', label: 'Mutar ou ativar som' },
  { keys: 'Cima ou baixo', label: 'Volume' },
  { keys: 'F', label: 'Tela cheia' },
  { keys: 'P', label: 'Playlist' },
  { keys: 'C', label: 'Chat no vídeo' },
  { keys: '?', label: 'Atalhos' },
] as const

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

interface TheaterShortcutHandlers {
  enabled: boolean
  onPlayPause: () => void
  onSeekBack: () => void
  onSeekForward: () => void
  onPrevVideo: () => void
  onNextVideo: () => void
  onToggleMute: () => void
  onVolumeUp: () => void
  onVolumeDown: () => void
  onToggleFullscreen: () => void
  onTogglePlaylist: () => void
  onToggleChat: () => void
  onToggleHelp: () => void
  canDrive: boolean
  canGoPrevious: boolean
  canGoNext: boolean
}

export function useTheaterShortcuts(handlers: TheaterShortcutHandlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!handlers.enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      const h = handlersRef.current
      if (isTypingTarget(event.target)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const key = event.key

      if (key === '?' || (key === '/' && event.shiftKey)) {
        event.preventDefault()
        h.onToggleHelp()
        return
      }

      if (key === ' ' || key === 'k' || key === 'K') {
        if (!h.canDrive) return
        event.preventDefault()
        h.onPlayPause()
        return
      }

      if (key === 'j' || key === 'J' || key === 'ArrowLeft') {
        if (!h.canDrive) return
        event.preventDefault()
        h.onSeekBack()
        return
      }

      if (key === 'l' || key === 'L' || key === 'ArrowRight') {
        if (!h.canDrive) return
        event.preventDefault()
        h.onSeekForward()
        return
      }

      if (key === 'N' && event.shiftKey) {
        if (!h.canGoNext) return
        event.preventDefault()
        h.onNextVideo()
        return
      }

      if (key === 'P' && event.shiftKey) {
        if (!h.canGoPrevious) return
        event.preventDefault()
        h.onPrevVideo()
        return
      }

      if (key === 'm' || key === 'M') {
        event.preventDefault()
        h.onToggleMute()
        return
      }

      if (key === 'ArrowUp') {
        event.preventDefault()
        h.onVolumeUp()
        return
      }

      if (key === 'ArrowDown') {
        event.preventDefault()
        h.onVolumeDown()
        return
      }

      if (key === 'f' || key === 'F') {
        event.preventDefault()
        h.onToggleFullscreen()
        return
      }

      if (key === 'p' || key === 'P') {
        event.preventDefault()
        h.onTogglePlaylist()
        return
      }

      if (key === 'c' || key === 'C') {
        event.preventDefault()
        h.onToggleChat()
        return
      }

      if (key === 'Escape') {
        h.onToggleHelp()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers.enabled])
}
