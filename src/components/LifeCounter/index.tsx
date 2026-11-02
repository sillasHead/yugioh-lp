import { useRef, useState } from 'react'
import type { ComponentType, PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
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
const adjustmentSteps = [
  1, 2, 5, 10, 25, 50, 100, 200, 500, 1000,
]
const ADJUSTMENT_DISTANCE = 12

function getAdjustmentAmount(level: number) {
  const magnitude = Math.abs(level)
  if (magnitude === 0) return 0
  if (magnitude <= adjustmentSteps.length) return adjustmentSteps[magnitude - 1]
  return 1000 + (magnitude - adjustmentSteps.length) * 1000
}

type ActiveAdjustment = {
  pointerId: number
  lastY: number
  distance: number
  direction: 1 | -1 | null
  level: number
}

type AdjustmentPreview = {
  amount: number
  x: number
  y: number
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
  const [adjustmentPreview, setAdjustmentPreview] =
    useState<AdjustmentPreview | null>(null)
  const otherPlayer = useLife(otherPlayerId)
  const otherPlayerLifePoints = otherPlayer.lifePoints
  const otherPlayerDisplayedLifePoints = otherPlayer.displayedLifePoints
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
      level: 0,
    }
  }

  function handleLifeBarPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const adjustment = activeAdjustment.current
    if (!adjustment || adjustment.pointerId !== event.pointerId) return

    const movement = adjustment.lastY - event.clientY
    adjustment.lastY = event.clientY
    if (movement === 0) return

    const isRotatedMobilePlayer =
      playerId === 'player-1' && window.matchMedia('(max-width: 600px)').matches
    const physicalDirection: 1 | -1 = movement > 0 ? 1 : -1
    let direction: 1 | -1 = physicalDirection
    if (isRotatedMobilePlayer) {
      direction = direction === 1 ? -1 : 1
    }
    if (adjustment.direction !== null && adjustment.direction !== direction) {
      adjustment.distance = 0
    }
    adjustment.direction = direction
    adjustment.distance += Math.abs(movement)

    const stepCount = Math.floor(adjustment.distance / ADJUSTMENT_DISTANCE)
    if (stepCount === 0) return

    adjustment.distance %= ADJUSTMENT_DISTANCE
    const previousLevel = adjustment.level
    let nextLevel = previousLevel + direction * stepCount

    if (
      (previousLevel > 0 && nextLevel < 0) ||
      (previousLevel < 0 && nextLevel > 0)
    ) {
      nextLevel = 0
    }

    adjustment.level = nextLevel
    const step = getAdjustmentAmount(adjustment.level)
    const pendingAmount =
      Math.sign(adjustment.level) *
      (adjustment.level < 0 ? Math.min(step, lifePoints) : step)
    setAdjustmentPreview({
      amount: pendingAmount,
      x: event.clientX,
      y: event.clientY,
    })
  }

  function finishLifeBarAdjustment(event: ReactPointerEvent<HTMLDivElement>) {
    const adjustment = activeAdjustment.current
    if (!adjustment || adjustment.pointerId !== event.pointerId) return

    const step = getAdjustmentAmount(adjustment.level)
    const amount =
      Math.sign(adjustment.level) *
      (adjustment.level < 0 ? Math.min(step, lifePoints) : step)
    if (amount !== 0) adjust(amount)
    activeAdjustment.current = null
    setAdjustmentPreview(null)
  }

  function cancelLifeBarAdjustment(event: ReactPointerEvent<HTMLDivElement>) {
    if (activeAdjustment.current?.pointerId !== event.pointerId) return
    activeAdjustment.current = null
    setAdjustmentPreview(null)
  }

  const value =
    otherPlayerLifePoints === 0 &&
    typeof otherPlayerDisplayedLifePoints === 'number' &&
    otherPlayerDisplayedLifePoints === 0
      ? 'win'
      : lifePoints === 0 &&
          typeof displayedLifePoints === 'number' &&
          displayedLifePoints === 0
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
        onLifeBarPointerUp={finishLifeBarAdjustment}
        onLifeBarPointerCancel={cancelLifeBarAdjustment}
      />
      {adjustmentPreview && adjustmentPreview.amount !== 0 &&
        createPortal(
          <div
            className={`life-adjustment-preview ${adjustmentPreview.amount > 0 ? 'is-gain' : 'is-loss'}`}
            style={{
              left: Math.min(window.innerWidth - 56, Math.max(56, adjustmentPreview.x)),
              top: Math.max(48, adjustmentPreview.y),
            }}
          >
            {adjustmentPreview.amount > 0 ? '+' : '−'}
            {Math.abs(adjustmentPreview.amount).toLocaleString()} LP
          </div>,
          document.body,
        )}
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
