import { useEffect, useMemo, useReducer, useRef } from 'react'
import type { LifeContextType, MultiLifeContextType } from '../types/life-context'
import type {
  Action,
  GameState,
  Player,
  PlayerLifeState,
  PlayerState,
} from '../types/life-provider'
import { LifeContext } from './LifeContext'

export type Props = {
  children: React.ReactNode
  configs: Player[]
}

const HISTORY_LIMIT = 50
const ANIMATION_DURATION = 1000

function toLifePercentage(lifePoints: number, initialLifePoints: number) {
  return Math.max(0, Math.min(100, (lifePoints / initialLifePoints) * 100))
}

function readLifePoints(playerId: string, initialLifePoints: number) {
  try {
    const raw = localStorage.getItem(playerId)
    if (raw === null || raw.trim() === '') return initialLifePoints

    const saved = Number(raw)
    return Number.isFinite(saved) && saved >= 0 ? saved : initialLifePoints
  } catch {
    return initialLifePoints
  }
}

function readHistory(): PlayerState[] {
  try {
    const raw = localStorage.getItem('states')
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (entry): entry is PlayerState => {
        if (typeof entry !== 'object' || entry === null) return false

        const candidate = entry as PlayerState
        return (
          typeof candidate.playerId === 'string' &&
          typeof candidate.state === 'object' &&
          candidate.state !== null &&
          typeof candidate.state.lifePoints === 'number' &&
          Number.isFinite(candidate.state.lifePoints) &&
          candidate.state.lifePoints >= 0
        )
      },
    )
  } catch {
    return []
  }
}

function initializeState(configs: Player[]): GameState {
  const players: Record<string, PlayerLifeState> = {}

  for (const { id, initialLifePoints } of configs) {
    const lifePoints = readLifePoints(id, initialLifePoints)
    players[id] = {
      lifePoints,
      displayedLifePoints: lifePoints,
      lifePointsPercentage: toLifePercentage(lifePoints, initialLifePoints),
    }
  }

  const history = readHistory()
    .flatMap((entry) => {
      const config = configs.find(({ id }) => id === entry.playerId)
      if (!config) return []

      const lifePoints = entry.state.lifePoints
      return [
        {
          playerId: entry.playerId,
          state: {
            lifePoints,
            displayedLifePoints: lifePoints,
            lifePointsPercentage: toLifePercentage(
              lifePoints,
              config.initialLifePoints,
            ),
          },
        },
      ]
    })
    .slice(-HISTORY_LIMIT)

  return { players, history }
}

function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'UNDO') {
    const history = [...state.history]
    const previous = history.pop()
    if (!previous || !state.players[previous.playerId]) return state

    return {
      players: {
        ...state.players,
        [previous.playerId]: {
          ...previous.state,
          displayedLifePoints: previous.state.lifePoints,
        },
      },
      history,
    }
  }

  const player = state.players[action.playerId]
  if (!player) return state

  if (action.type === 'SET_DISPLAY') {
    return {
      ...state,
      players: {
        ...state.players,
        [action.playerId]: { ...player, displayedLifePoints: action.value },
      },
    }
  }

  if (action.type === 'APPLY_REAL_VALUE') {
    return {
      ...state,
      players: {
        ...state.players,
        [action.playerId]: {
          ...player,
          displayedLifePoints: player.lifePoints,
        },
      },
    }
  }

  let lifePoints: number
  if (action.type === 'HIT') {
    lifePoints = Math.max(0, player.lifePoints - action.amount)
  } else if (action.type === 'HEAL') {
    lifePoints = player.lifePoints + action.amount
  } else {
    lifePoints = action.initialLifePoints
  }

  const initialLifePoints = action.initialLifePoints
  const nextPlayer: PlayerLifeState = {
    lifePoints,
    displayedLifePoints: player.displayedLifePoints,
    lifePointsPercentage: toLifePercentage(lifePoints, initialLifePoints),
  }
  const history = [
    ...state.history.slice(-(HISTORY_LIMIT - 1)),
    { playerId: action.playerId, state: player },
  ]

  return {
    players: { ...state.players, [action.playerId]: nextPlayer },
    history,
  }
}

export function MultiLifeProvider({ children, configs }: Props) {
  const [state, dispatch] = useReducer(reducer, configs, initializeState)
  const animationFrames = useRef(new Map<string, number>())
  const animationStarts = useRef(new Map<string, number>())

  function animateVisual(playerId: string, from: number) {
    const previousFrame = animationFrames.current.get(playerId)
    if (previousFrame !== undefined) cancelAnimationFrame(previousFrame)

    animationStarts.current.set(playerId, performance.now())

    function animate(now: number) {
      const startedAt = animationStarts.current.get(playerId) ?? now
      if (now - startedAt >= ANIMATION_DURATION) {
        animationFrames.current.delete(playerId)
        dispatch({ type: 'APPLY_REAL_VALUE', playerId })
        return
      }

      dispatch({
        type: 'SET_DISPLAY',
        playerId,
        value: Math.floor(Math.random() * (from + 1)),
      })
      animationFrames.current.set(playerId, requestAnimationFrame(animate))
    }

    animationFrames.current.set(playerId, requestAnimationFrame(animate))
  }

  useEffect(
    () => () => {
      for (const frame of animationFrames.current.values()) {
        cancelAnimationFrame(frame)
      }
    },
    [],
  )

  const lifePointsStorage = configs
    .map(({ id }) => `${id}:${state.players[id]?.lifePoints ?? 0}`)
    .join('|')

  useEffect(() => {
    for (const { id } of configs) {
      localStorage.setItem(id, String(state.players[id]?.lifePoints ?? 0))
    }
    localStorage.setItem('states', JSON.stringify(state.history))
  }, [configs, lifePointsStorage, state.history])

  const players = useMemo(() => {
    const result: Record<string, LifeContextType> = {}

    for (const { id, initialLifePoints } of configs) {
      const player = state.players[id]
      if (!player) continue

      result[id] = {
        ...player,
        hit: (amount) => {
          animateVisual(id, player.lifePoints)
          dispatch({ type: 'HIT', playerId: id, amount, initialLifePoints })
        },
        heal: (amount) => {
          animateVisual(id, player.lifePoints)
          dispatch({ type: 'HEAL', playerId: id, amount, initialLifePoints })
        },
        reset: () => {
          if (player.lifePoints === initialLifePoints) return
          animateVisual(id, player.lifePoints)
          dispatch({
            type: 'RESET',
            playerId: id,
            initialLifePoints,
          })
        },
      }
    }

    return result
  }, [configs, state.players])

  const canUndo = state.history.length > 0
  const value = useMemo<MultiLifeContextType>(
    () => ({
      players,
      canUndo,
      undo: () => {
        for (const frame of animationFrames.current.values()) {
          cancelAnimationFrame(frame)
        }
        animationFrames.current.clear()
        animationStarts.current.clear()
        dispatch({ type: 'UNDO' })
      },
    }),
    [players, canUndo],
  )

  return <LifeContext.Provider value={value}>{children}</LifeContext.Provider>
}
