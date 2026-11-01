import { useEffect, useReducer, useRef } from 'react'
import type { LifeContextType } from '../types/life-context'
import type { Action, Player, PlayerState, State } from '../types/life-provider'
import { LifeContext } from './LifeContext'

export type Props = {
  children: React.ReactNode
  configs: Player[]
}

// ---------- Reducer ----------
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HIT': {
      const newLife = Math.max(0, state.lifePoints - action.damage)
      return {
        ...state,
        lifePoints: newLife,
        lifePointsPercentage: (newLife / action.initialLifePoints) * 100,
      }
    }
    case 'HEAL': {
      const newLife = state.lifePoints + action.amount
      const lifePointsPercentage =
        newLife > action.initialLifePoints
          ? 100
          : (newLife / action.initialLifePoints) * 100
      return {
        ...state,
        lifePoints: newLife,
        lifePointsPercentage,
      }
    }
    case 'RESET': {
      return {
        ...state,
        lifePoints: action.initialLifePoints,
        lifePointsPercentage: 100,
      }
    }
    case 'SET_DISPLAY':
      return { ...state, displayedLifePoints: action.value }
    case 'SET_FRAME_ID':
      return { ...state, animationFrameId: action.id }
    case 'APPLY_REAL_VALUE':
      return {
        ...state,
        displayedLifePoints: state.lifePoints,
        animationFrameId: null,
      }
    case 'UNDO': {
      const raw = localStorage.getItem('states')
      if (!raw) return state

      const history = JSON.parse(raw) as PlayerState[]
      const lastState = history.pop()
      if (!lastState) return state

      const playerState = lastState.state
      if (!playerState) return state

      localStorage.setItem('states', JSON.stringify(history))
      return { ...state, ...playerState }
    }
    default:
      return state
  }
}

function createPlayerState(
  playerId: string,
  initialLifePoints: number,
): LifeContextType {
  const savedLP = localStorage.getItem(playerId)

  const [state, dispatch] = useReducer(reducer, {
    animationFrameId: null,
    lifePointsPercentage: savedLP
      ? (Number(savedLP) / initialLifePoints) * 100
      : 100,
    lifePoints: savedLP ? Number(savedLP) : initialLifePoints,
    displayedLifePoints: savedLP ? Number(savedLP) : initialLifePoints,
  })

  const startTimeRef = useRef<number>(0)

  function animateVisual(from: number) {
    startTimeRef.current = performance.now()

    function animate(now: number) {
      const elapsed = now - startTimeRef.current
      if (elapsed >= 1000) {
        dispatch({ type: 'APPLY_REAL_VALUE' })
        return
      }
      const fake = Math.floor(Math.random() * from)
      dispatch({ type: 'SET_DISPLAY', value: fake })
      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

  function hit(amount: number) {
    saveSnapshot()
    animateVisual(state.lifePoints)
    dispatch({ type: 'HIT', damage: amount, initialLifePoints })
  }

  function heal(amount: number) {
    saveSnapshot()
    animateVisual(state.lifePoints)
    dispatch({ type: 'HEAL', amount, initialLifePoints })
  }

  function reset() {
    if (state.lifePoints === initialLifePoints) return
    localStorage.removeItem(playerId)
    saveSnapshot()
    animateVisual(state.lifePoints)
    dispatch({ type: 'RESET', initialLifePoints })
  }

  function undo() {
    animateVisual(state.lifePoints)
    dispatch({ type: 'UNDO', playerId })
  }

  function saveSnapshot() {
    const raw = localStorage.getItem('states')
    const history = raw ? (JSON.parse(raw) as PlayerState[]) : []

    if (history.length > 50) history.shift() // keeps only the last 50 states

    history.push({ playerId, state })
    localStorage.setItem('states', JSON.stringify(history))
  }

  function isLastOnHistory(): boolean {
    const raw = localStorage.getItem('states')
    if (!raw) return false

    const history = JSON.parse(raw) as PlayerState[]
    const last = history[history.length - 1]
    return last?.playerId === playerId
  }

  useEffect(() => {
    localStorage.setItem(playerId, String(state.lifePoints))
  }, [state.lifePoints, playerId])

  return {
    lifePoints: state.lifePoints,
    displayedLifePoints: state.displayedLifePoints,
    lifePointsPercentage: state.lifePointsPercentage,
    hit,
    heal,
    reset,
    undo,
    isLastOnHistory,
  }
}

export function MultiLifeProvider({ children, configs }: Props) {
  const players: Record<string, LifeContextType> = {}

  for (const { id, initialLifePoints } of configs) {
    players[id] = createPlayerState(id, initialLifePoints)
  }

  return (
    <LifeContext.Provider value={{ players }}>{children}</LifeContext.Provider>
  )
}
