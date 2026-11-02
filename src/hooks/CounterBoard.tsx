import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type CounterToken = { id: string; symbol: string; color: string; glow: string }
type Board = {
  tokens: Record<string, CounterToken[]>
  counts: Record<string, Record<string, number>>
}
type CounterBoardContextValue = {
  tokens: (playerId: string) => CounterToken[]
  count: (playerId: string, tokenId: string) => number
  addToken: (playerId: string, token: CounterToken) => void
  removeToken: (playerId: string, tokenId: string) => void
  changeCount: (playerId: string, tokenId: string, amount: number) => void
}

const STORAGE_KEY = 'yugioh-counter-board-v1'
const EMPTY_BOARD: Board = { tokens: {}, counts: {} }
const CounterBoardContext = createContext<CounterBoardContextValue | null>(null)

function loadBoard(): Board {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return EMPTY_BOARD
    const value = JSON.parse(saved) as {
      tokens?: CounterToken[] | Record<string, CounterToken[]>
      counts?: Record<string, Record<string, number>>
    }
    if (!value.tokens || !value.counts) return EMPTY_BOARD

    if (Array.isArray(value.tokens)) {
      const legacyTokens = value.tokens
      const counts = value.counts
      const tokens: Record<string, CounterToken[]> = {}
      Object.entries(counts).forEach(([playerId, playerCounts]) => {
        tokens[playerId] = legacyTokens.filter(
          (token) => (playerCounts[token.id] ?? 0) > 0,
        )
      })
      return { tokens, counts }
    }

    return { tokens: value.tokens, counts: value.counts }
  } catch {
    return EMPTY_BOARD
  }
}

export function CounterBoardProvider({ children }: { children: ReactNode }) {
  const [board, setBoard] = useState(loadBoard)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
    } catch {
      // Counter use remains available if browser storage is unavailable.
    }
  }, [board])

  const value = useMemo<CounterBoardContextValue>(() => ({
    tokens: (playerId) => board.tokens[playerId] ?? [],
    count: (playerId, tokenId) => board.counts[playerId]?.[tokenId] ?? 0,
    addToken: (playerId, token) => setBoard((current) => ({
      ...current,
      tokens: {
        ...current.tokens,
        [playerId]: (current.tokens[playerId] ?? []).some(({ id }) => id === token.id)
          ? current.tokens[playerId]
          : [...(current.tokens[playerId] ?? []), token],
      },
    })),
    removeToken: (playerId, tokenId) => setBoard((current) => {
      const playerCounts = { ...current.counts[playerId] }
      delete playerCounts[tokenId]
      return {
        ...current,
        tokens: {
          ...current.tokens,
          [playerId]: (current.tokens[playerId] ?? []).filter(({ id }) => id !== tokenId),
        },
        counts: { ...current.counts, [playerId]: playerCounts },
      }
    }),
    changeCount: (playerId, tokenId, amount) => setBoard((current) => ({
      ...current,
      counts: {
        ...current.counts,
        [playerId]: {
          ...current.counts[playerId],
          [tokenId]: Math.max(0, (current.counts[playerId]?.[tokenId] ?? 0) + amount),
        },
      },
    })),
  }), [board])

  return <CounterBoardContext.Provider value={value}>{children}</CounterBoardContext.Provider>
}

export function useCounterBoard() {
  const context = useContext(CounterBoardContext)
  if (!context) throw new Error('CounterRack must be inside CounterBoardProvider')
  return context
}
