import { useEffect, useRef } from 'react'

/**
 * Soft atmospheric field — pointer-reactive blooms + grain.
 * Replaces the old CRT plasma with something calmer and more premium.
 */
export function AtmosBackground() {
  const rootRef = useRef<HTMLDivElement>(null)
  const bloomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const bloom = bloomRef.current
    if (!root || !bloom) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return undefined

    let raf = 0
    let targetX = 0.55
    let targetY = 0.35
    let curX = targetX
    let curY = targetY

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX / window.innerWidth
      targetY = event.clientY / window.innerHeight
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      curX += (targetX - curX) * 0.06
      curY += (targetY - curY) * 0.06
      bloom.style.setProperty('--bx', `${(curX * 100).toFixed(2)}%`)
      bloom.style.setProperty('--by', `${(curY * 100).toFixed(2)}%`)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div ref={rootRef} className="atmos-bg" aria-hidden>
      <div className="atmos-base" />
      <div ref={bloomRef} className="atmos-bloom" />
      <div className="atmos-grid" />
      <div className="atmos-grain" />
      <div className="atmos-vignette" />
    </div>
  )
}
