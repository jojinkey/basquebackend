import { useState } from 'react'
import { motion } from 'framer-motion'
import { trackBookingCompleted } from '../../utils/analytics'
import toast from 'react-hot-toast'

const HOURS = ['8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM']
const SKILL = ['Complete beginner', 'Some experience', 'Regular player']
const EQUIPMENT = ['Paddles', 'Balls', 'Both', 'Bringing my own']

const CourtBookingModal = ({ onClose }) => {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    date: '', startHour: '', duration: 1, players: 2,
    skill: '', equipment: '',
    addBar: false, barTime: '',
    requests: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.date || !form.startHour) {
      toast.error('Please fill in name, phone, date and time.')
      return
    }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 900))
      setSuccess(true)
      trackBookingCompleted('court', form.date)
    } catch {
      toast.error('Something went wrong. Please try WhatsApp or call us.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="successBox">
      <div className="successCheck">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14L11 20L23 8" stroke="#48b076" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <p className="successTitle">Court booked!</p>
      <p className="successBody">We'll confirm via WhatsApp within 2 hours. See you on the court.</p>
      <button className="submitBtn" onClick={onClose}>Back to Basque →</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="modalHeading">Book a Pickleball Court</h2>
      <p className="modalSub">Hourly slots. Equipment available on-site.</p>

      <div className="fieldGroup">
        <div><label className="fieldLabel">Name *</label><input className="fieldInput" type="text" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Full name"/></div>
        <div><label className="fieldLabel">Phone (WhatsApp) *</label><input className="fieldInput" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="+91 XXXXX XXXXX"/></div>
        <div><label className="fieldLabel">Email (optional)</label><input className="fieldInput" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com"/></div>
      </div>

      <div className="fieldDivider"/>

      <div className="fieldGroup">
        <div><label className="fieldLabel">Date *</label><input className="fieldInput" type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)} required/></div>
        <div>
          <label className="fieldLabel">Start Time *</label>
          <div className="chipRow">
            {HOURS.map(h => <button key={h} type="button" className={`chip ${form.startHour === h ? 'active' : ''}`} onClick={() => set('startHour', h)}>{h}</button>)}
          </div>
        </div>
        <div>
          <label className="fieldLabel">Duration</label>
          <div className="chipRow">
            {[1,2,3].map(d => <button key={d} type="button" className={`chip ${form.duration === d ? 'active' : ''}`} onClick={() => set('duration', d)}>{d} hour{d > 1 ? 's' : ''}</button>)}
          </div>
        </div>
        <div>
          <label className="fieldLabel">Number of Players</label>
          <div className="chipRow">
            {[2,3,4].map(p => <button key={p} type="button" className={`chip ${form.players === p ? 'active' : ''}`} onClick={() => set('players', p)}>{p} players</button>)}
          </div>
        </div>
      </div>

      <div className="fieldDivider"/>

      <div className="fieldGroup">
        <div>
          <label className="fieldLabel">Skill Level</label>
          <div className="chipRow">{SKILL.map(s => <button key={s} type="button" className={`chip ${form.skill === s ? 'active' : ''}`} onClick={() => set('skill', s)}>{s}</button>)}</div>
        </div>
        <div>
          <label className="fieldLabel">Equipment Needed</label>
          <div className="chipRow">{EQUIPMENT.map(e => <button key={e} type="button" className={`chip ${form.equipment === e ? 'active' : ''}`} onClick={() => set('equipment', e)}>{e}</button>)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--teak)', flex: 1 }}>Add bar reservation after?</label>
          <button type="button" className={`chip ${form.addBar ? 'active' : ''}`} onClick={() => set('addBar', !form.addBar)}>{form.addBar ? 'Yes ✓' : 'No'}</button>
        </div>
        {form.addBar && <div><label className="fieldLabel">Bar table time?</label><input className="fieldInput" type="time" value={form.barTime} onChange={e => set('barTime', e.target.value)}/></div>}
        <div><label className="fieldLabel">Special Requests</label><textarea className="fieldInput" rows={2} value={form.requests} onChange={e => set('requests', e.target.value)} placeholder="Anything else?" style={{ resize: 'vertical' }}/></div>
      </div>

      <motion.button type="submit" className="submitBtn" disabled={loading} whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}>
        {loading ? 'Sending…' : 'Book Pickleball Court →'}
      </motion.button>
    </form>
  )
}

export default CourtBookingModal
