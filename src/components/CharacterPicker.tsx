import type { Player } from '../types'

interface Props {
  characters: readonly string[]
  selected: string
  onSelect: (char: string) => void
  players?: Record<string, Player>
}

export function CharacterPicker({ characters, selected, onSelect, players }: Props) {
  const takenCharacters = new Set(
    Object.values(players ?? {}).map((p) => p.character)
  )

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8,
        margin: '16px 0',
      }}
    >
      {characters.map((char) => {
        const isTaken = takenCharacters.has(char) && char !== selected
        return (
          <button
            key={char}
            onClick={() => !isTaken && onSelect(char)}
            disabled={isTaken}
            style={{
              fontSize: 28,
              padding: 8,
              borderRadius: 8,
              border: selected === char
                ? '2px solid #4F46E5'
                : '1px solid rgba(255,255,255,0.1)',
              background: selected === char
                ? 'rgba(79,70,229,0.2)'
                : isTaken
                  ? 'rgba(255,255,255,0.02)'
                  : 'transparent',
              cursor: isTaken ? 'not-allowed' : 'pointer',
              opacity: isTaken ? 0.25 : 1,
            }}
          >
            {char}
          </button>
        )
      })}
    </div>
  )
}
