import { motion } from 'framer-motion'
import type { Player } from '../../types'

interface Props {
  player: Player
  position: number
  isWinner: boolean
  isLoser: boolean
}

export function RaceLane({ player, position, isWinner, isLoser }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: isWinner
          ? 'rgba(255, 215, 0, 0.15)'
          : isLoser
            ? 'rgba(255, 68, 68, 0.1)'
            : 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        border: isWinner
          ? '2px solid #FFD700'
          : isLoser
            ? '2px solid #FF4444'
            : '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, width: 50, textAlign: 'right', flexShrink: 0 }}>
        {player.name}
      </span>
      <div
        style={{
          flex: 1,
          position: 'relative',
          height: 40,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 2,
            background: '#FFD700',
          }}
        />
        <motion.div
          animate={{ left: `${position}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 28,
          }}
        >
          {player.character}
        </motion.div>
      </div>
    </div>
  )
}
