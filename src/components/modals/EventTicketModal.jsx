import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { bookingsApi } from '../../services/eventsApi'
import toast from 'react-hot-toast'
import styles from './Modal.module.css'

const generateBookingRef = () => {
  return 'EVT-' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

const EventTicketModal = ({ prefill = {}, onClose }) => {
  const event = prefill.event

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedTicketType, setSelectedTicketType] = useState(
    event?.ticket_types?.[0]?.id || ''
  )
  const [quantity, setQuantity] = useState(1)
  const [selectedVipPackage, setSelectedVipPackage] = useState('')
  const [utr, setUtr] = useState('')
  const [bookingRef, setBookingRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Calculate pricing
  const ticketObj = useMemo(() => {
    return event?.ticket_types?.find(t => t.id === selectedTicketType)
  }, [event, selectedTicketType])

  const vipObj = useMemo(() => {
    return event?.vip_packages?.find(v => v.id === selectedVipPackage)
  }, [event, selectedVipPackage])

  const ticketTotal = useMemo(() => {
    if (!ticketObj) return 0
    return ticketObj.price * quantity
  }, [ticketObj, quantity])

  const vipTotal = useMemo(() => {
    if (!vipObj) return 0
    return vipObj.price
  }, [vipObj])

  const grandTotal = useMemo(() => {
    return ticketTotal + vipTotal
  }, [ticketTotal, vipTotal])

  const handleNextStep = (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Please enter name, email, and phone number.')
      return
    }
    if (!selectedTicketType) {
      toast.error('Please select a ticket type.')
      return
    }
    setStep(2)
  }

  const handleCopyUpi = () => {
    if (event?.upi_id) {
      navigator.clipboard.writeText(event.upi_id)
      setCopied(true)
      toast.success('UPI ID copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSubmitBooking = async (e) => {
    e.preventDefault()
    if (!utr.trim()) {
      toast.error('Please enter the 12-digit UPI UTR number.')
      return
    }

    const cleanUtr = utr.trim().replace(/\s+/g, '')
    if (!/^\d{12}$/.test(cleanUtr)) {
      toast.error('UTR must be a 12-digit number.')
      return
    }

    setLoading(true)
    const ref = generateBookingRef()

    try {
      const payload = {
        event_id: event.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        ticket_type: ticketObj?.label || 'General',
        quantity: quantity,
        total_amount: grandTotal,
        booking_ref: `${ref} | UTR: ${cleanUtr}`,
        status: 'pending'
      }

      await bookingsApi.create(payload)
      setBookingRef(ref)
      setStep(3)
      toast.success('Booking request submitted!')
    } catch (err) {
      console.error(err)
      toast.error('Booking submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!event) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p className={styles.sub}>No event selected.</p>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      {/* Step 1: Info and Selection */}
      {step === 1 && (
        <form onSubmit={handleNextStep} className={styles.form}>
          <span className={styles.eyebrow}>Event Ticketing</span>
          <h2 className={styles.heading}>{event.title}</h2>
          {event.tagline && <p className={styles.sub}>{event.tagline}</p>}
          <p className={styles.fieldNote} style={{ fontSize: '0.8rem', color: 'var(--teak)', marginBottom: '8px' }}>
            📅 {event.event_date}
          </p>

          <div className={styles.field}>
            <label className={styles.label}>Name *</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Email *</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@email.com"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone *</label>
              <input
                type="tel"
                className={styles.input}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Contact Number"
                required
              />
            </div>
          </div>

          {/* Ticket Type Selector */}
          <div className={styles.field} style={{ marginTop: '10px' }}>
            <label className={styles.label}>Select Ticket Type *</label>
            <div className={styles.chips}>
              {event.ticket_types?.map(type => (
                <button
                  key={type.id}
                  type="button"
                  className={`${styles.chip} ${selectedTicketType === type.id ? styles.chipActive : ''}`}
                  onClick={() => setSelectedTicketType(type.id)}
                >
                  {type.label} — ₹{type.price}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className={styles.row2} style={{ marginTop: '10px' }}>
            <div className={styles.field}>
              <label className={styles.label}>Ticket Quantity</label>
              <div className={styles.stepper}>
                <button
                  type="button"
                  className={styles.stepBtn}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className={styles.stepVal}>{quantity}</span>
                <button
                  type="button"
                  className={styles.stepBtn}
                  onClick={() => setQuantity(q => q + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* VIP Package Selector (Optional) */}
          {event.vip_packages && event.vip_packages.length > 0 && (
            <div className={styles.field} style={{ marginTop: '15px' }}>
              <label className={styles.label}>Add VIP Package <span className={styles.optional}>(optional)</span></label>
              <div className={styles.chips}>
                <button
                  type="button"
                  className={`${styles.chip} ${selectedVipPackage === '' ? styles.chipActive : ''}`}
                  onClick={() => setSelectedVipPackage('')}
                >
                  No VIP Package
                </button>
                {event.vip_packages.map(pkg => (
                  <button
                    key={pkg.id}
                    type="button"
                    className={`${styles.chip} ${selectedVipPackage === pkg.id ? styles.chipActive : ''}`}
                    onClick={() => setSelectedVipPackage(pkg.id)}
                  >
                    {pkg.name} (pax: {pkg.pax}) — ₹{pkg.price}
                  </button>
                ))}
              </div>
              {vipObj && vipObj.features && vipObj.features.length > 0 && (
                <p className={styles.fieldNote} style={{ marginTop: '6px', fontSize: '0.78rem' }}>
                  ★ Features: {vipObj.features.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Total Calculation Display */}
          <div style={{
            background: 'rgba(200, 133, 42, 0.06)',
            border: '1px solid rgba(200, 133, 42, 0.15)',
            padding: '12px 16px',
            borderRadius: '2px',
            marginTop: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(61, 35, 20, 0.65)', fontFamily: 'var(--font-sc)' }}>
                TOTAL PAYABLE
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(28, 20, 16, 0.45)', fontFamily: 'var(--font-body)' }}>
                {quantity} × {ticketObj?.label || 'Ticket'} {vipObj ? `+ ${vipObj.name}` : ''}
              </p>
            </div>
            <strong style={{ fontSize: '1.4rem', color: 'var(--amber)', fontFamily: 'var(--font-display)' }}>
              ₹{grandTotal.toLocaleString()}
            </strong>
          </div>

          <motion.button
            type="submit"
            className={styles.submit}
            whileHover={{ opacity: 0.88 }}
            whileTap={{ scale: 0.98 }}
          >
            Proceed to Payment →
          </motion.button>
        </form>
      )}

      {/* Step 2: UPI Scanner and UTR validation */}
      {step === 2 && (
        <form onSubmit={handleSubmitBooking} className={styles.form}>
          <span className={styles.eyebrow}>Step 2 of 2 · Payment</span>
          <h2 className={styles.heading}>Pay & Submit UTR</h2>
          <p className={styles.sub}>
            Please scan the UPI QR code below and transfer the total amount. Submit the UTR number for verification.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid rgba(61, 35, 20, 0.1)',
            borderRadius: '4px',
            padding: '20px',
            gap: '12px'
          }}>
            {event.qr_image_url ? (
              <img
                src={event.qr_image_url}
                alt="Payment QR Code"
                style={{
                  maxWidth: '220px',
                  maxHeight: '220px',
                  objectFit: 'contain',
                  borderRadius: '2px',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}
              />
            ) : (
              <div style={{
                width: '180px',
                height: '180px',
                background: 'rgba(200, 133, 42, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--teak)',
                border: '1px dashed var(--teak)',
                borderRadius: '4px',
                padding: '16px'
              }}>
                Please request payment QR code at the venue desk.
              </div>
            )}

            {event.upi_id && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-body)', color: 'var(--teak)' }}>
                  UPI ID: <strong>{event.upi_id}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(200, 133, 42, 0.3)',
                    color: 'var(--amber)',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-sc)',
                    borderRadius: '2px',
                    cursor: 'none'
                  }}
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
            )}

            <div style={{
              marginTop: '4px',
              textAlign: 'center',
              fontSize: '0.88rem',
              color: 'var(--teak)',
              fontFamily: 'var(--font-body)'
            }}>
              Payable Amount: <strong style={{ color: 'var(--amber)', fontSize: '1.05rem' }}>₹{grandTotal.toLocaleString()}</strong>
            </div>
          </div>

          <div className={styles.field} style={{ marginTop: '10px' }}>
            <label className={styles.label}>12-Digit UPI UTR / Transaction ID *</label>
            <input
              type="text"
              className={styles.input}
              value={utr}
              onChange={e => setUtr(e.target.value.replace(/\D/g, '').substring(0, 12))}
              placeholder="e.g. 617895240312"
              required
              maxLength={12}
            />
            <p className={styles.fieldNote}>
              Enter the 12-digit transaction number from your GPay, Paytm, or PhonePe receipt.
            </p>
          </div>

          <div className={styles.row2} style={{ marginTop: '10px' }}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setStep(1)}
              style={{ width: '100%', padding: '14px 20px' }}
            >
              ← Edit Details
            </button>
            <motion.button
              type="submit"
              className={styles.submit}
              style={{ marginTop: 0 }}
              disabled={loading || utr.trim().length !== 12}
              whileHover={{ opacity: 0.88 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Submitting…' : 'Submit Booking'}
            </motion.button>
          </div>
        </form>
      )}

      {/* Step 3: Success Confirmation */}
      {step === 3 && (
        <div className={styles.successBox}>
          <div className={styles.successIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M5 14L11 20L23 8" stroke="#48b076" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className={styles.successTitle}>Booking Request Sent</h3>
          <p className={styles.successBody} style={{ maxWidth: '360px', marginBottom: '16px' }}>
            We've received your request! Your booking is pending verification of the UTR transaction number.
          </p>

          <div style={{
            background: 'rgba(72, 176, 118, 0.05)',
            border: '1px solid rgba(72, 176, 118, 0.2)',
            borderRadius: '4px',
            padding: '16px',
            width: '100%',
            textAlign: 'left',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            color: 'var(--teak)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div><strong>Guest:</strong> {name}</div>
            <div><strong>Ticket:</strong> {quantity} × {ticketObj?.label}</div>
            <div><strong>Amount Paid:</strong> ₹{grandTotal.toLocaleString()}</div>
            <div><strong>UTR Number:</strong> {utr}</div>
            <div style={{
              marginTop: '6px',
              borderTop: '1px solid rgba(72, 176, 118, 0.15)',
              paddingTop: '6px',
              fontSize: '0.9rem',
              color: 'var(--teak)'
            }}>
              Booking Ref: <strong style={{ color: '#48b076', fontFamily: 'var(--font-sc)' }}>{bookingRef}</strong>
            </div>
          </div>

          <p className={styles.fieldNote} style={{ fontSize: '0.78rem', opacity: 0.8, color: 'var(--teak)', marginTop: '8px' }}>
            * Please keep this reference safe. Once validated, your tickets will be confirmed.
          </p>

          <button className={styles.closeBtn} onClick={onClose} style={{ marginTop: '12px' }}>
            Done
          </button>
        </div>
      )}
    </div>
  )
}

export default EventTicketModal
