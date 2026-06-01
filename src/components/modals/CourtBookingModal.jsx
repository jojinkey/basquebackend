import { useState } from 'react'
import { motion } from 'framer-motion'
import TimeSlotPicker from './TimeSlotPicker'
import { trackBookingCompleted } from '../../utils/analytics'
import toast from 'react-hot-toast'
import styles from './Modal.module.css'
import { createCourtBooking } from '../../services/bookingApi'

const CourtBookingModal = ({ onClose }) => {
  const [form, setForm] = useState({
    name: '', phone: '',
    date: '', slot: '',
    duration: 1, players: 2,
    equipment: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.date || !form.slot) {
      toast.error('Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      await createCourtBooking(form)
      setSuccess(true)
      trackBookingCompleted('court', form.date)
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
      <h3 className={styles.successTitle}>Court Is Yours</h3>
      <p className={styles.successBody}>We'll WhatsApp you within 2 hours. Get your game face on — Dehradun's best court is waiting.</p>
      <button className={styles.closeBtn} onClick={onClose}>Done</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <span className={styles.eyebrow}>Dehradun's Premier Pickleball Courts</span>
      <h2 className={styles.heading}>Reserve Your Court</h2>
      <p className={styles.sub}>Pro-grade courts, mountain air, flood-lit evenings. Courts go fast on weekends — lock in your slot now.</p>

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
        <label className={styles.label}>Date *</label>
        <input className={styles.input} type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)} required style={{ maxWidth: 220 }} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Available Times *</label>
        <TimeSlotPicker date={form.date} type="court" value={form.slot} onChange={v => set('slot', v)} />
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>Duration</label>
          <div className={styles.chips}>
            {[1, 2, 3].map(d => (
              <button key={d} type="button" className={`${styles.chip} ${form.duration === d ? styles.chipActive : ''}`} onClick={() => set('duration', d)}>
                {d} hr{d > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Players</label>
          <div className={styles.chips}>
            {[2, 3, 4].map(p => (
              <button key={p} type="button" className={`${styles.chip} ${form.players === p ? styles.chipActive : ''}`} onClick={() => set('players', p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Equipment</label>
        <div className={styles.chips}>
          {['Paddles', 'Balls', 'Both', 'Bringing my own'].map(e => (
            <button key={e} type="button" className={`${styles.chip} ${form.equipment === e ? styles.chipActive : ''}`} onClick={() => set('equipment', form.equipment === e ? '' : e)}>{e}</button>
          ))}
        </div>
      </div>

      <motion.button type="submit" className={styles.submit} disabled={loading} whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.98 }}>
        {loading ? 'Reserving your court…' : 'Reserve My Court →'}
      </motion.button>
    </form>
  )
}

export default CourtBookingModal