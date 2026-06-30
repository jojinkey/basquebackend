/**
 * Basque Manager OS — Supabase API Service
 */
import { supabase } from "../lib/supabase";

const isDemoId = (id) =>
  typeof id === "string" &&
  (id.startsWith("d0000001") ||
    id.startsWith("e0000001") ||
    id.startsWith("f0000001") ||
    id.startsWith("b0000001") ||
    id.startsWith("c0000001"));

const STAGE_TO_UI = {
  pending_approval: "pending",
  placed: "new",
  ready: "ready",
  served: "served",
};

const UI_TO_STAGE = {
  pending: "pending_approval",
  new: "placed",
  placed: "placed",
  approve: "placed",
  preparing: "placed",
  ready: "ready",
  served: "served",
};

export const stageToUi = (stage) => STAGE_TO_UI[stage] || stage;
export const uiToStage = (status) => UI_TO_STAGE[status] || status;

// ─── TABLES ──────────────────────────────────────────────────────────────────

export const tablesApi = {
  getAll: async (params) => {
    let q = supabase
      .from("tables")
      .select(
        "id, capacity, status, current_session, sort_order, is_active, sections(id, name, label, is_active), session:current_session(id, guest_name, party_size, is_vip, created_at, server_id, server:users(id, name))"
      )
      .eq("is_active", true)
      .order("sort_order");

    if (params?.status) q = q.eq("status", params.status);

    const { data, error } = await q;
    if (error) throw error;

    const rows = data || [];
    const tableIds = rows.map((t) => t.id);

    let ordersByTable = {};
    let svcByTable = {};

    const activeSessionIds = rows.map((t) => t.current_session).filter(Boolean);
    let ords = [];
    if (activeSessionIds.length > 0) {
      const { data: ordsData, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, session_id, stage, subtotal, created_at, kitchen_started_at, table_sessions(table_id), order_items(quantity, unit_price, menu_items(name))"
        )
        .in("session_id", activeSessionIds);

      if (ordersError) throw ordersError;
      ords = ordsData || [];
    }

    (ords || [])
      .filter((o) => !isDemoId(o.id) && o.stage !== "pending_approval")
      .forEach((o) => {
        const tableId = o.table_sessions?.table_id;
        if (!tableId) return;

        // Only map the order as active if it matches the table's current active session
        const table = rows.find((t) => t.id === tableId);
        if (!table || o.session_id !== table.current_session) return;

        if (!ordersByTable[tableId]) ordersByTable[tableId] = [];

        ordersByTable[tableId].push({
          _id: o.id,
          id: o.id,
          status: (o.kitchen_started_at && o.stage === "placed") ? "preparing" : stageToUi(o.stage),
          total: o.subtotal,
          createdAt: o.created_at,
          items: (o.order_items || []).map((i) => ({
            name: i.menu_items?.name || "Item",
            qty: i.quantity,
            price: i.unit_price,
          })),
        });
      });

    if (tableIds.length) {
      const { data: svcs } = await supabase
        .from("service_requests")
        .select("id, table_id, type, status, table_name, created_at")
        .in("table_id", tableIds)
        .neq("status", "completed");

      (svcs || [])
        .filter((s) => !isDemoId(s.id))
        .forEach((s) => {
          if (!svcByTable[s.table_id]) svcByTable[s.table_id] = [];
          const shaped = _shapeService(s);
          if (shaped.type !== "bussing_request") {
            svcByTable[s.table_id].push(shaped);
          }
        });
    }

    return {
      data: rows.map((t) => {
        const hasRealOrders = (ordersByTable[t.id] || []).length > 0;
        const isDemoSession = isDemoId(t.current_session) && !hasRealOrders;

        return {
          tableId: t.id,
          tableName: `Table ${t.id}`,
          section: t.sections?.label || "",
          sections: t.sections,
          pax: t.capacity,
          status: (t.status === "needs_bussing" || t.status === "reserved")
            ? t.status
            : (hasRealOrders ? "seated" : isDemoSession ? "available" : t.status),
          current_session: isDemoSession ? null : t.current_session,
          guest: isDemoSession ? null : t.session?.guest_name || null,
          isVip: isDemoSession ? false : t.session?.is_vip || false,
          seatedAt: isDemoSession ? null : t.session?.created_at || null,
          occupiedSince: isDemoSession ? null : t.session?.created_at || null,
          assignedServer: isDemoSession ? null : (t.session?.server ? { id: t.session.server.id, name: t.session.server.name } : null),
          activeOrders: ordersByTable[t.id] || [],
          serviceRequests: svcByTable[t.id] || [],
        };
      }),
    };
  },

  getOne: async (tableId) => {
    const { data: table, error } = await supabase
      .from("tables")
      .select("id, capacity, status, current_session, sections(id, name, label, is_active)")
      .eq("id", tableId)
      .single();

    if (error) throw error;

    let activeOrders = [];
    let serviceRequests = [];
    let sessionData = null;

    const [sessRes, ordRes, svcRes] = await Promise.all([
      table.current_session
        ? supabase
            .from("table_sessions")
            .select("id, guest_name, party_size, is_vip, created_at, server_id, server:users(id, name)")
            .eq("id", table.current_session)
            .maybeSingle()
        : Promise.resolve({ data: null }),

      table.current_session
        ? supabase
            .from("orders")
            .select(
              "id, session_id, stage, subtotal, created_at, kitchen_started_at, table_sessions(table_id), order_items(id, quantity, unit_price, menu_items(name))"
            )
            .eq("session_id", table.current_session)
        : Promise.resolve({ data: [] }),

      supabase
        .from("service_requests")
        .select("id, type, status, table_name, created_at")
        .eq("table_id", tableId)
        .neq("status", "completed"),
    ]);

    sessionData = sessRes.data;

    activeOrders = (ordRes.data || [])
      .filter((o) => !isDemoId(o.id) && o.session_id === table.current_session && o.stage !== "pending_approval")
      .map((o) => ({
        _id: o.id,
        id: o.id,
        status: (o.kitchen_started_at && o.stage === "placed") ? "preparing" : stageToUi(o.stage),
        total: o.subtotal,
        createdAt: o.created_at,
        items: (o.order_items || []).map((i) => ({
          name: i.menu_items?.name || "Unknown",
          qty: i.quantity,
          price: i.unit_price,
        })),
      }));

    serviceRequests = (svcRes.data || [])
      .filter((s) => !isDemoId(s.id))
      .map(_shapeService)
      .filter((s) => s.type !== "bussing_request");

    const hasRealOrders = activeOrders.length > 0;
    const isDemoSession = isDemoId(table.current_session) && !hasRealOrders;

    return {
      data: {
        tableId: table.id,
        tableName: `Table ${table.id}`,
        section: table.sections?.label || "",
        sections: table.sections,
        pax: table.capacity,
        status: (table.status === "needs_bussing" || table.status === "reserved")
          ? table.status
          : (hasRealOrders ? "seated" : isDemoSession ? "available" : table.status),
        guest: isDemoSession ? null : sessionData?.guest_name || null,
        isVip: isDemoSession ? false : sessionData?.is_vip || false,
        seatedAt: isDemoSession ? null : sessionData?.created_at || null,
        assignedServer: isDemoSession ? null : (sessionData?.server ? { id: sessionData.server.id, name: sessionData.server.name } : null),
        activeOrders,
        serviceRequests,
      },
    };
  },

  getStats: async () => {
    const tablesRes = await tablesApi.getAll();
    const rows = (tablesRes.data || []).filter((t) => t.sections?.is_active !== false);

    return {
      data: {
        available: rows.filter((t) => t.status === "available").length,
        seated: rows.filter((t) => t.status === "seated").length,
        occupied: rows.filter((t) => t.status === "seated").length,
        bussing: rows.filter((t) => t.status === "needs_bussing").length,
        reserved: rows.filter((t) => t.status === "reserved").length,
      },
    };
  },

  updateStatus: async (tableId, body) => {
    const { status, guest, isVip, performer } = body;

    if (status === "seated") {
      // Close any existing open sessions for this table to prevent orphans
      await supabase
        .from("table_sessions")
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq("table_id", tableId)
        .is("left_at", null);

      const { data: session, error: sessErr } = await supabase
        .from("table_sessions")
        .insert({
          table_id: tableId,
          guest_name: guest || "Guest",
          party_size: 2,
          is_vip: isVip || false,
          is_active: true,
        })
        .select()
        .single();

      if (sessErr) throw sessErr;

      const { data, error } = await supabase
        .from("tables")
        .update({ status: "seated", current_session: session.id })
        .eq("id", tableId)
        .select()
        .single();

      if (error) throw error;

      _auditLog("table_status_change", "table", tableId, performer, {
        to: "seated",
        guest,
      });

      return { data };
    }

    if (status === "available" || status === "needs_bussing") {
      const { data: tbl } = await supabase
        .from("tables")
        .select("current_session")
        .eq("id", tableId)
        .single();

      if (tbl?.current_session) {
        await supabase
          .from("table_sessions")
          .update({
            is_active: false,
            left_at: new Date().toISOString(),
          })
          .eq("id", tbl.current_session);
      }

      const { data, error } = await supabase
        .from("tables")
        .update({ status, current_session: null })
        .eq("id", tableId)
        .select()
        .single();

      if (error) throw error;

      _auditLog("table_status_change", "table", tableId, performer, {
        to: status,
      });

      return { data };
    }

    const { data, error } = await supabase
      .from("tables")
      .update({ status })
      .eq("id", tableId)
      .select()
      .single();

    if (error) throw error;

    _auditLog("table_status_change", "table", tableId, performer, {
      to: status,
    });

    return { data };
  },

  assignServer: async (tableId, userId) => {
    const { data: tbl, error: tblError } = await supabase
      .from("tables")
      .select("current_session")
      .eq("id", tableId)
      .single();
    
    if (tblError) throw tblError;
    if (!tbl.current_session) {
      throw new Error("Table does not have an active session.");
    }

    const { data: sess, error: sessError } = await supabase
      .from("table_sessions")
      .select("server_id")
      .eq("id", tbl.current_session)
      .single();

    if (sessError) throw sessError;
    if (sess.server_id) {
      throw new Error("Table is already assigned to a server.");
    }

    const { data, error } = await supabase
      .from("table_sessions")
      .update({ server_id: userId })
      .eq("id", tbl.current_session)
      .select();

    if (error) throw error;
    return { data };
  },
};

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export const ordersApi = {
  getAll: async (params) => {
    let q = supabase
      .from("orders")
      .select(
        "id, session_id, stage, subtotal, notes, created_at, placed_at, ready_at, served_at, kitchen_started_at, table_sessions(table_id, guest_name, server_id), order_items(id, quantity, unit_price, menu_items(name))"
      )
      .order("created_at", { ascending: false });

    if (params?.status) q = q.eq("stage", params.status);

    const { data, error } = await q;
    if (error) throw error;

    return {
      data: (data || [])
        .filter((o) => !isDemoId(o.id))
        .map(_shapeOrder),
    };
  },

  updateStatus: async (id, status, serverId) => {
    const stage = uiToStage(status);

    const updates = { stage };

    if (stage === "ready") {
      updates.ready_at = new Date().toISOString();
    }

    if (stage === "served") {
      updates.served_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select(
        "id, session_id, stage, subtotal, notes, created_at, placed_at, ready_at, served_at, kitchen_started_at, table_sessions(id, table_id, guest_name, server_id), order_items(id, quantity, unit_price, menu_items(name))"
      )
      .single();

    if (error) throw error;

    // If order is approved (changed to 'placed'), activate the table session and mark table seated
    if (stage === "placed" && data?.table_sessions) {
      const sessionId = data.table_sessions.id;
      const tableId = data.table_sessions.table_id;

      if (sessionId && tableId) {
        // Fetch the session to check if it's already closed
        const { data: session } = await supabase
          .from("table_sessions")
          .select("left_at")
          .eq("id", sessionId)
          .maybeSingle();

        if (session && !session.left_at) {
          // 1. Activate session and set server_id if provided
          const sessionUpdates = { is_active: true };
          if (serverId) {
            sessionUpdates.server_id = serverId;
          }
          await supabase
            .from("table_sessions")
            .update(sessionUpdates)
            .eq("id", sessionId);

          // 2. Set table occupied
          await supabase
            .from("tables")
            .update({ status: "seated", current_session: sessionId })
            .eq("id", tableId);
        }
      }
    }

    return { data: _shapeOrder(data) };
  },

  deleteOrder: async (id) => {
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", id);

    if (itemsError) throw itemsError;

    const { error: orderError } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (orderError) throw orderError;

    return { data: { ok: true, id } };
  },
};

function _shapeOrder(o) {
  const isPreparing = o.kitchen_started_at && !o.ready_at && !o.served_at && o.stage === "placed";
  return {
    _id: o.id,
    id: o.id,
    sessionId: o.session_id,
    tableId: o.table_sessions?.table_id || "",
    tableName: `Table ${o.table_sessions?.table_id || ""}`,
    status: isPreparing ? "preparing" : stageToUi(o.stage),
    total: o.subtotal,
    createdAt: o.created_at,
    notes: o.notes,
    serverId: o.table_sessions?.server_id || null,
    items: (o.order_items || []).map((i) => ({
      name: i.menu_items?.name || "Unknown",
      qty: i.quantity,
      price: i.unit_price,
    })),
  };
}

// ─── SERVICE REQUESTS ────────────────────────────────────────────────────────

export const serviceApi = {
  getAll: async ({ includeBussing = false } = {}) => {
    // 1. Fetch tables to build a map of tableId -> server_id
    const { data: tablesData, error: tablesError } = await supabase
      .from("tables")
      .select("id, current_session(server_id)");

    if (tablesError) throw tablesError;

    const serverMap = {};
    (tablesData || []).forEach((t) => {
      serverMap[t.id] = t.current_session?.server_id || null;
    });

    // 2. Fetch service requests
    const { data, error } = await supabase
      .from("service_requests")
      .select("id, table_id, table_name, type, status, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return {
      data: (data || [])
        .filter((s) => !isDemoId(s.id))
        .map((s) => ({
          ...s,
          serverId: serverMap[s.table_id] || null,
        }))
        .map(_shapeService)
        .filter((s) => includeBussing || s.type !== "bussing_request"),
    };
  },

  updateStatus: async (id, status, performer) => {
    const { data, error } = await supabase
      .from("service_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await _logServiceAction(_shapeService(data), status, performer);

    return { data: _shapeService(data) };
  },

  create: async (tableId, tableName, type, performer) => {
    const isBussing = type === "bussing_request";
    const storedType = isBussing ? "call_waiter" : type;
    const storedTableName = isBussing
      ? `${tableName || `Table ${tableId}`} | Bussing Request`
      : tableName;

    if (isBussing) {
      const { data: existing, error: existingError } = await supabase
        .from("service_requests")
        .select("id, table_id, table_name, type, status, created_at, updated_at")
        .eq("table_id", tableId)
        .eq("type", storedType)
        .neq("status", "completed")
        .ilike("table_name", "%| Bussing Request")
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) return { data: _shapeService(existing) };
    }

    const { data, error } = await supabase
      .from("service_requests")
      .insert({
        table_id: tableId,
        table_name: storedTableName,
        type: storedType,
        status: "new",
      })
      .select()
      .single();

    if (error) throw error;

    await _logServiceAction(_shapeService(data), "new", performer);

    return { data: _shapeService(data) };
  },
};

// ─── WAITLIST ─────────────────────────────────────────────────────────────────

function _shapeService(s) {
  const rawTableName = s.tableName || s.table_name || "";
  const isBussing = rawTableName.includes("| Bussing Request") || s.type === "bussing_request";
  const cleanTableName = rawTableName.replace(/\s*\|\s*Bussing Request\s*$/, "");
  const tableId = s.table_id || s.tableId;

  return {
    _id: s.id || s._id,
    id: s.id || s._id,
    tableId,
    tableName: cleanTableName || `Table ${tableId}`,
    type: isBussing ? "bussing_request" : s.type,
    status: s.status,
    createdAt: s.created_at || s.createdAt,
    updatedAt: s.updated_at || s.updatedAt,
    serverId: s.tables?.session?.server_id || s.serverId || null,
  };
}

export const waitlistApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("waitlist_entries")
      .select(
        "id, guest_name, guest_phone, party_size, source, status, estimated_wait, priority, notes, created_at, seated_at"
      )
      .eq("status", "waiting")
      .order("priority", { ascending: true });

    if (error) throw error;

    return {
      data: (data || [])
        .filter((e) => !isDemoId(e.id))
        .map(_shapeWaitlist),
    };
  },

  getDeclined: async () => {
    const { data, error } = await supabase
      .from("waitlist_entries")
      .select("id, guest_name, party_size, source, notes, created_at")
      .eq("status", "declined")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return { data: (data || []).filter((e) => !isDemoId(e.id)) };
  },

  add: async (form) => {
    const { data, error } = await supabase
      .from("waitlist_entries")
      .insert({
        guest_name: form.guestName,
        guest_phone: form.phone || null,
        party_size: form.partySize,
        source: (form.source || "WALK_IN").toLowerCase(),
        status: "waiting",
        estimated_wait: form.estimatedWait || null,
        priority: 99,
        notes: form.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: _shapeWaitlist(data) };
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from("waitlist_entries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data: _shapeWaitlist(data) };
  },

  remove: async (id) => {
    const { error } = await supabase
      .from("waitlist_entries")
      .update({
        status: "seated",
        seated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    return { data: { ok: true } };
  },

  notify: async (id) => {
    const { error } = await supabase
      .from("waitlist_entries")
      .update({ status: "notified" })
      .eq("id", id);

    if (error) throw error;

    return { data: { ok: true } };
  },

  decline: async (id) => {
    const { error } = await supabase
      .from("waitlist_entries")
      .update({ status: "declined" })
      .eq("id", id);

    if (error) throw error;

    return { data: { ok: true } };
  },
};

function _shapeWaitlist(e) {
  return {
    _id: e.id,
    guestName: e.guest_name,
    phone: e.guest_phone,
    partySize: e.party_size,
    source: (e.source || "walk_in").toUpperCase(),
    status: e.status,
    estimatedWait: e.estimated_wait,
    waitStart: e.created_at,
    priority: e.priority,
    isVip: false,
    sectionPreference: null,
    notes: e.notes,
  };
}

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

export const reservationsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data: (data || []).filter((r) => !isDemoId(r.id)) };
  },

  getStats: async () => {
    const { data, error } = await supabase.from("reservations").select("id, stage");

    if (error) throw error;

    const rows = (data || []).filter((r) => !isDemoId(r.id));

    return {
      data: {
        total: rows.length,
        newLeads: rows.filter((r) => r.stage === "new").length,
        contacted: rows.filter((r) => r.stage === "reviewing").length,
        confirmed: rows.filter((r) => r.stage === "accepted").length,
        declined: rows.filter((r) => r.stage === "declined").length,
        checkedIn: rows.filter((r) => r.stage === "completed").length,
      },
    };
  },

  create: async (payload) => {
    const { data, error } = await supabase
      .from("reservations")
      .insert({
        ...payload,
        stage: "new",
        received_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { data };
  },

  updateStage: async (id, body) => {
    const { data, error } = await supabase
      .from("reservations")
      .update({
        stage: body.stage,
        manager_notes: body.stageNote || "",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data };
  },
};

// ─── MENU ─────────────────────────────────────────────────────────────────────

export const menuApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select(
        "id, name, description, price, dietary, image_url, is_available, is_signature, is_new, preparation_time, sort_order, menu_categories(id, name, label, sort_order)"
      )
      .eq("is_available", true)
      .order("sort_order");

    if (error) throw error;

    return { data: data || [] };
  },

  toggleAvailability: async (id, isAvailable) => {
    const { data, error } = await supabase
      .from("menu_items")
      .update({ is_available: isAvailable })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data };
  },
};

