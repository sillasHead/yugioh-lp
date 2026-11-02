import { useEffect, useMemo, useReducer } from 'react'
import type { LifeContextType, MultiLifeContextType } from '../types/life-context'
import type {
  Action,
  GameSnapshot,
  GameSettings,
  GameState,
  MatchResult,
  Player,
  PlayerLifeState,
  PlayerProfile,
} from '../types/life-provider'
import { LifeContext } from './LifeContext'
import { useLifePointAnimation } from './useLifePointAnimation'

export type Props = {
  children: React.ReactNode
  configs: Player[]
}

const HISTORY_LIMIT = 50
const SETTINGS_KEY = 'duel-settings'

type StoredSettings = GameSettings & { result: MatchResult | null }

function toLifePercentage(lifePoints: number, initialLifePoints: number) {
  return Math.max(0, Math.min(100, (lifePoints / initialLifePoints) * 100))
}

function normalizeProfile(value: unknown, fallbackName: string): PlayerProfile {
  if (typeof value !== 'object' || value === null) {
    return { name: fallbackName, wins: 0, losses: 0 }
  }

  const candidate = value as Partial<PlayerProfile>
  return {
    name:
      typeof candidate.name === 'string' && candidate.name.trim()
        ? candidate.name.trim().slice(0, 24)
        : fallbackName,
    wins:
      typeof candidate.wins === 'number' &&
      Number.isInteger(candidate.wins) &&
      candidate.wins >= 0
        ? candidate.wins
        : 0,
    losses:
      typeof candidate.losses === 'number' &&
      Number.isInteger(candidate.losses) &&
      candidate.losses >= 0
        ? candidate.losses
        : 0,
  }
}

function isMatchResult(value: unknown): value is MatchResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as MatchResult).winnerId === 'string' &&
    typeof (value as MatchResult).loserId === 'string'
  )
}

function readStoredSettings(configs: Player[]): StoredSettings {
  const defaultSettings: StoredSettings = {
    initialLifePoints: configs[0]?.initialLifePoints ?? 12000,
    profiles: Object.fromEntries(
      configs.map((player) => [
        player.id,
        normalizeProfile(undefined, player.name),
      ]),
    ),
    result: null,
  }

  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaultSettings

    const stored: unknown = JSON.parse(raw)
    if (typeof stored !== 'object' || stored === null) return defaultSettings

    const candidate = stored as Partial<StoredSettings>
    const initialLifePoints =
      typeof candidate.initialLifePoints === 'number' &&
      Number.isInteger(candidate.initialLifePoints) &&
      candidate.initialLifePoints > 0
        ? candidate.initialLifePoints
        : defaultSettings.initialLifePoints
    const storedProfiles =
      typeof candidate.profiles === 'object' && candidate.profiles !== null
        ? candidate.profiles
        : {}

    return {
      initialLifePoints,
      profiles: Object.fromEntries(
        configs.map((player) => [
          player.id,
          normalizeProfile(
            (storedProfiles as Record<string, unknown>)[player.id],
            player.name,
          ),
        ]),
      ),
      result: isMatchResult(candidate.result) ? candidate.result : null,
    }
  } catch {
    return defaultSettings
  }
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

function isPlayerLifeState(value: unknown): value is PlayerLifeState {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PlayerLifeState).lifePoints === 'number' &&
    Number.isFinite((value as PlayerLifeState).lifePoints) &&
    (value as PlayerLifeState).lifePoints >= 0
  )
}

function readHistory(): GameSnapshot[] {
  try {
    const raw = localStorage.getItem('duel-history')
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((entry): entry is GameSnapshot => {
      if (typeof entry !== 'object' || entry === null) return false
      const candidate = entry as GameSnapshot
      return (
        typeof candidate.players === 'object' &&
        candidate.players !== null &&
        typeof candidate.profiles === 'object' &&
        candidate.profiles !== null
      )
    })
  } catch {
    return []
  }
}

