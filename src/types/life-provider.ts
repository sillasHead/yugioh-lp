export type Player = {
  id: string
  initialLifePoints: number
}

export type PlayerLifeState = {
  lifePoints: number
  displayedLifePoints: number
  lifePointsPercentage: number
}

export type PlayerState = {
  playerId: string
  state: PlayerLifeState
}

export type GameState = {
  players: Record<string, PlayerLifeState>
  history: PlayerState[]
}

export type Action =
  | { type: 'HIT'; playerId: string; amount: number; initialLifePoints: number }
  | { type: 'HEAL'; playerId: string; amount: number; initialLifePoints: number }
  | { type: 'RESET'; playerId: string; initialLifePoints: number }
  | { type: 'SET_DISPLAY'; playerId: string; value: number }
  | { type: 'APPLY_REAL_VALUE'; playerId: string }
  | { type: 'UNDO' }
