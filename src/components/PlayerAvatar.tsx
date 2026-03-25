interface Props {
  character: string
  name: string
  size?: number
  highlight?: 'winner' | 'loser' | null
}

export function PlayerAvatar({ character, name, size = 48, highlight }: Props) {
  const borderColor =
    highlight === 'winner'
      ? '#FFD700'
      : highlight === 'loser'
        ? '#FF4444'
        : 'transparent'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        style={{
          fontSize: size,
          lineHeight: 1,
          border: `3px solid ${borderColor}`,
          borderRadius: '50%',
          padding: 4,
        }}
      >
        {character}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
    </div>
  )
}
