import { RefreshCcw } from 'lucide-react'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
} from 'react'
import gauge from '../../assets/gauge.png'
import './style.css'

// ---------- types ----------
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

export type GaugeHandle = {
  reset: () => void
}

type Props = {
  initialLifePoints?: number
  playerDirection?: 'left' | 'right'
  player: string
}

// ---------- initial state ----------
export const initialState: State = {
  lifePoints: 8000,
  displayedLifePoints: 8000,
  animationFrameId: null,
  lifePointsPercentage: 100,
}

// ---------- reducer ----------
export function reducer(state: State, action: Action): State {
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

const Gauge = forwardRef<GaugeHandle, Props>(function Gauge(
  { initialLifePoints = 8000, playerDirection = 'left', player }: Props,
  ref,
) {
  const savedLP = localStorage.getItem(player)
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    lifePoints: savedLP ? Number(savedLP) : initialLifePoints,
    displayedLifePoints: savedLP ? Number(savedLP) : initialLifePoints,
    lifePointsPercentage: savedLP
      ? (Number(savedLP) / initialLifePoints) * 100
      : 100,
  })
  const startTimeRef = useRef<number>(0)
  const delay = 800

  const lifeActions = [50, 100, 500, 1000]
  const scaleX = playerDirection === 'left' ? -1 : 1

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

  // ---------- main functions ----------
  function hit(damage: number) {
    animateVisual(state.lifePoints)
    dispatch({ type: 'HIT', damage })
  }

  function heal(amount: number) {
    animateVisual(state.lifePoints)
    dispatch({ type: 'HEAL', amount })
  }

  function reset() {
    if (state.lifePoints === initialLifePoints) return
    animateVisual(state.lifePoints)
    dispatch({ type: 'RESET', initialLifePoints })
  }

  useEffect(() => {
    localStorage.setItem(player, String(state.lifePoints))
  }, [state.lifePoints, player])

  useImperativeHandle(ref, () => ({
    reset,
  }))

  return (
    <div className="gauge-container">
      <div className="gauge" style={{ transform: `scaleX(${scaleX})` }}>
        <img src={gauge} alt="Gauge" />
        <div
          className="gauge-lp bungee-spice-regular"
          style={{
            transform: `scaleX(${scaleX}) scaleY(2.5)`,
          }}
        >
          {state.displayedLifePoints}
        </div>

        <div className="gauge-bar">
          <div
            className="empty-bar"
            style={{
              height: `${100 - state.lifePointsPercentage}%`,
            }}
          />
          <div>
            <div className="bar bar-1" />
          </div>
          <div>
            <div className="bar bar-2" />
          </div>
          <div>
            <div className="bar bar-3" />
          </div>
          <div>
            <div className="bar bar-4" />
          </div>
          <div>
            <div className="bar bar-5" />
          </div>
          <div>
            <div className="bar bar-6" />
          </div>
          <div>
            <div className="bar bar-7" />
          </div>
          <div>
            <div className="bar bar-8" />
          </div>
        </div>
      </div>
      <div className="life-actions">
        {lifeActions.map((action) => (
          <button key={action} type="button" onClick={() => hit(action)}>
            💥 {action}
          </button>
        ))}
        {lifeActions.map((action) => (
          <button key={action} type="button" onClick={() => heal(action)}>
            💚 {action}
          </button>
        ))}
        <button type="button" className="reset btn-gray" onClick={reset}>
          <RefreshCcw size={'1.25em'} />
        </button>
      </div>
    </div>
  )
})

export default Gauge
