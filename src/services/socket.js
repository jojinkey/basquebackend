/**
 * Supabase Realtime channel helper.
 * Provides a socket-like `.on` / `.off` interface so existing components
 * need zero changes — we just reroute events through Supabase channels.
 */
import { supabase } from '../lib/supabase'

const _listeners = {}   // { eventName: Set<handler> }
const _channels  = {}   // { channelKey: RealtimeChannel }

function _emit(event, payload) {
  ;(_listeners[event] || new Set()).forEach((fn) => { try { fn(payload) } catch (_) {} })
}

function _on(event, fn)  { if (!_listeners[event]) _listeners[event] = new Set(); _listeners[event].add(fn) }
function _off(event, fn) { _listeners[event]?.delete(fn) }

// ── Subscribe to key tables ───────────────────────────────────────────────────

function _startRealtime() {
  // Orders channel
  _channels.orders = supabase
    .channel('rt-orders')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (p) => _emit('order:new', _fmtOrder(p.new)))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (p) => _emit('order:updated', _fmtOrder(p.new)))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, (p) => _emit('order:deleted', p.old?.id))
    .subscribe()

  // Tables channel
  _channels.tables = supabase
    .channel('rt-tables')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (p) => _emit('table:statusChanged', p.new || p.old))
    .subscribe()

  // Service requests channel
  _channels.service = supabase
    .channel('rt-service')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'service_requests' }, (p) => _emit('service:new', _fmtService(p.new)))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'service_requests' }, (p) => _emit('service:updated', _fmtService(p.new)))
    .subscribe()

  // Waitlist channel
  _channels.waitlist = supabase
    .channel('rt-waitlist')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waitlist_entries' }, (p) => _emit('waitlist:added', _fmtWaitlist(p.new)))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'waitlist_entries' }, (p) => _emit('waitlist:updated', _fmtWaitlist(p.new)))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'waitlist_entries' }, (p) => _emit('waitlist:removed', p.old?.id))
    .subscribe()

  // Reservations channel
  _channels.reservations = supabase
    .channel('rt-reservations')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (p) => _emit('reservation:new', p.new))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservations' }, (p) => _emit('reservation:updated', p.new))
    .subscribe()
}

// Shape raw Supabase rows into the same format components already expect
const _STAGE_TO_UI = { pending_approval: 'pending', placed: 'new', preparing: 'preparing', ready: 'preparing', served: 'served' }

function _fmtOrder(o) {
  return {
    _id: o.id,
    tableId: o.table_id || '',
    tableName: `Table ${o.table_id || ''}`,
    status: _STAGE_TO_UI[o.stage] || o.stage,
    total: o.subtotal || 0,
    createdAt: o.created_at,
    items: [],   // Realtime payloads don't include joined data; components refetch on event
  }
}

function _fmtService(s) {
  const rawTableName = s.table_name || `Table ${s.table_id}`
  const isBussing = rawTableName.includes('| Bussing Request')
  const tableName = rawTableName.replace(/\s*\|\s*Bussing Request\s*$/, '')

  return {
    _id: s.id,
    tableId: s.table_id,
    tableName: tableName || `Table ${s.table_id}`,
    type: isBussing ? 'bussing_request' : s.type,
    status: s.status,
    createdAt: s.created_at,
  }
}

function _fmtWaitlist(e) {
  return {
    _id: e.id,
    guestName: e.guest_name,
    partySize: e.party_size,
    source: (e.source || 'walk_in').toUpperCase(),
    status: e.status,
    waitStart: e.created_at,
    priority: e.priority,
    isVip: false,
    notes: e.notes,
  }
}

_startRealtime()

// Public socket-like interface
export const socket = { on: _on, off: _off, emit: () => {} }
