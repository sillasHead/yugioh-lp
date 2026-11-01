import { useEffect } from 'react'
import './App.css'
import { GameActions } from './components/GameActions'
import { Gauge } from './components/Gauge'
import { MultiLifeProvider } from './hooks/LifeProvider'
import type { Player } from './types/life-provider'

function App() {
  const p1: Player = {
    id: 'player-1',
    initialLifePoints: 12000,
  }
  const p2: Player = {
    id: 'player-2',
    initialLifePoints: 12000,
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
      <MultiLifeProvider configs={[p1, p2]}>
        <Gauge playerDirection="left" playerId={p1.id} otherPlayer={p2.id} />
        <GameActions players={[p1.id, p2.id]} />
        <Gauge playerDirection="right" playerId={p2.id} otherPlayer={p1.id} />
      </MultiLifeProvider>

      {/* <div id="myModal" className="modal">
        <div className="modal-content">
          <h2>Initial Life Points</h2>

          {lpOptions.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onSelectLifePoints(value)}
            >
              {value}
            </button>
          ))}
          <div className="custom">
            <input ref={customRef} type="text" placeholder="Custom" />
            <Check
              size={32}
              onClick={() =>
                onSelectLifePoints(Number(customRef.current?.value))
              }
            />
          </div>
        </div>
      </div> */}
    </div>
  )
}

export default App
