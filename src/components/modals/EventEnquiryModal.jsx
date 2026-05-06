import { useState } from 'react'
import { motion } from 'framer-motion'
import { trackBookingCompleted } from '../../utils/analytics'
import toast from 'react-hot-toast'
import styles from './Modal.module.css'

const EVENT_TYPES = ['Corporate retreat', 'Private dining', 'Birthday', 'Anniversary', 'Pre-wedding', 'Sangeet / Mehendi', 'Pickleball tournament', 'Golf day', 'Product launch', 'Other']
const SPACES = ['Garden', 'Verandah / Indoor', 'Terrace', 'Full venue']
const BUDGETS = ['Under ₹2L', '₹2–5L', '₹5–15L', '₹15–30L', 'Above ₹30L']

const guestNote = (n) => {
  if (n >= 150) return "Full venue can accommodate this — we'll arrange everything."
  if (n >= 80) return 'Full garden available for your event.'
  if (n >= 30) return 'Garden section available.'
  return ''
}

const EventEnquiryModal = ({ onClose }) => {
  const [form, setForm] = useState({
    name: '', phone: '',
    eventType: '', date: '',
    guests: 30, space: '', budget: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.eventType) {
      toast.error('Please fill in name, phone and event type.')
      return
    }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 900))
      setSuccess(true)
      trackBookingCompleted('event', form.date)
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
      <h3 className={styles.successTitle}>We'll Be in Touch</h3>
      <p className={styles.successBody}>A real person will call within 24 hours — not a bot, not a template. Great events start with great conversations.</p>
      <button className={styles.closeBtn} onClick={onClose}>Done</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <span className={styles.eyebrow}>Dehradun's Finest Private Venue</span>
      <h2 className={styles.heading}>Create Something Unforgettable</h2>
      <p className={styles.sub}>Heritage gardens, 1924 architecture, bespoke hospitality. Tell us your vision — we'll make it happen exactly as you imagined.</p>

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

      <div className={styles.field}>
        <label className={styles.label}>Event Type *</label>
        <div className={styles.chips}>
          {EVENT_TYPES.map(t => (
            <button key={t} type="button" className={`${styles.chip} ${form.eventType === t ? styles.chipActive : ''}`} onClick={() => set('eventType', form.eventType === t ? '' : t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>Preferred Date</label>
          <input className={styles.input} type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Estimated Guests</label>
          <div className={styles.stepper}>
            <button type="button" className={styles.stepBtn} onClick={() => set('guests', Math.max(10, form.guests - 10))}>−</button>
            <span className={styles.stepVal}>{form.guests}</span>
            <button type="button" className={styles.stepBtn} onClick={() => set('guests', Math.min(300, form.guests + 10))}>+</button>
          </div>
          {guestNote(form.guests) && <p className={styles.fieldNote}>{guestNote(form.guests)}</p>}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Space Preference <span className={styles.optional}>(optional)</span></label>
        <div className={styles.chips}>
          {SPACES.map(s => (
            <button key={s} type="button" className={`${styles.chip} ${form.space === s ? styles.chipActive : ''}`} onClick={() => set('space', form.space === s ? '' : s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Budget <span className={styles.optional}>(optional)</span></label>
        <div className={styles.chips}>
          {BUDGETS.map(b => (
            <button key={b} type="button" className={`${styles.chip} ${form.budget === b ? styles.chipActive : ''}`} onClick={() => set('budget', form.budget === b ? '' : b)}>{b}</button>
          ))}
        </div>
      </div>

      <motion.button type="submit" className={styles.submit} disabled={loading} whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.98 }}>
        {loading ? 'Sending your vision…' : 'Start Planning My Event →'}
      </motion.button>
    </form>
  )
}

export default EventEnquiryModal
