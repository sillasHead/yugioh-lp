import { useRef } from 'react'

import CoinToss from '../../assets/coin/coin-toss.svg'
import Face from '../../assets/coin/face.png'
import Tail from '../../assets/coin/tail.png'

import { RefreshCcw, Undo2 } from 'lucide-react'
import Dice1 from '../../assets/dice/dice-1.svg'
import Dice2 from '../../assets/dice/dice-2.svg'
import Dice3 from '../../assets/dice/dice-3.svg'
import Dice4 from '../../assets/dice/dice-4.svg'
import Dice5 from '../../assets/dice/dice-5.svg'
import Dice6 from '../../assets/dice/dice-6.svg'
import Dice from '../../assets/dice/dice.svg'
import { useGameLife, useLife } from '../../hooks/LifeContext'
import './style.css'

type Props = {
  players: string[]
}

export function GameActions({ players }: Props) {
  const p1 = useLife(players[0])
  const p2 = useLife(players[1])
  const { canUndo, undo: undoLastAction } = useGameLife()

  const delay = 1250

  const tailRef = useRef<HTMLImageElement>(null)
  const faceRef = useRef<HTMLImageElement>(null)

  const diceRefs = useRef<Array<HTMLImageElement | null>>([])
  const diceImages = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]

  function resetLifePoints() {
    p1.reset()
    p2.reset()
  }

  function handleCoinToss() {
    const randomNumber = Math.floor(Math.random() * 2)
    const coinFace = randomNumber === 0 ? 'face' : 'tail'

    switch (coinFace) {
      case 'face':
        faceRef.current?.classList.add('active-coin')
        setTimeout(() => {
          faceRef.current?.classList.remove('active-coin')
        }, delay)
        break
      case 'tail':
        tailRef.current?.classList.add('active-coin')
        setTimeout(() => {
          tailRef.current?.classList.remove('active-coin')
        }, delay)
        break
    }
  }

  function handleDiceRoll() {
    const randomIndex = Math.floor(Math.random() * 6)
    const ref = diceRefs.current[randomIndex]

    ref?.classList.add('active-dice')
    setTimeout(() => {
      ref?.classList.remove('active-dice')
    }, delay)
  }

  function undo() {
    undoLastAction()
  }

  return (
    <div className="game-actions">
      <div className="actions">
        <img className="coin" ref={faceRef} src={Face} alt="Coin Face" />
        <img className="coin" ref={tailRef} src={Tail} alt="Coin Tail" />
        <button
          type="button"
          className="action-button"
          onClick={handleCoinToss}
        >
          <img src={CoinToss} alt="Coin Toss" />
        </button>
      </div>

      <button type="button" className="reset-game" onClick={resetLifePoints}>
        <RefreshCcw size={60} />
      </button>

      <button type="button" onClick={undo} disabled={!canUndo}>
        <Undo2 size={60} />
      </button>

      <div className="actions">
        {diceImages.map((img, i) => (
          <img
            key={img}
            className="dice"
            ref={(element) => {
              diceRefs.current[i] = element
            }}
            src={img}
            alt={`Dice ${i + 1}`}
          />
        ))}
        <button
          type="button"
          className="action-button"
          onClick={handleDiceRoll}
        >
          <img src={Dice} alt="Dice" />
        </button>
      </div>
    </div>
  )
}
