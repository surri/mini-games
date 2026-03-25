import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { motion } from 'framer-motion'
import { joinRoom, getStoredPlayerId, getRoomOnce, toStringArray } from '../../lib/room'
import { generateRandomName } from '../../lib/nameGenerator'
import { useRoom } from '../../hooks/useRoom'
import { useLadder } from '../../hooks/useLadder'
import { LadderBoard } from '../../components/ladder/LadderBoard'
import { LadderResultPanel } from '../../components/ladder/LadderResultPanel'
import { CharacterPicker } from '../../components/CharacterPicker'
import { getFirstAvailable } from '../../lib/characters'

export function LadderJoinPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [name, setName] = useState(generateRandomName)
  const [character, setCharacter] = useState(() => getFirstAvailable([]))
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const { room } = useRoom(roomId)
  const { triggerPlayer, markFinished } = useLadder(roomId ?? '', room)

  const playerId = getStoredPlayerId()

  useEffect(() => {
    if (!roomId) return
    getRoomOnce(roomId)
      .then((r) => {
        if (!r) setError('방을 찾을 수 없습니다')
      })
      .catch(() => {
        setError('방 확인 중 오류가 발생했습니다')
      })
      .finally(() => {
        setChecking(false)
      })
  }, [roomId])

  useEffect(() => {
    if (!roomId) return
    const joinedKey = `joined_${roomId}`
    if (sessionStorage.getItem(joinedKey) && room?.players?.[playerId]) {
      setJoined(true)
    }
  }, [room, playerId, roomId])

  useEffect(() => {
    if (!room || joined) return
    const taken = Object.values(room.players ?? {}).map((p) => p.character)
    if (taken.includes(character)) {
      setCharacter(getFirstAvailable(taken))
    }
  }, [room, joined, character])

  const handleJoin = async () => {
    if (!roomId || !name.trim()) return
    try {
      await joinRoom(roomId, name.trim(), character)
      sessionStorage.setItem(`joined_${roomId}`, '1')
      setJoined(true)
    } catch {
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
        <h2 style={{ marginBottom: 4 }}>🪜 사다리 타기 참가</h2>
        <p style={{ color: '#888', marginBottom: 20 }}>방 코드: {roomId}</p>

        <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="이름 입력"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={10}
          autoFocus
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
          onClick={() => setName(generateRandomName())}
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

        <CharacterPicker
          selected={character}
          onSelect={setCharacter}
          players={room?.players}
        />

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
  const isPlaying = room?.status === 'playing'
  const isFinished = room?.status === 'finished'
  const isWaiting = room?.status === 'waiting'

  const ladder = room?.gameType === 'ladder' ? room.ladder : null

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      {isWaiting && (
        <div style={{ textAlign: 'center' }}>
          <h2>대기 중...</h2>
          <p style={{ color: '#888' }}>호스트가 사다리를 시작할 때까지 기다려주세요</p>
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

      {(isPlaying || isFinished) && ladder && (
        <LadderBoard
          players={players}
          ladder={ladder}
          myPlayerId={playerId}
          onTapCharacter={triggerPlayer}
          onPlayerFinished={markFinished}
        />
      )}

      {isFinished && ladder && toStringArray(ladder.loserIds).length > 0 && (
        <LadderResultPanel
          players={players}
          loserIds={toStringArray(ladder.loserIds)}
        />
      )}
    </div>
  )
}
