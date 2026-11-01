import type { ComponentType } from 'react'
import { RefreshCcw } from 'lucide-react'
import { useLife } from '../../hooks/LifeContext'
import { GxCounter } from './skins/gx'
import type { CounterSkinProps, CounterTheme } from './types'
import './style.css'

type Props = {
  playerId: string
  otherPlayerId: string
  playerDirection: 'left' | 'right'
  theme?: CounterTheme
}

const counterSkins: Record<CounterTheme, ComponentType<CounterSkinProps>> = {
  gx: GxCounter,
}

const lifeActions = [50, 100, 500, 1000]

export function LifeCounter({
  playerId,
  otherPlayerId,
  playerDirection,
  theme = 'gx',
}: Props) {
  const { displayedLifePoints, lifePointsPercentage, hit, heal, reset } =
    useLife(playerId)
  const otherPlayerLifePoints = useLife(otherPlayerId).displayedLifePoints
  const CounterSkin = counterSkins[theme]

  const value =
    otherPlayerLifePoints === 0
      ? 'win'
      : displayedLifePoints === 0
        ? 'loser'
        : displayedLifePoints

  return (
    <div className={`life-counter ${playerId}`}>
      <CounterSkin
        value={value}
        lifePointsPercentage={lifePointsPercentage}
        direction={playerDirection}
      />
      <div className="life-actions">
        {lifeActions.map((amount) => (
          <button key={`damage-${amount}`} type="button" onClick={() => hit(amount)}>
            💥 {amount}
          </button>
        ))}
        {[...lifeActions].reverse().map((amount) => (
          <button key={`heal-${amount}`} type="button" onClick={() => heal(amount)}>
            💚 {amount}
          </button>
        ))}
        <button type="button" className="reset btn-gray" onClick={reset}>
          <RefreshCcw size="1.25em" />
        </button>
      </div>
    </div>
  )
}
