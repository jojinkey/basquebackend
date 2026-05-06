import { useState } from 'react'
import { motion } from 'framer-motion'
import TimeSlotPicker from './TimeSlotPicker'
import { trackBookingCompleted } from '../../utils/analytics'
import toast from 'react-hot-toast'
import styles from './Modal.module.css'

const OCCASIONS = ['Anniversary', 'Birthday', 'Proposal', 'Business Dinner', 'Sunday Brunch', 'None']

const TableBookingModal = ({ prefill = {}, onClose }) => {
  const [form, setForm] = useState({
    name: '', phone: '',
    date: '', slot: prefill.slot || '',
    covers: 2, occasion: prefill.occasion || '',
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
      await new Promise(r => setTimeout(r, 900))
      setSuccess(true)
      trackBookingCompleted('table', form.date)
    } catch {
      toast.error('Something went wrong. Please call or WhatsApp us directly.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className={styles.successBox}>
      <div className={styles.successIcon}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M5 14L11 20L23 8" stroke="#48b076" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 className={styles.successTitle}>Reservation Received</h3>
      <p className={styles.successBody}>We'll confirm on WhatsApp within 2 hours. See you at Basque.</p>
      <button className={styles.closeBtn} onClick={onClose}>Done</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <span className={styles.eyebrow}>The Restaurant at Basque</span>
      <h2 className={styles.heading}>Reserve a Table</h2>
      <p className={styles.sub}>We'll confirm within 2 hours via WhatsApp.</p>

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
          <label className={styles.label}>Date *</label>
          <input className={styles.input} type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Covers</label>
          <div className={styles.stepper}>
            <button type="button" className={styles.stepBtn} onClick={() => set('covers', Math.max(1, form.covers - 1))}>−</button>
            <span className={styles.stepVal}>{form.covers}</span>
            <button type="button" className={styles.stepBtn} onClick={() => set('covers', Math.min(20, form.covers + 1))}>+</button>
          </div>
          {form.covers >= 15 && <p className={styles.fieldNote}>For 15+ covers, we'll call to confirm.</p>}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Available Times *</label>
        <TimeSlotPicker date={form.date} type="table" value={form.slot} onChange={v => set('slot', v)} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Occasion <span className={styles.optional}>(optional)</span></label>
        <div className={styles.chips}>
          {OCCASIONS.map(o => (
            <button key={o} type="button" className={`${styles.chip} ${form.occasion === o ? styles.chipActive : ''}`} onClick={() => set('occasion', form.occasion === o ? '' : o)}>{o}</button>
          ))}
        </div>
      </div>

      <motion.button type="submit" className={styles.submit} disabled={loading} whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.98 }}>
        {loading ? 'Sending…' : 'Confirm Reservation →'}
      </motion.button>
    </form>
  )
}

export default TableBookingModal
