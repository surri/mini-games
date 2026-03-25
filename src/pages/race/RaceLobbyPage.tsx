import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { createRoom, joinRoom } from '../../lib/room'
import { useRoom } from '../../hooks/useRoom'
import { useRace } from '../../hooks/useRace'
import { QRCode } from '../../components/QRCode'
import { PlayerAvatar } from '../../components/PlayerAvatar'
import { CountdownOverlay } from '../../components/CountdownOverlay'
import { RaceTrack } from '../../components/race/RaceTrack'
import { RaceResult } from '../../components/race/RaceResult'
import { resetRace } from '../../lib/room'

const CHARACTERS = ['🏃', '🐎', '🐢', '🚀', '🐇', '🦊', '🐻', '🐶', '🐱', '🦁', '🐸', '🎃']

export function RaceLobbyPage() {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [hostJoined, setHostJoined] = useState(false)
  const [hostName, setHostName] = useState('')
  const [hostChar, setHostChar] = useState(CHARACTERS[0])
  const { room } = useRoom(roomId ?? undefined)
  const { startRace } = useRace(roomId ?? '', room)
  const navigate = useNavigate()
  const players = room?.players ?? {}
  const playerCount = Object.keys(players).length

  const handleCreate = async () => {
    setCreating(true)
    try {
      const id = await createRoom()
      setRoomId(id)
    } catch (error) {
      setCreating(false)
    }
  }

  const handleHostJoin = async () => {
    if (!roomId || !hostName.trim()) return
    await joinRoom(roomId, hostName.trim(), hostChar)
    setHostJoined(true)
  }

  const handleStart = () => {
    if (playerCount < 2) return
    startRace()
  }

  const handlePlayAgain = async () => {
    if (!roomId) return
    await resetRace(roomId)
  }

  if (!roomId) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 40, marginBottom: 8 }}>🏇</h1>
        <h2 style={{ marginBottom: 24 }}>레이스</h2>
        <p style={{ color: '#888', marginBottom: 32 }}>꼴찌가 커피 삽니다</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleCreate}
          disabled={creating}
          style={{
            padding: '14px 40px',
            fontSize: 18,
            fontWeight: 700,
            background: '#4F46E5',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            opacity: creating ? 0.6 : 1,
          }}
        >
          {creating ? '생성 중...' : '방 만들기'}
        </motion.button>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'block',
            margin: '16px auto 0',
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ← 돌아가기
        </button>
      </div>
    )
  }

  if (!hostJoined) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>호스트 설정</h2>
        <input
          type="text"
          placeholder="이름 입력"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          maxLength={10}
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
              onClick={() => setHostChar(char)}
              style={{
                fontSize: 28,
                padding: 8,
                borderRadius: 8,
                border: hostChar === char ? '2px solid #4F46E5' : '1px solid rgba(255,255,255,0.1)',
                background: hostChar === char ? 'rgba(79,70,229,0.2)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {char}
            </button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleHostJoin}
          disabled={!hostName.trim()}
          style={{
            padding: '12px 32px',
            fontSize: 16,
            fontWeight: 700,
            background: '#4F46E5',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            opacity: hostName.trim() ? 1 : 0.4,
          }}
        >
          확인
        </motion.button>
      </div>
    )
  }

  const isCountdown = room?.status === 'countdown'
  const isRacing = room?.status === 'racing'
  const isFinished = room?.status === 'finished'

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <CountdownOverlay active={isCountdown} />

      {room?.status === 'waiting' && (
        <>
          <h2 style={{ textAlign: 'center', marginBottom: 16 }}>대기실</h2>
          <QRCode roomId={roomId} />

          <div style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 12 }}>
              참가자 ({playerCount}명)
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {Object.entries(players).map(([id, player]) => (
                <motion.div
                  key={id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <PlayerAvatar character={player.character} name={player.name} />
                </motion.div>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            disabled={playerCount < 2}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 24,
              padding: '14px 0',
              fontSize: 18,
              fontWeight: 700,
              background: playerCount >= 2 ? '#10B981' : '#374151',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              cursor: playerCount >= 2 ? 'pointer' : 'not-allowed',
            }}
          >
            {playerCount < 2 ? '2명 이상 필요' : `레이스 시작! (${playerCount}명)`}
          </motion.button>
        </>
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
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}
