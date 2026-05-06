import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../../context/ModalContext'
import { trackIntentSelected } from '../../utils/analytics'
import styles from './IntentSelector.module.css'

const INTENTS = [
  {
    id: 'dine',
    title: 'I want to dine',
    desc: 'Reserve a table for lunch, dinner, or Sunday brunch.',
    cta: 'Reserve a Table →',
    action: 'modal:table',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M12 6v10M12 6C12 6 8 8 8 14M12 6C12 6 16 8 16 14M12 16v14" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M22 6v24M22 6c0 0 4 4 4 8" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    wide: false,
  },
  {
    id: 'wedding',
    title: 'We\'re getting married',
    desc: 'Plan your wedding at Dehradun\'s most beautiful heritage garden.',
    cta: 'Begin Wedding Planning →',
    action: 'route:/weddings',
    popular: true,
    wide: true,
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="13" cy="18" r="6" stroke="var(--amber)" strokeWidth="1.5"/>
        <circle cx="23" cy="18" r="6" stroke="var(--amber)" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'bar',
    title: 'I\'d like a drink',
    desc: "Walk into the bar — no reservation needed. Open Wed–Sun, 5 PM.",
    cta: 'See the Bar →',
    action: 'route:/bar',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M10 8h16L20 20v10h-4V20L10 8z" stroke="var(--amber)" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M8 8h20" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'pickleball',
    title: 'Let\'s play pickleball',
    desc: 'Book a court by the hour. Equipment available on-site.',
    cta: 'Book a Court →',
    action: 'modal:court',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <ellipse cx="14" cy="22" rx="8" ry="6" stroke="var(--amber)" strokeWidth="1.5"/>
        <path d="M20 16L28 8" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="28" cy="8" r="2" stroke="var(--amber)" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'golf',
    title: 'Try the golf simulator',
    desc: 'Tour-grade simulation. 100+ courses. Book a bay for 1–3 hours.',
    cta: 'Book a Simulator Bay →',
    action: 'modal:golf',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 28V10" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M18 10L28 14L18 18" stroke="var(--amber)" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M10 30h16" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'event',
    title: 'I\'m planning a private event',
    desc: 'Birthdays, corporate retreats, anniversaries, private dinners.',
    cta: 'Explore Event Options →',
    action: 'modal:event',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 8l2.5 5 5.5.8-4 3.9.9 5.5L18 20.5l-4.9 2.7.9-5.5-4-3.9 5.5-.8z" stroke="var(--amber)" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'brunch',
    title: 'I want Sunday brunch',
    desc: 'The Sunday garden brunch. Terrace seating, mountain views, bloody mary.',
    cta: 'Book Sunday Brunch →',
    action: 'modal:table:Sunday Brunch',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="14" r="6" stroke="var(--amber)" strokeWidth="1.5"/>
        <path d="M18 20v8M12 28h12" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 14h2M28 14h2M9 7l1.5 1.5M25.5 7L24 8.5M9 21l1.5-1.5M25.5 21L24 19.5" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'occasion',
    title: 'It\'s a special occasion',
    desc: 'Birthday, anniversary, proposal, celebration dinner.',
    cta: 'Make It Special →',
    action: 'modal:table:Special Occasion',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 8v4M18 24v4M8 18h4M24 18h4" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="18" cy="18" r="6" stroke="var(--amber)" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'explore',
    title: 'I\'m just exploring',
    desc: 'Browse the property, menus, and everything Basque has to offer.',
    cta: 'Explore Basque →',
    action: 'scroll:footer',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="10" stroke="var(--amber)" strokeWidth="1.5"/>
        <path d="M18 8l-3 7 7 3-7 3 3 7" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

const IntentCard = ({ intent, index }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const { openModal } = useModal()
  const navigate = useNavigate()

  const handleClick = () => {
    trackIntentSelected(intent.title)
    const [type, route, prefill] = intent.action.split(':')
    if (type === 'modal') {
      openModal(route, prefill ? { occasion: prefill } : {})
    } else if (type === 'route') {
      navigate(route)
    } else if (type === 'scroll') {
      document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <motion.button
      ref={ref}
      className={`${styles.card} ${intent.wide ? styles.cardWide : ''}`}
      onClick={handleClick}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(61,35,20,0.08)', borderColor: 'var(--amber)' }}
      whileTap={{ scale: 0.98 }}
    >
      {intent.popular && (
        <span className={styles.popularTag}>Most Popular</span>
      )}
      <div className={styles.cardIcon}>{intent.icon}</div>
      <p className={styles.cardTitle}>{intent.title}</p>
      <p className={styles.cardDesc}>{intent.desc}</p>
      <span className={styles.cardCta}>
        {intent.cta}
        <motion.span
          className={styles.arrow}
          initial={{ x: 0 }}
          whileHover={{ x: 4 }}
        >→</motion.span>
      </span>
    </motion.button>
  )
}

const IntentSelector = () => (
  <section className={styles.section}>
    <div className={styles.topRule} />
    <div className={styles.inner}>
      <motion.span
        className={styles.eyebrow}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        Tell Us Why You're Here
      </motion.span>

      <motion.h2
        className={styles.heading}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        What brings you<br/><em>to Basque today?</em>
      </motion.h2>

      <motion.p
        className={styles.sub}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        Select what you have in mind — we'll take you straight there.
      </motion.p>

      <div className={styles.grid}>
        {INTENTS.map((intent, i) => (
          <IntentCard key={intent.id} intent={intent} index={i} />
        ))}
      </div>

      <motion.div
        className={styles.helpRow}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <span className={styles.helpText}>Not sure? Call us and we'll help plan it.</span>
        <a href="tel:+919999999999" className={styles.helpPhone}>+91 99999 99999</a>
        <a
          href="https://wa.me/919999999999?text=Hi%2C%20I'd%20like%20to%20find%20out%20more%20about%20Basque%20Dehradun."
          target="_blank"
          rel="noopener noreferrer"
          className={styles.waBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>
      </motion.div>
    </div>
  </section>
)

export default IntentSelector
