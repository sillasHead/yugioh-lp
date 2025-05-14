import { useEffect, useRef } from 'react'
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

  // visible viewport height for mobile devices
  // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setViewportHeight()
    window.addEventListener('resize', setViewportHeight)

    return () => window.removeEventListener('resize', setViewportHeight)
  }, [])

  return (
    <div className="container">
      <Gauge
        ref={player1Ref}
        initialLifePoints={8000}
        playerDirection="left"
        player="player-1"
      />
      <GameActions resetBoth={resetBoth} />
      <Gauge
        ref={player2Ref}
        initialLifePoints={8000}
        playerDirection="right"
        player="player-2"
      />
    </div>
  )
}

export default App
