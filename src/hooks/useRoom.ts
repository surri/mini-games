import { useState, useEffect } from 'react'
import { subscribeToRoom } from '../lib/room'
import type { Room } from '../types'

export function useRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToRoom(roomId, (snapshot) => {
      setRoom(snapshot)
      setLoading(false)
    })

    return unsubscribe
  }, [roomId])

  return { room, loading }
}
