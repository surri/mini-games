import { useState, useEffect, useRef } from 'react'
import { LADDER_CONFIG } from '../lib/ladderConfig'

export function useLadderAnimation(
  currentAnimatingPlayer: string | null,
  revealedPlayers: readonly string[]
) {
  const [animationProgress, setAnimationProgress] = useState<Record<string, number>>({})
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!currentAnimatingPlayer) return
    if (revealedPlayers.includes(currentAnimatingPlayer)) return

    startTimeRef.current = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current
      const progress = Math.min(1, elapsed / LADDER_CONFIG.ANIMATION.PATH_DURATION_MS)

      setAnimationProgress((prev) => ({
        ...prev,
        [currentAnimatingPlayer]: progress,
      }))

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [currentAnimatingPlayer, revealedPlayers])

  useEffect(() => {
    const completed: Record<string, number> = {}
    for (const id of revealedPlayers) {
      completed[id] = 1
    }
    setAnimationProgress((prev) => ({ ...prev, ...completed }))
  }, [revealedPlayers])

  return { animationProgress }
}