function initializeState(configs: Player[]): GameState {
  const settings = readStoredSettings(configs)
  const players: Record<string, PlayerLifeState> = {}

  for (const { id } of configs) {
    const lifePoints = readLifePoints(id, settings.initialLifePoints)
    players[id] = {
      lifePoints,
      displayedLifePoints: lifePoints,
      lifePointsPercentage: toLifePercentage(
        lifePoints,
        settings.initialLifePoints,
      ),
    }
  }

  const profiles = settings.profiles
  const history = readHistory()
    .flatMap((entry) => {
      const snapshotPlayers: Record<string, PlayerLifeState> = {}
      for (const { id } of configs) {
        const savedPlayer = entry.players[id]
        if (!isPlayerLifeState(savedPlayer)) return []
        snapshotPlayers[id] = {
          lifePoints: savedPlayer.lifePoints,
          displayedLifePoints: savedPlayer.lifePoints,
          lifePointsPercentage: toLifePercentage(
            savedPlayer.lifePoints,
            settings.initialLifePoints,
          ),
        }
      }

      const snapshotProfiles = Object.fromEntries(
        configs.map((player) => [
          player.id,
          normalizeProfile(entry.profiles[player.id], player.name),
        ]),
      ) as Record<string, PlayerProfile>

      return [
        {
          players: snapshotPlayers,
          profiles: snapshotProfiles,
          result: isMatchResult(entry.result) ? entry.result : null,
        },
      ]
    })
    .slice(-HISTORY_LIMIT)

  return {
    players,
    profiles,
    initialLifePoints: settings.initialLifePoints,
    result: settings.result,
    history,
  }
}

function createSnapshot(state: GameState): GameSnapshot {
  return {
    players: state.players,
    profiles: state.profiles,
    result: state.result,
  }
}

