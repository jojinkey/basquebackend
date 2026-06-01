import { supabase } from '../lib/supabase'

export const createTableBooking = async (form) => {
  const { error } = await supabase.from('reservations').insert({
    type: 'table',
    stage: 'new',
    name: form.name,
    phone: form.phone,
    date: form.date,
    time_slot: form.slot,
    guests: form.covers,
    source_modal: 'TableBookingModal',
    details: {
      occasion: form.occasion || null,
    },
  })
  if (error) throw new Error(error.message)
}

export const createCourtBooking = async (form) => {
  const { error } = await supabase.from('reservations').insert({
    type: 'event',
    stage: 'new',
    name: form.name,
    phone: form.phone,
    date: form.date,
    time_slot: form.slot,
    guests: form.players,
    source_modal: 'CourtBookingModal',
    details: {
      booking_category: 'court',
      duration_hours: form.duration,
      equipment: form.equipment || null,
    },
  })
  if (error) throw new Error(error.message)
}

export const createGolfBooking = async (form) => {
  const { error } = await supabase.from('reservations').insert({
    type: 'golf',
    stage: 'new',
    name: form.name,
    phone: form.phone,
    date: form.date,
    time_slot: form.slot,
    guests: form.players,
    source_modal: 'GolfBookingModal',
    details: {
      duration: form.duration,
      experience: form.experience || null,
    },
  })
  if (error) throw new Error(error.message)
}

export const createGolfDiningBooking = async (form) => {
  const { error } = await supabase.from('reservations').insert({
    type: 'golf_dining',
    stage: 'new',
    name: form.name,
    phone: form.phone,
    date: form.date || null,
    guests: form.guests,
    source_modal: 'GolfDiningModal',
    details: {
      package: form.pkg,
    },
  })
  if (error) throw new Error(error.message)
}

export const createEventEnquiry = async (form) => {
  const { error } = await supabase.from('reservations').insert({
    type: 'event',
    stage: 'new',
    name: form.name,
    phone: form.phone,
    date: form.date || null,
    guests: form.guests,
    source_modal: 'EventEnquiryModal',
    details: {
      event_type: form.eventType,
      space: form.space || null,
      budget: form.budget || null,
    },
  })
  if (error) throw new Error(error.message)
}