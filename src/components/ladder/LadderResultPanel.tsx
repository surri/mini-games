import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { playFinish, playLoserReveal } from '../../lib/sound'
import type { Player } from '../../types'

interface Props {
  players: Record<string, Player>
  loserIds: string[]
  onPlayAgain?: () => void
}

export function LadderResultPanel({ players, loserIds, onPlayAgain }: Props) {
  const soundPlayedRef = useRef(false)

  const losers = loserIds
    .map((id) => ({ id, player: players[id] }))
    .filter((l) => l.player)

  useEffect(() => {
    if (soundPlayedRef.current) return
    soundPlayedRef.current = true

    playLoserReveal()
    setTimeout(() => playFinish(), 600)

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    })
  }, [])

  if (losers.length === 0) return null

  const names = losers.map((l) => l.player.name).join(', ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {losers.map(({ id, player }, index) => (
          <motion.span
            key={id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 * (index + 1) }}
            style={{ fontSize: 28 }}
          >
            {player.character}
          </motion.span>
        ))}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {names}님, 커피 사세요! ☕
        </p>
      </div>

      {onPlayAgain && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onPlayAgain}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 700,
            background: '#4F46E5',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          다시
        </motion.button>
      )}
    </motion.div>
  )
}
