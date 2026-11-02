export type CounterTheme = 'gx'

import type { PointerEventHandler } from 'react'

export type CounterSkinProps = {
  value: number | string
  lifePointsPercentage: number
  direction: 'left' | 'right'
  name: string
  wins: number
  onLifeBarPointerDown: PointerEventHandler<HTMLDivElement>
  onLifeBarPointerMove: PointerEventHandler<HTMLDivElement>
  onLifeBarPointerUp: PointerEventHandler<HTMLDivElement>
  onLifeBarPointerCancel: PointerEventHandler<HTMLDivElement>
}
