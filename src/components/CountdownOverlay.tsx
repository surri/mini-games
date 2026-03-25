import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playCountdownBeep, playGoBeep } from '../lib/sound'

interface Props {
  active: boolean
  onComplete?: () => void
}

const STEPS = ['3', '2', '1', 'GO!']

export function CountdownOverlay({ active, onComplete }: Props) {
  const [step, setStep] = useState(-1)

  useEffect(() => {
    if (!active) {
      setStep(-1)
      return
    }

    setStep(0)
    const timers: ReturnType<typeof setTimeout>[] = []

    STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setStep(i)
          if (i < 3) playCountdownBeep()
          else playGoBeep()
        }, i * 1000)
      )
    })

    timers.push(
      setTimeout(() => {
        setStep(-1)
        onComplete?.()
      }, 4000)
    )

    return () => timers.forEach(clearTimeout)
  }, [active, onComplete])

  if (step < 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            fontSize: step < 3 ? 120 : 80,
            fontWeight: 900,
            color: step < 3 ? '#fff' : '#FFD700',
            textShadow: '0 0 40px rgba(255,255,255,0.5)',
          }}
        >
          {STEPS[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
