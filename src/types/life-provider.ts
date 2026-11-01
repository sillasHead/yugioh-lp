export type Player = {
  id: string
  initialLifePoints: number
}

export type State = {
  lifePoints: number
  displayedLifePoints: number
  animationFrameId: number | null
  lifePointsPercentage: number
}

export type PlayerState = {
  playerId: string
  state: State
}

export type Action =
  | { type: 'HIT'; damage: number; initialLifePoints: number }
  | { type: 'HEAL'; amount: number; initialLifePoints: number }
  | { type: 'RESET'; initialLifePoints: number }
  | { type: 'SET_DISPLAY'; value: number }
  | { type: 'SET_FRAME_ID'; id: number | null }
  | { type: 'APPLY_REAL_VALUE' }
  | { type: 'UNDO'; playerId: string }
