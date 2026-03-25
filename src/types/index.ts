export type RoomStatus = 'waiting' | 'countdown' | 'racing' | 'playing' | 'finished'
export type RacePhase = 'opening' | 'midrace' | 'finalStretch'

export interface Player {
  name: string
  character: string
  joinedAt: number
}

// --- Race Types ---

export interface Obstacle {
  id: string
  type: string
  lane: string
  position: number
  triggered: boolean
  createdAtTick: number
}

export interface PlayerEffects {
  stunned: boolean
  slowed: boolean
  boosted: boolean
  flashColor: string | null
}

export interface PlayerPhysics {
  momentum: number
  momentumDirection: 1 | -1
  stunTicksRemaining: number
  slowTicksRemaining: number
  slowMultiplier: number
  boostTicksRemaining: number
  boostMultiplier: number
}

export interface RaceState {
  positions: Record<string, number>
  winnerId: string | null
  loserId: string | null
  finishedAt: number | null
  phase: RacePhase | null
  obstacles: Record<string, Obstacle> | null
  effects: Record<string, PlayerEffects> | null
}

// --- Ladder Types ---

export type LadderAnimationStatus = 'idle' | 'animating' | 'revealed'

export interface Bridge {
  id: string
  fromLine: number
  toLine: number
  yPosition: number
}

export interface LadderPathSegment {
  type: 'vertical' | 'horizontal'
  fromX: number
  fromY: number
  toX: number
  toY: number
}

export interface LadderPath {
  playerId: string
  startLine: number
  endLine: number
  segments: LadderPathSegment[]
}

export interface LadderResult {
  lineIndex: number
  label: string
  isLoser: boolean
}

export interface LadderState {
  bridges: Record<string, Bridge>
  playerAssignments: Record<string, number>
  results: Record<string, LadderResult>
  paths: Record<string, LadderPath> | null
  animationStatus: LadderAnimationStatus
  loserIds: string[]
  startedPlayers: string[]
  finishedPlayers: string[]
}

// --- Room Types (Discriminated Union) ---

interface RoomBase {
  hostId: string
  status: RoomStatus
  createdAt: number
  players: Record<string, Player>
}

export interface RaceRoom extends RoomBase {
  gameType: 'race'
  race: RaceState
}

export interface LadderRoom extends RoomBase {
  gameType: 'ladder'
  ladder: LadderState
}

export type Room = RaceRoom | LadderRoom
