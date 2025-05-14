import { useRef } from 'react'

import CoinToss from '../../assets/coin/coin-toss.svg'
import Face from '../../assets/coin/face.png'
import Tail from '../../assets/coin/tail.png'

import { RefreshCcw } from 'lucide-react'
import One from '../../assets/dice/dice-1.svg'
import Two from '../../assets/dice/dice-2.svg'
import Three from '../../assets/dice/dice-3.svg'
import Four from '../../assets/dice/dice-4.svg'
import Five from '../../assets/dice/dice-5.svg'
import Six from '../../assets/dice/dice-6.svg'
import Dice from '../../assets/dice/dice.svg'
import './style.css'

type Props = {
  resetBoth: () => void
}

export default function GameActions({ resetBoth }: Props) {
  const delay = 1250

  const tailRef = useRef<HTMLImageElement>(null)
  const faceRef = useRef<HTMLImageElement>(null)

  const oneRef = useRef<HTMLImageElement>(null)
  const twoRef = useRef<HTMLImageElement>(null)
  const threeRef = useRef<HTMLImageElement>(null)
  const fourRef = useRef<HTMLImageElement>(null)
  const fiveRef = useRef<HTMLImageElement>(null)
  const sixRef = useRef<HTMLImageElement>(null)

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
    const randomNumber = Math.floor(Math.random() * 6) + 1

    switch (randomNumber) {
      case 1:
        oneRef.current?.classList.add('active-dice')
        setTimeout(() => {
          oneRef.current?.classList.remove('active-dice')
        }, delay)
        break
      case 2:
        twoRef.current?.classList.add('active-dice')
        setTimeout(() => {
          twoRef.current?.classList.remove('active-dice')
        }, delay)
        break
      case 3:
        threeRef.current?.classList.add('active-dice')
        setTimeout(() => {
          threeRef.current?.classList.remove('active-dice')
        }, delay)
        break
      case 4:
        fourRef.current?.classList.add('active-dice')
        setTimeout(() => {
          fourRef.current?.classList.remove('active-dice')
        }, delay)
        break
      case 5:
        fiveRef.current?.classList.add('active-dice')
        setTimeout(() => {
          fiveRef.current?.classList.remove('active-dice')
        }, delay)
        break
      case 6:
        sixRef.current?.classList.add('active-dice')
        setTimeout(() => {
          sixRef.current?.classList.remove('active-dice')
        }, delay)
        break
    }
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

      <button type="button" className="reset-game" onClick={resetBoth}>
        <RefreshCcw size={60} />
      </button>

      <div className="actions">
        <img className="dice" ref={oneRef} src={One} alt="Dice 1" />
        <img className="dice" ref={twoRef} src={Two} alt="Dice 2" />
        <img className="dice" ref={threeRef} src={Three} alt="Dice 3" />
        <img className="dice" ref={fourRef} src={Four} alt="Dice 4" />
        <img className="dice" ref={fiveRef} src={Five} alt="Dice 5" />
        <img className="dice" ref={sixRef} src={Six} alt="Dice 6" />
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
