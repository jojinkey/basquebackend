import { supabase } from "../lib/supabase";

// ─── EVENTS ──────────────────────────────────────────────────────────────────

export const eventsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { data: data || [] };
  },

  getPublished: async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return { data };
  },

  create: async (payload) => {
    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },

  update: async (id, payload) => {
    const { data, error } = await supabase
      .from("events")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },

  delete: async (id) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) throw error;
    return { data: { ok: true } };
  },

  togglePublish: async (id, currentState) => {
    const { data, error } = await supabase
      .from("events")
      .update({ is_published: !currentState, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },
};

// ─── TICKET BOOKINGS ─────────────────────────────────────────────────────────

export const bookingsApi = {
  create: async (payload) => {
    const { data, error } = await supabase
      .from("ticket_bookings")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },

  getByEvent: async (eventId) => {
    const { data, error } = await supabase
      .from("ticket_bookings")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { data: data || [] };
  },

  updateStatus: async (id, status) => {
    const { data, error } = await supabase
      .from("ticket_bookings")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },

  getStats: async (eventId) => {
    const { data, error } = await supabase
      .from("ticket_bookings")
      .select("status, quantity")
      .eq("event_id", eventId);
    if (error) throw error;
    const rows = data || [];
    return {
      data: {
        total: rows.reduce((s, r) => s + (r.quantity || 1), 0),
        confirmed: rows.filter((r) => r.status === "confirmed").reduce((s, r) => s + (r.quantity || 1), 0),
        pending: rows.filter((r) => r.status === "pending").reduce((s, r) => s + (r.quantity || 1), 0),
        rejected: rows.filter((r) => r.status === "rejected").reduce((s, r) => s + (r.quantity || 1), 0),
      },
    };
  },
};
