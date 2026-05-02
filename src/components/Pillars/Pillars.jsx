import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import AnimatedText from '../shared/AnimatedText'
import SectionLabel from '../shared/SectionLabel'
import styles from './Pillars.module.css'

const PILLARS = [
  {
    num: '01',
    title: 'The Restaurant',
    sub: 'Contemporary cuisine rooted in local flavour.',
    accent: 'var(--amber)',
    placeholder: null,
    image: 'https://file.garden/aaq7u9giWjY0-o-W/BASQUE/Gemini_Generated_Image_iu438niu438niu43%20(1).png',
    video: null,
  },
  {
    num: '02',
    title: 'Garden Events',
    sub: 'Open skies, craft cocktails, and good company.',
    accent: 'var(--sage)',
    placeholder: null,
    video: 'https://file.garden/aaq7u9giWjY0-o-W/BASQUE/2339-157269920_medium.mp4',
  },
  {
    num: '03',
    title: 'The Pickleball Courts',
    sub: 'World-class courts under the Shivalik sky.',
    accent: 'var(--terracotta)',
    placeholder: null,
    video: 'https://file.garden/aaq7u9giWjY0-o-W/BASQUE/pickleball.mp4',
    cta: 'Choose Your Time Slot',
  },
  {
    num: '04',
    title: 'Private Events',
    sub: 'Your milestone, our canvas.',
    accent: 'var(--cream)',
    placeholder: null,
    video: 'https://file.garden/aaq7u9giWjY0-o-W/BASQUE/278182.mp4',
  },
]

const PillarCard = ({ pillar, index }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      className={styles.card}
      initial={{ opacity: 0, y: 60, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        delay: index * 0.12,
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ scale: 1.02 }}
    >
      <div className={styles.cardBg}>
        {pillar.video ? (
          <video autoPlay muted loop playsInline loading="lazy">
            <source src={pillar.video} type="video/mp4" />
          </video>
        ) : pillar.image ? (
          <img src={pillar.image} alt={pillar.title} className={styles.cardImg} />
        ) : (
          <div
            className={styles.cardPlaceholder}
            style={{ background: pillar.placeholder }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.4">
              <circle cx="24" cy="24" r="20" stroke="var(--amber)" strokeWidth="1.5" />
              <polygon points="20,16 36,24 20,32" fill="var(--amber)" />
            </svg>
          </div>
        )}
      </div>

      <div className={styles.cardOverlay} />

      <div className={styles.cardContent}>
        <div className={styles.cardAccent} style={{ background: pillar.accent }} />
        <span className={styles.cardNumber} style={{ color: pillar.accent }}>
          {pillar.num}
        </span>

        <AnimatedText text={pillar.title} type="words" className={styles.cardTitle} />
        <p className={styles.cardSub}>{pillar.sub}</p>

        {pillar.cta ? (
          <motion.button
            className={styles.cardCta}
            whileHover="hover"
          >
            <motion.span
              variants={{ hover: { x: -2 } }}
              style={{ display: 'inline-block' }}
            >
              🎾
            </motion.span>
            {' '}{pillar.cta}
            <motion.span
              variants={{ hover: { x: 6 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{ display: 'inline-block' }}
            >
              {' '}→
            </motion.span>
          </motion.button>
        ) : (
          <motion.a href="#" className={styles.cardLink} whileHover="hover">
            Explore
            <motion.span
              variants={{ hover: { x: 6 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              →
            </motion.span>
          </motion.a>
        )}
      </div>
    </motion.div>
  )
}

const Pillars = () => (
  <section className={styles.section}>
    <div className={styles.header}>
      <SectionLabel className={styles.headerEyebrow}>
        THE BASQUE EXPERIENCE
      </SectionLabel>

      <AnimatedText
        text="Four Worlds, One Address."
        type="words"
        className={styles.headerHeading}
        style={{ justifyContent: 'center' }}
      />

      <motion.p
        className={styles.headerSub}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        From the dining room to the garden to the court.
      </motion.p>
    </div>

    <div className={styles.grid}>
      {PILLARS.map((pillar, i) => (
        <PillarCard key={pillar.num} pillar={pillar} index={i} />
      ))}
    </div>
  </section>
)

export default Pillars
