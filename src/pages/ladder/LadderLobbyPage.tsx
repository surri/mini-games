import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { createRoom, joinRoom } from '../../lib/room'
import { generateRandomName } from '../../lib/nameGenerator'
import { useRoom } from '../../hooks/useRoom'
import { useLadder } from '../../hooks/useLadder'
import { QRCode } from '../../components/QRCode'
import { PlayerAvatar } from '../../components/PlayerAvatar'
import { LadderBoard } from '../../components/ladder/LadderBoard'
import { LadderResultPanel } from '../../components/ladder/LadderResultPanel'
import { CharacterPicker } from '../../components/CharacterPicker'
import { CHARACTERS } from '../../lib/characters'
import { getStoredPlayerId } from '../../lib/room'

export function LadderLobbyPage() {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [hostJoined, setHostJoined] = useState(false)
  const [hostName, setHostName] = useState(generateRandomName)
  const [hostChar, setHostChar] = useState(CHARACTERS[0])
  const [loserCount, setLoserCount] = useState(1)
  const { room } = useRoom(roomId ?? undefined)
  const { startLadder, triggerPlayer, markFinished, resetGame } = useLadder(roomId ?? '', room)
  const myPlayerId = getStoredPlayerId()
  const navigate = useNavigate()
  const players = room?.players ?? {}
  const playerCount = Object.keys(players).length

  const handleCreate = async () => {
    setCreating(true)
    try {
      const id = await createRoom('ladder')
      setRoomId(id)
    } catch {
      setCreating(false)
    }
  }

  const handleHostJoin = async () => {
    if (!roomId || !hostName.trim()) return
    await joinRoom(roomId, hostName.trim(), hostChar)
    setHostJoined(true)
  }

  const maxLosers = Math.max(1, playerCount - 1)

  const handleStart = () => {
    if (playerCount < 2) return
    startLadder(loserCount)
  }

  const handlePlayAgain = async () => {
    if (!roomId) return
    await resetGame()
  }

  if (!roomId) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 40, marginBottom: 8 }}>🪜</h1>
        <h2 style={{ marginBottom: 24 }}>사다리 타기</h2>
        <p style={{ color: '#888', marginBottom: 32 }}>누가 커피 당첨?</p>
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
        <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="이름 입력"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          maxLength={10}
          style={{
            flex: 1,
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
        <button
          onClick={() => setHostName(generateRandomName())}
          style={{
            padding: '12px 14px',
            fontSize: 20,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.05)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          🎲
        </button>
        </div>
        <CharacterPicker selected={hostChar} onSelect={setHostChar} />
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

  const isPlaying = room?.status === 'playing'
  const isFinished = room?.status === 'finished'

  const ladder = room?.gameType === 'ladder' ? room.ladder : null

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      {room?.status === 'waiting' && (
        <>
          <h2 style={{ textAlign: 'center', marginBottom: 16 }}>대기실</h2>
          <QRCode roomId={roomId} gameType="ladder" />

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

          {playerCount >= 2 && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
                ☕ 커피 당첨 인원
              </p>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {Array.from({ length: maxLosers }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setLoserCount(n)}
                    style={{
                      width: 44,
                      height: 44,
                      fontSize: 16,
                      fontWeight: loserCount === n ? 700 : 400,
                      borderRadius: 10,
                      border: loserCount === n ? '2px solid #FF6B6B' : '1px solid rgba(255,255,255,0.15)',
                      background: loserCount === n ? 'rgba(255,107,107,0.2)' : 'transparent',
                      color: loserCount === n ? '#FF6B6B' : '#aaa',
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            disabled={playerCount < 2}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 16,
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
            {playerCount < 2 ? '2명 이상 필요' : `사다리 시작! (당첨 ${loserCount}명)`}
          </motion.button>
        </>
      )}

      {(isPlaying || isFinished) && ladder && (
        <LadderBoard
          players={players}
          ladder={ladder}
          myPlayerId={myPlayerId}
          onTapCharacter={triggerPlayer}
          onPlayerFinished={markFinished}
        />
      )}

      {isFinished && ladder && (ladder.loserIds ?? []).length > 0 && (
        <LadderResultPanel
          players={players}
          loserIds={ladder.loserIds}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}
