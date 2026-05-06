import { useState } from 'react'
import { motion } from 'framer-motion'
import { trackBookingCompleted } from '../../utils/analytics'
import toast from 'react-hot-toast'

const PACKAGES = [
  { id: 'round', name: 'The Round', desc: '2 hours simulator · Bar table after', tag: null },
  { id: 'afternoon', name: 'The Afternoon', desc: '3 hours simulator · Lunch or dinner for the group', tag: 'RECOMMENDED' },
  { id: 'corporate', name: 'The Corporate Day', desc: 'Half-day simulator (4 hrs) · Full private dining · Event coordinator', tag: null },
]

const GolfDiningModal = ({ onClose }) => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', package: 'afternoon', date: '', guests: 2, requests: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) { toast.error('Please fill in name and phone.'); return }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 900))
      setSuccess(true)
      trackBookingCompleted('golf_dining', form.date)
    } catch {
      toast.error('Something went wrong. Please try WhatsApp or call us.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="successBox">
      <div className="successCheck">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14L11 20L23 8" stroke="#48b076" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <p className="successTitle">Package enquiry received.</p>
      <p className="successBody">We'll WhatsApp you within 2 hours to confirm everything. Prepare for a great afternoon.</p>
      <button className="submitBtn" onClick={onClose}>Back to Basque →</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="modalHeading">Golf & Dining Package</h2>
      <div style={{ display: 'inline-block', background: 'var(--amber)', color: 'var(--warm-white)', fontFamily: 'var(--font-sc)', fontSize: '0.55rem', letterSpacing: '0.3em', padding: '4px 10px', borderRadius: 2, marginBottom: 10 }}>CURATED EXPERIENCE</div>
      <p className="modalSub">A simulator bay + a table. We'll take care of the timing.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {PACKAGES.map(pkg => (
          <button key={pkg.id} type="button" onClick={() => set('package', pkg.id)} style={{
            padding: '16px 18px', border: `2px solid ${form.package === pkg.id ? 'var(--amber)' : 'rgba(61,35,20,0.15)'}`,
            borderRadius: 4, background: form.package === pkg.id ? 'rgba(200,133,42,0.06)' : 'var(--warm-white)',
            textAlign: 'left', cursor: 'none', position: 'relative', transition: 'all 0.2s ease',
          }}>
            {pkg.tag && <span style={{ position: 'absolute', top: 10, right: 12, fontFamily: 'var(--font-sc)', fontSize: '0.52rem', letterSpacing: '0.2em', color: 'var(--amber)' }}>{pkg.tag}</span>}
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--teak)', marginBottom: 4 }}>{pkg.name}</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'rgba(28,20,16,0.6)', fontWeight: 300 }}>{pkg.desc}</p>
          </button>
        ))}
      </div>

      <div className="fieldDivider"/>

      <div className="fieldGroup">
        <div><label className="fieldLabel">Name *</label><input className="fieldInput" type="text" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Full name"/></div>
        <div><label className="fieldLabel">Phone *</label><input className="fieldInput" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="+91 XXXXX XXXXX"/></div>
        <div><label className="fieldLabel">Email</label><input className="fieldInput" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com"/></div>
        <div><label className="fieldLabel">Preferred Date</label><input className="fieldInput" type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)}/></div>
        <div>
          <label className="fieldLabel">Group Size</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button type="button" className="chip" onClick={() => set('guests', Math.max(1, form.guests - 1))}>−</button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--teak)' }}>{form.guests}</span>
            <button type="button" className="chip" onClick={() => set('guests', Math.min(20, form.guests + 1))}>+</button>
          </div>
        </div>
        <div><label className="fieldLabel">Special Requirements</label><textarea className="fieldInput" rows={2} value={form.requests} onChange={e => set('requests', e.target.value)} placeholder="Dietary needs, preferences…" style={{ resize: 'vertical' }}/></div>
      </div>

      <motion.button type="submit" className="submitBtn" disabled={loading} whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}>
        {loading ? 'Sending…' : 'Enquire About Package →'}
      </motion.button>
    </form>
  )
}

export default GolfDiningModal
