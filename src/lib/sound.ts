const audioContext = () => new (window.AudioContext || (window as any).webkitAudioContext)()

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
  try {
    const ctx = audioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // audio not supported
  }
}

export function playCountdownBeep() {
  playTone(440, 0.15, 'square')
}

export function playGoBeep() {
  playTone(880, 0.3, 'square')
}

export function playFinish() {
  try {
    const ctx = audioContext()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + 0.3)
    })
  } catch {
    // audio not supported
  }
}

export function playObstacleHit() {
  playTone(200, 0.15, 'sawtooth')
}

export function playBoost() {
  playTone(600, 0.1, 'sine')
  setTimeout(() => playTone(800, 0.1, 'sine'), 80)
}

export function playLeadChange() {
  playTone(523, 0.08, 'triangle')
  setTimeout(() => playTone(659, 0.12, 'triangle'), 100)
}

// --- Ladder sounds ---

export function playLadderStep() {
  playTone(330, 0.05, 'sine')
}

export function playBridgeCross() {
  playTone(440, 0.08, 'triangle')
}

export function playLadderReveal() {
  playTone(523, 0.1, 'sine')
  setTimeout(() => playTone(659, 0.15, 'sine'), 100)
}

export function playLoserReveal() {
  playTone(400, 0.2, 'sawtooth')
  setTimeout(() => playTone(350, 0.2, 'sawtooth'), 200)
  setTimeout(() => playTone(300, 0.3, 'sawtooth'), 400)
}
