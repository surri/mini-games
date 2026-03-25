import { RaceLane } from './RaceLane'
import type { Player } from '../../types'

interface Props {
  players: Record<string, Player>
  positions: Record<string, number>
  winnerId: string | null
  loserId: string | null
}

export function RaceTrack({ players, positions, winnerId, loserId }: Props) {
  const playerEntries = Object.entries(players)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0' }}>
      {playerEntries.map(([id, player]) => (
        <RaceLane
          key={id}
          player={player}
          position={positions[id] ?? 0}
          isWinner={winnerId === id}
          isLoser={loserId === id}
        />
      ))}
    </div>
  )
}
