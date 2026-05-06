// Analytics utility — replace placeholder IDs with real values in production

export const trackIntentSelected = (intent) => {
  try {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'intent_selected', { event_label: intent })
    }
    if (typeof fbq !== 'undefined') {
      fbq('track', 'ViewContent', { content_name: intent })
    }
  } catch (_) {}
}

export const trackBookingStarted = (type) => {
  try {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'booking_started', { event_label: type })
    }
    if (typeof fbq !== 'undefined') {
      fbq('track', 'InitiateCheckout', { content_name: type })
    }
  } catch (_) {}
}

export const trackBookingCompleted = (type, date) => {
  try {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'booking_completed', { event_label: type, booking_date: date })
    }
    if (typeof fbq !== 'undefined') {
      fbq('track', 'Lead', { content_name: type })
    }
  } catch (_) {}
}

export const trackFormAbandoned = (type, lastField) => {
  try {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_abandoned', { event_label: type, last_field: lastField })
    }
  } catch (_) {}
}
