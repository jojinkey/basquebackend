import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider, useAuth } from './context/AuthContext'
import { ModalProvider } from './context/ModalContext'
import GrainOverlay from './components/shared/GrainOverlay'
import BookingModalShell from './components/modals/BookingModalShell'
import MenuPage from './pages/MenuPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EventsPage from './pages/EventsPage'
import BarPage from './pages/BarPage'
import GolfPage from './pages/GolfPage'
import WeddingsPage from './pages/WeddingsPage'

function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) return <Navigate to="/" state={{ from: location }} replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <GrainOverlay />
        <BookingModalShell />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              background: 'var(--teak)',
              color: 'var(--warm-white)',
              borderRadius: '2px',
            },
          }}
        />

        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={(
              <AuthGuard>
                <DashboardPage />
              </AuthGuard>
            )}
          />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/menu/:tableId" element={<MenuPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/bar" element={<BarPage />} />
          <Route path="/golf" element={<GolfPage />} />
          <Route path="/weddings" element={<WeddingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ModalProvider>
    </AuthProvider>
  )
}

export default App