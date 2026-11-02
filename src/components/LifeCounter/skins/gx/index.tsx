import type { CSSProperties } from 'react'
import gauge from '../../../../assets/gauge.png'
import type { CounterSkinProps } from '../../types'
import './style.css'

export function GxCounter({
  value,
  lifePointsPercentage,
  direction,
  name,
  wins,
  losses,
  onLifeBarPointerDown,
  onLifeBarPointerMove,
  onLifeBarPointerUp,
}: CounterSkinProps) {
  const scaleX = direction === 'left' ? -1 : 1

  return (
    <div className="gx-counter" style={{ transform: `scaleX(${scaleX})` }}>
      <img className="gx-counter-art" src={gauge} alt="" />
      <div
        className="gx-counter-score bungee-spice-regular"
        style={{
          transform: `scaleX(${scaleX}) scaleY(2.5)`,
          '--score-length': String(value).length,
        } as CSSProperties}
      >
        {value}
      </div>
      <div
        className="gx-counter-player"
        style={{ transform: `scaleX(${scaleX})` }}
      >
        <span className="gx-counter-name">{name}</span>
        <span className="gx-counter-record">V {wins} · D {losses}</span>
      </div>

      <div
        className="gx-counter-life-bar"
        title="Arraste para cima para aumentar LP e para baixo para diminuir"
        onPointerDown={onLifeBarPointerDown}
        onPointerMove={onLifeBarPointerMove}
        onPointerUp={onLifeBarPointerUp}
        onPointerCancel={onLifeBarPointerUp}
      >
        <div
          className="gx-counter-empty-bar"
          style={{ height: `${100 - lifePointsPercentage}%` }}
        />
        {Array.from({ length: 8 }, (_, index) => (
          <div className="gx-counter-segment" key={index}>
            <div className={`gx-counter-color gx-counter-color-${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  )
}
