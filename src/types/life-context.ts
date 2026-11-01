import type { PlayerLifeState } from './life-provider'

export type LifeContextType = PlayerLifeState & {
  hit: (amount: number) => void
  heal: (amount: number) => void
  reset: () => void
}

export type MultiLifeContextType = {
  players: Record<string, LifeContextType>
  canUndo: boolean
  undo: () => void
}
