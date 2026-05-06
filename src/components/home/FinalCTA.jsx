import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../../context/ModalContext'
import styles from './FinalCTA.module.css'

const FinalCTA = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const { openModal } = useModal()
  const navigate = useNavigate()

  return (
    <section className={styles.section} ref={ref}>
      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className={styles.heading}>
          The right place for<br /><em>whatever comes next.</em>
        </h2>

        <p className={styles.sub}>
          Dinner tonight. A wedding next year. A Saturday court session.<br />
          An afternoon on Augusta. Whatever it is — Basque is ready.
        </p>

        <div className={styles.btnGrid}>
          {/* Row 1 */}
          <motion.button className={`${styles.btn} ${styles.btnAmber}`} onClick={() => openModal('table')} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
            Reserve a Table →
          </motion.button>
          <motion.button className={`${styles.btn} ${styles.btnWhite}`} onClick={() => navigate('/weddings')} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
            Plan Your Wedding →
          </motion.button>

          {/* Row 2 */}
          <motion.button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => openModal('court')} whileHover={{ background: 'rgba(200,133,42,0.12)' }} whileTap={{ scale: 0.97 }}>
            Book a Court →
          </motion.button>
          <motion.button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => openModal('golf')} whileHover={{ background: 'rgba(200,133,42,0.12)' }} whileTap={{ scale: 0.97 }}>
            Book the Golf Simulator →
          </motion.button>

          {/* Row 3 */}
          <motion.button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => openModal('event')} whileHover={{ color: 'var(--warm-white)' }} whileTap={{ scale: 0.97 }}>
            Host a Private Event →
          </motion.button>
          <motion.a href="tel:+919999999999" className={`${styles.btn} ${styles.btnGhostAmber}`}>
            Call Us Directly →
          </motion.a>
        </div>

        <div className={styles.bottom}>
          <div className={styles.rule} />
          <p className={styles.ig}>
            Or find us on Instagram —{' '}
            <a href="https://instagram.com/basquedehradun" target="_blank" rel="noopener noreferrer" className={styles.igLink}>
              @basquedehradun
            </a>
          </p>
        </div>
      </motion.div>
    </section>
  )
}

export default FinalCTA
