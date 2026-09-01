import { useEffect, useRef } from 'react'

const BG = { r: 3, g: 9, b: 11 }
const GLOW = { r: 61, g: 214, b: 140 }
const BRIGHT = { r: 110, g: 255, b: 190 }

export function CrtWarpBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return undefined

    const isMobile = window.matchMedia('(max-width: 640px)').matches
    const scale = isMobile ? 0.16 : 0.22
    const targetFps = isMobile ? 18 : 24

    let frameId = 0
    let lastFrame = 0
    let time = 0
    let running = true
    const pointer = { x: 0.5, y: 0.5 }

    const resize = () => {
      const width = Math.max(1, Math.floor(window.innerWidth * scale))
      const height = Math.max(1, Math.floor(window.innerHeight * scale))
      canvas.width = width
      canvas.height = height
    }

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX / window.innerWidth
      pointer.y = event.clientY / window.innerHeight
    }

    const onVisibility = () => {
      running = document.visibilityState === 'visible'
      if (running) {
        lastFrame = 0
        frameId = requestAnimationFrame(tick)
      }
    }

    const sample = (x: number, y: number, t: number) => {
      const wave =
        Math.sin(x * 11 + t) +
        Math.sin(y * 7 + t * 0.75) +
        Math.sin((x + y) * 9 + t * 1.15) +
        Math.sin(Math.hypot(x - 0.5, y - 0.5) * 18 - t * 1.4)
      return (wave + 4) / 8
    }

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick)
      if (!running) return

      const minDelta = 1000 / targetFps
      if (now - lastFrame < minDelta) return
      lastFrame = now
      time += 0.045

      const width = canvas.width
      const height = canvas.height
      const image = ctx.createImageData(width, height)
      const data = image.data
      const step = isMobile ? 2 : 1

      for (let py = 0; py < height; py += step) {
        const ny = py / height
        const scan = 0.82 + 0.18 * Math.sin(ny * height * 0.55 + time * 2)

        for (let px = 0; px < width; px += step) {
          const nx = px / width
          const cx = nx - 0.5
          const cy = ny - 0.5
          const radius = cx * cx + cy * cy
          const warp = 1 + radius * 0.18 + (pointer.y - 0.5) * 0.1
          const wx = 0.5 + cx * warp + (pointer.x - 0.5) * 0.04
          const wy = 0.5 + cy * warp

          const plasma = sample(wx, wy, time) * scan
          const edge = 1 - Math.min(1, radius * 2.4)
          const intensity = plasma * (0.35 + edge * 0.65)

          const mix = intensity * 0.28
          const highlight = intensity > 0.72 ? (intensity - 0.72) * 0.9 : 0

          const red = BG.r + GLOW.r * mix + BRIGHT.r * highlight
          const green = BG.g + GLOW.g * mix + BRIGHT.g * highlight
          const blue = BG.b + GLOW.b * mix + BRIGHT.b * highlight

          for (let dy = 0; dy < step && py + dy < height; dy += 1) {
            for (let dx = 0; dx < step && px + dx < width; dx += 1) {
              const idx = ((py + dy) * width + (px + dx)) * 4
              data[idx] = red
              data[idx + 1] = green
              data[idx + 2] = blue
              data[idx + 3] = 255
            }
          }
        }
      }

      ctx.putImageData(image, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    frameId = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div className="crt-bg" aria-hidden>
      <canvas ref={canvasRef} className="crt-bg-canvas" />
      <div className="crt-bg-scanlines" />
      <div className="crt-bg-vignette" />
      <div className="crt-bg-glow" />
    </div>
  )
}
