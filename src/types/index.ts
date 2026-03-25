export type RoomStatus = 'waiting' | 'countdown' | 'racing' | 'finished'

export interface Player {
  name: string
  character: string
  joinedAt: number
}

export interface RaceState {
  positions: Record<string, number>
  winnerId: string | null
  loserId: string | null
  finishedAt: number | null
}

export interface Room {
  hostId: string
  status: RoomStatus
  createdAt: number
  gameType: 'race'
  players: Record<string, Player>
  race: RaceState
}

export interface RoomSnapshot {
  roomId: string
  room: Room
}
