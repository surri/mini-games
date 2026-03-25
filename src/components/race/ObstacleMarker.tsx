import { motion } from 'framer-motion'
import { OBSTACLE_TYPES } from '../../lib/raceConfig'

interface Props {
  type: string
  position: number
  triggered: boolean
}

export function ObstacleMarker({ type, position, triggered }: Props) {
  const config = OBSTACLE_TYPES[type]
  if (!config) return null

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={
        triggered
          ? { scale: 1.5, opacity: 0 }
          : { scale: [0, 1.2, 1], opacity: 1 }
      }
      transition={triggered ? { duration: 0.3 } : { duration: 0.4 }}
      style={{
        position: 'absolute',
        left: `${position}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 18,
        pointerEvents: 'none',
        zIndex: 5,
        filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))',
      }}
    >
      {config.emoji}
    </motion.div>
  )
}
