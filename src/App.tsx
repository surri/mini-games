import { createBrowserRouter, RouterProvider } from 'react-router'
import { HomePage } from './pages/HomePage'
import { RaceLobbyPage } from './pages/race/RaceLobbyPage'
import { RaceJoinPage } from './pages/race/RaceJoinPage'
import { LadderLobbyPage } from './pages/ladder/LadderLobbyPage'
import { LadderJoinPage } from './pages/ladder/LadderJoinPage'

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/race', element: <RaceLobbyPage /> },
  { path: '/race/:roomId', element: <RaceJoinPage /> },
  { path: '/ladder', element: <LadderLobbyPage /> },
  { path: '/ladder/:roomId', element: <LadderJoinPage /> },
], {
  basename: '/mini-games',
})

export function App() {
  return <RouterProvider router={router} />
}
