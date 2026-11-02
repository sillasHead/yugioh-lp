import { useEffect, useRef, useState } from 'react'

import CoinToss from '../../assets/coin/coin-toss.svg'
import Face from '../../assets/coin/face.png'
import Tail from '../../assets/coin/tail.png'

import { RefreshCcw, Settings2, Undo2 } from 'lucide-react'
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
}

const diceImages = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]
const ROLL_LIFETIME = 2800

export function GameActions({ players }: Props) {
  const {
    canUndo,
    resetAll,
    undo: undoLastAction,
  } = useGameLife()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [rollResult, setRollResult] = useState<RollResult | null>(null)
  const rollId = useRef(0)
  const hideRollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (hideRollTimer.current !== null) clearTimeout(hideRollTimer.current)
  }, [])

  function showRoll(kind: RollResult['kind'], value: number) {
    if (hideRollTimer.current !== null) clearTimeout(hideRollTimer.current)
    rollId.current += 1
    setRollResult({ kind, value, id: rollId.current })
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
    <div className="game-actions">
      <div className="actions">
        {rollResult?.kind === 'coin' && (
          <span
            key={rollResult.id}
            className="coin-flight"
            aria-hidden="true"
          >
            <span className={`coin ${rollResult.value === 0 ? 'is-face' : 'is-tail'}`}>
              <img className="coin-front" src={Face} alt="" />
              <img className="coin-back" src={Tail} alt="" />
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
        disabled={!canUndo}
      >
        <Undo2 size={60} />
      </button>

      <button
        type="button"
        className="reset-game"
        title="Reiniciar LP dos dois jogadores"
        aria-label="Reiniciar LP dos dois jogadores"
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
        onClick={() => setIsSettingsOpen(true)}
      >
        <Settings2 size={60} />
      </button>

      <div className="actions">
        {rollResult?.kind === 'dice' && (
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
        {rollResult?.kind === 'coin'
          ? `Moeda: ${rollResult.value === 0 ? 'cara' : 'coroa'}`
          : rollResult?.kind === 'dice'
            ? `Dado: ${rollResult.value + 1}`
            : ''}
      </span>

      {isSettingsOpen && (
        <GameSettings
          playerIds={players}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  )
}
