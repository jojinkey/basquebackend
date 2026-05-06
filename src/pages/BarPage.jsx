import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useModal } from '../context/ModalContext'
import styles from './BarPage.module.css'

const HOURS = [
  { days: 'Wednesday – Friday', time: '5 PM – 11 PM' },
  { days: 'Saturday – Sunday', time: '4 PM – Midnight' },
  { days: 'Monday – Tuesday', time: 'Closed' },
]

const COCKTAILS = [
  {
    name: 'The Basque Mule',
    desc: 'Dehradun ginger brew, premium vodka, fresh lime, mountain mint. The bar\'s most reordered drink by a wide margin.',
    note: 'House Signature',
  },
  {
    name: 'Heritage Old Fashioned',
    desc: 'Single malt aged in oak, demerara from Uttarakhand, two dashes Angostura. A drink that respects where it\'s made.',
    note: 'Bartender\'s Pick',
  },
  {
    name: 'The Garden Spritz',
    desc: 'Prosecco, elderflower, cucumber, and a citrus wheel. What the garden looks like, in a glass.',
    note: 'Warm Weather',
  },
]

const BLOCKS = [
  {
    title: 'The Setting',
    body: 'Every table has a view. Some face the garden, where the fairy lights come on at dusk. Some face the mountains, where the last of the sun catches the Shivaliks at six. There is no bad seat in this bar. We checked.',
    icon: '🌿',
  },
  {
    title: 'The Drinks',
    body: 'A full spirits list, a focused cocktail menu, and the same quality control that runs the restaurant next door. The bar team takes the ice as seriously as the pour. It shows in the glass.',
    icon: '🥃',
  },
  {
    title: 'The Snacks',
    body: 'The kitchen sends over. Truffle sliders, crispy calamari, charcuterie arranged by someone who thinks about charcuterie. The food here is not an afterthought. It is half the reason people come.',
    icon: '🍽️',
  },
]

const BarPage = () => {
  const { openModal } = useModal()
  const cocktailsRef = useRef(null)
  const cocktailsInView = useInView(cocktailsRef, { once: true, margin: '-40px' })

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
          <span className={styles.heroEyebrow}>The Bar at Basque · Dehradun</span>
          <h1 className={styles.heroHeading}>
            No reservations.<br />
            <em>Just show up.</em>
          </h1>
          <p className={styles.heroSub}>
            Mountain views. Proper cocktails. The kind of evening that<br />
            turns into a standing plan for every week after.
          </p>
          <div className={styles.heroCtas}>
            <motion.a
              href="https://maps.google.com/?q=Basque+Dehradun"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroCtaPrimary}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Directions →
            </motion.a>
            <motion.button
              className={styles.heroCtaSecondary}
              onClick={() => openModal('table')}
              whileHover={{ borderColor: 'var(--amber)', color: 'var(--amber)' }}
              whileTap={{ scale: 0.97 }}
            >
              Reserve a Table
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Hours Strip */}
      <div className={styles.hoursStrip}>
        <span className={styles.hoursLabel}>Opening Hours</span>
        <div className={styles.hoursList}>
          {HOURS.map((h) => (
            <div key={h.days} className={`${styles.hoursItem} ${h.days.startsWith('Monday') ? styles.hoursItemClosed : ''}`}>
              <span className={styles.hoursDays}>{h.days}</span>
              <span className={styles.hoursDivider} />
              <span className={styles.hoursTime}>{h.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Experience Blocks */}
      <section className={styles.blocksSection}>
        <div className={styles.blocksInner}>
          <span className={styles.eyebrow}>What You Come For</span>
          <h2 className={styles.sectionHeading}>
            Three things that make<em> the evening.</em>
          </h2>
          <div className={styles.blocksGrid}>
            {BLOCKS.map((block, i) => (
              <motion.div
                key={block.title}
                className={styles.blockCard}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className={styles.blockIcon}>{block.icon}</span>
                <h3 className={styles.blockTitle}>{block.title}</h3>
                <p className={styles.blockBody}>{block.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cocktails */}
      <section className={styles.cocktailsSection} ref={cocktailsRef}>
        <div className={styles.cocktailsInner}>
          <span className={styles.eyebrow}>Signature Cocktails</span>
          <h2 className={styles.sectionHeading}>
            Three to start<em> with.</em>
          </h2>
          <div className={styles.cocktailsGrid}>
            {COCKTAILS.map((c, i) => (
              <motion.div
                key={c.name}
                className={styles.cocktailCard}
                initial={{ opacity: 0, x: 30 }}
                animate={cocktailsInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className={styles.cocktailNote}>{c.note}</span>
                <h3 className={styles.cocktailName}>{c.name}</h3>
                <p className={styles.cocktailDesc}>{c.desc}</p>
                <div className={styles.cocktailLine} />
              </motion.div>
            ))}
          </div>
          <p className={styles.menuNote}>Full menu available at the bar — we rotate seasonally.</p>
        </div>
      </section>

      {/* Atmosphere Paragraph */}
      <section className={styles.atmosphereSection}>
        <div className={styles.atmosphereInner}>
          <span className={styles.eyebrow}>The Atmosphere</span>
          <blockquote className={styles.atmosphereQuote}>
            "The bar does not try to be anything it isn't. It is a well-lit room adjacent to a beautiful garden, serving proper drinks to people who drove from Dehradun or walked in from the pickleball courts. The music is at a volume that allows conversation. The staff know the menu. On a good weekend evening, every table has been there before."
          </blockquote>
          <span className={styles.atmosphereSource}>— A guest, on their fifth visit</span>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaLeft}>
            <h2 className={styles.ctaHeading}>Come as you are.</h2>
            <p className={styles.ctaSub}>
              Walk-ins always welcome. If you want a specific table on a busy evening, a quick reservation helps. Either way, the bar will be ready.
            </p>
            <div className={styles.ctaBtns}>
              <motion.button
                className={styles.ctaBtnPrimary}
                onClick={() => openModal('table')}
                whileHover={{ scale: 1.03, y: -2, boxShadow: '0 16px 40px rgba(200,133,42,0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                Reserve a Table →
              </motion.button>
              <motion.a
                href="https://maps.google.com/?q=Basque+Dehradun"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaBtnSecondary}
                whileHover={{ borderColor: 'var(--amber)', color: 'var(--amber)' }}
              >
                Get Directions
              </motion.a>
            </div>
          </div>
          <div className={styles.ctaRight}>
            <div className={styles.ctaInfoCard}>
              <span className={styles.ctaInfoLabel}>Location</span>
              <p className={styles.ctaInfoValue}>Basque, Dehradun<br />Uttarakhand, India</p>
              <span className={styles.ctaInfoLabel} style={{ marginTop: '20px' }}>Walk-ins</span>
              <p className={styles.ctaInfoValue}>Always welcome<br />subject to availability</p>
              <span className={styles.ctaInfoLabel} style={{ marginTop: '20px' }}>Enquiries</span>
              <p className={styles.ctaInfoValue}>WhatsApp preferred<br />We respond quickly</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default BarPage
