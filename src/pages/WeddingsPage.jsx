import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useModal } from '../context/ModalContext'
import styles from './WeddingsPage.module.css'

const STATS = [
  { value: '50+', label: 'Weddings Celebrated' },
  { value: '1924', label: 'Heritage Since' },
  { value: '300', label: 'Guests, Comfortably' },
  { value: '4', label: 'Distinct Venues' },
]

const SPACES = [
  {
    name: 'The Heritage Garden',
    capacity: 'Up to 300 guests',
    desc: 'Fairy-lit lawns beneath century-old trees. The garden speaks for itself — no decorator required. This is the space that makes guests forget they are in Dehradun.',
    mood: 'Outdoor · Evening Ceremonies · Receptions',
    gradient: 'linear-gradient(135deg, #1A2A18 0%, #2A3D28 100%)',
  },
  {
    name: 'The Verandah',
    capacity: 'Up to 80 guests',
    desc: 'Colonial-era columns, warm amber light, and the scent of heritage stone. Intimate enough to feel personal. Grand enough to feel like an occasion.',
    mood: 'Indoor · Intimate Ceremonies · Dinners',
    gradient: 'linear-gradient(135deg, #2A1A0E 0%, #4A2A1A 100%)',
  },
  {
    name: 'The Mountain Terrace',
    capacity: 'Up to 120 guests',
    desc: 'The Shivaliks as your backdrop. Ceremonies here are photographed by guests who never expected to be photographers. The view does everything.',
    mood: 'Open Air · Morning Ceremonies · Brunches',
    gradient: 'linear-gradient(135deg, #1A1A2A 0%, #2E2A3D 100%)',
  },
  {
    name: 'Full Estate Buyout',
    capacity: 'Entire property, yours',
    desc: 'Take over every corner of Basque — the restaurant, the garden, the bar, the courts. For a weekend that no guest will ever stop talking about.',
    mood: 'Multi-Day · Weekend Weddings · Full Access',
    gradient: 'linear-gradient(135deg, #1C1408 0%, #3D2A0A 100%)',
  },
]

const WHYS = [
  {
    title: 'The setting does the work.',
    body: 'A venue this old doesn\'t need decoration. The heritage stone, the trees, the mountain views — they\'ve been here since 1924. Your photographer will thank you on the day.',
  },
  {
    title: 'One kitchen, one standard.',
    body: 'The same team that runs the restaurant every night is the same team that runs your wedding. Not a catering contractor. Not a third party. Your food will taste exactly as you hoped it would.',
  },
  {
    title: 'No surprise costs.',
    body: 'We tell you the number on day one. No per-head charge that spirals, no "additional venue fee" on the invoice. The figure you agree to is the figure you pay.',
  },
  {
    title: 'Decades of doing this.',
    body: '50+ weddings in this garden. We have seen every situation, managed every rain, handled every last-minute change. You will not be the first couple to relax once you hand it to us.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'We looked at five hotels in Dehradun. Nothing came close. Basque felt like it was built specifically for our wedding, and it has been there for a hundred years.',
    names: 'Priya & Arjun',
    detail: 'Garden Ceremony · December',
  },
  {
    quote: 'The garden at night, with the fairy lights and the mountain air — our guests still bring it up. One couple even came back for their anniversary dinner.',
    names: 'Sunita & Rohan',
    detail: 'Full Estate · February',
  },
]

const SpaceCard = ({ space, index }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={styles.spaceCard}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.spaceCardBg} style={{ background: space.gradient }} />
      <div className={styles.spaceCardOverlay} />
      <div className={styles.spaceCardContent}>
        <span className={styles.spaceMood}>{space.mood}</span>
        <h3 className={styles.spaceName}>{space.name}</h3>
        <p className={styles.spaceCapacity}>{space.capacity}</p>
        <p className={styles.spaceDesc}>{space.desc}</p>
      </div>
    </motion.div>
  )
}

