import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Recover from '@/pages/Recover'
import Dashboard from '@/pages/Dashboard'
import GameEditor from '@/pages/GameEditor'
import Play from '@/pages/Play'
import Join from '@/pages/Join'
import SessionHost from '@/pages/SessionHost'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recover" element={<Recover />} />
          <Route path="/play/:slug" element={<Play />} />
          <Route path="/join" element={<Join />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/games/new"
            element={
              <ProtectedRoute>
                <GameEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/games/:id"
            element={
              <ProtectedRoute>
                <GameEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/session/:id"
            element={
              <ProtectedRoute>
                <SessionHost />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
