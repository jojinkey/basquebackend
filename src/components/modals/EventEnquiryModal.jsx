import { useState } from 'react'
import { motion } from 'framer-motion'
import { trackBookingCompleted } from '../../utils/analytics'
import toast from 'react-hot-toast'

const EVENT_TYPES = ['Corporate retreat','Private dining','Birthday celebration','Anniversary','Pre-wedding shoot','Sangeet / Mehendi','Pickleball tournament','Golf day','Product launch','Other']
const SPACES = ['Garden','Verandah / Indoor','Terrace','Full venue exclusive']
const BUDGETS = ['Under ₹2 lakhs','₹2–5 lakhs','₹5–15 lakhs','₹15–30 lakhs','Above ₹30 lakhs','Prefer not to say']
const SOURCES = ['Google Search','Instagram','Word of mouth','A friend','Drive-by','Other']

const guestNote = (n) => {
  if (n >= 150) return 'Full venue can accommodate this — we'll arrange everything.'
  if (n >= 80) return 'Full garden available for your event.'
  if (n >= 30) return 'Garden section available.'
  return ''
}

const EventEnquiryModal = ({ onClose }) => {
  const [form, setForm] = useState({
    name: '', org: '', phone: '', email: '',
    eventType: '', date: '', altDate: '',
    guests: 30, space: '', budget: '',
    description: '', source: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

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
      toast.error('Something went wrong. Please try WhatsApp or call us.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="successBox">
      <div className="successCheck">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14L11 20L23 8" stroke="#48b076" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <p className="successTitle">Your request has been received.</p>
      <p className="successBody">We respond within 24 hours — no automated replies. We'll be in touch personally.</p>
      <button className="submitBtn" onClick={onClose}>Back to Basque →</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="modalHeading">Host an Event at Basque</h2>
      <p className="modalSub">We respond within 24 hours. No automated replies.</p>

      <div className="fieldGroup">
        <div><label className="fieldLabel">Name *</label><input className="fieldInput" type="text" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Your full name"/></div>
        <div><label className="fieldLabel">Organisation (optional)</label><input className="fieldInput" type="text" value={form.org} onChange={e => set('org', e.target.value)} placeholder="Company / Family name"/></div>
        <div><label className="fieldLabel">Phone *</label><input className="fieldInput" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="+91 XXXXX XXXXX"/></div>
        <div><label className="fieldLabel">Email *</label><input className="fieldInput" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="you@email.com"/></div>
      </div>

      <div className="fieldDivider"/>

      <div className="fieldGroup">
        <div>
          <label className="fieldLabel">Event Type *</label>
          <div className="chipRow">{EVENT_TYPES.map(t => <button key={t} type="button" className={`chip ${form.eventType === t ? 'active' : ''}`} onClick={() => set('eventType', t)}>{t}</button>)}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><label className="fieldLabel">Preferred Date</label><input className="fieldInput" type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)}/></div>
          <div style={{ flex: 1 }}><label className="fieldLabel">Alternative Date</label><input className="fieldInput" type="date" value={form.altDate} min={new Date().toISOString().split('T')[0]} onChange={e => set('altDate', e.target.value)}/></div>
        </div>
        <div>
          <label className="fieldLabel">Estimated Guests</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
            <button type="button" className="chip" onClick={() => set('guests', Math.max(10, form.guests - 10))}>−</button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--teak)', minWidth: 40, textAlign: 'center' }}>{form.guests}</span>
            <button type="button" className="chip" onClick={() => set('guests', Math.min(300, form.guests + 10))}>+</button>
          </div>
          {guestNote(form.guests) && <p style={{ fontSize: '0.75rem', color: 'var(--amber)' }}>{guestNote(form.guests)}</p>}
        </div>
      </div>

      <div className="fieldDivider"/>

      <div className="fieldGroup">
        <div>
          <label className="fieldLabel">Space Preference</label>
          <div className="chipRow">{SPACES.map(s => <button key={s} type="button" className={`chip ${form.space === s ? 'active' : ''}`} onClick={() => set('space', s)}>{s}</button>)}</div>
        </div>
        <div>
          <label className="fieldLabel">Budget Indication</label>
          <div className="chipRow">{BUDGETS.map(b => <button key={b} type="button" className={`chip ${form.budget === b ? 'active' : ''}`} onClick={() => set('budget', b)}>{b}</button>)}</div>
        </div>
        <div><label className="fieldLabel">Tell us about your event</label><textarea className="fieldInput" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="How are you imagining it?" style={{ resize: 'vertical' }}/></div>
        <div>
          <label className="fieldLabel">How did you find us?</label>
          <div className="chipRow">{SOURCES.map(s => <button key={s} type="button" className={`chip ${form.source === s ? 'active' : ''}`} onClick={() => set('source', s)}>{s}</button>)}</div>
        </div>
      </div>

      <motion.button type="submit" className="submitBtn" disabled={loading} whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}>
        {loading ? 'Sending…' : 'Send Event Enquiry →'}
      </motion.button>
    </form>
  )
}

export default EventEnquiryModal
