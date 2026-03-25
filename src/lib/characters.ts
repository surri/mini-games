export const CHARACTERS = [
  '🐶', '🐱', '🐻', '🐼', '🐨',
  '🐯', '🦁', '🐮', '🐷', '🐸',
  '🐵', '🐔', '🐧', '🦊', '🐇',
  '🐢', '🐎', '🐺', '🦉', '🐙',
  '🦄', '🐲', '🤖', '👻', '🎃',
]

export function getFirstAvailable(takenCharacters: readonly string[]): string {
  const taken = new Set(takenCharacters)
  return CHARACTERS.find((c) => !taken.has(c)) ?? CHARACTERS[0]
}
