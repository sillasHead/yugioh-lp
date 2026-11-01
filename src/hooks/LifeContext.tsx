import { createContext, useContext } from 'react'
import type { MultiLifeContextType } from '../types/life-context'

export const LifeContext = createContext<MultiLifeContextType | null>(null)

export const useGameLife = () => {
  const context = useContext(LifeContext)
  if (!context) throw new Error('Life hooks must be used within MultiLifeProvider')
  return context
}

export const useLife = (playerId: string) => {
  const context = useGameLife()
  const player = context.players[playerId]
  if (!player) throw new Error(`No life state found for playerId: ${playerId}`)
  return player
}
