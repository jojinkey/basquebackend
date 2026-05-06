import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { ModalProvider } from './context/ModalContext'
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
import ImageStrip from './components/ImageStrip/ImageStrip'
import PhoneMockup from './components/PhoneMockup/PhoneMockup'
import PainPoints from './components/PainPoints/PainPoints'
import Proposal from './components/Proposal/Proposal'
import SocialProof from './components/home/SocialProof'
import FinalCTA from './components/home/FinalCTA'
import Footer from './components/Footer/Footer'

// Pages
import GolfPage from './pages/GolfPage'

const HomePage = ({ loaded }) => (
  <main>
    <Hero loaded={loaded} />
    <Pillars />
    <IntentSelector />
    <GolfSimulator />
    <WeddingPreview />
    <ExperienceStrip />
    <SocialProof />
    <ImageStrip />
    <PhoneMockup />
    <PainPoints />
    <Proposal />
    <FinalCTA />
  </main>
)

function App() {
  const [isLoading, setIsLoading] = useState(true)

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
          <Route path="/weddings" element={<div style={{ padding: '200px var(--container-pad)', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--teak)' }}>Weddings page — coming soon.</div>} />
          <Route path="/bar" element={<div style={{ padding: '200px var(--container-pad)', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--teak)' }}>Bar page — coming soon.</div>} />
          <Route path="/events" element={<div style={{ padding: '200px var(--container-pad)', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--teak)' }}>Events page — coming soon.</div>} />
        </Routes>

        <Footer id="footer" />
        <WhatsAppFloat />
      </motion.div>
    </ModalProvider>
  )
}

export default App
