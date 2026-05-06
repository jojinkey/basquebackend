import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import styles from './SocialProof.module.css'

const STATS = [
  { value: 4.8, suffix: '★', label: 'Google Rating', sub: 'Based on 100+ reviews', decimal: true },
  { value: 300, suffix: '', label: 'Wedding guests max', sub: 'Garden & indoor combined' },
  { value: 100, suffix: '+', label: 'Golf courses available', sub: 'Tour-grade simulation' },
  { value: 1924, suffix: '', label: 'Year the property was built', sub: 'A century of open doors' },
]

const TESTIMONIALS = [
  {
    stars: 5,
    quote: "We wanted a wedding that felt like a home. Basque was the only place in Dehradun that understood exactly what that meant. Every photograph looks like it was taken on a film set.",
    guest: 'Aarushi & Vikram',
    occasion: 'Garden Wedding · October 2024',
  },
  {
    stars: 5,
    quote: "The terrace at sunset is extraordinary. The kind of restaurant that makes you want to go back before you've even left.",
    guest: 'Rohan M.',
    occasion: 'Dinner · Google Review',
  },
  {
    stars: 5,
    quote: "Booked the court for a Saturday morning and ended up staying for lunch, then cocktails. We didn't leave until nine.",
    guest: 'Priya S.',
    occasion: 'Pickleball + Bar · Google Review',
  },
  {
    stars: 5,
    quote: "I played St Andrews on a Tuesday afternoon in Dehradun. The Golf Simulator at Basque is genuinely impressive — and the bar after is the perfect 19th hole.",
    guest: 'Deepak R.',
    occasion: 'Golf Simulator · May 2025',
  },
  {
    stars: 5,
    quote: "Our company offsite was transformed. The garden held our team perfectly. The golf simulator won the afternoon. The bar held us even better.",
    guest: 'Anika T.',
    occasion: 'Corporate Retreat · April 2025',
  },
]

const CountStat = ({ stat, isInView }) => {
  const [display, setDisplay] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!isInView || startedRef.current) return
    startedRef.current = true
    const start = Date.now()
    const duration = 1800
    const end = stat.value
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * end
      setDisplay(stat.decimal ? Math.min(current, end).toFixed(1) : Math.round(current))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isInView, stat])

  return (
    <div className={styles.stat}>
      <span className={styles.statNum}>
        {display}{stat.suffix}
      </span>
      <span className={styles.statLabel}>{stat.label}</span>
      <span className={styles.statSub}>{stat.sub}</span>
    </div>
  )
}

const SocialProof = () => {
  const statsRef = useRef(null)
  const statsInView = useInView(statsRef, { once: true, margin: '-40px' })
  const [active, setActive] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActive(a => (a + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const resetInterval = (idx) => {
    clearInterval(intervalRef.current)
    setActive(idx)
    intervalRef.current = setInterval(() => {
      setActive(a => (a + 1) % TESTIMONIALS.length)
    }, 5000)
  }

  return (
    <section className={styles.section}>
      {/* Stats row */}
      <div className={styles.statsRow} ref={statsRef}>
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.7 }}
          >
            <CountStat stat={stat} isInView={statsInView} />
          </motion.div>
        ))}
      </div>

      {/* Testimonial carousel */}
      <div className={styles.carousel} onMouseEnter={() => clearInterval(intervalRef.current)} onMouseLeave={() => resetInterval(active)}>
        <motion.div
          key={active}
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.stars}>
            {Array.from({ length: TESTIMONIALS[active].stars }).map((_, i) => (
              <span key={i} className={styles.star}>★</span>
            ))}
          </div>
          <p className={styles.quote}>"{TESTIMONIALS[active].quote}"</p>
          <p className={styles.guest}>{TESTIMONIALS[active].guest}</p>
          <span className={styles.occasion}>{TESTIMONIALS[active].occasion}</span>
        </motion.div>

        <div className={styles.dots}>
          {TESTIMONIALS.map((_, i) => (
            <button key={i} className={`${styles.dot} ${i === active ? styles.dotActive : ''}`} onClick={() => resetInterval(i)} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default SocialProof
