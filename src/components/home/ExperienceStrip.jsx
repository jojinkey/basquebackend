import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useModal } from '../../context/ModalContext'
import styles from './ExperienceStrip.module.css'

const BLOCKS = [
  {
    label: 'Lunch & Brunch',
    time: '12:30 PM – 3:30 PM',
    cta: 'Reserve →',
    ctaAction: 'table',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="11" r="5" stroke="var(--amber)" strokeWidth="1.2"/>
        <path d="M14 16v8M8 24h12" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M4 11h2M22 11h2M6.5 5.5l1.5 1.5M19.5 5.5L18 7" stroke="var(--amber)" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Dinner Service',
    time: '7:00 PM – 11:00 PM',
    cta: 'Reserve →',
    ctaAction: 'table',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 6a8 8 0 100 16A8 8 0 0014 6z" stroke="var(--amber)" strokeWidth="1.2"/>
        <path d="M14 6c0 0-3-2-3-4M14 6c0 0 3-2 3-4" stroke="var(--amber)" strokeWidth="1" strokeLinecap="round"/>
        <circle cx="22" cy="6" r="3" stroke="var(--amber)" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    label: 'The Amber Room Bar',
    time: 'Wed–Sun · 5 PM onwards',
    cta: 'Walk In Welcome →',
    ctaAction: null,
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M8 6h12L14 16v8" stroke="var(--amber)" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M6 6h16" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M11 24h6" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Pickleball Court',
    time: '8 AM – 7 PM daily',
    cta: 'Book a Slot →',
    ctaAction: 'court',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <ellipse cx="11" cy="17" rx="6" ry="5" stroke="var(--sage)" strokeWidth="1.2"/>
        <path d="M15 12l7-7" stroke="var(--sage)" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="22" cy="5" r="2" stroke="var(--sage)" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    label: 'Golf Simulator',
    time: 'By appointment',
    cta: 'Book a Bay →',
    ctaAction: 'golf',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 22V10" stroke="var(--sage)" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M14 10l8 4-8 4" stroke="var(--sage)" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M8 24h12" stroke="var(--sage)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const ExperienceStrip = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const { openModal } = useModal()

  return (
    <section className={styles.section} ref={ref}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        <span className={styles.eyebrow}>At Basque Today</span>
        <h2 className={styles.heading}>Plan your perfect afternoon.</h2>
      </motion.div>

      <div className={styles.blocks}>
        {BLOCKS.map((block, i) => (
          <motion.div
            key={block.label}
            className={styles.block}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => block.ctaAction && openModal(block.ctaAction)}
          >
            <div className={styles.blockIcon}>{block.icon}</div>
            <p className={styles.blockLabel}>{block.label}</p>
            <p className={styles.blockTime}>{block.time}</p>
            <span className={styles.blockCta}>{block.cta}</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default ExperienceStrip
