import { RaceLane } from './RaceLane'
import type { Player, Obstacle, PlayerEffects, RacePhase } from '../../types'

interface Props {
  players: Record<string, Player>
  positions: Record<string, number>
  winnerId: string | null
  loserId: string | null
  finished: boolean
  obstacles: Record<string, Obstacle> | null
  effects: Record<string, PlayerEffects> | null
  phase: RacePhase | null
}

function getRanks(positions: Record<string, number>): Record<string, number> {
  const sorted = Object.entries(positions).sort((a, b) => b[1] - a[1])
  return Object.fromEntries(sorted.map(([id], i) => [id, i]))
}

export function RaceTrack({
  players,
  positions,
  winnerId,
  loserId,
  finished,
  obstacles,
  effects,
  phase,
}: Props) {
  const playerEntries = Object.entries(players)
  const obstacleList = obstacles ? Object.values(obstacles) : []
  const ranks = finished ? getRanks(positions) : null

  return (
    <div>
      {phase === 'finalStretch' && !finished && (
        <div
          style={{
            textAlign: 'center',
            padding: '6px 0',
            fontSize: 14,
            fontWeight: 700,
            color: '#FFD700',
            animation: 'pulse 1s infinite',
          }}
        >
          🏁 최종 스퍼트!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0' }}>
        {playerEntries.map(([id, player]) => (
          <RaceLane
            key={id}
            player={player}
            position={positions[id] ?? 0}
            isWinner={winnerId === id}
            isLoser={loserId === id}
            rank={ranks ? ranks[id] ?? null : null}
            obstacles={obstacleList.filter((o) => o.lane === id && !o.triggered)}
            effects={effects?.[id] ?? null}
          />
        ))}
      </div>
    </div>
  )
}
