import type { CSSProperties } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import gauge from '../../../../assets/gauge.png'
import type { CounterSkinProps } from '../../types'
import { LiquidLifeBar } from './LiquidLifeBar'
import './style.css'

export function GxCounter({
  value,
  lifePointsPercentage,
  direction,
  name,
  wins,
  onLifeBarPointerDown,
  onLifeBarPointerMove,
  onLifeBarPointerUp,
  onLifeBarPointerCancel,
}: CounterSkinProps) {
  const scaleX = direction === 'left' ? -1 : 1
  const isWin = value === 'win'
  const scoreLength = String(value).length
  const scoreLengthRef = useRef(scoreLength)
  scoreLengthRef.current = scoreLength
  const [scoreOverride, setScoreOverride] = useState<string | null>(null)
  const wasWin = useRef(isWin)

  useLayoutEffect(() => {
    if (isWin) {
      wasWin.current = true
      setScoreOverride(null)
      return
    }

    const returningFromWin = wasWin.current && !isWin
    wasWin.current = isWin

    if (!returningFromWin) return

    const startedAt = performance.now()
    let animationFrame = 0
    const randomScore = () =>
      Array.from({ length: scoreLengthRef.current }, () =>
        Math.floor(Math.random() * 10),
      ).join('')

    setScoreOverride(randomScore())

    function scramble(now: number) {
      if (now - startedAt >= 1000) {
        setScoreOverride(null)
        return
      }

      setScoreOverride(randomScore())
      animationFrame = requestAnimationFrame(scramble)
    }

    animationFrame = requestAnimationFrame(scramble)
    return () => cancelAnimationFrame(animationFrame)
  }, [isWin])

  const displayedValue = scoreOverride ?? value

  return (
    <div className="gx-counter" style={{ transform: `scaleX(${scaleX})` }}>
      <img className="gx-counter-art" src={gauge} alt="" />
      <div
        className={`gx-counter-score bungee-spice-regular${displayedValue === 'win' ? ' is-win' : displayedValue === 'loser' ? ' is-loser' : ''}`}
        style={
          {
            transform: `scaleX(${scaleX}) scaleY(2.5)`,
            '--score-length': String(displayedValue).length,
          } as CSSProperties
        }
      >
        {displayedValue}
      </div>
      <div
        className="gx-counter-player"
        style={{ transform: `scaleX(${scaleX})` }}
      >
        <span className="gx-counter-name">{name}</span>
        <span className="gx-counter-record" aria-label={`Vitórias: ${wins}`}>
          V-{wins}
        </span>
      </div>

      <div
        className="gx-counter-life-bar"
        title="Arraste para cima para aumentar LP e para baixo para diminuir"
        onPointerDown={onLifeBarPointerDown}
        onPointerMove={onLifeBarPointerMove}
        onPointerUp={onLifeBarPointerUp}
        onPointerCancel={onLifeBarPointerCancel}
      >
        <LiquidLifeBar percentage={lifePointsPercentage} />
      </div>
    </div>
  )
}
