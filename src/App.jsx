import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { ModalProvider } from './context/ModalContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import CustomCursor from './components/shared/CustomCursor'
import GrainOverlay from './components/shared/GrainOverlay'
import WhatsAppFloat from './components/shared/WhatsAppFloat'
import Loader from './components/Loader/Loader'
import Navbar from './components/Navbar/Navbar'
import BookingModalShell from './components/modals/BookingModalShell'

// Home sections
import Hero from './components/Hero/Hero'
import Pillars from './components/Pillars/Pillars'
import IntentSelector from './components/home/IntentSelector'
import GolfSimulator from './components/home/GolfSimulator'
import WeddingPreview from './components/home/WeddingPreview'
import ExperienceStrip from './components/home/ExperienceStrip'
import SocialProof from './components/home/SocialProof'
import FinalCTA from './components/home/FinalCTA'
import Footer from './components/Footer/Footer'

// Pages
import GolfPage from './pages/GolfPage'
import WeddingsPage from './pages/WeddingsPage'
import BarPage from './pages/BarPage'
import EventsPage from './pages/EventsPage'
import MenuPage from './pages/MenuPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

const HomePage = ({ loaded }) => (
  <main>
    <Hero loaded={loaded} />
    <Pillars />
    <IntentSelector />
    <GolfSimulator />
    <WeddingPreview />
    <ExperienceStrip />
    <SocialProof />
    <FinalCTA />
  </main>
)

function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function WebsiteLayout({ isLoading, setIsLoading }) {
  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <Loader key="loader" onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Navbar />
        <BookingModalShell />
        <Routes>
          <Route path="/" element={<HomePage loaded={!isLoading} />} />
          <Route path="/golf" element={<GolfPage />} />
          <Route path="/weddings" element={<WeddingsPage />} />
          <Route path="/bar" element={<BarPage />} />
          <Route path="/events" element={<EventsPage />} />
        </Routes>
        <Footer id="footer" />
        <WhatsAppFloat />
      </motion.div>
    </>
  )
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  const isDashboard = location.pathname.startsWith('/dashboard')
  const isLogin = location.pathname === '/login'
  const isMenu = location.pathname.startsWith('/menu/')

  if (isDashboard) {
    return (
      <AuthProvider>
        <AuthGuard>
          <DashboardPage />
        </AuthGuard>
      </AuthProvider>
    )
  }

  if (isLogin) {
    return (
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )
  }

  if (isMenu) {
    return (
      <Routes>
        <Route path="/menu/:tableId" element={<MenuPage />} />
      </Routes>
    )
  }

  return (
    <ModalProvider>
      <CustomCursor />
      <GrainOverlay />
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
      <WebsiteLayout isLoading={isLoading} setIsLoading={setIsLoading} />
    </ModalProvider>
  )
}

export default App