// ─── INSIGHTS ─────────────────────────────────────────────────────────────────

export const insightsApi = {
  getToday: async () => {
    const [ordersRes, tablesRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, session_id, subtotal, stage, order_items(quantity, menu_items(name))")
        .neq("stage", "placed"),

      tablesApi.getAll(),
    ]);

    if (ordersRes.error) throw ordersRes.error;

    const orders = (ordersRes.data || []).filter((o) => !isDemoId(o.id));
    const tables = tablesRes.data || [];

    const revenue = orders.reduce((s, o) => s + (o.subtotal || 0), 0);

    const covers = tables
      .filter((t) => t.status === "seated")
      .reduce((s, t) => s + t.pax, 0);

    const itemMap = {};

    orders.forEach((o) => {
      (o.order_items || []).forEach((i) => {
        const n = i.menu_items?.name || "Unknown";
        itemMap[n] = (itemMap[n] || 0) + i.quantity;
      });
    });

    const topItems = Object.entries(itemMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      data: {
        revenue,
        covers,
        orderCount: orders.length,
        avgSpend: covers > 0 ? Math.round(revenue / covers) : 0,
        topItems,
      },
    };
  },

  getSectionPerf: async () => {
    const [tablesRes, ordersRes] = await Promise.all([
      tablesApi.getAll(),
      supabase.from("orders").select("id, session_id, subtotal, stage, table_sessions(table_id)"),
    ]);

    if (ordersRes.error) throw ordersRes.error;

    const tables = tablesRes.data || [];
    const orders = (ordersRes.data || []).filter((o) => !isDemoId(o.id));

    return {
      data: ["Indoor", "Terrace", "Garden", "Bar"].map((section) => {
        const secTables = tables.filter((t) => t.section === section);
        const secIds = secTables.map((t) => t.tableId);

        const secOrders = orders.filter((o) =>
          secIds.includes(o.table_sessions?.table_id)
        );

        return {
          section,
          covers: secTables
            .filter((t) => t.status === "seated")
            .reduce((s, t) => s + t.pax, 0),
          revenue: secOrders.reduce((s, o) => s + (o.subtotal || 0), 0),
        };
      }),
    };
  },

  exportAudit: async () => {
    const { data } = await supabase
      .from("audit_logs")
      .select("action, entity, entity_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const rows = data || [];

    const csv = [
      "Timestamp,Action,Entity,EntityId,Details",
      ...rows.map((l) =>
        [
          new Date(l.created_at).toISOString(),
          l.action,
          l.entity,
          l.entity_id || "",
          JSON.stringify(l.details || {}).replace(/,/g, ";"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `basque-audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  },
};

// ─── PLAYBOOK KPIS ────────────────────────────────────────────────────────────

export const kpisApi = {
  getPlaybookKPIs: async () => {
    const [
      tablesRes,
      sessionsRes,
      ordersRes,
      servicesRes,
      waitlistRes,
      reservationsRes,
      orderLogsRes,
      auditLogsRes,
      menuItemsRes,
    ] = await Promise.all([
      supabase.from("tables").select("id, status, capacity, current_session, sections(name, label)"),
      supabase.from("table_sessions").select("*"),
      supabase.from("orders").select("id, session_id, stage, subtotal, created_at, placed_at, kitchen_started_at, ready_at, served_at, order_items(id, quantity, unit_price, menu_items(name, category_id, menu_categories(name, label)))"),
      supabase.from("service_requests").select("*"),
      supabase.from("waitlist_entries").select("*"),
      supabase.from("reservations").select("*"),
      supabase.from("order_logs").select("*").order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }),
      supabase.from("menu_items").select("id, name, is_available"),
    ]);

    if (tablesRes.error) throw tablesRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    if (ordersRes.error) throw ordersRes.error;

    return {
      data: {
        tables: tablesRes.data || [],
        sessions: sessionsRes.data || [],
        orders: ordersRes.data || [],
        services: servicesRes.data || [],
        waitlist: waitlistRes.data || [],
        reservations: reservationsRes.data || [],
        orderLogs: orderLogsRes.data || [],
        auditLogs: auditLogsRes.data || [],
        menuItems: menuItemsRes.data || [],
      }
    };
  }
};


// ─── AUDIT REPORTS ───────────────────────────────────────────────────────────

export const auditApi = {
  getReport: async ({ range = "7d", from, to } = {}) => {
    const { data: allOrders, error } = await supabase
      .from("orders")
      .select(
        "id, session_id, subtotal, stage, created_at, order_items(quantity, unit_price, menu_items(name, menu_categories(label)))"
      );

    if (error) throw error;

    const filtered = (allOrders || [])
      .filter((o) => !isDemoId(o.id))
      .filter((o) => _inRange(o.created_at, range, from, to));

    const summary = filtered.reduce(
      (acc, o) => {
        acc.gross += o.subtotal || 0;
        acc.net += o.subtotal || 0;
        return acc;
      },
      { gross: 0, net: 0, tax: 0, discount: 0 }
    );

    const itemMap = {};
    const categoryMap = {};
    const timelineMap = {};

    filtered.forEach((o) => {
      const day = o.created_at?.split("T")[0] || "";

      if (!timelineMap[day]) {
        timelineMap[day] = {
          date: day,
          gross: 0,
          net: 0,
          discount: 0,
        };
      }

      timelineMap[day].gross += o.subtotal || 0;
      timelineMap[day].net += o.subtotal || 0;

      (o.order_items || []).forEach((i) => {
        const name = i.menu_items?.name || "Unknown";
        const cat = i.menu_items?.menu_categories?.label || "Other";
        const rev = (i.quantity || 1) * (i.unit_price || 0);

        if (!itemMap[name]) {
          itemMap[name] = {
            name,
            category: cat,
            qty: 0,
            revenue: 0,
          };
        }

        itemMap[name].qty += i.quantity || 1;
        itemMap[name].revenue += rev;

        categoryMap[cat] = (categoryMap[cat] || 0) + rev;
      });
    });

    return {
      data: {
        summary,
        categories: categoryMap,
        payments: { card: summary.gross },
        channels: { dine_in: summary.gross },
        items: Object.values(itemMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 12),
        timeline: Object.values(timelineMap).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        ),
      },
    };
  },

  exportCsv: (report) => {
    if (!report) return;

    const csv = [
      "Item,Category,Qty,Revenue",
      ...report.items.map((i) => [i.name, i.category, i.qty, i.revenue].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "basque-report.csv";
    a.click();

    URL.revokeObjectURL(url);
  },
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (role) => ({
    data: {
      user: { role },
    },
  }),
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function _auditLog(action, entity, entityId, performer, details) {
  try {
    await supabase.from("audit_logs").insert({
      action,
      entity,
      entity_id: entityId,
      details: { ...details, performer },
    });
  } catch (_) {}
}

async function _logServiceAction(request, status, performer) {
  if (!request) return;

  const typePrefix = request.type === "bussing_request"
    ? "BUSSING"
    : "SERVICE";

  const action = status === "new"
    ? `${typePrefix}_REQUESTED`
    : status === "acknowledged"
    ? `${typePrefix}_ACKNOWLEDGED`
    : status === "completed"
    ? `${typePrefix}_ON_MY_WAY`
    : `${typePrefix}_${status?.toUpperCase() || "UPDATED"}`;

  try {
    await supabase.from("order_logs").insert({
      order_id: null,
      table_id: request.table_id || request.tableId,
      action,
      performed_by: _formatPerformerRole(performer),
    });
  } catch (error) {
    console.error("Service activity log failed:", error);
  }
}

function _formatPerformerRole(performer) {
  const value = typeof performer === "string"
    ? performer
    : performer?.role || performer?.name || "";

  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, "_");
  const labels = {
    owner: "Owner",
    restaurant_manager: "Restaurant Manager",
    manager: "Restaurant Manager",
    floor_manager: "Floor Manager",
    server: "Server",
    kitchen: "Kitchen",
    kitchen_display: "Kitchen",
    auditor: "Auditor",
  };

  return labels[normalized] || value || null;
}

function _inRange(dateStr, range, from, to) {
  const d = new Date(dateStr);
  const now = new Date();
  const sot = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === "today") return d >= sot;

  if (range === "7d") {
    const s = new Date(sot);
    s.setDate(s.getDate() - 6);
    return d >= s;
  }

  if (range === "30d") {
    const s = new Date(sot);
    s.setDate(s.getDate() - 29);
    return d >= s;
  }

  if (range === "custom" && from && to) {
    return d >= new Date(from) && d <= new Date(to);
  }

  return true;
}

export default {};
