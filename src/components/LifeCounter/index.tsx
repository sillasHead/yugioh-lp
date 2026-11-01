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
  const {
    lifePoints,
    displayedLifePoints,
    lifePointsPercentage,
    name,
    wins,
    losses,
    hit,
    heal,
    reset,
  } = useLife(playerId)
  const otherPlayer = useLife(otherPlayerId)
  const otherPlayerLifePoints = otherPlayer.lifePoints
  const matchEnded = lifePoints === 0 || otherPlayer.lifePoints === 0
  const CounterSkin = counterSkins[theme]

  const value =
    otherPlayerLifePoints === 0
      ? 'win'
      : lifePoints === 0
        ? 'loser'
        : displayedLifePoints

  return (
    <div className={`life-counter ${playerId}`}>
      <CounterSkin
        value={value}
        lifePointsPercentage={lifePointsPercentage}
        direction={playerDirection}
        name={name}
        wins={wins}
        losses={losses}
      />
      <div className="life-actions">
        {lifeActions.map((amount) => (
          <button
            key={`damage-${amount}`}
            type="button"
            onClick={() => hit(amount)}
            disabled={matchEnded}
          >
            💥 {amount}
          </button>
        ))}
        {[...lifeActions].reverse().map((amount) => (
          <button
            key={`heal-${amount}`}
            type="button"
            onClick={() => heal(amount)}
            disabled={matchEnded}
          >
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
