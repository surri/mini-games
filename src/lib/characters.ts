export const CHARACTERS = [
  '🐶', '🐱', '🐻', '🐼', '🐨',
  '🐯', '🦁', '🐮', '🐷', '🐸',
  '🐵', '🐔', '🐧', '🦊', '🐇',
  '🐢', '🐎', '🐺', '🦉', '🐙',
  '🦄', '🐲', '🤖', '👻', '🎃',
]

export function shuffleCharacters(): string[] {
  const arr = [...CHARACTERS]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export function getFirstAvailable(shuffled: readonly string[], takenCharacters: readonly string[]): string {
  const taken = new Set(takenCharacters)
  return shuffled.find((c) => !taken.has(c)) ?? shuffled[0]
}
