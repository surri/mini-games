import { useState, useEffect, useRef, useCallback } from 'react'
import { LADDER_CONFIG } from '../lib/ladderConfig'

interface PlayerAnimState {
  progress: number
  startTime: number | null
  done: boolean
}

export function useLadderAnimation(
  startedPlayers: readonly string[],
  onPlayerFinished?: (playerId: string) => void
) {
  const [animStates, setAnimStates] = useState<Record<string, PlayerAnimState>>({})
  const animFrameRef = useRef<number | null>(null)
  const onFinishedRef = useRef(onPlayerFinished)
  onFinishedRef.current = onPlayerFinished

  const notifiedRef = useRef<Set<string>>(new Set())
  const allDoneRef = useRef(false)
  const prevCountRef = useRef(0)

  const animate = useCallback((now: number) => {
    if (allDoneRef.current) return

    setAnimStates((prev) => {
      let changed = false
      let activeCount = 0
      const next = { ...prev }

      for (const [pid, state] of Object.entries(next)) {
        if (state.done) continue
        activeCount++

        const startTime = state.startTime ?? now
        if (state.startTime === null) {
          next[pid] = { ...state, startTime }
          changed = true
        }

        const elapsed = now - startTime
        const progress = Math.min(1, elapsed / LADDER_CONFIG.ANIMATION.PATH_DURATION_MS)

        if (progress !== state.progress) {
          next[pid] = { ...next[pid], progress, startTime }
          changed = true
        }

        if (progress >= 1 && !state.done) {
          next[pid] = { ...next[pid], done: true, progress: 1 }
          changed = true
          activeCount--
          if (!notifiedRef.current.has(pid)) {
            notifiedRef.current.add(pid)
            setTimeout(() => onFinishedRef.current?.(pid), 0)
          }
        }
      }

      if (activeCount === 0 && Object.keys(next).length > 0) {
        allDoneRef.current = true
      }

      return changed ? next : prev
    })

    animFrameRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const count = startedPlayers.length

    for (const pid of startedPlayers) {
      setAnimStates((prev) => {
        if (prev[pid]) return prev
        return { ...prev, [pid]: { progress: 0, startTime: null, done: false } }
      })
    }

    if (count > prevCountRef.current) {
      prevCountRef.current = count
      allDoneRef.current = false
      animFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [startedPlayers.length, animate])

  const getProgress = useCallback((playerId: string): number => {
    return animStates[playerId]?.progress ?? 0
  }, [animStates])

  return { getProgress }
}
