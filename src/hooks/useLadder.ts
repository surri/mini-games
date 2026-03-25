import { useCallback, useRef } from 'react'
import { updateRoomStatus, updateLadderState, appendToLadderArray, toStringArray } from '../lib/room'
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
    if (!Number.isInteger(loserCount) || loserCount < 1) return
    startingRef.current = true

    try {
      const playerIds = Object.keys(room.players ?? {})
      if (playerIds.length < LADDER_CONFIG.MIN_PLAYERS) {
        startingRef.current = false
        return
      }

      const lineCount = playerIds.length
      const clampedCount = Math.min(loserCount, lineCount - 1)
      const bridges = generateBridges(lineCount)
      const playerAssignments = assignPlayersToLines(playerIds)
      const results = generateResults(lineCount, clampedCount)
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
    } catch (error) {
      startingRef.current = false
      throw error
    }
  }, [room, roomId])

  const triggerPlayer = useCallback(async (playerId: string) => {
    if (!room || room.gameType !== 'ladder') return
    try {
      await appendToLadderArray(roomId, 'startedPlayers', playerId)
    } catch {
      // 네트워크 오류 시 무시 - 재터치로 재시도 가능
    }
  }, [room, roomId])

  const markFinished = useCallback(async (playerId: string) => {
    if (!room || room.gameType !== 'ladder') return
    try {
      const { newArray } = await appendToLadderArray(roomId, 'finishedPlayers', playerId)
      const playerCount = Object.keys(room.players ?? {}).length
      const loserIds = toStringArray(room.ladder.loserIds)

      const allDone = newArray.length >= playerCount
      const allLosersRevealed = loserIds.length > 0 &&
        loserIds.every((lid) => newArray.includes(lid))

      if (allDone || allLosersRevealed) {
        await updateLadderState(roomId, { animationStatus: 'revealed' })
        await updateRoomStatus(roomId, 'finished')
      }
    } catch {
      // 네트워크 오류 시 무시 - 다른 플레이어의 finish로 allDone 재검사됨
    }
  }, [room, roomId])

  const resetGame = useCallback(async () => {
    startingRef.current = false
    try {
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
    } catch {
      // 리셋 실패 시 재시도 가능
    }
  }, [roomId])

  return { startLadder, triggerPlayer, markFinished, resetGame }
}
