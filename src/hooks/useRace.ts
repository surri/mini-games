import { useRef, useCallback } from 'react'
import { updatePositions, updateRoomStatus, updateRaceState } from '../lib/room'
import type { Room } from '../types'

const FINISH_LINE = 100
const BASE_SPEED = 0.15
const RANDOM_FACTOR = 0.25
const BURST_CHANCE = 0.02
const BURST_BONUS = 0.8
const UPDATE_INTERVAL_MS = 100

export function useRace(roomId: string, room: Room | null) {
  const animationRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const positionsRef = useRef<Record<string, number>>({})
  const speedsRef = useRef<Record<string, number>>({})

  const stopRace = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const startRace = useCallback(async () => {
    if (!room) return

    const playerIds = Object.keys(room.players ?? {})
    if (playerIds.length < 2) return

    positionsRef.current = Object.fromEntries(playerIds.map((id) => [id, 0]))
    speedsRef.current = Object.fromEntries(
      playerIds.map((id) => [id, BASE_SPEED + Math.random() * 0.05])
    )

    await updatePositions(roomId, positionsRef.current)
    await updateRoomStatus(roomId, 'countdown')

    setTimeout(async () => {
      await updateRoomStatus(roomId, 'racing')
      lastUpdateRef.current = performance.now()

      const tick = async (now: number) => {
        const positions = { ...positionsRef.current }
        const speeds = speedsRef.current
        let finished = false
        let winnerId: string | null = null
        let maxPos = -1

        for (const id of playerIds) {
          if (positions[id] >= FINISH_LINE) continue

          const burst = Math.random() < BURST_CHANCE ? BURST_BONUS : 0
          const randomSpeed = Math.random() * RANDOM_FACTOR
          positions[id] = Math.min(
            FINISH_LINE,
            positions[id] + speeds[id] + randomSpeed + burst
          )

          if (positions[id] >= FINISH_LINE && !finished) {
            finished = true
            winnerId = id
          }
          if (positions[id] > maxPos) {
            maxPos = positions[id]
          }
        }

        positionsRef.current = positions

        if (now - lastUpdateRef.current >= UPDATE_INTERVAL_MS) {
          lastUpdateRef.current = now
          await updatePositions(roomId, positions)
        }

        if (finished && winnerId) {
          const loserId = playerIds.reduce((worst, id) =>
            positions[id] < positions[worst] ? id : worst
          )

          await updatePositions(roomId, positions)
          await updateRaceState(roomId, {
            winnerId,
            loserId,
            finishedAt: Date.now(),
          })
          await updateRoomStatus(roomId, 'finished')
          stopRace()
          return
        }

        animationRef.current = requestAnimationFrame(tick)
      }

      animationRef.current = requestAnimationFrame(tick)
    }, 4000)
  }, [room, roomId, stopRace])

  return { startRace, stopRace }
}
