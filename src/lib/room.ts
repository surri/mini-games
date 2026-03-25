import { ref, set, onValue, off, remove, get } from 'firebase/database'
import { db } from './firebase'
import type { Room, RaceRoom, LadderRoom, Player, RoomStatus, RaceState, RacePhase, Obstacle, PlayerEffects, LadderState } from '../types'

const ROOM_TTL_MS = 60 * 60 * 1000

function generatePlayerId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export function getStoredPlayerId(): string {
  const stored = sessionStorage.getItem('playerId')
  if (stored) return stored
  const id = generatePlayerId()
  sessionStorage.setItem('playerId', id)
  return id
}

function createInitialRaceState(): RaceState {
  return {
    positions: {},
    winnerId: null,
    loserId: null,
    finishedAt: null,
    phase: null,
    obstacles: null,
    effects: null,
  }
}

function createInitialLadderState(): LadderState {
  return {
    bridges: {},
    playerAssignments: {},
    results: {},
    paths: null,
    animationStatus: 'idle',
    loserId: null,
    startedPlayers: [],
    finishedPlayers: [],
  }
}

export async function createRoom(gameType: 'race' | 'ladder' = 'race'): Promise<string> {
  const roomId = generateRoomId()
  const playerId = getStoredPlayerId()

  const base = {
    hostId: playerId,
    status: 'waiting' as const,
    createdAt: Date.now(),
    players: {},
  }

  const room: Room = gameType === 'race'
    ? { ...base, gameType: 'race', race: createInitialRaceState() } as RaceRoom
    : { ...base, gameType: 'ladder', ladder: createInitialLadderState() } as LadderRoom

  await set(ref(db, `rooms/${roomId}`), room)
  return roomId
}

export async function joinRoom(
  roomId: string,
  name: string,
  character: string
): Promise<void> {
  const playerId = getStoredPlayerId()
  const player: Player = {
    name,
    character,
    joinedAt: Date.now(),
  }
  await set(ref(db, `rooms/${roomId}/players/${playerId}`), player)
}

export async function getRoomOnce(roomId: string): Promise<Room | null> {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  if (!snapshot.exists()) return null
  const room = snapshot.val() as Room
  if (Date.now() - room.createdAt > ROOM_TTL_MS) return null
  return room
}

export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void
): () => void {
  const roomRef = ref(db, `rooms/${roomId}`)
  const handler = onValue(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }
    callback(snapshot.val() as Room)
  })
  return () => off(roomRef, 'value', handler)
}

export async function updateRoomStatus(
  roomId: string,
  status: RoomStatus
): Promise<void> {
  await set(ref(db, `rooms/${roomId}/status`), status)
}

// --- Race-specific functions ---

export async function updateRaceState(
  roomId: string,
  race: Partial<RaceState>
): Promise<void> {
  const raceRef = ref(db, `rooms/${roomId}/race`)
  const snapshot = await get(raceRef)
  const current = snapshot.exists() ? snapshot.val() : {}
  await set(raceRef, { ...current, ...race })
}

export async function updatePositions(
  roomId: string,
  positions: Record<string, number>
): Promise<void> {
  await set(ref(db, `rooms/${roomId}/race/positions`), positions)
}

export async function updateRacePhase(
  roomId: string,
  phase: RacePhase
): Promise<void> {
  await set(ref(db, `rooms/${roomId}/race/phase`), phase)
}

export async function updateObstacles(
  roomId: string,
  obstacles: Record<string, Obstacle>
): Promise<void> {
  await set(ref(db, `rooms/${roomId}/race/obstacles`), obstacles)
}

export async function updatePlayerEffects(
  roomId: string,
  effects: Record<string, PlayerEffects>
): Promise<void> {
  await set(ref(db, `rooms/${roomId}/race/effects`), effects)
}

export async function resetRace(roomId: string): Promise<void> {
  await set(ref(db, `rooms/${roomId}/status`), 'waiting')
  await set(ref(db, `rooms/${roomId}/race`), createInitialRaceState())
}

// --- Ladder-specific functions ---

export async function updateLadderState(
  roomId: string,
  ladder: Partial<LadderState>
): Promise<void> {
  const ladderRef = ref(db, `rooms/${roomId}/ladder`)
  const snapshot = await get(ladderRef)
  const current = snapshot.exists() ? snapshot.val() : {}
  await set(ladderRef, { ...current, ...ladder })
}

export async function resetLadder(roomId: string): Promise<void> {
  await set(ref(db, `rooms/${roomId}/status`), 'waiting')
  await set(ref(db, `rooms/${roomId}/ladder`), createInitialLadderState())
}

export async function removeRoom(roomId: string): Promise<void> {
  await remove(ref(db, `rooms/${roomId}`))
}
