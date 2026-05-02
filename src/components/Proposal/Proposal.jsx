import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import AnimatedText from '../shared/AnimatedText'
import SectionLabel from '../shared/SectionLabel'
import styles from './Proposal.module.css'

const PHASES = [
  {
    phase: 'Phase 01',
    title: 'Foundation',
    deliverables: [
      'Premium website — conversion-engineered, mobile-first',
      'Google Business Profile dominance & Maps optimisation',
      'Brand voice, visual identity & content guidelines',
      'SEO architecture across all four revenue verticals',
      'Domain authority setup & technical infrastructure',
    ],
    promise: 'Your digital front door — as impressive as your physical one.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="18" width="20" height="4" rx="1" stroke="var(--amber)" strokeWidth="1.5" />
        <path d="M14 6L22 18H6L14 6Z" stroke="var(--amber)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    timeline: '30 Days',
  },
  {
    phase: 'Phase 02',
    title: 'Growth',
    deliverables: [
      'Table, court & event reservation engine — live 24/7',
      'Instagram & Google content calendar (3× weekly)',
      '#1 Google Maps ranking campaign — "Restaurant Dehradun"',
      'Review velocity system — targeting 200+ verified reviews',
      'Email & WhatsApp CRM for repeat guest retention',
    ],
    promise: 'Every search, every scroll, every tap — leads to a booking.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 22L11 14L16 18L24 8" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="8" r="2.5" stroke="var(--amber)" strokeWidth="1.5" />
      </svg>
    ),
    timeline: '60 Days',
  },
  {
    phase: 'Phase 03',
    title: 'Scale',
    deliverables: [
      'Paid acquisition funnels — Meta & Google Ads',
      'Event & private dining revenue channel, fully digital',
      'Loyalty programme — turning guests into advocates',
      'Live analytics dashboard — revenue tracked in real time',
      'Quarterly strategy reviews & compounding optimisation',
    ],
    promise: 'Month-on-month revenue growth — measurable, accountable, relentless.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="9" stroke="var(--amber)" strokeWidth="1.5" />
        <path d="M14 10V14L17 17" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    timeline: '90 Days',
  },
]

const PhaseCard = ({ phase, index }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={styles.card}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(28,20,16,0.12)' }}
    >
      <div className={styles.cardHeader}>
        <span className={styles.phaseNum}>{phase.phase}</span>
        <span className={styles.timeline}>{phase.timeline}</span>
      </div>

      <div className={styles.iconCircle}>{phase.icon}</div>
      <h3 className={styles.cardTitle}>{phase.title}</h3>

      <ul className={styles.deliverables}>
        {phase.deliverables.map((item, i) => (
          <li key={i} className={styles.deliverable}>
            <span className={styles.deliverableDot} />
            {item}
          </li>
        ))}
      </ul>

      <p className={styles.promise}>"{phase.promise}"</p>
    </motion.div>
  )
}

const Proposal = () => (
  <section className={styles.section}>
    <div className={styles.watermark}>PROPOSAL</div>

    <div className={styles.header}>
      <SectionLabel className={styles.label}>THE DBS DIGITAL REVAMP</SectionLabel>
      <AnimatedText
        text="A Complete Digital Architecture Built for Basque's Vision."
        type="words"
        className={styles.heading}
      />
    </div>

    <div className={styles.grid}>
      {PHASES.map((phase, i) => (
        <PhaseCard key={phase.phase} phase={phase} index={i} />
      ))}
    </div>

    <motion.div
      className={styles.ctaBanner}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className={styles.ctaBannerEyebrow}>DIGITAL BYTE SOLUTIONS · DEHRADUN</p>
      <p className={styles.ctaBannerHeading}>We Are Ready to Own Your Revenue.</p>
      <p className={styles.ctaBannerClaim}>
        Not promises. Deliverables. Not timelines. Results.<br />
        Basque deserves a digital presence as premium as the experience it delivers —<br />
        and we're the team built to make that happen.
      </p>
      <motion.button
        className={styles.ctaBtn}
        whileHover={{ scale: 1.04, y: -2, background: 'var(--warm-white)', color: 'var(--teak)' }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        Request Full Proposal →
      </motion.button>
    </motion.div>
  </section>
)

export default Proposal
