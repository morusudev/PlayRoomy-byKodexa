import { useCallback, useEffect, useRef, useState } from 'react'
import { useToastStore } from '../store/toastStore'
import type { ToastItem } from '../types'

interface FeedbackOptions {
  large?: boolean
  toast?: string
  toastType?: ToastItem['type']
}

export function usePlayerFeedback() {
  const addToast = useToastStore((s) => s.addToast)
  const [flashMessage, setFlashMessage] = useState<string | null>(null)
  const [flashLarge, setFlashLarge] = useState(false)
  const timerRef = useRef<number | null>(null)

  const showFeedback = useCallback(
    (message: string, options?: FeedbackOptions) => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      setFlashMessage(message)
      setFlashLarge(!!options?.large)
      timerRef.current = window.setTimeout(() => {
        setFlashMessage(null)
        setFlashLarge(false)
        timerRef.current = null
      }, options?.large ? 1000 : 800)
      if (options?.toast) {
        addToast(options.toast, options?.toastType ?? 'info')
      }
    },
    [addToast],
  )

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  return { flashMessage, flashLarge, showFeedback }
}
