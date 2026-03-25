import { createHashRouter, RouterProvider } from 'react-router'
import { HomePage } from './pages/HomePage'
import { RaceLobbyPage } from './pages/race/RaceLobbyPage'
import { RaceJoinPage } from './pages/race/RaceJoinPage'

const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/race', element: <RaceLobbyPage /> },
  { path: '/race/join/:roomId', element: <RaceJoinPage /> },
])

export function App() {
  return <RouterProvider router={router} />
}
