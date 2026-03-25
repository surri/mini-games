import { useRef, useCallback } from 'react'
import {
  updatePositions,
  updateRoomStatus,
  updateRaceState,
  updateRacePhase,
  updateObstacles,
  updatePlayerEffects,
} from '../lib/room'
import { RACE_CONFIG, OBSTACLE_SPAWN, OBSTACLE_TYPES } from '../lib/raceConfig'
import {
  getPhase,
  createPlayerPhysics,
  updateMomentum,
  calculateSpeed,
  tickPlayerPhysics,
  shouldSpawnObstacle,
  generateObstacle,
  checkObstacleCollision,
  applyObstacleEffect,
  getLeaderId,
} from '../lib/raceEngine'
import type { RaceRoom, Obstacle, PlayerPhysics, PlayerEffects, RacePhase } from '../types'

export function useRace(roomId: string, room: RaceRoom | null) {
  const animationRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const positionsRef = useRef<Record<string, number>>({})
  const baseSpedsRef = useRef<Record<string, number>>({})
  const physicsRef = useRef<Record<string, PlayerPhysics>>({})
  const flashColorsRef = useRef<Record<string, string | null>>({})
  const obstaclesRef = useRef<Obstacle[]>([])
  const tickRef = useRef(0)
  const prevPhaseRef = useRef<RacePhase>('opening')
  const pendingSyncRef = useRef({
    obstacles: false,
    effects: false,
    phase: false,
  })

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
    baseSpedsRef.current = Object.fromEntries(
      playerIds.map((id) => [id, RACE_CONFIG.SPEED.midrace.base + Math.random() * 0.05])
    )
    physicsRef.current = Object.fromEntries(
      playerIds.map((id) => [id, createPlayerPhysics()])
    )
    flashColorsRef.current = Object.fromEntries(playerIds.map((id) => [id, null]))
    obstaclesRef.current = []
    tickRef.current = 0
    prevPhaseRef.current = 'opening'

    await updatePositions(roomId, positionsRef.current)
    await updateRoomStatus(roomId, 'countdown')

    setTimeout(async () => {
      await updateRoomStatus(roomId, 'racing')
      lastUpdateRef.current = performance.now()

      const tick = async (now: number) => {
        tickRef.current++
        const currentTick = tickRef.current
        const positions = { ...positionsRef.current }
        const physics = { ...physicsRef.current }
        const flashColors = { ...flashColorsRef.current }

        const leaderPosition = Math.max(...Object.values(positions), 0)
        const leaderId = Object.keys(positions).length > 0 ? getLeaderId(positions) : playerIds[0]
        const phase = getPhase(leaderPosition)

        if (phase !== prevPhaseRef.current) {
          prevPhaseRef.current = phase
          pendingSyncRef.current.phase = true
        }

        let finished = false
        let winnerId: string | null = null

        for (const id of playerIds) {
          if (positions[id] >= RACE_CONFIG.FINISH_LINE) continue

          physics[id] = updateMomentum(physics[id])

          const speed = calculateSpeed({
            phase,
            baseSpeed: baseSpedsRef.current[id],
            physics: physics[id],
            playerPosition: positions[id],
            leaderPosition,
          })

          positions[id] = Math.min(RACE_CONFIG.FINISH_LINE, positions[id] + speed)
          physics[id] = tickPlayerPhysics(physics[id])

          // Clear flash when all effects end
          if (flashColors[id] && physics[id].stunTicksRemaining <= 0 && physics[id].slowTicksRemaining <= 0 && physics[id].boostTicksRemaining <= 0) {
            flashColors[id] = null
            pendingSyncRef.current.effects = true
          }

          if (positions[id] >= RACE_CONFIG.FINISH_LINE && !finished) {
            finished = true
            winnerId = id
          }
        }

        // Obstacle spawn
        if (shouldSpawnObstacle(phase, obstaclesRef.current.filter((o) => !o.triggered).length, currentTick)) {
          const obstacle = generateObstacle(leaderPosition, playerIds, leaderId, currentTick)
          obstaclesRef.current = [...obstaclesRef.current, obstacle]
          pendingSyncRef.current.obstacles = true
        }

        // Obstacle collisions
        let obstaclesChanged = false
        for (const id of playerIds) {
          for (const obstacle of obstaclesRef.current) {
            if (obstacle.lane !== id) continue
            if (checkObstacleCollision(positions[id], obstacle)) {
              physics[id] = applyObstacleEffect(physics[id], obstacle.type)
              const config = OBSTACLE_TYPES[obstacle.type]
              if (config) flashColors[id] = config.flashColor
              obstacle.triggered = true
              obstaclesChanged = true
              pendingSyncRef.current.effects = true
            }
          }
        }
        if (obstaclesChanged) pendingSyncRef.current.obstacles = true

        // Expire old obstacles
        const beforeLen = obstaclesRef.current.length
        obstaclesRef.current = obstaclesRef.current.filter(
          (o) => !o.triggered && currentTick - o.createdAtTick < OBSTACLE_SPAWN.lifetimeTicks
        )
        if (obstaclesRef.current.length !== beforeLen) pendingSyncRef.current.obstacles = true

        positionsRef.current = positions
        physicsRef.current = physics
        flashColorsRef.current = flashColors

        // Sync to Firebase (throttled)
        if (now - lastUpdateRef.current >= RACE_CONFIG.UPDATE_INTERVAL_MS) {
          lastUpdateRef.current = now
          const syncPromises: Promise<void>[] = [updatePositions(roomId, positions)]

          if (pendingSyncRef.current.phase) {
            syncPromises.push(updateRacePhase(roomId, phase))
            pendingSyncRef.current.phase = false
          }
          if (pendingSyncRef.current.obstacles) {
            const obstacleMap = Object.fromEntries(
              obstaclesRef.current.map((o) => [o.id, o])
            )
            syncPromises.push(updateObstacles(roomId, obstacleMap))
            pendingSyncRef.current.obstacles = false
          }
          if (pendingSyncRef.current.effects) {
            const effectsMap: Record<string, PlayerEffects> = {}
            for (const id of playerIds) {
              effectsMap[id] = {
                stunned: physics[id].stunTicksRemaining > 0,
                slowed: physics[id].slowTicksRemaining > 0,
                boosted: physics[id].boostTicksRemaining > 0,
                flashColor: flashColors[id],
              }
            }
            syncPromises.push(updatePlayerEffects(roomId, effectsMap))
            pendingSyncRef.current.effects = false
          }

          await Promise.all(syncPromises)
        }

        if (finished && winnerId) {
          const loserId = playerIds.reduce((worst, id) =>
            positions[id] < positions[worst] ? id : worst
          )

          await Promise.all([
            updatePositions(roomId, positions),
            updateRaceState(roomId, { winnerId, loserId, finishedAt: Date.now() }),
            updateRoomStatus(roomId, 'finished'),
          ])
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
