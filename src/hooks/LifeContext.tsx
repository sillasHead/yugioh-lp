import { createContext, useContext } from 'react'

type LifeContextType = {
  lifePoints: number
  displayedLifePoints: number
  lifePointsPercentage: number
  hit: (amount: number) => void
  heal: (amount: number) => void
  reset: () => void
}

export const LifeContext = createContext<LifeContextType>({} as LifeContextType)

export const useLife = () => useContext(LifeContext)
