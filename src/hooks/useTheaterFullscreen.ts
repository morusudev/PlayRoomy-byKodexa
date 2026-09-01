import { useCallback, useEffect, useState, type RefObject } from 'react'

function isNativeFullscreenActive(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
  )
}

export function useTheaterFullscreen(theaterRef: RefObject<HTMLDivElement | null>) {
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false)
  const [isImmersive, setIsImmersive] = useState(false)

  const syncFullscreenState = useCallback(() => {
    setIsNativeFullscreen(isNativeFullscreenActive())
  }, [])

  useEffect(() => {
    document.addEventListener('fullscreenchange', syncFullscreenState)
    document.addEventListener('webkitfullscreenchange', syncFullscreenState)
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState)
      document.removeEventListener('webkitfullscreenchange', syncFullscreenState)
    }
  }, [syncFullscreenState])

  const enter = useCallback(async () => {
    const el = theaterRef.current
    if (!el) return false

    if (document.fullscreenEnabled && el.requestFullscreen) {
      try {
        await el.requestFullscreen()
        setIsImmersive(false)
        return true
      } catch {
        // fall through to immersive CSS mode (iOS and blocked contexts)
      }
    }

    setIsImmersive(true)
    document.body.style.overflow = 'hidden'
    return true
  }, [theaterRef])

  const exit = useCallback(async () => {
    if (isNativeFullscreenActive()) {
      try {
        await document.exitFullscreen()
      } catch {
        // ignore
      }
    }
    setIsImmersive(false)
    document.body.style.overflow = ''
  }, [])

  const toggle = useCallback(async () => {
    if (isNativeFullscreenActive() || isImmersive) {
      await exit()
      return false
    }
    await enter()
    return true
  }, [enter, exit, isImmersive])

  useEffect(() => {
    if (!isImmersive) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') void exit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exit, isImmersive])

  return {
    isFullscreen: isNativeFullscreen || isImmersive,
    isImmersive,
    enter,
    exit,
    toggle,
  }
}
