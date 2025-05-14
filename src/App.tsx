import { useRef } from 'react'
import './App.css'
import GameActions from './components/GameActions'
import Gauge, { type GaugeHandle } from './components/Gauge'

function App() {
  const player1Ref = useRef<GaugeHandle>(null)
  const player2Ref = useRef<GaugeHandle>(null)

  function resetBoth() {
    player1Ref.current?.reset()
    player2Ref.current?.reset()
  }

  return (
    <div className="container">
      <Gauge ref={player1Ref} initialLifePoints={8000} playerDirection="left" />
      <GameActions resetBoth={resetBoth} />
      <Gauge
        ref={player2Ref}
        initialLifePoints={8000}
        playerDirection="right"
      />
    </div>
  )
}

export default App
