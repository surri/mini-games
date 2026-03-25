import { useCallback, useRef } from 'react'
import { updateRoomStatus, updateLadderState } from '../lib/room'
import {
  generateBridges,
  assignPlayersToLines,
  generateResults,
  resolveAllPaths,
  findLosersFromPaths,
} from '../lib/ladderEngine'
import { LADDER_CONFIG } from '../lib/ladderConfig'
import type { Room } from '../types'

export function useLadder(roomId: string, room: Room | null) {
  const startingRef = useRef(false)

  const startLadder = useCallback(async (loserCount: number = 1) => {
    if (!room || room.gameType !== 'ladder') return
    if (startingRef.current) return
    startingRef.current = true

    const playerIds = Object.keys(room.players ?? {})
    if (playerIds.length < LADDER_CONFIG.MIN_PLAYERS) {
      startingRef.current = false
      return
    }

    const lineCount = playerIds.length
    const bridges = generateBridges(lineCount)
    const playerAssignments = assignPlayersToLines(playerIds)
    const results = generateResults(lineCount, loserCount)
    const paths = resolveAllPaths(playerAssignments, bridges, lineCount)
    const loserIds = findLosersFromPaths(paths, results)

    const bridgeMap: Record<string, (typeof bridges)[number]> = {}
    bridges.forEach((b) => {
      bridgeMap[b.id] = b
    })

    await updateLadderState(roomId, {
      bridges: bridgeMap,
      playerAssignments,
      results,
      paths,
      loserIds,
      animationStatus: 'animating',
      startedPlayers: [],
      finishedPlayers: [],
    })

    await updateRoomStatus(roomId, 'playing')
  }, [room, roomId])

  const triggerPlayer = useCallback(async (playerId: string) => {
    if (!room || room.gameType !== 'ladder') return
    const ladder = room.ladder
    const started = ladder.startedPlayers ?? []
    if (started.includes(playerId)) return

    await updateLadderState(roomId, {
      startedPlayers: [...started, playerId],
    })
  }, [room, roomId])

  const markFinished = useCallback(async (playerId: string) => {
    if (!room || room.gameType !== 'ladder') return
    const ladder = room.ladder
    const finished = ladder.finishedPlayers ?? []
    if (finished.includes(playerId)) return

    const newFinished = [...finished, playerId]
    const playerCount = Object.keys(room.players ?? {}).length
    const allDone = newFinished.length >= playerCount

    if (allDone) {
      await updateLadderState(roomId, {
        finishedPlayers: newFinished,
        animationStatus: 'revealed',
      })
      await updateRoomStatus(roomId, 'finished')
    } else {
      await updateLadderState(roomId, {
        finishedPlayers: newFinished,
      })
    }
  }, [room, roomId])

  const resetGame = useCallback(async () => {
    startingRef.current = false
    await updateRoomStatus(roomId, 'waiting')
    await updateLadderState(roomId, {
      bridges: {},
      playerAssignments: {},
      results: {},
      paths: null,
      animationStatus: 'idle',
      loserIds: [],
      startedPlayers: [],
      finishedPlayers: [],
    })
  }, [roomId])

  return { startLadder, triggerPlayer, markFinished, resetGame }
}
