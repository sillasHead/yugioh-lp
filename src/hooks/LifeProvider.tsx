import { useReducer, useRef } from 'react'
import { LifeContext } from './LifeContext'

// ---------- types ----------
type Props = {
  children: React.ReactNode
  initialLifePoints?: number
}

type State = {
  lifePoints: number
  displayedLifePoints: number
  animationFrameId: number | null
  lifePointsPercentage: number
}

type Action =
  | { type: 'HIT'; damage: number }
  | { type: 'HEAL'; amount: number }
  | { type: 'RESET'; initialLifePoints?: number }
  | { type: 'SET_DISPLAY'; value: number }
  | { type: 'SET_FRAME_ID'; id: number | null }
  | { type: 'APPLY_REAL_VALUE' }

// ---------- initial state ----------
const initialState: State = {
  lifePoints: 8000,
  displayedLifePoints: 8000,
  animationFrameId: null,
  lifePointsPercentage: 100,
}

// ---------- Reducer ----------
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HIT': {
      const newLife = Math.max(0, state.lifePoints - action.damage)
      return {
        ...state,
        lifePoints: newLife,
        lifePointsPercentage: (newLife / 8000) * 100,
      }
    }
    case 'HEAL': {
      const newLife = state.lifePoints + action.amount
      const lifePointsPercentage = newLife > 8000 ? 100 : (newLife / 8000) * 100
      return {
        ...state,
        lifePoints: newLife,
        lifePointsPercentage,
      }
    }
    case 'RESET': {
      return {
        ...state,
        lifePoints: action.initialLifePoints ?? 8000,
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
    default:
      return state
  }
}

export function LifeProvider({ children, initialLifePoints }: Props) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    lifePoints: initialLifePoints ?? 8000,
    displayedLifePoints: initialLifePoints ?? 8000,
  })
  const startTimeRef = useRef<number>(0)
  const delay = 1000

  // ---------- animation ----------
  function animateVisual(from: number) {
    startTimeRef.current = performance.now()

    // cancels the previous animation
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId)
    }

    function animate(now: number) {
      const elapsed = now - startTimeRef.current

      if (elapsed >= delay) {
        dispatch({ type: 'APPLY_REAL_VALUE' })
        return
      }

      const fakeValue = Math.floor(Math.random() * (from + 1))
      dispatch({ type: 'SET_DISPLAY', value: fakeValue })

      const id = requestAnimationFrame(animate)
      dispatch({ type: 'SET_FRAME_ID', id })
    }

    const id = requestAnimationFrame(animate)
    dispatch({ type: 'SET_FRAME_ID', id })
  }

  function hit(damage: number) {
    animateVisual(state.lifePoints)
    dispatch({ type: 'HIT', damage })
  }

  function heal(amount: number) {
    animateVisual(state.lifePoints)
    dispatch({ type: 'HEAL', amount })
  }

  function reset() {
    animateVisual(state.lifePoints)
    dispatch({ type: 'RESET' })
  }

  return (
    <LifeContext.Provider
      value={{
        lifePoints: state.lifePoints,
        displayedLifePoints: state.displayedLifePoints,
        lifePointsPercentage: state.lifePointsPercentage,
        hit,
        heal,
        reset,
      }}
    >
      {children}
    </LifeContext.Provider>
  )
}