function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'UNDO') {
    const history = [...state.history]
    const previous = history.pop()
    if (!previous) return state

    return {
      ...state,
      players: Object.fromEntries(
        Object.entries(previous.players).map(([id, player]) => [
          id,
          { ...player, displayedLifePoints: player.lifePoints },
        ]),
      ),
      profiles: previous.profiles,
      result: previous.result,
      history,
    }
  }

  if (action.type === 'SET_SETTINGS') {
    const pointsChanged =
      action.settings.initialLifePoints !== state.initialLifePoints
    const players = pointsChanged
      ? Object.fromEntries(
          Object.keys(state.players).map((id) => [
            id,
            {
              lifePoints: action.settings.initialLifePoints,
              displayedLifePoints: action.settings.initialLifePoints,
              lifePointsPercentage: 100,
            },
          ]),
        )
      : state.players

    return {
      ...state,
      players,
      profiles: action.settings.profiles,
      initialLifePoints: action.settings.initialLifePoints,
      result: pointsChanged ? null : state.result,
      history: [],
    }
  }

  if (action.type === 'RESET_ALL') {
    const history = [
      ...state.history.slice(-(HISTORY_LIMIT - 1)),
      { players: state.players, profiles: state.profiles, result: state.result },
    ]
    return {
      ...state,
      players: Object.fromEntries(
        Object.keys(state.players).map((id) => [
          id,
          {
            lifePoints: state.initialLifePoints,
            displayedLifePoints: state.initialLifePoints,
            lifePointsPercentage: 100,
          },
        ]),
      ),
      result: null,
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

  if (state.result) return state

  let lifePoints: number
  if (action.type === 'HIT') {
    lifePoints = Math.max(0, player.lifePoints - action.amount)
  } else if (action.type === 'HEAL') {
    lifePoints = player.lifePoints + action.amount
  } else if (action.type === 'ADJUST_LP') {
    lifePoints = Math.max(0, player.lifePoints + action.amount)
  } else {
    lifePoints = state.initialLifePoints
  }

  const nextHistory = [
    ...state.history.slice(-(HISTORY_LIMIT - 1)),
    createSnapshot(state),
  ]
  const nextPlayer: PlayerLifeState = {
    lifePoints,
    displayedLifePoints: player.displayedLifePoints,
    lifePointsPercentage: toLifePercentage(lifePoints, state.initialLifePoints),
  }
  if (action.type === 'ADJUST_LP' && lifePoints === player.lifePoints) {
    return state
  }
  const players = { ...state.players, [action.playerId]: nextPlayer }

  if (action.type === 'RESET') {
    return { ...state, players, result: null, history: nextHistory }
  }

  let profiles = state.profiles
  let result: MatchResult | null = null
  if (
    (action.type === 'HIT' ||
      (action.type === 'ADJUST_LP' && action.amount < 0)) &&
    lifePoints === 0
  ) {
    const opponentId = Object.keys(state.players).find(
      (id) => id !== action.playerId,
    )
    if (opponentId && state.players[opponentId].lifePoints > 0) {
      result = { winnerId: opponentId, loserId: action.playerId }
      profiles = {
        ...state.profiles,
        [opponentId]: {
          ...state.profiles[opponentId],
          wins: state.profiles[opponentId].wins + 1,
        },
        [action.playerId]: {
          ...state.profiles[action.playerId],
          losses: state.profiles[action.playerId].losses + 1,
        },
      }
    }
  }

  return {
    ...state,
    players,
    profiles,
    result,
    history: nextHistory,
  }
}

export function MultiLifeProvider({ children, configs }: Props) {
  const [state, dispatch] = useReducer(reducer, configs, initializeState)
  const { animateVisual, cancelAll } = useLifePointAnimation(dispatch)

  const lifePointsStorage = configs
    .map(({ id }) => `${id}:${state.players[id]?.lifePoints ?? 0}`)
    .join('|')

  useEffect(() => {
    for (const { id } of configs) {
      localStorage.setItem(id, String(state.players[id]?.lifePoints ?? 0))
    }
    localStorage.setItem('duel-history', JSON.stringify(state.history))
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        initialLifePoints: state.initialLifePoints,
        profiles: state.profiles,
        result: state.result,
      }),
    )
  }, [
    configs,
    lifePointsStorage,
    state.history,
    state.initialLifePoints,
    state.profiles,
    state.result,
  ])

  const players = useMemo(() => {
    const result: Record<string, LifeContextType> = {}

    for (const { id } of configs) {
      const player = state.players[id]
      const profile = state.profiles[id]
      if (!player || !profile) continue

      result[id] = {
        ...player,
        ...profile,
        hit: (amount) => {
          animateVisual(id, player.lifePoints, Math.max(0, player.lifePoints - amount))
          dispatch({ type: 'HIT', playerId: id, amount })
        },
        heal: (amount) => {
          animateVisual(id, player.lifePoints, player.lifePoints + amount)
          dispatch({ type: 'HEAL', playerId: id, amount })
        },
        adjust: (amount) => {
          animateVisual(id, player.lifePoints, Math.max(0, player.lifePoints + amount))
          dispatch({
            type: 'ADJUST_LP',
            playerId: id,
            amount,
          })
        },
        reset: () => {
          if (state.result) {
            for (const [playerId, currentPlayer] of Object.entries(state.players)) {
              animateVisual(
                playerId,
                currentPlayer.lifePoints,
                state.initialLifePoints,
              )
            }
            dispatch({ type: 'RESET_ALL' })
            return
          }
          if (player.lifePoints === state.initialLifePoints) return
          animateVisual(id, player.lifePoints, state.initialLifePoints)
          dispatch({ type: 'RESET', playerId: id })
        },
      }
    }

    return result
  }, [configs, state.players, state.profiles, state.initialLifePoints])

  const canUndo = state.history.length > 0
  const settings = useMemo<GameSettings>(
    () => ({
      initialLifePoints: state.initialLifePoints,
      profiles: state.profiles,
    }),
    [state.initialLifePoints, state.profiles],
  )
  const value = useMemo<MultiLifeContextType>(
    () => ({
      players,
      settings,
      saveSettings: (nextSettings) => {
        if (nextSettings.initialLifePoints !== state.initialLifePoints) {
          for (const [id, player] of Object.entries(state.players)) {
            animateVisual(id, player.lifePoints, nextSettings.initialLifePoints)
          }
        }
        dispatch({ type: 'SET_SETTINGS', settings: nextSettings })
      },
      resetAll: () => {
        if (
          !state.result &&
          Object.values(state.players).every(
            (player) => player.lifePoints === state.initialLifePoints,
          )
        ) {
          return
        }
        for (const [id, player] of Object.entries(state.players)) {
          animateVisual(id, player.lifePoints, state.initialLifePoints)
        }
        dispatch({ type: 'RESET_ALL' })
      },
      canUndo,
      undo: () => {
        const previous = state.history[state.history.length - 1]
        if (!previous) return

        cancelAll()
        dispatch({ type: 'UNDO' })
        for (const [id, player] of Object.entries(state.players)) {
          if (previous.players[id]?.lifePoints !== player.lifePoints) {
            animateVisual(
              id,
              player.lifePoints,
              previous.players[id]?.lifePoints ?? player.lifePoints,
            )
          }
        }
      },
    }),
    [
      players,
      settings,
      canUndo,
      state.players,
      state.result,
      state.initialLifePoints,
      state.history,
      animateVisual,
      cancelAll,
    ],
  )

  return <LifeContext.Provider value={value}>{children}</LifeContext.Provider>
}
