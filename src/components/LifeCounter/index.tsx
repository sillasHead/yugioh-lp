import { useRef, useState } from 'react'
import type { ComponentType, PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCcw } from 'lucide-react'
import { useLife } from '../../hooks/LifeContext'
import { GxCounter } from './skins/gx'
import { CounterRack } from '../CounterRack'
import { playResetAnimation } from '../../utils/animations'
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

function playLifeActionAnimation(
  button: HTMLButtonElement,
  action: 'damage' | 'heal',
  amount: number,
) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const intensity = amount <= 50 ? 0.2 : amount <= 100 ? 0.45 : amount <= 500 ? 0.78 : 1
  const scale = (1.03 + intensity * 0.17).toFixed(3)
  const shift = (4 + intensity * 12).toFixed(1)
  const rotation = (intensity * 3).toFixed(1)
  const glow = Math.round(14 + intensity * 24)
  const glowOpacity = (0.5 + intensity * 0.45).toFixed(2)

  const frames: Keyframe[] = action === 'damage'
    ? [
        { transform: 'translateX(0) scale(1)', boxShadow: '0 0 0 transparent', filter: 'brightness(1)' },
        { offset: 0.22, transform: `translateX(-${shift}px) rotate(-${rotation}deg) scale(${scale})`, boxShadow: `0 0 ${glow}px rgb(255 87 59 / ${glowOpacity})`, filter: `brightness(${1.25 + intensity * 0.55})` },
        { offset: 0.42, transform: `translateX(${(shift * 0.75).toFixed(1)}px) rotate(${rotation}deg) scale(.98)`, boxShadow: `0 0 ${Math.round(glow * 0.7)}px rgb(255 87 59 / ${(intensity * 0.5 + 0.3).toFixed(2)})`, filter: 'brightness(1.3)' },
        { offset: 0.62, transform: `translateX(-${(shift * 0.4).toFixed(1)}px) scale(1.01)`, boxShadow: `0 0 ${Math.round(glow * 0.4)}px rgb(255 87 59 / ${(intensity * 0.3 + 0.15).toFixed(2)})`, filter: 'brightness(1.12)' },
        { transform: 'translateX(0) scale(1)', boxShadow: '0 0 0 transparent', filter: 'brightness(1)' },
      ]
    : [
        { transform: 'scale(.94)', boxShadow: '0 0 0 transparent', filter: 'brightness(1)' },
        { offset: 0.38, transform: `scale(${(1.04 + intensity * 0.22).toFixed(3)})`, boxShadow: `0 0 ${Math.round(16 + intensity * 32)}px rgb(57 223 139 / ${glowOpacity})`, filter: `brightness(${1.2 + intensity * 0.5})` },
        { offset: 0.68, transform: 'scale(.99)', boxShadow: `0 0 ${Math.round(10 + intensity * 18)}px rgb(57 223 139 / ${(intensity * 0.45 + 0.25).toFixed(2)})`, filter: 'brightness(1.15)' },
        { transform: 'scale(1)', boxShadow: '0 0 0 transparent', filter: 'brightness(1)' },
      ]

  button.animate(frames, {
    duration: (action === 'damage' ? 360 : 420) + intensity * (action === 'damage' ? 360 : 400),
    easing: action === 'damage' ? 'cubic-bezier(.2,.8,.3,1)' : 'ease-out',
  })
}

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
      <CounterRack playerId={playerId} />
      <div className="life-actions">
        {lifeActions.map((amount) => (
          <button
            key={`damage-${amount}`}
            type="button"
            className="life-action-damage"
            onClick={(event) => {
              playLifeActionAnimation(event.currentTarget, 'damage', amount)
              hit(amount)
            }}
            disabled={matchEnded}
          >
            💥 {amount}
          </button>
        ))}
        {[...lifeActions].reverse().map((amount) => (
          <button
            key={`heal-${amount}`}
            type="button"
            className="life-action-heal"
            onClick={(event) => {
              playLifeActionAnimation(event.currentTarget, 'heal', amount)
              heal(amount)
            }}
            disabled={matchEnded}
          >
            💚 {amount}
          </button>
        ))}
        <button
          type="button"
          className="reset btn-gray"
          onClick={(event) => {
            playResetAnimation(event.currentTarget)
            reset()
          }}
        >
          <RefreshCcw size="1.25em" />
        </button>
      </div>
    </div>
  )
}
