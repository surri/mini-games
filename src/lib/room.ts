import { ref, set, onValue, off, remove, get } from 'firebase/database'
import { db } from './firebase'
import type { Room, Player, RoomStatus, RaceState } from '../types'

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

export async function createRoom(): Promise<string> {
  const roomId = generateRoomId()
  const playerId = getStoredPlayerId()

  const room: Room = {
    hostId: playerId,
    status: 'waiting',
    createdAt: Date.now(),
    gameType: 'race',
    players: {},
    race: {
      positions: {},
      winnerId: null,
      loserId: null,
      finishedAt: null,
    },
  }

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

export async function resetRace(roomId: string): Promise<void> {
  await set(ref(db, `rooms/${roomId}/status`), 'waiting')
  await set(ref(db, `rooms/${roomId}/race`), {
    positions: {},
    winnerId: null,
    loserId: null,
    finishedAt: null,
  })
}

export async function removeRoom(roomId: string): Promise<void> {
  await remove(ref(db, `rooms/${roomId}`))
}
