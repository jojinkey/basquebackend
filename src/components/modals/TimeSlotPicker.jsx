import { useState, useEffect } from 'react'
import styles from './TimeSlotPicker.module.css'

// ─────────────────────────────────────────────
// MOCK DATA — replace with real API call when DB is ready
// Structure: { 'YYYY-MM-DD': ['9 AM', '2 PM', ...] }
// These slots will appear as "Booked" in the UI
const MOCK_BOOKED = {
  // Example: hardcode a few slots for demo purposes
  // '2026-05-10': ['9 AM', '11 AM', '3 PM'],
}

// TODO: Replace this function with:
// const res = await fetch(`/api/slots?date=${date}&type=${type}`)
// const { booked } = await res.json()
const fetchBookedSlots = (date, type) =>
  new Promise((resolve) =>
    setTimeout(() => resolve(MOCK_BOOKED[date] || []), 500)
  )
// ─────────────────────────────────────────────

const SLOT_GROUPS = {
  Morning: ['8 AM', '9 AM', '10 AM', '11 AM'],
  Afternoon: ['12 PM', '1 PM', '2 PM', '3 PM'],
  Evening: ['4 PM', '5 PM', '6 PM', '7 PM'],
}

const TABLE_GROUPS = {
  Lunch: ['12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM'],
  Dinner: ['7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'],
}

const TimeSlotPicker = ({ date, type = 'court', value, onChange }) => {
  const [booked, setBooked] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!date) return
    setLoading(true)
    setBooked([])
    onChange('')
    fetchBookedSlots(date, type).then((slots) => {
      setBooked(slots)
      setLoading(false)
    })
  }, [date, type])

  if (!date) return (
    <p className={styles.hint}>Select a date above to see available times.</p>
  )

  if (loading) return (
    <div className={styles.loadingRow}>
      <span className={styles.loadingDot} />
      <span className={styles.loadingDot} />
      <span className={styles.loadingDot} />
      <span className={styles.loadingText}>Checking availability…</span>
    </div>
  )

  const groups = type === 'table' ? TABLE_GROUPS : SLOT_GROUPS

  return (
    <div className={styles.wrap}>
      {Object.entries(groups).map(([label, slots]) => (
        <div key={label} className={styles.group}>
          <span className={styles.groupLabel}>{label}</span>
          <div className={styles.slotRow}>
            {slots.map((slot) => {
              const isBooked = booked.includes(slot)
              const isSelected = value === slot
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={isBooked}
                  onClick={() => !isBooked && onChange(slot)}
                  className={`${styles.slot} ${isBooked ? styles.slotBooked : ''} ${isSelected ? styles.slotSelected : ''}`}
                >
                  {slot}
                  {isBooked && <span className={styles.bookedLine} />}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={styles.dotAvail} />Available</span>
        <span className={styles.legendItem}><span className={styles.dotBooked} />Booked</span>
      </div>
    </div>
  )
}

export default TimeSlotPicker
