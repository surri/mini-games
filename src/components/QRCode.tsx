import { useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  roomId: string
  gameType?: 'race' | 'ladder'
}

function buildJoinUrl(roomId: string, gameType: string): string {
  const base = window.location.origin + window.location.pathname
  return `${base}#/${gameType}/join/${roomId}`
}

export function QRCode({ roomId, gameType = 'race' }: Props) {
  const url = buildJoinUrl(roomId, gameType)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }, [url])

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: '미니게임 참가', url })
      } catch {
        // 사용자가 공유를 취소한 경우
      }
    } else {
      await handleCopy()
    }
  }, [url, handleCopy])

  return (
    <div style={{ textAlign: 'center' }}>
      <QRCodeSVG value={url} size={200} level="M" />
      <p style={{ marginTop: 8, fontSize: 14, color: '#888', wordBreak: 'break-all' }}>
        {url}
      </p>
      <p style={{ fontSize: 24, fontWeight: 'bold', letterSpacing: 4 }}>
        {roomId}
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 1,
            maxWidth: 180,
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
            color: copied ? '#10B981' : '#fff',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          {copied ? '복사됨!' : '링크 복사'}
        </button>
        <button
          onClick={handleShare}
          style={{
            flex: 1,
            maxWidth: 180,
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            background: '#4F46E5',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          공유하기
        </button>
      </div>
    </div>
  )
}
