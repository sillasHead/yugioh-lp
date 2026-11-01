export type LifeContextType = {
  lifePoints: number
  displayedLifePoints: number
  lifePointsPercentage: number
  hit: (amount: number) => void
  heal: (amount: number) => void
  reset: () => void
  undo: () => void
  isLastOnHistory: () => boolean
}

export type MultiLifeContextType = {
  players: Record<string, LifeContextType>
}
