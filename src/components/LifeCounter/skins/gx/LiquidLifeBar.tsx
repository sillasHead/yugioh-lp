import { useEffect, useRef } from 'react'

const colors: [number, string][] = [
  [0, '#1410ad'],
  [0.14, '#2520df'],
  [0.27, '#4353f1'],
  [0.34, '#8793f5'],
  [0.41, '#f6f3af'],
  [0.47, '#ffef3c'],
  [0.55, '#ffe91e'],
  [0.65, '#ffb72b'],
  [0.76, '#f96930'],
  [0.87, '#ed3030'],
  [1, '#bd101b'],
]

function drawLiquid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  percentage: number,
  time: number,
  reducedMotion: boolean,
  tilt: number,
  ripple: number,
) {
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#000'
  context.fillRect(0, 0, width, height)

  if (percentage <= 0.05) return

  const level = height * (1 - percentage / 100)
  const atLimit = percentage >= 99.95
  const idleWave = reducedMotion || atLimit ? 0 : 0.35
  const activeTilt = reducedMotion || atLimit ? 0 : tilt
  const activeRipple = reducedMotion || atLimit ? 0 : ripple
  const phase = time * 0.003
  const surface = (x: number) =>
    level +
    activeTilt * (x / width - 0.5) +
    Math.sin((x / width) * Math.PI * 2 + phase) * activeRipple +
    Math.sin((x / width) * Math.PI * 2 + time * 0.0007) * idleWave

  context.save()
  context.beginPath()
  context.moveTo(0, surface(0))
  for (let x = 2; x < width; x += 2) context.lineTo(x, surface(x))
  context.lineTo(width, surface(width))
  context.lineTo(width, height)
  context.lineTo(0, height)
  context.closePath()
  context.clip()

  const gradient = context.createLinearGradient(0, 0, 0, height)
  for (const [stop, color] of colors) gradient.addColorStop(stop, color)
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  const surfaceShade = context.createLinearGradient(0, level - 2, 0, level + 9)
  surfaceShade.addColorStop(0, 'rgba(0, 0, 0, 0.24)')
  surfaceShade.addColorStop(0.4, 'rgba(0, 0, 0, 0.12)')
  surfaceShade.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.fillStyle = surfaceShade
  context.fillRect(0, level - 2, width, 11)

  // The soft bands drift inside the liquid and react slightly to its motion.
  const drift = reducedMotion ? 0 : Math.sin(time * 0.00055)
  context.fillStyle = 'rgba(255, 255, 255, 0.11)'
  context.beginPath()
  context.ellipse(width * (0.37 + drift * 0.08 + tilt * 0.004), height * 0.49, width * 0.6, height * 0.045, -0.1, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = 'rgba(36, 12, 30, 0.12)'
  context.beginPath()
  context.ellipse(width * (0.66 - drift * 0.07 - tilt * 0.003), height * 0.79, width * 0.58, height * 0.05, 0.1, 0, Math.PI * 2)
  context.fill()

  for (let segment = 1; segment < 8; segment += 1) {
    const y = height * segment / 8
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.strokeStyle = 'rgba(255, 239, 205, 0.26)'
    context.lineWidth = 1
    context.stroke()
  }

  context.beginPath()
  context.moveTo(0, surface(0))
  for (let x = 2; x < width; x += 2) context.lineTo(x, surface(x))
  context.lineTo(width, surface(width))
  context.strokeStyle = 'rgba(27, 12, 27, 0.38)'
  context.lineWidth = 1.5
  context.stroke()

  const edgeShade = context.createLinearGradient(0, 0, width, 0)
  edgeShade.addColorStop(0, 'rgba(0, 0, 0, 0.42)')
  edgeShade.addColorStop(0.16, 'rgba(0, 0, 0, 0)')
  edgeShade.addColorStop(0.84, 'rgba(0, 0, 0, 0)')
  edgeShade.addColorStop(1, 'rgba(0, 0, 0, 0.42)')
  context.fillStyle = edgeShade
  context.fillRect(0, 0, width, height)
  context.restore()
}

export function LiquidLifeBar({ percentage }: { percentage: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const targetRef = useRef(Math.max(0, Math.min(100, percentage)))
  const disturbanceRef = useRef(0)
  const refreshRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let lastTime = 0
    let displayed = targetRef.current
    let tilt = 0
    let tiltVelocity = 0
    let ripple = 0

    function render(time: number) {
      if (!canvas || !context) return

      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width > 0 && height > 0) {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
        const pixelWidth = Math.round(width * pixelRatio)
        const pixelHeight = Math.round(height * pixelRatio)
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
          canvas.width = pixelWidth
          canvas.height = pixelHeight
        }
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

        const elapsed = lastTime ? Math.min(time - lastTime, 50) : 16
        const seconds = elapsed / 1000
        const impulse = disturbanceRef.current
        disturbanceRef.current = 0
        if (motionPreference.matches) {
          tilt = 0
          tiltVelocity = 0
          ripple = 0
        } else {
          tiltVelocity = Math.max(-90, Math.min(90, tiltVelocity + impulse))
          tiltVelocity += (-tilt * 52 - tiltVelocity * 9) * seconds
          tilt = Math.max(-6, Math.min(6, tilt + tiltVelocity * seconds))
          ripple = Math.min(3.5, (ripple + Math.abs(impulse) * 0.035) * Math.exp(-seconds * 2.8))
        }
        displayed = motionPreference.matches
          ? targetRef.current
          : displayed + (targetRef.current - displayed) * (1 - Math.exp(-elapsed / 220))
        if (Math.abs(displayed - targetRef.current) < 0.02) displayed = targetRef.current
        drawLiquid(context, width, height, displayed, time, motionPreference.matches, tilt, ripple)
      }

      lastTime = time
      if (!motionPreference.matches) frame = requestAnimationFrame(render)
    }

    function refresh() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(render)
    }

    const resizeObserver = new ResizeObserver(refresh)
    resizeObserver.observe(canvas)
    motionPreference.addEventListener('change', refresh)
    refreshRef.current = refresh
    refresh()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      motionPreference.removeEventListener('change', refresh)
      refreshRef.current = null
    }
  }, [])

  useEffect(() => {
    const nextTarget = Math.max(0, Math.min(100, percentage))
    const change = nextTarget - targetRef.current
    targetRef.current = nextTarget
    if (Math.abs(change) > 0.08) {
      const impulse = Math.sign(change) * Math.min(85, 18 + Math.sqrt(Math.abs(change)) * 18)
      disturbanceRef.current = Math.max(-90, Math.min(90, disturbanceRef.current + impulse))
    }
    refreshRef.current?.()
  }, [percentage])

  return <canvas ref={canvasRef} className="gx-counter-liquid-canvas" aria-hidden="true" />
}
