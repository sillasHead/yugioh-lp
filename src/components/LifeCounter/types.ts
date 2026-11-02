export type CounterTheme = 'gx'

import type { PointerEventHandler } from 'react'

export type CounterSkinProps = {
  value: number | 'win' | 'loser'
  lifePointsPercentage: number
  direction: 'left' | 'right'
  name: string
  wins: number
  losses: number
  onLifeBarPointerDown: PointerEventHandler<HTMLDivElement>
  onLifeBarPointerMove: PointerEventHandler<HTMLDivElement>
  onLifeBarPointerUp: PointerEventHandler<HTMLDivElement>
}
