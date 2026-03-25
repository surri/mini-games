import { useCallback, useRef } from 'react'
import { updateRoomStatus, updateLadderState } from '../lib/room'
import {
  generateBridges,
  assignPlayersToLines,
  generateResults,
  resolveAllPaths,
  generateAnimationOrder,
  findLoserFromPaths,
} from '../lib/ladderEngine'
import { LADDER_CONFIG } from '../lib/ladderConfig'
import type { Room } from '../types'

export function useLadder(roomId: string, room: Room | null) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const startingRef = useRef(false)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const startLadder = useCallback(async () => {
    if (!room || room.gameType !== 'ladder') return
    if (startingRef.current) return
    startingRef.current = true

    const playerIds = Object.keys(room.players ?? {})
    if (playerIds.length < LADDER_CONFIG.MIN_PLAYERS) {
      startingRef.current = false
      return
    }

    clearTimers()

    const lineCount = playerIds.length
    const bridges = generateBridges(lineCount)
    const playerAssignments = assignPlayersToLines(playerIds)
    const results = generateResults(lineCount)
    const paths = resolveAllPaths(playerAssignments, bridges, lineCount)
    const animationOrder = generateAnimationOrder(playerIds)
    const loserId = findLoserFromPaths(paths, results)

    const bridgeMap: Record<string, (typeof bridges)[number]> = {}
    bridges.forEach((b) => {
      bridgeMap[b.id] = b
    })

    await updateLadderState(roomId, {
      bridges: bridgeMap,
      playerAssignments,
      results,
      paths,
      animationOrder,
      loserId,
      animationStatus: 'idle',
      currentAnimatingPlayer: null,
      revealedPlayers: [],
    })

    await updateRoomStatus(roomId, 'countdown')

    const countdownTimer = setTimeout(async () => {
      await updateRoomStatus(roomId, 'playing')
      await updateLadderState(roomId, { animationStatus: 'animating' })

      let delay = 0

      animationOrder.forEach((playerId, index) => {
        const timer = setTimeout(async () => {
          await updateLadderState(roomId, {
            currentAnimatingPlayer: playerId,
          })
        }, delay)
        timersRef.current.push(timer)

        delay += LADDER_CONFIG.ANIMATION.PATH_DURATION_MS

        const revealTimer = setTimeout(async () => {
          const revealed = animationOrder.slice(0, index + 1)
          await updateLadderState(roomId, {
            revealedPlayers: revealed,
          })
        }, delay)
        timersRef.current.push(revealTimer)

        if (index < animationOrder.length - 1) {
          delay += LADDER_CONFIG.ANIMATION.PAUSE_BETWEEN_MS
        }
      })

      const finishTimer = setTimeout(async () => {
        await updateLadderState(roomId, {
          animationStatus: 'revealed',
          currentAnimatingPlayer: null,
        })
        await updateRoomStatus(roomId, 'finished')
      }, delay + 500)
      timersRef.current.push(finishTimer)
    }, LADDER_CONFIG.ANIMATION.COUNTDOWN_DURATION_MS)

    timersRef.current.push(countdownTimer)
  }, [room, roomId, clearTimers])

  const resetGame = useCallback(async () => {
    clearTimers()
    await updateRoomStatus(roomId, 'waiting')
    await updateLadderState(roomId, {
      bridges: {},
      playerAssignments: {},
      results: {},
      paths: null,
      animationStatus: 'idle',
      currentAnimatingPlayer: null,
      animationOrder: [],
      loserId: null,
      revealedPlayers: [],
    })
  }, [roomId, clearTimers])

  return { startLadder, resetGame }
}
