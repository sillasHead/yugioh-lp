import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { Action } from '../types/life-provider'

const ANIMATION_DURATION = 1000
const PROCEDURAL_CHANGE_LIMIT = 100

function getScrambledValue(digits: number) {
  return Array.from({ length: digits }, () => Math.floor(Math.random() * 10)).join('')
}

export function useLifePointAnimation(dispatch: Dispatch<Action>) {
  const animationFrames = useRef(new Map<string, number>())

  const animateVisual = useCallback(
    (playerId: string, from: number, to: number) => {
      const previousFrame = animationFrames.current.get(playerId)
      if (previousFrame !== undefined) cancelAnimationFrame(previousFrame)
      const startedAt = performance.now()
      const isSmallChange = Math.abs(to - from) <= PROCEDURAL_CHANGE_LIMIT
      const digitCount = Math.max(String(from).length, String(to).length)

      function animate(now: number) {
        const progress = Math.min((now - startedAt) / ANIMATION_DURATION, 1)
        if (progress >= 1) {
          animationFrames.current.delete(playerId)
          dispatch({ type: 'APPLY_REAL_VALUE', playerId })
          return
        }

        const value = isSmallChange
          ? Math.round(from + (to - from) * progress)
          : getScrambledValue(digitCount)
        dispatch({ type: 'SET_DISPLAY', playerId, value })
        animationFrames.current.set(playerId, requestAnimationFrame(animate))
      }

      animationFrames.current.set(playerId, requestAnimationFrame(animate))
    },
    [dispatch],
  )

  const cancelAll = useCallback(() => {
    for (const frame of animationFrames.current.values()) {
      cancelAnimationFrame(frame)
    }
    animationFrames.current.clear()
  }, [])

  useEffect(() => cancelAll, [cancelAll])

  return { animateVisual, cancelAll }
}
