import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'

const GAMES = [
  { id: 'race', emoji: '🏇', title: '레이스', description: '꼴찌가 커피 삽니다' },
  { id: 'ladder', emoji: '🪜', title: '사다리 타기', description: '누가 커피 당첨?' },
]

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: 28, marginBottom: 8 }}>🎮 Mini Games</h1>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: 32 }}>
        점심 커피내기용 미니게임
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {GAMES.map((game) => (
          <motion.button
            key={game.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/${game.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 20,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              cursor: 'pointer',
              color: 'inherit',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 40 }}>{game.emoji}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{game.title}</div>
              <div style={{ fontSize: 14, color: '#888' }}>{game.description}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
