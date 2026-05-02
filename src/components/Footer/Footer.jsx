import { motion } from 'framer-motion'
import styles from './Footer.module.css'

const NAV_LINKS = ['Reserve a Table', 'Book a Court', 'Host an Event', 'Menu', 'About Basque']

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.grid}>
      {/* Brand */}
      <div className={styles.brand}>
        <span className={styles.brandName}>BASQUE</span>
        <span className={styles.brandTagline}>Where Every Afternoon Is A Celebration.</span>
        <div className={styles.socials}>
          <motion.a
            href="#"
            className={styles.socialBtn}
            aria-label="Instagram"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0" />
            </svg>
          </motion.a>
          <motion.a
            href="#"
            className={styles.socialBtn}
            aria-label="Google"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            </svg>
          </motion.a>
        </div>
      </div>

      {/* Navigation */}
      <div>
        <span className={styles.navLabel}>EXPERIENCE</span>
        <ul className={styles.navList}>
          {NAV_LINKS.map((link) => (
            <li key={link}>
              <motion.a
                href="#"
                className={styles.navItem}
                whileHover={{ x: 4, color: 'var(--amber)' }}
                transition={{ duration: 0.25 }}
              >
                {link}
              </motion.a>
            </li>
          ))}
        </ul>
      </div>

      {/* Find Us */}
      <div>
        <span className={styles.findLabel}>FIND US</span>
        <address className={styles.address}>
          Rajpur Road<br />
          Dehradun, Uttarakhand 248001
        </address>
        <motion.a
          href="#"
          className={styles.directionsBtn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{ marginTop: '20px' }}
        >
          Get Directions →
        </motion.a>
      </div>
    </div>

    <div className={styles.bottomBar}>
      <span className={styles.bottomText}>© 2025 Basque. All Rights Reserved.</span>
      <span className={styles.bottomText}>Crafted with precision by Digital Byte Solutions</span>
    </div>
  </footer>
)

export default Footer
