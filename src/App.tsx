import './App.css'
import { GameActions } from './components/GameActions'
import { LifeCounter } from './components/LifeCounter'
import { MultiLifeProvider } from './hooks/LifeProvider'
import { CounterBoardProvider } from './hooks/CounterBoard'
import type { Player } from './types/life-provider'

const players: Player[] = [
  { id: 'player-1', name: 'Yugi', initialLifePoints: 12000 },
  { id: 'player-2', name: 'Kaiba', initialLifePoints: 12000 },
]

function App() {
  const [player1, player2] = players

  return (
    <div className="container">
      <MultiLifeProvider configs={players}>
        <CounterBoardProvider>
          <LifeCounter
            playerDirection="left"
            playerId={player1.id}
            otherPlayerId={player2.id}
          />
          <GameActions players={[player1.id, player2.id]} />
          <LifeCounter
            playerDirection="right"
            playerId={player2.id}
            otherPlayerId={player1.id}
          />
        </CounterBoardProvider>
      </MultiLifeProvider>
    </div>
  )
}

export default App
