import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { useModal } from '../context/ModalContext'
import { eventsApi } from '../services/eventsApi'
import styles from './EventsPage.module.css'

const EVENT_TYPES = [
  {
    title: 'Corporate Retreats',
    desc: 'Half-day and full-day formats. Breakfast to dinner, team-building on the courts, and a programme the team didn\'t know they needed.',
    icon: '🏢',
  },
  {
    title: 'Birthday Dinners',
    desc: 'A private table or a private room. A menu crafted to the guest of honour. An evening they will still be describing in six months.',
    icon: '🎂',
  },
  {
    title: 'Brand Launches',
    desc: 'A location that says something before you do. The garden, the architecture, the mountain backdrop — a venue that does half your brand\'s job for you.',
    icon: '🚀',
  },
  {
    title: 'Anniversary Celebrations',
    desc: 'The restaurant that gets booked a year in advance for the next anniversary. We know the effect. We\'ve seen the callbacks.',
    icon: '🥂',
  },
  {
    title: 'Engagement Parties',
    desc: 'Fairy lights, the mountain view, and a hundred people who genuinely care about the couple. The setting does what words can\'t.',
    icon: '💍',
  },
  {
    title: 'Golf Tournaments',
    desc: 'Private bay tournaments for groups of 4 to 24. Full scoring, catering, a champion\'s dinner after. All in one address.',
    icon: '⛳',
  },
]

const SPACES = [
  {
    name: 'The Heritage Garden',
    capacity: '300 guests',
    type: 'Outdoor · Receptions · Galas',
    desc: 'The flagship. Fairy-lit lawns, century-old trees, and a view of the Shivaliks that every attendee photographs.',
  },
  {
    name: 'The Private Dining Room',
    capacity: '20–40 guests',
    type: 'Indoor · Intimate · Boardroom',
    desc: 'For the event where every detail matters. A chef\'s menu, a curated wine list, complete privacy.',
  },
  {
    name: 'The Mountain Terrace',
    capacity: '80–120 guests',
    type: 'Open Air · Cocktails · Ceremonies',
    desc: 'The Shivaliks as a backdrop. Every photograph from this terrace looks like it was commissioned.',
  },
  {
    name: 'Full Estate Buyout',
    capacity: 'Entire property',
    type: 'Multi-Venue · All Day · Exclusive',
    desc: 'Every square foot of Basque, reserved for your event. Restaurant, bar, garden, courts — all yours.',
  },
]

const WHYS = [
  {
    title: 'One team handles everything.',
    body: 'Catering, décor logistics, bar service, and event coordination — all from a single point of contact. No supplier chain to manage. No day-of surprises.',
  },
  {
    title: 'The venue does the talking.',
    body: 'Heritage stone, a hundred-year-old garden, and mountain views — guests remember where they were. Your event is already halfway to memorable before anyone arrives.',
  },
  {
    title: 'A kitchen that can scale.',
    body: 'The same restaurant team runs events for 20 or 300. The quality does not change with the headcount. We have done this many times.',
  },
  {
    title: 'No arbitrary minimums.',
    body: 'We quote for your event as it is, not as we would prefer it to be. The figure you receive reflects your actual requirements, nothing added for the sake of the margin.',
  },
]

const SpaceCard = ({ space, index }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={styles.spaceCard}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.spaceTop}>
        <h3 className={styles.spaceName}>{space.name}</h3>
        <span className={styles.spaceCapacity}>{space.capacity}</span>
      </div>
      <span className={styles.spaceType}>{space.type}</span>
      <p className={styles.spaceDesc}>{space.desc}</p>
    </motion.div>
  )
}