const WeddingsPage = () => {
  const { openModal } = useModal()
  const spacesRef = useRef(null)

  return (
    <div className={styles.page}>

      {/* Hero */}
      <section className={styles.hero}>
        <video
          className={styles.heroBgVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="https://file.garden/aaq7u9giWjY0-o-W/BASQUE/Indian Wedding.mp4" type="video/mp4" />
        </video>
        <div className={styles.heroOverlay} />
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={styles.heroEyebrow}>Weddings at Basque · Dehradun · Est. 1924</span>
          <h1 className={styles.heroHeading}>
            The place that needs<br />
            <em>no decoration.</em>
          </h1>
          <p className={styles.heroSub}>
            A hundred-year-old garden, mountain views, and the finest table in Uttarakhand.<br />
            December and February dates are almost gone.
          </p>
          <motion.button
            className={styles.heroCta}
            onClick={() => openModal('event')}
            whileHover={{ scale: 1.04, y: -2, boxShadow: '0 20px 50px rgba(200,133,42,0.45)' }}
            whileTap={{ scale: 0.97 }}
          >
            Begin Planning Your Wedding →
          </motion.button>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            className={styles.statItem}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
          >
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Opening Editorial */}
      <section className={styles.editorial}>
        <div className={styles.editorialInner}>
          <span className={styles.eyebrow}>A word before we begin</span>
          <div className={styles.editorialGrid}>
            <h2 className={styles.editorialHeading}>
              Most venues are hired. Basque is<em> chosen.</em>
            </h2>
            <div className={styles.editorialBody}>
              <p>
                The difference is felt the moment you walk in. Heritage stone, century-old trees, and the Shivalik range framing the horizon — this garden was here long before wedding photography existed, and it will outlast every trend.
              </p>
              <p>
                We do not overcrowd the calendar. We take a limited number of weddings each year, and we give each one our full attention. When you book Basque, you book the whole team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Spaces */}
      <section className={styles.spacesSection} ref={spacesRef}>
        <div className={styles.spacesSectionInner}>
          <span className={styles.eyebrow}>The Venues</span>
          <h2 className={styles.sectionHeading}>
            Four ways to say<em> forever.</em>
          </h2>
          <div className={styles.spacesGrid}>
            {SPACES.map((space, i) => (
              <SpaceCard key={space.name} space={space} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Basque */}
      <section className={styles.whySection}>
        <div className={styles.whyInner}>
          <span className={styles.eyebrow}>Why Basque</span>
          <h2 className={styles.sectionHeading}>
            Not a ballroom.<em> A legacy.</em>
          </h2>
          <div className={styles.whyGrid}>
            {WHYS.map((why, i) => (
              <motion.div
                key={why.title}
                className={styles.whyCard}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.1, duration: 0.7 }}
              >
                <span className={styles.whyNum}>0{i + 1}</span>
                <h3 className={styles.whyTitle}>{why.title}</h3>
                <p className={styles.whyBody}>{why.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonialSection}>
        <div className={styles.testimonialInner}>
          <span className={styles.eyebrow}>From Our Couples</span>
          <div className={styles.testimonialGrid}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.names}
                className={styles.testimonialCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
              >
                <span className={styles.testimonialMark}>"</span>
                <p className={styles.testimonialQuote}>{t.quote}</p>
                <div className={styles.testimonialMeta}>
                  <span className={styles.testimonialNames}>{t.names}</span>
                  <span className={styles.testimonialDetail}>{t.detail}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <span className={styles.ctaEyebrow}>Limited Dates Available</span>
          <h2 className={styles.ctaHeading}>
            December and February<br />
            <em>go first.</em>
          </h2>
          <p className={styles.ctaSub}>
            We take a select number of weddings per year. Most popular months book 8–12 months out.
            If you have a date in mind, the conversation should start now.
          </p>
          <motion.button
            className={styles.ctaBtn}
            onClick={() => openModal('event')}
            whileHover={{ scale: 1.04, y: -2, boxShadow: '0 24px 60px rgba(200,133,42,0.5)' }}
            whileTap={{ scale: 0.97 }}
          >
            Check Your Date →
          </motion.button>
          <p className={styles.ctaNote}>We respond within 4 hours. No obligation.</p>
        </div>
      </section>

    </div>
  )
}

export default WeddingsPage
