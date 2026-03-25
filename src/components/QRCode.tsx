import { QRCodeSVG } from 'qrcode.react'

interface Props {
  roomId: string
}

function buildJoinUrl(roomId: string): string {
  const base = window.location.origin + window.location.pathname
  return `${base}#/race/join/${roomId}`
}

export function QRCode({ roomId }: Props) {
  const url = buildJoinUrl(roomId)

  return (
    <div style={{ textAlign: 'center' }}>
      <QRCodeSVG value={url} size={200} level="M" />
      <p style={{ marginTop: 8, fontSize: 14, color: '#888', wordBreak: 'break-all' }}>
        {url}
      </p>
      <p style={{ fontSize: 24, fontWeight: 'bold', letterSpacing: 4 }}>
        {roomId}
      </p>
    </div>
  )
}
