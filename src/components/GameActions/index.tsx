import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'

import CoinToss from '../../assets/coin/coin-toss.svg'
import ArenaFace from '../../assets/coin/arena-face.svg'
import ArenaTail from '../../assets/coin/arena-tail.svg'

import { RefreshCcw, Settings2, Undo2, X } from 'lucide-react'
import Dice1 from '../../assets/dice/dice-1.svg'
import Dice2 from '../../assets/dice/dice-2.svg'
import Dice3 from '../../assets/dice/dice-3.svg'
import Dice4 from '../../assets/dice/dice-4.svg'
import Dice5 from '../../assets/dice/dice-5.svg'
import Dice6 from '../../assets/dice/dice-6.svg'
import Dice from '../../assets/dice/dice.svg'
import { useGameLife } from '../../hooks/LifeContext'
import { GameSettings } from '../GameSettings'
import { playResetAnimation } from '../../utils/animations'
import './style.css'

type Props = {
  players: string[]
}

type RollResult = {
  kind: 'coin' | 'dice'
  value: number
  id: number
  landingX: number
  entryX: number
  driftX: number
}

const diceImages = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]
const ROLL_LIFETIME = 2800
const diePips: Record<number, number[]> = {
  1: [5], 2: [1, 9], 3: [1, 5, 9],
  4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9],
}
const dieFaces = [
  ['front', 1], ['back', 6], ['right', 3],
  ['left', 4], ['top', 2], ['bottom', 5],
] as const

function ArenaDie({ result }: { result: number }) {
  return (
    <span className={`arena-die-cube die-result-${result}`}>
      {dieFaces.map(([side, value]) => (
        <span key={side} className={`arena-die-face arena-die-${side}`}>
          {Array.from({ length: 9 }, (_, index) => (
            <i key={index} className={diePips[value].includes(index + 1) ? 'has-pip' : ''} />
          ))}
        </span>
      ))}
    </span>
  )
}

