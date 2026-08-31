import { useCallback, useEffect, useRef, useState } from 'react'

const IDLE_HIDE_MS = 2800
const IDLE_HIDE_MOBILE_MS = 4500

export function useAutoHideControls(pinned: boolean, enabled = true, slowHide = false) {
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const scheduleHide = useCallback(() => {
    clearTimer()
    if (!enabled || pinned) return
    const delay = slowHide ? IDLE_HIDE_MOBILE_MS : IDLE_HIDE_MS
    timerRef.current = setTimeout(() => setVisible(false), delay)
  }, [enabled, pinned, slowHide])

  const revealControls = useCallback(() => {
    if (!enabled) return
    setVisible(true)
    scheduleHide()
  }, [enabled, scheduleHide])

  const hideControls = useCallback(() => {
    if (!enabled || pinned) return
    clearTimer()
    setVisible(false)
  }, [enabled, pinned])

  useEffect(() => {
    if (!enabled) {
      setVisible(true)
      clearTimer()
      return
    }
    if (pinned) {
      setVisible(true)
      clearTimer()
      return
    }
    scheduleHide()
  }, [enabled, pinned, scheduleHide])

  useEffect(() => clearTimer, [])

  return {
    controlsVisible: !enabled || pinned || visible,
    revealControls,
    hideControls,
  }
}
