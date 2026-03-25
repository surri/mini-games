import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { playFinish } from '../../lib/sound'
import type { Player } from '../../types'

interface Props {
  players: Record<string, Player>
  winnerId: string
  loserId: string
  onPlayAgain: () => void
}

export function RaceResult({ players, winnerId, loserId, onPlayAgain }: Props) {
  const winner = players[winnerId]
  const loser = players[loserId]

  useEffect(() => {
    playFinish()
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        textAlign: 'center',
        padding: 24,
        marginTop: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        style={{ fontSize: 64 }}
      >
        🏆
      </motion.div>
      <h2 style={{ margin: '8px 0 4px', fontSize: 24 }}>
        {winner?.character} {winner?.name} 우승!
      </h2>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.5 }}
        style={{
          marginTop: 24,
          padding: 16,
          background: 'rgba(255, 68, 68, 0.15)',
          borderRadius: 16,
          border: '2px solid #FF4444',
        }}
      >
        <div style={{ fontSize: 40 }}>☕</div>
        <p style={{ fontSize: 20, fontWeight: 700, margin: '8px 0 0' }}>
          {loser?.character} {loser?.name}
        </p>
        <p style={{ fontSize: 14, color: '#FF8888' }}>커피 사세요!</p>
      </motion.div>

      <button
        onClick={onPlayAgain}
        style={{
          marginTop: 24,
          padding: '12px 32px',
          fontSize: 16,
          fontWeight: 700,
          background: '#4F46E5',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
        }}
      >
        다시하기
      </button>
    </motion.div>
  )
}