export function GameActions({ players }: Props) {
  const {
    canUndo,
    resetAll,
    settings,
    undo: undoLastAction,
  } = useGameLife()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [rollResult, setRollResult] = useState<RollResult | null>(null)
  const [isArenaOpen, setIsArenaOpen] = useState(false)
  const [isArenaSettled, setIsArenaSettled] = useState(false)
  const rollId = useRef(0)
  const hideRollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settleRollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const arenaCloseButton = useRef<HTMLButtonElement>(null)
  const arenaObjectButton = useRef<HTMLButtonElement>(null)
  const rollTrigger = useRef<HTMLElement | null>(null)

  useEffect(() => () => {
    if (hideRollTimer.current !== null) clearTimeout(hideRollTimer.current)
    if (settleRollTimer.current !== null) clearTimeout(settleRollTimer.current)
  }, [])

  useEffect(() => {
    if (!isArenaOpen) return
    arenaCloseButton.current?.focus()
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeArena()
      if (event.key !== 'Tab') return
      const focusable = [arenaCloseButton.current, arenaObjectButton.current]
        .filter((button): button is HTMLButtonElement => button !== null)
      const currentIndex = focusable.findIndex((button) => button === document.activeElement)
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + focusable.length) % focusable.length
        : (currentIndex + 1) % focusable.length
      event.preventDefault()
      focusable[nextIndex]?.focus()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isArenaOpen])

  useEffect(() => {
    if (!isArenaOpen && rollTrigger.current) {
      rollTrigger.current.focus()
      rollTrigger.current = null
    }
  }, [isArenaOpen])

  function closeArena() {
    if (settleRollTimer.current !== null) clearTimeout(settleRollTimer.current)
    setIsArenaOpen(false)
    setRollResult(null)
  }

  function showRoll(kind: RollResult['kind'], value: number) {
    if (hideRollTimer.current !== null) clearTimeout(hideRollTimer.current)
    if (settleRollTimer.current !== null) clearTimeout(settleRollTimer.current)
    rollId.current += 1
    const direction = Math.random() < .5 ? -1 : 1
    setRollResult({
      kind, value, id: rollId.current,
      landingX: Math.round((Math.random() * 2 - 1) * (kind === 'dice' ? 62 : 50)),
      entryX: Math.round(direction * (85 + Math.random() * 45)),
      driftX: Math.round(direction * (18 + Math.random() * 24)),
    })
    if (settings.rollMode === 'arena') {
      if (!isArenaOpen) rollTrigger.current = document.activeElement as HTMLElement
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      setIsArenaSettled(reduceMotion)
      if (!reduceMotion) {
        settleRollTimer.current = setTimeout(() => {
          setIsArenaSettled(true)
          settleRollTimer.current = null
        }, kind === 'coin' ? 2100 : 1900)
      }
      setIsArenaOpen(true)
      return
    }
    hideRollTimer.current = setTimeout(() => {
      setRollResult(null)
      hideRollTimer.current = null
    }, ROLL_LIFETIME)
  }

  function handleCoinToss() {
    showRoll('coin', Math.floor(Math.random() * 2))
  }

  function handleDiceRoll() {
    showRoll('dice', Math.floor(Math.random() * diceImages.length))
  }

  function undo() {
    undoLastAction()
  }

  return (
    <div className={`game-actions ${isArenaOpen ? 'is-arena-open' : ''}`}>
      <div className="actions">
        {settings.rollMode === 'quick' && rollResult?.kind === 'coin' && (
          <span
            key={rollResult.id}
            className="coin-flight"
            aria-hidden="true"
          >
            <span className={`coin ${rollResult.value === 0 ? 'is-face' : 'is-tail'}`}>
              <img className="coin-front" src={ArenaFace} alt="" />
              <img className="coin-back" src={ArenaTail} alt="" />
            </span>
          </span>
        )}
        <button
          type="button"
          className="action-button"
          aria-label="Lançar moeda"
          onClick={handleCoinToss}
        >
          <img src={CoinToss} alt="" />
        </button>
      </div>

      <button
        type="button"
        className="undo-game"
        onClick={undo}
        disabled={isArenaOpen || !canUndo}
      >
        <Undo2 size={60} />
      </button>

      <button
        type="button"
        className="reset-game"
        title="Reiniciar LP dos dois jogadores"
        aria-label="Reiniciar LP dos dois jogadores"
        disabled={isArenaOpen}
        onClick={(event) => {
          playResetAnimation(event.currentTarget)
          resetAll()
        }}
      >
        <span className="reset-game-spinner">
          <RefreshCcw size={60} />
        </span>
      </button>

      <button
        type="button"
        className="settings-game"
        disabled={isArenaOpen}
        onClick={() => setIsSettingsOpen(true)}
      >
        <Settings2 size={60} />
      </button>

      <div className="actions">
        {settings.rollMode === 'quick' && rollResult?.kind === 'dice' && (
          <img
            key={rollResult.id}
            className="dice"
            src={diceImages[rollResult.value]}
            alt=""
            aria-hidden="true"
          />
        )}
        <button
          type="button"
          className="action-button"
          aria-label="Lançar dado"
          onClick={handleDiceRoll}
        >
          <img src={Dice} alt="" />
        </button>
      </div>

      <span className="roll-announcement" role="status">
        {settings.rollMode === 'quick' && rollResult?.kind === 'coin'
          ? `Moeda: ${rollResult.value === 0 ? 'heads' : 'tails'}`
          : settings.rollMode === 'quick' && rollResult?.kind === 'dice'
            ? `Dado: ${rollResult.value + 1}`
            : ''}
      </span>

      {isArenaOpen && rollResult && createPortal(
        <div className="roll-arena" role="region" aria-label="Lançamento de moeda ou dado"
          onClick={closeArena}>
          <div className="roll-arena-content">
            <button ref={arenaCloseButton} type="button" className="roll-arena-close"
              aria-label="Sair do lançamento" onClick={closeArena}><X aria-hidden="true" /></button>
            <div key={rollResult.id} className={`roll-arena-stage roll-arena-${rollResult.kind}`}
              style={{
                '--landing-x': `${rollResult.landingX}px`,
                '--entry-x': `${rollResult.entryX}px`,
                '--drift-x': `${rollResult.driftX}px`,
                '--drift-half': `${rollResult.driftX / 2}px`,
                '--drift-third': `${rollResult.driftX / 3}px`,
                '--drift-quarter': `${rollResult.driftX / 4}px`,
              } as CSSProperties}>
              <span className="roll-arena-floor" />
              <span className="roll-arena-shadow" />
              {rollResult.kind === 'coin' ? (
                  <button ref={arenaObjectButton} type="button" className="roll-arena-object-trigger roll-arena-coin-path"
                    aria-label={`Moeda: ${rollResult.value === 0 ? 'heads' : 'tails'}. Lançar novamente`}
                    onClick={(event) => { event.stopPropagation(); handleCoinToss() }}>
                    <span className={`coin ${rollResult.value === 0 ? 'is-face' : 'is-tail'}`}>
                      <img className="coin-front" src={ArenaFace} alt="" />
                      <img className="coin-back" src={ArenaTail} alt="" />
                    </span>
                  </button>
              ) : (
                <button ref={arenaObjectButton} type="button" className="roll-arena-object-trigger roll-arena-die-path"
                  aria-label={`Dado: ${rollResult.value + 1}. Lançar novamente`}
                  onClick={(event) => { event.stopPropagation(); handleDiceRoll() }}>
                  <ArenaDie result={rollResult.value + 1} />
                </button>
              )}
            </div>
            <span className="roll-announcement" role="status">
              {isArenaSettled && (rollResult.kind === 'coin'
                ? `Moeda: ${rollResult.value === 0 ? 'heads' : 'tails'}`
                : `Dado: ${rollResult.value + 1}`)}
            </span>
          </div>
        </div>, document.body,
      )}

      {isSettingsOpen && (
        <GameSettings
          playerIds={players}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  )
}
