import { HashRouter, Link, NavLink, Outlet, Route, Routes, useParams } from 'react-router'

const players: Record<string, { name: string; best: number } | undefined> = {
  ada: { name: 'Ada', best: 270 },
  bo: { name: 'Bo', best: 245 },
  cy: { name: 'Cy', best: 280 },
}

/** Shared by every page: the nav, then the matched child route in <Outlet />. */
function Layout() {
  return (
    <>
      <nav>
        <NavLink to="/" end>
          Home
        </NavLink>{' '}
        | <NavLink to="/players">Players</NavLink>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  )
}

function Home() {
  return <h1>Five Dice</h1>
}

function PlayerList() {
  return (
    <>
      <h1>Players</h1>
      <ul>
        {Object.entries(players).map(([id, player]) => (
          <li key={id}>
            {/* Relative: from /players, "ada" means /players/ada. */}
            <Link to={id}>{player?.name}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}

function PlayerPage() {
  // The :id part of the URL, e.g. "ada" for /players/ada.
  const { id = '' } = useParams()
  const player = players[id]
  if (!player) return <h1>No player called “{id}”</h1>
  return (
    <>
      <h1>{player.name}</h1>
      <p>Best score: {player.best}</p>
      <Link to="/players">All players</Link>
    </>
  )
}

/** Which component shows for which URL. */
export function DiceRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="players" element={<PlayerList />} />
        <Route path="players/:id" element={<PlayerPage />} />
        <Route path="*" element={<h1>Page not found</h1>} />
      </Route>
    </Routes>
  )
}

// The examples page is already addressed by ?demo=…, so this demo keeps its
// route after the # (…?demo=ch20/router#/players/ada). A real app uses
// <BrowserRouter> and plain paths.
export default function RouterDemo() {
  return (
    <HashRouter>
      <DiceRoutes />
    </HashRouter>
  )
}
