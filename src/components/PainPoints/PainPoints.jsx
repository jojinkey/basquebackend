import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import AnimatedText from '../shared/AnimatedText'
import SectionLabel from '../shared/SectionLabel'
import styles from './PainPoints.module.css'

const PAIN_POINTS = [
  {
    num: '01',
    title: 'Zero Digital Brand Surface Area',
    detail: 'The most photogenic venue in the city leaves no trace in search, review ecosystems, or social feeds.',
  },
  {
    num: '02',
    title: 'Four Revenue Verticals, Zero Digital Funnels',
    detail: 'Restaurant, bar, pickleball, events — all untapped as independent online revenue channels.',
  },
  {
    num: '03',
    title: 'Limited Booking & Reserve Structure',
    detail: 'Tables, courts, and event spaces deserve a seamless reservation engine — one that converts intent into confirmed covers around the clock.',
  },
  {
    num: '04',
    title: 'SEO Invisibility',
    detail: 'No website means no indexing. Inferior competitors will own every Dehradun F&B search by default.',
  },
  {
    num: '05',
    title: 'Social Without a System',
    detail: 'Isolated posts with no voice, no calendar, no visual language. Impressive reach, wasted potential.',
  },
]

const PainItem = ({ item, index }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={styles.item}
      initial={{ x: -40, opacity: 0 }}
      animate={isInView ? { x: 0, opacity: 1 } : {}}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={styles.number}>{item.num}</span>
      <div className={styles.itemContent}>
        <p className={styles.itemTitle}>{item.title}</p>
        <p className={styles.itemDetail}>{item.detail}</p>
      </div>
    </motion.div>
  )
}

const GridSVG = () => (
  <svg className={styles.bgGrid} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--ivory)" strokeWidth="0.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
)

const PainPoints = () => (
  <section className={styles.section}>
    <GridSVG />
    <div className={styles.bgHotspot} />

    <div className={styles.header}>
      <SectionLabel className={styles.label}>
        DIGITAL REVAMP PROPOSAL
      </SectionLabel>

      <AnimatedText
        text="Where Basque Is Today."
        type="words"
        className={styles.heading}
      />
      <span className={styles.subheading}>— And where we take it.</span>
    </div>

    <div className={styles.list}>
      {PAIN_POINTS.map((item, i) => (
        <PainItem key={item.num} item={item} index={i} />
      ))}
    </div>
  </section>
)

export default PainPoints
