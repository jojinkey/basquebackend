import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../../context/ModalContext'
import styles from './Navbar.module.css'

const NAV_ITEMS = ['Reserve a Table', 'Book a Court', 'Upcoming Events', 'Host an Event', 'Golf Simulator', 'Menu']

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [courtDropdown, setCourtDropdown] = useState(false)
  const { scrollY } = useScroll()
  const { openModal } = useModal()
  const navigate = useNavigate()

  const handleNavAction = (item) => {
    setMenuOpen(false)
    if (item === 'Reserve a Table') openModal('table')
    else if (item === 'Book a Court') openModal('court')
    else if (item === 'Upcoming Events') navigate('/events')
    else if (item === 'Host an Event') openModal('event')
    else if (item === 'Golf Simulator') openModal('golf')
    else if (item === 'Menu') navigate('/menu')
  }

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
          href="/"
          className={styles.logo}
          style={{
            color: useTransform(scrollY, [0, 80],
              ['var(--warm-white)', 'var(--teak)']),
          }}
        >
          BASQUE
        </motion.a>

        <div className={styles.actions}>
          {/* Reserve a Table — with pulse dot */}
          <div className={styles.btnWrap}>
            <div className={styles.pulseDot}>
              <div className={styles.pulseDotCore} />
              <div className={styles.pulseDotRing} />
            </div>
            <motion.button
              className={styles.btnFilled}
              onClick={() => openModal('table')}
              whileHover={{ scale: 1.03, y: -2, boxShadow: '0 10px 30px var(--amber-glow)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              Reserve a Table
            </motion.button>
          </div>

          {/* Book a Court — with dropdown */}
          <div
            className={styles.dropdownWrap}
            onMouseEnter={() => setCourtDropdown(true)}
            onMouseLeave={() => setCourtDropdown(false)}
          >
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
              Book a Court ▾
            </motion.button>

            <AnimatePresence>
              {courtDropdown && (
                <motion.div
                  className={styles.dropdown}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <button className={styles.dropdownItem} onClick={() => { setCourtDropdown(false); openModal('court') }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="10" rx="5" ry="3.5" stroke="var(--amber)" strokeWidth="1.2"/><path d="M11 7l4-4" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    Pickleball Court
                  </button>
                  <button className={styles.dropdownItem} onClick={() => { setCourtDropdown(false); openModal('golf') }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12V5" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round"/><path d="M8 5l5 2.5-5 2.5" stroke="var(--amber)" strokeWidth="1.2" strokeLinejoin="round"/><path d="M4 14h8" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    Golf Simulator
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            className={styles.btnOutlined}
            style={{
              color: useTransform(scrollY, [0, 80],
                ['var(--warm-white)', 'var(--amber)']),
            }}
            onClick={() => navigate('/events')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            Upcoming Events
          </motion.button>

          <motion.button
            className={styles.btnOutlined}
            style={{
              color: useTransform(scrollY, [0, 80],
                ['var(--warm-white)', 'var(--amber)']),
            }}
            onClick={() => openModal('event')}
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
            onClick={() => navigate('/menu')}
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
                onClick={() => handleNavAction(item)}
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
