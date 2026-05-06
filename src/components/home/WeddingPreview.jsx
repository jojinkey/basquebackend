import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './WeddingPreview.module.css'

const STATS = ['Up to 300 guests', 'Garden + Indoor', 'Full venue buyout available']

const MARQUEE_TEXT = 'GARDEN CEREMONIES ◆ INTIMATE RECEPTIONS ◆ PRE-WEDDING SHOOTS ◆ MEHENDI EVENINGS ◆ SANGEET CELEBRATIONS ◆ MORNING-AFTER BRUNCHES ◆ '

const WeddingPreview = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const navigate = useNavigate()

  return (
    <>
      <section className={styles.section}>
        <div className={styles.videoBg}>
          <div className={styles.placeholder} />
        </div>
        <div className={styles.overlay} />

        <motion.div
          ref={ref}
          className={styles.content}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={styles.eyebrow}>Basque Weddings</span>

          <h2 className={styles.heading}>
            "Some places get decorated<br />for weddings."
          </h2>
          <h2 className={`${styles.heading} ${styles.headingItalic}`}>
            "Basque simply opens its doors."
          </h2>

          <p className={styles.sub}>
            Up to 300 guests. Garden, verandah, and terrace.<br />
            The Shivaliks in the background. The bar open until midnight.
          </p>

          <div className={styles.stats}>
            {STATS.map(s => (
              <span key={s} className={styles.statChip}>{s}</span>
            ))}
          </div>

          <div className={styles.ctaRow}>
            <motion.button
              className={styles.ctaPrimary}
              onClick={() => navigate('/weddings')}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Plan Your Wedding at Basque →
            </motion.button>
            <motion.button
              className={styles.ctaSecondary}
              onClick={() => navigate('/weddings#gallery')}
              whileHover={{ background: 'var(--warm-white)', color: 'var(--teak)' }}
              whileTap={{ scale: 0.97 }}
            >
              See the Venue →
            </motion.button>
          </div>
        </motion.div>
      </section>

      <div className={styles.marqueeStrip}>
        <motion.div
          className={styles.marqueeTrack}
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
        >
          <span className={styles.marqueeText}>{MARQUEE_TEXT}</span>
          <span className={styles.marqueeText}>{MARQUEE_TEXT}</span>
        </motion.div>
      </div>
    </>
  )
}

export default WeddingPreview
