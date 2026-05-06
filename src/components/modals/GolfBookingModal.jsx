import { useState } from 'react'
import { motion } from 'framer-motion'
import { trackBookingCompleted } from '../../utils/analytics'
import toast from 'react-hot-toast'

const DURATIONS = ['1 hour', '2 hours', '3 hours', 'Half day (4 hrs)']
const EXPERIENCE = ['First time', 'Occasional golfer', 'Regular golfer', 'Competitive player']

const GolfBookingModal = ({ onClose }) => {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    date: '', timeSlot: '', duration: '', players: 1,
    experience: '', course: '',
    addBar: false, barTime: '',
    addDining: false,
    requests: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.date) {
      toast.error('Please fill in name, phone and date.')
      return
    }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 900))
      setSuccess(true)
      trackBookingCompleted('golf', form.date)
    } catch {
      toast.error('Something went wrong. Please try WhatsApp or call us.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="successBox">
      <div className="successCheck">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14L11 20L23 8" stroke="#48b076" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <p className="successTitle">Simulator bay reserved.</p>
      <p className="successBody">We'll confirm via WhatsApp within 2 hours. Get ready to play Augusta.</p>
      <button className="submitBtn" onClick={onClose}>Back to Basque →</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="modalHeading">Book the Golf Simulator</h2>
      <p className="modalSub">Private bay. 100+ courses. Equipment included.</p>

      <div className="fieldGroup">
        <div><label className="fieldLabel">Name *</label><input className="fieldInput" type="text" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Full name"/></div>
        <div><label className="fieldLabel">Phone (WhatsApp) *</label><input className="fieldInput" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="+91 XXXXX XXXXX"/></div>
        <div><label className="fieldLabel">Email (optional)</label><input className="fieldInput" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com"/></div>
      </div>

      <div className="fieldDivider"/>

      <div className="fieldGroup">
        <div><label className="fieldLabel">Date *</label><input className="fieldInput" type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)} required/></div>
        <div><label className="fieldLabel">Preferred Time</label><input className="fieldInput" type="time" value={form.timeSlot} onChange={e => set('timeSlot', e.target.value)}/></div>
        <div>
          <label className="fieldLabel">Duration</label>
          <div className="chipRow">{DURATIONS.map(d => <button key={d} type="button" className={`chip ${form.duration === d ? 'active' : ''}`} onClick={() => set('duration', d)}>{d}</button>)}</div>
        </div>
        <div>
          <label className="fieldLabel">Number of Players (max 8)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button type="button" className="chip" onClick={() => set('players', Math.max(1, form.players - 1))}>−</button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--teak)' }}>{form.players}</span>
            <button type="button" className="chip" onClick={() => set('players', Math.min(8, form.players + 1))}>+</button>
          </div>
        </div>
      </div>

      <div className="fieldDivider"/>

      <div className="fieldGroup">
        <div>
          <label className="fieldLabel">Your Experience</label>
          <div className="chipRow">{EXPERIENCE.map(e => <button key={e} type="button" className={`chip ${form.experience === e ? 'active' : ''}`} onClick={() => set('experience', e)}>{e}</button>)}</div>
        </div>
        <div>
          <label className="fieldLabel">Any course in mind? (optional)</label>
          <input className="fieldInput" type="text" value={form.course} onChange={e => set('course', e.target.value)} placeholder="e.g. Augusta National, St Andrews…"/>
          <p style={{ fontSize: '0.7rem', color: 'rgba(28,20,16,0.45)', marginTop: 4 }}>100+ courses including Augusta, St Andrews, Pebble Beach, Emirates Golf Club and more.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--teak)', flex: 1 }}>Add post-session bar table?</span>
          <button type="button" className={`chip ${form.addBar ? 'active' : ''}`} onClick={() => set('addBar', !form.addBar)}>{form.addBar ? 'Yes ✓' : 'No'}</button>
        </div>
        {form.addBar && <div><label className="fieldLabel">Bar table time?</label><input className="fieldInput" type="time" value={form.barTime} onChange={e => set('barTime', e.target.value)}/></div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--teak)', flex: 1 }}>Add dining package?</span>
          <button type="button" className={`chip ${form.addDining ? 'active' : ''}`} onClick={() => set('addDining', !form.addDining)}>{form.addDining ? 'Yes ✓' : 'No'}</button>
        </div>
        <div><label className="fieldLabel">Special Requests</label><textarea className="fieldInput" rows={2} value={form.requests} onChange={e => set('requests', e.target.value)} placeholder="Anything else?" style={{ resize: 'vertical' }}/></div>
      </div>

      <motion.button type="submit" className="submitBtn" disabled={loading} whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}>
        {loading ? 'Sending…' : 'Book Simulator Bay →'}
      </motion.button>
    </form>
  )
}

export default GolfBookingModal
