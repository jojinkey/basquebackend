import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import styles from './Hero.module.css'

const HEADLINE_LINES = ['The Standard', 'Dehradun', 'Deserves.']

const Hero = ({ loaded }) => {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])

  const baseDelay = loaded ? 0.4 : 3.2

  return (
    <>
      <section className={styles.hero} ref={heroRef}>
        {/* Parallax video background */}
        <motion.div
          className={styles.videoBg}
          style={{ y: videoY, scale: 1.3, transformOrigin: 'center center' }}
        >
          <video autoPlay muted loop playsInline preload="auto">
            <source src="https://file.garden/aaq7u9giWjY0-o-W/BASQUE/20203969-uhd_3840_2160_30fps.mp4" type="video/mp4" />
          </video>
        </motion.div>

        {/* Gradient overlay */}
        <div className={styles.overlay} />

        {/* Content */}
        <div className={styles.content}>
          <motion.span
            className={styles.eyebrow}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: baseDelay + 0, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Dehradun · Uttarakhand
          </motion.span>

          <div>
            {HEADLINE_LINES.map((line, i) => (
              <div key={i} className={styles.headlineWrap}>
                <motion.span
                  className={styles.headline}
                  initial={{ y: '105%' }}
                  animate={{ y: '0%' }}
                  transition={{
                    delay: baseDelay + 0.2 + i * 0.18,
                    duration: 1.0,
                    ease: [0.76, 0, 0.24, 1],
                  }}
                >
                  {line}
                </motion.span>
              </div>
            ))}
          </div>

          {/* Backlit pill tagline */}
          <motion.span
            className={styles.taglineBacklit}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: baseDelay + 0.9, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            Restaurant&nbsp;&nbsp;·&nbsp;&nbsp;Bar&nbsp;&nbsp;·&nbsp;&nbsp;Garden&nbsp;&nbsp;·&nbsp;&nbsp;Pickleball
          </motion.span>

          <div className={styles.ctaRow}>
            <motion.button
              className={styles.ctaPrimary}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: baseDelay + 1.1, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ scale: 1.04, y: -3, boxShadow: '0 20px 50px rgba(200,133,42,0.45)' }}
              whileTap={{ scale: 0.96 }}
            >
              Reserve a Table →
            </motion.button>

            <motion.button
              className={styles.ctaSecondary}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: baseDelay + 1.2, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              Explore Basque
            </motion.button>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className={styles.scrollIndicator}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: baseDelay + 1.6, duration: 1.0 }}
        >
          <motion.svg
            className={styles.chevron}
            viewBox="0 0 20 12"
            fill="none"
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          >
            <path d="M1 1L10 11L19 1" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" />
          </motion.svg>
          <span className={styles.scrollLabel}>Scroll</span>
        </motion.div>
      </section>

      {/* Logo showcase strip */}
      <motion.div
        className={styles.logoStrip}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src="https://file.garden/aaq7u9giWjY0-o-W/BASQUE/BASQUE%20Logo.png"
          alt="Basque — Restaurant · Garden · Pickleball"
          className={styles.logoImage}
        />
        <div className={styles.logoStripDivider} />
      </motion.div>
    </>
  )
}

export default Hero
