import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useModal } from '../../context/ModalContext'
import styles from './GolfSimulator.module.css'

const CHIPS = ['100+ Global Courses', 'Private Bay', 'By the Hour', 'Corporate Bookings']

const GolfSimulator = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const { openModal } = useModal()

  return (
    <section className={styles.section} ref={ref}>
      <motion.div
        className={styles.imageCol}
        initial={{ opacity: 0, x: -40 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.imagePlaceholder}>
          <div className={styles.imageOverlay} />
          <div className={styles.imageFallback}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" opacity="0.3">
              <circle cx="40" cy="40" r="36" stroke="var(--amber)" strokeWidth="1.5"/>
              <path d="M40 20v30M40 20L56 32L40 44" stroke="var(--amber)" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M24 62h32" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </motion.div>

      <motion.div
        className={styles.textCol}
        initial={{ opacity: 0, x: 40 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>Now at Basque</span>
          <span className={styles.newTag}>NEW</span>
        </div>

        <h2 className={styles.heading}>
          The world's great<br/>
          golf courses.<br/>
          <em>Delivered to Dehradun.</em>
        </h2>

        <p className={styles.body}>
          Basque has installed a tour-grade full-swing golf simulator — the only one of its kind in the Dehradun valley. Play Augusta National, St Andrews, Pebble Beach, or 100 other courses from a private bay. Perfect for a corporate afternoon, a competitive session among friends, or simply the most unusual hour you've spent in Uttarakhand.
        </p>

        <div className={styles.chips}>
          {CHIPS.map(c => <span key={c} className={styles.chip}>{c}</span>)}
        </div>

        <div className={styles.ctaRow}>
          <motion.button
            className={styles.ctaPrimary}
            onClick={() => openModal('golf')}
            whileHover={{ scale: 1.03, y: -2, boxShadow: '0 12px 36px rgba(200,133,42,0.3)' }}
            whileTap={{ scale: 0.97 }}
          >
            Book a Simulator Bay →
          </motion.button>

          <motion.button
            className={styles.ctaSecondary}
            onClick={() => openModal('golfDining')}
            whileHover={{ background: 'var(--teak)', color: 'var(--warm-white)' }}
            whileTap={{ scale: 0.97 }}
          >
            Golf + Dining Package →
          </motion.button>
        </div>
      </motion.div>
    </section>
  )
}

export default GolfSimulator
