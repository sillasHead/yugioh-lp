import { createContext, useContext } from 'react'
import type { MultiLifeContextType } from '../types/life-context'

export const LifeContext = createContext<MultiLifeContextType>({ players: {} })

export const useLife = (playerId: string) => {
  const context = useContext(LifeContext)
  const player = context.players[playerId]
  if (!player) throw new Error(`No life state found for playerId: ${playerId}`)
  return player
}
