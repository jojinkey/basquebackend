import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useState } from 'react'
import styles from './Navbar.module.css'

const NAV_ITEMS = ['Reserve a Table', 'Book a Court', 'Host an Event', 'Menu']

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const { scrollY } = useScroll()
  const scrolled = useTransform(scrollY, [0, 80], [0, 1])

  return (
    <>
      <motion.nav
        className={styles.navbar}
        style={{
          backgroundColor: useTransform(scrollY, [0, 80],
            ['rgba(0,0,0,0)', 'rgba(245,240,232,0.92)']),
          backdropFilter: useTransform(scrollY, [0, 80],
            ['blur(0px)', 'blur(24px)']),
          borderBottomColor: useTransform(scrollY, [0, 80],
            ['rgba(200,133,42,0)', 'rgba(200,133,42,0.2)']),
        }}
      >
        <motion.a
          href="#"
          className={styles.logo}
          style={{
            color: useTransform(scrollY, [0, 80],
              ['var(--warm-white)', 'var(--teak)']),
          }}
        >
          BASQUE
        </motion.a>

        <div className={styles.actions}>
          <motion.button
            className={styles.btnFilled}
            whileHover={{ scale: 1.03, y: -2, boxShadow: '0 10px 30px var(--amber-glow)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            Reserve a Table
          </motion.button>

          <motion.button
            className={styles.btnOutlined}
            style={{
              color: useTransform(scrollY, [0, 80],
                ['var(--warm-white)', 'var(--amber)']),
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            Book a Court
          </motion.button>

          <motion.button
            className={styles.btnOutlined}
            style={{
              color: useTransform(scrollY, [0, 80],
                ['var(--warm-white)', 'var(--amber)']),
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            Host an Event
          </motion.button>

          <motion.button
            className={styles.btnGhost}
            style={{
              color: useTransform(scrollY, [0, 80],
                ['var(--warm-white)', 'var(--teak)']),
            }}
            whileHover={{ color: 'var(--amber)' }}
          >
            Menu
          </motion.button>
        </div>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            {NAV_ITEMS.map((item, i) => (
              <motion.button
                key={item}
                className={styles.mobileItem}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
