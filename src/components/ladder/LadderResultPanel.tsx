import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { PlayerAvatar } from '../PlayerAvatar'
import { playFinish, playLoserReveal } from '../../lib/sound'
import type { Player } from '../../types'

interface Props {
  players: Record<string, Player>
  loserId: string
  onPlayAgain?: () => void
}

export function LadderResultPanel({ players, loserId, onPlayAgain }: Props) {
  const soundPlayedRef = useRef(false)
  const loser = players[loserId]

  useEffect(() => {
    if (soundPlayedRef.current) return
    soundPlayedRef.current = true

    playLoserReveal()
    setTimeout(() => playFinish(), 600)

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [])

  if (!loser) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        textAlign: 'center',
        marginTop: 32,
        padding: 24,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <p style={{ fontSize: 20, marginBottom: 16 }}>☕ 커피 당첨!</p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <PlayerAvatar
          character={loser.character}
          name={loser.name}
          size={64}
          highlight="loser"
        />
      </div>

      <motion.p
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
        style={{ fontSize: 24, fontWeight: 700 }}
      >
        {loser.name}님, 커피 사세요! ☕
      </motion.p>

      {onPlayAgain && (
        <motion.button
          whileTap={{ scale: 0.95 }}
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
        </motion.button>
      )}
    </motion.div>
  )
}
