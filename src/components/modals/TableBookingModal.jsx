import { useState } from 'react'
import { motion } from 'framer-motion'
import { trackBookingCompleted } from '../../utils/analytics'
import toast from 'react-hot-toast'

const TIME_SLOTS = {
  Lunch: ['12:30 PM', '1:00 PM', '1:30 PM'],
  Dinner: ['7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'],
}
const SEATING = ['Garden', 'Terrace', 'Indoor', 'Bar Seating', 'No Preference']
const OCCASIONS = ['Regular Dining', 'Anniversary', 'Birthday', 'Proposal', 'Business Dinner', 'Sunday Brunch', 'Special Occasion']

const TableBookingModal = ({ prefill = {}, onClose }) => {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    date: '', timeSlot: prefill.timeSlot || '',
    covers: 2, seating: [], occasion: prefill.occasion || '',
    requests: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleChip = (key, val) =>
    set(key, form[key].includes(val) ? form[key].filter(x => x !== val) : [...form[key], val])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.date || !form.timeSlot) {
      toast.error('Please fill in name, phone, date and time slot.')
      return
    }
    setLoading(true)
    try {
      // EmailJS integration — owner replaces placeholder IDs
      // await emailjs.send('service_basque', 'table_booking', { ...form }, 'YOUR_PUBLIC_KEY')
      await new Promise(r => setTimeout(r, 900)) // simulate
      setSuccess(true)
      trackBookingCompleted('table', form.date)
    } catch {
      toast.error('Something went wrong. Please try WhatsApp or call us.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="successBox">
      <div className="successCheck">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M5 14L11 20L23 8" stroke="#48b076" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="successTitle">Your request has been received.</p>
      <p className="successBody">We'll confirm via WhatsApp within 2 hours. For urgent enquiries, call us directly.</p>
      <button className="submitBtn" onClick={onClose}>Back to Basque →</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="modalHeading">Reserve a Table</h2>
      <p className="modalSub">We'll confirm within 2 hours via WhatsApp.</p>

      <div className="fieldGroup">
        <div>
          <label className="fieldLabel">Your Name *</label>
          <input className="fieldInput" type="text" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Full name" />
        </div>
        <div>
          <label className="fieldLabel">Phone (WhatsApp) *</label>
          <input className="fieldInput" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="+91 XXXXX XXXXX" />
        </div>
        <div>
          <label className="fieldLabel">Email (optional)</label>
          <input className="fieldInput" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" />
        </div>
      </div>

      <div className="fieldDivider" />

      <div className="fieldGroup">
        <div>
          <label className="fieldLabel">Date *</label>
          <input className="fieldInput" type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)} required />
        </div>

        <div>
          <label className="fieldLabel">Time Slot *</label>
          {Object.entries(TIME_SLOTS).map(([meal, slots]) => (
            <div key={meal} style={{ marginBottom: 10 }}>
              <p style={{ fontFamily: 'var(--font-sc)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--amber)', marginBottom: 6 }}>{meal.toUpperCase()}</p>
              <div className="chipRow">
                {slots.map(s => (
                  <button key={s} type="button" className={`chip ${form.timeSlot === s ? 'active' : ''}`} onClick={() => set('timeSlot', s)}>{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="fieldLabel">Number of Covers</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button type="button" className="chip" onClick={() => set('covers', Math.max(1, form.covers - 1))}>−</button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--teak)' }}>{form.covers}</span>
            <button type="button" className="chip" onClick={() => set('covers', Math.min(20, form.covers + 1))}>+</button>
          </div>
          {form.covers >= 15 && <p style={{ fontSize: '0.75rem', color: 'var(--amber)', marginTop: 6 }}>Up to 20 covers online. Larger groups, call us directly.</p>}
        </div>
      </div>

      <div className="fieldDivider" />

      <div className="fieldGroup">
        <div>
          <label className="fieldLabel">Seating Preference</label>
          <div className="chipRow">
            {SEATING.map(s => (
              <button key={s} type="button" className={`chip ${form.seating.includes(s) ? 'active' : ''}`} onClick={() => toggleChip('seating', s)}>{s}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="fieldLabel">Occasion</label>
          <div className="chipRow">
            {OCCASIONS.map(o => (
              <button key={o} type="button" className={`chip ${form.occasion === o ? 'active' : ''}`} onClick={() => set('occasion', o)}>{o}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="fieldLabel">Special Requests (optional)</label>
          <textarea className="fieldInput" rows={3} value={form.requests} maxLength={200} onChange={e => set('requests', e.target.value)} placeholder="Dietary requirements, allergies, celebrations…" style={{ resize: 'vertical' }} />
          <p style={{ fontSize: '0.7rem', color: 'rgba(28,20,16,0.4)', marginTop: 4, textAlign: 'right' }}>{form.requests.length}/200</p>
        </div>
      </div>

      <motion.button
        type="submit"
        className="submitBtn"
        disabled={loading}
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? 'Sending…' : 'Confirm Table Reservation →'}
      </motion.button>
    </form>
  )
}

export default TableBookingModal
