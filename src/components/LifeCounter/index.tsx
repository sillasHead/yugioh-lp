import { useRef } from 'react'
import type { ComponentType, PointerEvent as ReactPointerEvent } from 'react'
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
const adjustmentSteps = [1, 5, 10, 25, 50, 100, 200, 500, 1000]
const ADJUSTMENT_DISTANCE = 12
const ADJUSTMENT_STEP_INTERVAL = 400

type ActiveAdjustment = {
  pointerId: number
  lastY: number
  distance: number
  direction: 1 | -1 | null
  startedAt: number
  historyRecorded: boolean
}

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
    adjust,
    reset,
  } = useLife(playerId)
  const activeAdjustment = useRef<ActiveAdjustment | null>(null)
  const otherPlayer = useLife(otherPlayerId)
  const otherPlayerLifePoints = otherPlayer.lifePoints
  const matchEnded = lifePoints === 0 || otherPlayer.lifePoints === 0
  const CounterSkin = counterSkins[theme]

  function handleLifeBarPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (matchEnded || (event.pointerType === 'mouse' && event.button !== 0)) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    activeAdjustment.current = {
      pointerId: event.pointerId,
      lastY: event.clientY,
      distance: 0,
      direction: null,
      startedAt: performance.now(),
      historyRecorded: false,
    }
  }

  function handleLifeBarPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const adjustment = activeAdjustment.current
    if (!adjustment || adjustment.pointerId !== event.pointerId) return

    const movement = adjustment.lastY - event.clientY
    adjustment.lastY = event.clientY
    if (movement === 0) return

    const direction = movement > 0 ? 1 : -1
    if (adjustment.direction !== null && adjustment.direction !== direction) {
      adjustment.distance = 0
    }
    adjustment.direction = direction
    adjustment.distance += Math.abs(movement)

    const stepCount = Math.floor(adjustment.distance / ADJUSTMENT_DISTANCE)
    if (stepCount === 0) return

    adjustment.distance %= ADJUSTMENT_DISTANCE
    const elapsed = performance.now() - adjustment.startedAt
    const stepIndex = Math.min(
      adjustmentSteps.length - 1,
      Math.floor(elapsed / ADJUSTMENT_STEP_INTERVAL),
    )
    adjust(
      direction * stepCount * adjustmentSteps[stepIndex],
      !adjustment.historyRecorded,
    )
    adjustment.historyRecorded = true
  }

  function endLifeBarAdjustment(event: ReactPointerEvent<HTMLDivElement>) {
    if (activeAdjustment.current?.pointerId === event.pointerId) {
      activeAdjustment.current = null
    }
  }

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
        onLifeBarPointerDown={handleLifeBarPointerDown}
        onLifeBarPointerMove={handleLifeBarPointerMove}
        onLifeBarPointerUp={endLifeBarAdjustment}
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
