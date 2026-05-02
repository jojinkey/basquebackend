import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import styles from './PhoneMockup.module.css'

const KEYWORDS = [
  { term: 'Restaurant Dehradun', intent: 'High Intent', volume: '8.2K / mo' },
  { term: 'Pickleball Court Dehradun', intent: 'Emerging', volume: '3.1K / mo' },
  { term: 'Restaurant on Rajpur / Mussorie Rd', intent: 'Local SEO', volume: '4.9K / mo' },
  { term: 'Garden Restaurant Dehradun', intent: 'Local SEO', volume: '2.8K / mo' },
  { term: 'Event Venue Dehradun', intent: 'Commercial', volume: '4.7K / mo' },
  { term: 'Fine Dining Dehradun', intent: 'High Value', volume: '6.3K / mo' },
]

const PhoneScreen = () => (
  <div className={styles.phone}>
    {/* Notch */}
    <div className={styles.notch} />

    {/* Status bar */}
    <div className={styles.statusBar}>
      <span>9:41</span>
      <span className={styles.statusRight}>5G ▲▲▲</span>
    </div>

    {/* Search bar */}
    <div className={styles.searchBar}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8852A" strokeWidth="2.5">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <span>restaurant dehradun</span>
    </div>

    {/* Map area */}
    <div className={styles.mapArea}>
      <div className={styles.mapGrid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={styles.mapCell} />
        ))}
      </div>
      {/* Basque pin */}
      <div className={styles.pinBasque}>
        <span>B</span>
      </div>
      {/* Competitor pin */}
      <div className={styles.pinComp}>
        <span>c</span>
      </div>
      {/* #1 badge */}
      <div className={styles.badge}>#1 Dehradun</div>
    </div>

    {/* Listing card */}
    <div className={styles.listingCard}>
      <div className={styles.listingMain}>
        <div>
          <p className={styles.listingName}>Basque</p>
          <div className={styles.listingStars}>
            {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
            <span className={styles.listingRating}>4.9 (200+)</span>
          </div>
          <p className={styles.listingCat}>Restaurant · Bar · Garden · Pickleball</p>
          <p className={styles.listingOpen}>Open · Rajpur Road · basque.in</p>
        </div>
        <div className={styles.listingThumb}>B</div>
      </div>
      <div className={styles.listingActions}>
        <button>Directions</button>
        <button>Call</button>
        <button>Website</button>
      </div>
    </div>

    {/* Competitor dimmed */}
    <div className={styles.competitorRow}>
      <p className={styles.competitorName}>Competitor Restaurant</p>
      <div className={styles.competitorStars}>★★★☆☆ <span>3.7 (42)</span></div>
    </div>
  </div>
)

const PhoneMockup = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className={styles.section} ref={ref}>
      {/* Background */}
      <div className={styles.bg} />

      <div className={styles.inner}>
        {/* Left — Phone */}
        <motion.div
          className={styles.phoneWrap}
          initial={{ opacity: 0, x: -60, rotate: -4 }}
          animate={isInView ? { opacity: 1, x: 0, rotate: -2 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <PhoneScreen />
          {/* Glow under phone */}
          <div className={styles.phoneGlow} />
        </motion.div>

        {/* Right — Keyword strategy */}
        <div className={styles.content}>
          <motion.span
            className={styles.eyebrow}
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            SEO &amp; KEYWORD STRATEGY
          </motion.span>

          <motion.h2
            className={styles.heading}
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            Own Every Search.<br />Own Dehradun.
          </motion.h2>

          <motion.p
            className={styles.body}
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            We map Basque to every high-intent query your future guests are already typing.
            From Google Maps dominance to organic search ranking — every search leads here.
          </motion.p>

          {/* Keyword table */}
          <div className={styles.kwTable}>
            {KEYWORDS.map((kw, i) => (
              <motion.div
                key={kw.term}
                className={styles.kwRow}
                initial={{ opacity: 0, x: 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.55 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={styles.kwLeft}>
                  <span className={styles.kwDot} />
                  <span className={styles.kwTerm}>{kw.term}</span>
                </div>
                <div className={styles.kwRight}>
                  <span className={`${styles.kwBadge} ${styles[`kwBadge_${kw.intent.replace(/\s/g,'')}`]}`}>
                    {kw.intent}
                  </span>
                  <span className={styles.kwVol}>{kw.volume}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className={styles.claimBox}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <span className={styles.claimIcon}>🏆</span>
            <p className={styles.claimText}>
              Target: <strong>#1 Google Maps ranking</strong> for "Restaurant Dehradun" within 90 days of launch.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default PhoneMockup
