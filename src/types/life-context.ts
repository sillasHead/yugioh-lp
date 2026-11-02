import type {
  GameSettings,
  PlayerLifeState,
  PlayerProfile,
} from './life-provider'

export type LifeContextType = PlayerLifeState & PlayerProfile & {
  hit: (amount: number) => void
  heal: (amount: number) => void
  adjust: (amount: number, recordHistory: boolean) => void
  reset: () => void
}

export type MultiLifeContextType = {
  players: Record<string, LifeContextType>
  settings: GameSettings
  saveSettings: (settings: GameSettings) => void
  resetAll: () => void
  canUndo: boolean
  undo: () => void
}
