import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import CustomCursor from './components/shared/CustomCursor'
import GrainOverlay from './components/shared/GrainOverlay'
import Loader from './components/Loader/Loader'
import Navbar from './components/Navbar/Navbar'
import Hero from './components/Hero/Hero'
import Pillars from './components/Pillars/Pillars'
import ImageStrip from './components/ImageStrip/ImageStrip'
import PhoneMockup from './components/PhoneMockup/PhoneMockup'
import PainPoints from './components/PainPoints/PainPoints'
import Proposal from './components/Proposal/Proposal'
import Footer from './components/Footer/Footer'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      <CustomCursor />
      <GrainOverlay />

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
        <main>
          <Hero loaded={!isLoading} />
          <Pillars />
          <ImageStrip />
          <PhoneMockup />
          <PainPoints />
          <Proposal />
        </main>
        <Footer />
      </motion.div>
    </>
  )
}

export default App
