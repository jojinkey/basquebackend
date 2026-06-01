import { useState } from 'react'
import { motion } from 'framer-motion'
import { trackBookingCompleted } from '../../utils/analytics'
import toast from 'react-hot-toast'
import styles from './Modal.module.css'
import { createGolfDiningBooking } from '../../services/bookingApi'

const PACKAGES = [
  { id: 'round', label: 'The Round', desc: '2 hrs simulator · Bar table after' },
  { id: 'afternoon', label: 'The Afternoon', desc: '3 hrs simulator · Lunch or dinner', tag: 'RECOMMENDED' },
  { id: 'corporate', label: 'Corporate Day', desc: 'Half-day · Private dining · Coordinator' },
]

const GolfDiningModal = ({ onClose }) => {
  const [form, setForm] = useState({
    name: '', phone: '',
    date: '', pkg: 'afternoon',
    guests: 2,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      toast.error('Please fill in name and phone.')
      return
    }
    setLoading(true)
    try {
      await createGolfDiningBooking(form)
      setSuccess(true)
      trackBookingCompleted('golf_dining', form.date)
    } catch {
      toast.error('Something went wrong. Please call or WhatsApp us.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className={styles.successBox}>
      <div className={styles.successIcon}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M5 14L11 20L23 8" stroke="#48b076" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 className={styles.successTitle}>Afternoon Secured</h3>
      <p className={styles.successBody}>We'll WhatsApp you within 2 hours with everything confirmed. Prepare to play — and dine — exceptionally well.</p>
      <button className={styles.closeBtn} onClick={onClose}>Done</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <span className={styles.eyebrow}>The Ultimate Basque Experience</span>
      <h2 className={styles.heading}>Book the Full Experience</h2>
      <p className={styles.sub}>Play the world's finest courses, then dine as though you own the place. One afternoon, zero compromises.</p>

      <div className={styles.field}>
        <label className={styles.label}>Select Package</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PACKAGES.map(pkg => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => set('pkg', pkg.id)}
              style={{
                padding: '14px 16px',
                border: `1.5px solid ${form.pkg === pkg.id ? 'var(--amber)' : 'rgba(61,35,20,0.16)'}`,
                borderRadius: 2,
                background: form.pkg === pkg.id ? 'rgba(200,133,42,0.06)' : 'var(--warm-white)',
                textAlign: 'left',
                cursor: 'none',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
            >
              {pkg.tag && (
                <span style={{
                  position: 'absolute', top: 10, right: 12,
                  fontFamily: 'var(--font-sc)', fontSize: '0.48rem',
                  letterSpacing: '0.2em', color: 'var(--amber)',
                }}>{pkg.tag}</span>
              )}
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--teak)', margin: '0 0 3px' }}>{pkg.label}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'rgba(28,20,16,0.55)', fontWeight: 300, margin: 0 }}>{pkg.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>Name *</label>
          <input className={styles.input} type="text" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Your name" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Phone *</label>
          <input className={styles.input} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="+91 XXXXX XXXXX" />
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>Preferred Date</label>
          <input className={styles.input} type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Group Size</label>
          <div className={styles.stepper}>
            <button type="button" className={styles.stepBtn} onClick={() => set('guests', Math.max(1, form.guests - 1))}>−</button>
            <span className={styles.stepVal}>{form.guests}</span>
            <button type="button" className={styles.stepBtn} onClick={() => set('guests', Math.min(20, form.guests + 1))}>+</button>
          </div>
        </div>
      </div>

      <motion.button type="submit" className={styles.submit} disabled={loading} whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.98 }}>
        {loading ? 'Booking your afternoon…' : 'Book My Experience →'}
      </motion.button>
    </form>
  )
}

export default GolfDiningModal