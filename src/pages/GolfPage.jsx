import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useModal } from '../context/ModalContext'
import GolfBookingModal from '../components/modals/GolfBookingModal'
import styles from './GolfPage.module.css'

const COURSES = [
  { name: 'Augusta National', location: 'Georgia, USA', difficulty: 'Championship' },
  { name: 'St Andrews Old Course', location: 'Scotland', difficulty: 'Links Classic' },
  { name: 'Pebble Beach', location: 'California, USA', difficulty: 'Scenic Coastal' },
  { name: 'Emirates Golf Club', location: 'Dubai, UAE', difficulty: 'Desert Course' },
  { name: 'Royal Melbourne', location: 'Australia', difficulty: 'Championship' },
  { name: 'Bethpage Black', location: 'New York, USA', difficulty: 'US Open Venue' },
  { name: 'TPC Sawgrass', location: 'Florida, USA', difficulty: 'Tour Venue' },
  { name: 'Pine Valley', location: 'New Jersey, USA', difficulty: 'World #1' },
  { name: 'Shinnecock Hills', location: 'New York, USA', difficulty: 'US Open Venue' },
]

const PACKAGES = [
  { id: 'round', name: 'The Round', details: ['2 hours simulator', 'Bar table after'], tag: null },
  { id: 'afternoon', name: 'The Afternoon', details: ['3 hours simulator', 'Lunch or dinner for the group', 'Equipment included'], tag: 'RECOMMENDED' },
  { id: 'corporate', name: 'The Corporate Day', details: ['Half-day simulator (4 hrs)', 'Full private dining', 'Dedicated event coordinator', 'Custom scorecard'], tag: null },
]

const AUDIENCES = [
  { type: 'The Golf Enthusiast', desc: 'Serious about the game. 100+ courses, precise ball tracking data, and a private bay that lets you play at your own pace. Augusta on a Tuesday is not a joke.', icon: '⛳' },
  { type: 'The Curious Beginner', desc: 'No handicap required. No experience needed. Equipment provided, settings adjustable. An instructor can be arranged. The bar is 40 feet away if it doesn\'t go well.', icon: '🏌️' },
  { type: 'The Corporate Host', desc: 'A private bay for your team. Catering on-site. A tournament format if you want it. The kind of team afternoon that people actually remember.', icon: '🏢' },
]

const GolfPage = () => {
  const { openModal } = useModal()
  const coursesRef = useRef(null)
  const coursesInView = useInView(coursesRef, { once: true, margin: '-40px' })

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={styles.heroEyebrow}>The Golf Simulator · Basque Dehradun</span>
          <h1 className={styles.heroHeading}>
            The world's great<br />
            <em>courses. Your afternoon.</em>
          </h1>
          <p className={styles.heroSub}>
            Dehradun's only tour-grade full-swing simulator.<br />
            Private bay. 100+ courses. No handicap required.
          </p>
          <motion.button
            className={styles.heroCta}
            onClick={() => openModal('golf')}
            whileHover={{ scale: 1.04, y: -2, boxShadow: '0 20px 50px rgba(200,133,42,0.4)' }}
            whileTap={{ scale: 0.97 }}
          >
            Book a Simulator Bay →
          </motion.button>
        </motion.div>
      </section>

      {/* The Simulator — editorial */}
      <section className={styles.editorial}>
        <div className={styles.editorialImage}>
          <div className={styles.editorialPlaceholder} />
        </div>
        <div className={styles.editorialText}>
          <span className={styles.eyebrow}>The Setup</span>
          <h2 className={styles.editorialHeading}>This is not a novelty.</h2>
          <p className={styles.editorialBody}>
            It is a full-swing simulator used by professionals. The ball flight data, course conditions, and physics are indistinguishable from the real thing — except the bar is 40 feet away.
          </p>
          <div className={styles.featureChips}>
            {['Full-Swing Technology', '100+ Courses', 'Ball Tracking Data', 'Up to 8 Players', 'Private Bay'].map(f => (
              <span key={f} className={styles.featureChip}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className={styles.coursesSection} ref={coursesRef}>
        <div className={styles.coursesSectionInner}>
          <span className={styles.eyebrow}>Featured Courses</span>
          <h2 className={styles.sectionHeading}>Play the world's<br/><em>most iconic courses.</em></h2>
          <div className={styles.courseScroll}>
            {COURSES.map((c, i) => (
              <motion.div
                key={c.name}
                className={styles.courseCard}
                initial={{ opacity: 0, x: 30 }}
                animate={coursesInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={styles.courseCardBg} />
                <span className={styles.courseDifficulty}>{c.difficulty}</span>
                <p className={styles.courseName}>{c.name}</p>
                <p className={styles.courseLocation}>{c.location}</p>
              </motion.div>
            ))}
          </div>
          <p className={styles.coursesNote}>100+ courses available — ask us for the full list when you book.</p>
        </div>
      </section>

      {/* Packages */}
      <section className={styles.packagesSection}>
        <div className={styles.packagesSectionInner}>
          <span className={styles.eyebrow}>Choose Your Experience</span>
          <h2 className={styles.sectionHeading}>Three ways to<br/><em>spend your afternoon.</em></h2>
          <div className={styles.packagesGrid}>
            {PACKAGES.map(pkg => (
              <div key={pkg.id} className={`${styles.pkgCard} ${pkg.tag === 'RECOMMENDED' ? styles.pkgCardFeatured : ''}`}>
                {pkg.tag && <span className={styles.pkgTag}>{pkg.tag}</span>}
                <h3 className={styles.pkgName}>{pkg.name}</h3>
                <ul className={styles.pkgDetails}>
                  {pkg.details.map(d => <li key={d} className={styles.pkgDetail}><span className={styles.pkgDot}/>{d}</li>)}
                </ul>
                <button className={styles.pkgCta} onClick={() => openModal('golf')}>Enquire →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Plays Here */}
      <section className={styles.audienceSection}>
        <div className={styles.audienceInner}>
          <span className={styles.eyebrow}>Who Plays Here</span>
          <div className={styles.audienceGrid}>
            {AUDIENCES.map((a, i) => (
              <motion.div
                key={a.type}
                className={styles.audienceCard}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.1, duration: 0.7 }}
              >
                <span className={styles.audienceIcon}>{a.icon}</span>
                <h3 className={styles.audienceType}>{a.type}</h3>
                <p className={styles.audienceDesc}>{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Inline booking */}
      <section className={styles.bookingSection}>
        <div className={styles.bookingInner}>
          <h2 className={styles.bookingHeading}>Choose your afternoon.</h2>
          <p className={styles.bookingSub}>Fill in the details and we'll confirm within 2 hours via WhatsApp.</p>
          <div className={styles.bookingForm}>
            <GolfBookingModal onClose={() => {}} />
          </div>
        </div>
      </section>
    </div>
  )
}

export default GolfPage