const EventsPage = () => {
  const { openModal } = useModal()
  const [featuredEvent, setFeaturedEvent] = useState(null)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventsApi.getPublished()
        if (res?.data) {
          setFeaturedEvent(res.data)
        }
      } catch (err) {
        console.error('Failed to load published event:', err)
      }
    }
    fetchEvent()
  }, [])

  return (
    <div className={styles.page}>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={styles.heroEyebrow}>Private Events at Basque · Dehradun · Est. 1924</span>
          <h1 className={styles.heroHeading}>
            Make them<br />
            <em>remember it.</em>
          </h1>
          <p className={styles.heroSub}>
            Heritage garden. Mountain backdrop. A kitchen that doesn't compromise.<br />
            For events that are still being talked about a year later.
          </p>
          <motion.button
            className={styles.heroCta}
            onClick={() => openModal('event')}
            whileHover={{ scale: 1.04, y: -2, boxShadow: '0 20px 50px rgba(200,133,42,0.45)' }}
            whileTap={{ scale: 0.97 }}
          >
            Start Your Enquiry →
          </motion.button>
        </motion.div>
      </section>

      {/* Featured Event Section */}
      {featuredEvent && (
        <section className={styles.featuredEventSection} style={{
          padding: '80px 24px',
          background: '#0c0603',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(200, 133, 42, 0.15)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: featuredEvent.background_image_url ? `linear-gradient(135deg, rgba(26,14,8,0.95) 0%, rgba(10,6,3,0.92) 100%), url(${featuredEvent.background_image_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.85
          }} />
          <motion.div 
            style={{
              position: 'relative',
              maxWidth: '800px',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(200, 133, 42, 0.25)',
              padding: '48px 24px',
              borderRadius: '4px',
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className={styles.eyebrow} style={{ color: 'var(--amber)', letterSpacing: '0.25em' }}>FEATURED UPCOMING EVENT</span>
            <h2 className={styles.sectionHeading} style={{ color: '#f8ebcb', margin: '8px 0', fontSize: '2.5rem', fontFamily: 'var(--font-display)' }}>{featuredEvent.title}</h2>
            {featuredEvent.tagline && (
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '1.05rem', color: 'rgba(248, 235, 203, 0.8)', maxWidth: '600px', margin: '0 auto 8px', lineHeight: 1.5 }}>
                {featuredEvent.tagline}
              </p>
            )}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              justifyContent: 'center',
              margin: '8px 0 16px',
              fontFamily: 'var(--font-sc)',
              fontSize: '0.8rem',
              color: '#f8ebcb',
              opacity: 0.8,
              letterSpacing: '0.12em'
            }}>
              <span>📅 {featuredEvent.event_date}</span>
              {featuredEvent.ticket_types && featuredEvent.ticket_types.length > 0 && (
                <span>🎟️ Tickets from ₹{Math.min(...featuredEvent.ticket_types.map(t => t.price || 0)).toLocaleString()}</span>
              )}
            </div>
            <motion.button
              onClick={() => openModal('eventTicket', { event: featuredEvent })}
              style={{
                background: 'var(--amber)',
                color: 'var(--warm-white)',
                border: 'none',
                padding: '14px 36px',
                fontFamily: 'var(--font-sc)',
                fontSize: '0.72rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                borderRadius: '2px',
                cursor: 'pointer',
                boxShadow: '0 12px 24px rgba(200, 133, 42, 0.2)'
              }}
              whileHover={{ scale: 1.04, y: -2, boxShadow: '0 20px 40px rgba(200, 133, 42, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              Book Tickets Now →
            </motion.button>
          </motion.div>
        </section>
      )}

      {/* Event Types */}
      <section className={styles.typesSection}>
        <div className={styles.typesInner}>
          <span className={styles.eyebrow}>What We Host</span>
          <h2 className={styles.sectionHeading}>
            Six kinds of<em> unforgettable.</em>
          </h2>
          <div className={styles.typesGrid}>
            {EVENT_TYPES.map((evt, i) => (
              <motion.div
                key={evt.title}
                className={styles.typeCard}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
              >
                <span className={styles.typeIcon}>{evt.icon}</span>
                <h3 className={styles.typeTitle}>{evt.title}</h3>
                <p className={styles.typeDesc}>{evt.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Venue Spaces */}
      <section className={styles.spacesSection}>
        <div className={styles.spacesInner}>
          <span className={styles.eyebrow}>The Venues</span>
          <h2 className={styles.sectionHeading}>
            Four spaces.<em> One address.</em>
          </h2>
          <div className={styles.spacesGrid}>
            {SPACES.map((space, i) => (
              <SpaceCard key={space.name} space={space} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Basque Over a Hotel */}
      <section className={styles.whySection}>
        <div className={styles.whyInner}>
          <span className={styles.eyebrow}>Why Not a Hotel Ballroom</span>
          <h2 className={styles.sectionHeading}>
            The difference is<em> felt immediately.</em>
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
                <div className={styles.whyAccent} />
                <h3 className={styles.whyTitle}>{why.title}</h3>
                <p className={styles.whyBody}>{why.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Strip */}
      <section className={styles.processSection}>
        <div className={styles.processInner}>
          <span className={styles.eyebrow}>How It Works</span>
          <div className={styles.processSteps}>
            {[
              { step: '01', label: 'Enquire', desc: 'Tell us the occasion, the date, and the guest count. Takes two minutes.' },
              { step: '02', label: 'We Respond', desc: 'Within 4 hours. We\'ll confirm availability and ask the right questions.' },
              { step: '03', label: 'A Proposal', desc: 'A clear, no-surprise quote for exactly what you asked for.' },
              { step: '04', label: 'It Happens', desc: 'We handle the rest. You attend your event as a guest, not a coordinator.' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                className={styles.processStep}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <span className={styles.processNum}>{s.step}</span>
                <h3 className={styles.processLabel}>{s.label}</h3>
                <p className={styles.processDesc}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <span className={styles.ctaEyebrow}>4-Hour Response Guaranteed</span>
          <h2 className={styles.ctaHeading}>
            Tell us your vision.<br />
            <em>We'll make it happen.</em>
          </h2>
          <p className={styles.ctaSub}>
            No commitment required to enquire. We'll send you availability, capacity, and a clear quote.
            Most events are confirmed within 48 hours of the first message.
          </p>
          <motion.button
            className={styles.ctaBtn}
            onClick={() => openModal('event')}
            whileHover={{ scale: 1.04, y: -2, boxShadow: '0 24px 60px rgba(200,133,42,0.5)' }}
            whileTap={{ scale: 0.97 }}
          >
            Begin Your Enquiry →
          </motion.button>
          <p className={styles.ctaNote}>We respond within 4 hours. No obligation.</p>
        </div>
      </section>

    </div>
  )
}

export default EventsPage
