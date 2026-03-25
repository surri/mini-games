import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { motion } from 'framer-motion'
import { joinRoom, getStoredPlayerId, getRoomOnce } from '../../lib/room'
import { useRoom } from '../../hooks/useRoom'
import { CountdownOverlay } from '../../components/CountdownOverlay'
import { RaceTrack } from '../../components/race/RaceTrack'
import { RaceResult } from '../../components/race/RaceResult'

const CHARACTERS = ['🏃', '🐎', '🐢', '🚀', '🐇', '🦊', '🐻', '🐶', '🐱', '🦁', '🐸', '🎃']

export function RaceJoinPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [name, setName] = useState('')
  const [character, setCharacter] = useState(CHARACTERS[1])
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const { room } = useRoom(roomId)

  const playerId = getStoredPlayerId()

  useEffect(() => {
    if (!roomId) return
    getRoomOnce(roomId).then((r) => {
      if (!r) setError('방을 찾을 수 없습니다')
      setChecking(false)
    })
  }, [roomId])

  useEffect(() => {
    if (room?.players?.[playerId]) {
      setJoined(true)
    }
  }, [room, playerId])

  const handleJoin = async () => {
    if (!roomId || !name.trim()) return
    try {
      await joinRoom(roomId, name.trim(), character)
      setJoined(true)
    } catch (err) {
      setError('참가에 실패했습니다')
    }
  }

  if (checking) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>방 확인 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#FF4444', fontSize: 18 }}>{error}</p>
        <p style={{ color: '#888', marginTop: 8 }}>QR 코드를 다시 스캔해주세요</p>
      </div>
    )
  }

  if (!joined) {
    return (
      <div style={{ padding: 24, maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 4 }}>🏇 레이스 참가</h2>
        <p style={{ color: '#888', marginBottom: 20 }}>방 코드: {roomId}</p>

        <input
          type="text"
          placeholder="이름 입력"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={10}
          autoFocus
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.05)',
            color: 'inherit',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 8,
            margin: '16px 0',
          }}
        >
          {CHARACTERS.map((char) => (
            <button
              key={char}
              onClick={() => setCharacter(char)}
              style={{
                fontSize: 28,
                padding: 8,
                borderRadius: 8,
                border: character === char ? '2px solid #4F46E5' : '1px solid rgba(255,255,255,0.1)',
                background: character === char ? 'rgba(79,70,229,0.2)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {char}
            </button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleJoin}
          disabled={!name.trim()}
          style={{
            width: '100%',
            padding: '14px 0',
            fontSize: 18,
            fontWeight: 700,
            background: '#4F46E5',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            opacity: name.trim() ? 1 : 0.4,
          }}
        >
          참가하기
        </motion.button>
      </div>
    )
  }

  const players = room?.players ?? {}
  const isCountdown = room?.status === 'countdown'
  const isRacing = room?.status === 'racing'
  const isFinished = room?.status === 'finished'
  const isWaiting = room?.status === 'waiting'

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <CountdownOverlay active={isCountdown} />

      {isWaiting && (
        <div style={{ textAlign: 'center' }}>
          <h2>대기 중...</h2>
          <p style={{ color: '#888' }}>호스트가 레이스를 시작할 때까지 기다려주세요</p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginTop: 24 }}>
            {Object.entries(players).map(([id, player]) => (
              <motion.div
                key={id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  textAlign: 'center',
                  opacity: id === playerId ? 1 : 0.6,
                }}
              >
                <div style={{ fontSize: 36 }}>{player.character}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>{player.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {(isCountdown || isRacing || isFinished) && (
        <RaceTrack
          players={players}
          positions={room?.race?.positions ?? {}}
          winnerId={room?.race?.winnerId ?? null}
          loserId={room?.race?.loserId ?? null}
        />
      )}

      {isFinished && room?.race?.winnerId && room?.race?.loserId && (
        <RaceResult
          players={players}
          winnerId={room.race.winnerId}
          loserId={room.race.loserId}
          onPlayAgain={() => {}}
        />
      )}
    </div>
  )
}
