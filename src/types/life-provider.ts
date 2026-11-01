export type Player = {
  id: string
  name: string
  initialLifePoints: number
}

export type PlayerProfile = {
  name: string
  wins: number
  losses: number
}

export type MatchResult = {
  winnerId: string
  loserId: string
}

export type GameSettings = {
  initialLifePoints: number
  profiles: Record<string, PlayerProfile>
}

export type PlayerLifeState = {
  lifePoints: number
  displayedLifePoints: number
  lifePointsPercentage: number
}

export type GameSnapshot = {
  players: Record<string, PlayerLifeState>
  profiles: Record<string, PlayerProfile>
  result: MatchResult | null
}

export type GameState = {
  players: Record<string, PlayerLifeState>
  profiles: Record<string, PlayerProfile>
  initialLifePoints: number
  result: MatchResult | null
  history: GameSnapshot[]
}

export type Action =
  | { type: 'HIT'; playerId: string; amount: number }
  | { type: 'HEAL'; playerId: string; amount: number }
  | { type: 'RESET'; playerId: string }
  | { type: 'RESET_ALL' }
  | { type: 'SET_DISPLAY'; playerId: string; value: number }
  | { type: 'APPLY_REAL_VALUE'; playerId: string }
  | { type: 'SET_SETTINGS'; settings: GameSettings }
  | { type: 'UNDO' }
