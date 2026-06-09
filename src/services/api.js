<<<<<<< Updated upstream
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const MOCK_TABLES = [
  { tableId: "T01", tableName: "Table 1",  section: "Indoor",  pax: 2, status: "available" },
  { tableId: "T02", tableName: "Table 2",  section: "Indoor",  pax: 4, status: "occupied",      guest: "Sharma Party",  occupiedSince: new Date(Date.now() - 35 * 60000).toISOString() },
  { tableId: "T03", tableName: "Table 3",  section: "Indoor",  pax: 4, status: "available" },
  { tableId: "T04", tableName: "Table 4",  section: "Indoor",  pax: 6, status: "reserved" },
  { tableId: "T05", tableName: "Table 5",  section: "Indoor",  pax: 2, status: "needs_bussing" },
  { tableId: "T06", tableName: "Table 6",  section: "Terrace", pax: 4, status: "occupied",      guest: "Mehta Family",  isVip: true, occupiedSince: new Date(Date.now() - 55 * 60000).toISOString() },
  { tableId: "T07", tableName: "Table 7",  section: "Terrace", pax: 4, status: "available" },
  { tableId: "T08", tableName: "Table 8",  section: "Terrace", pax: 6, status: "occupied",      guest: "Singh Group",   occupiedSince: new Date(Date.now() - 20 * 60000).toISOString() },
  { tableId: "T09", tableName: "Table 9",  section: "Terrace", pax: 2, status: "available" },
  { tableId: "T10", tableName: "Table 10", section: "Garden",  pax: 8, status: "reserved" },
  { tableId: "T11", tableName: "Table 11", section: "Garden",  pax: 4, status: "available" },
  { tableId: "T12", tableName: "Table 12", section: "Garden",  pax: 4, status: "occupied",      guest: "Kapoor & Co",   occupiedSince: new Date(Date.now() - 10 * 60000).toISOString() },
  { tableId: "T13", tableName: "Table 13", section: "Garden",  pax: 6, status: "available" },
  { tableId: "T14", tableName: "Table 14", section: "Garden",  pax: 2, status: "needs_bussing" },
  { tableId: "T15", tableName: "Table 15", section: "Bar",     pax: 2, status: "occupied",      guest: "Rajput",        occupiedSince: new Date(Date.now() - 45 * 60000).toISOString() },
  { tableId: "T16", tableName: "Table 16", section: "Bar",     pax: 2, status: "available" },
  { tableId: "T17", tableName: "Table 17", section: "Bar",     pax: 4, status: "occupied",      guest: "Verma",         occupiedSince: new Date(Date.now() - 15 * 60000).toISOString() },
  { tableId: "T18", tableName: "Table 18", section: "Bar",     pax: 4, status: "available" },
];
=======
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
>>>>>>> Stashed changes

let _tables = [...MOCK_TABLES];

let _orders = [
  { _id: "o1", tableId: "T02", tableName: "Table 2",  status: "new",       total: 1480, createdAt: new Date(Date.now() -  8 * 60000).toISOString(), items: [{ name: "Basque Cheesecake", qty: 2, price: 420 }, { name: "Lemon Posset", qty: 1, price: 280 }, { name: "Cold Brew", qty: 2, price: 180 }] },
  { _id: "o2", tableId: "T06", tableName: "Table 6",  status: "preparing", total: 3200, createdAt: new Date(Date.now() - 22 * 60000).toISOString(), items: [{ name: "Txuleta Steak", qty: 1, price: 1800 }, { name: "Pintxos Board", qty: 2, price: 650 }, { name: "Rioja Glass", qty: 1, price: 450 }] },
  { _id: "o3", tableId: "T08", tableName: "Table 8",  status: "new",       total: 2100, createdAt: new Date(Date.now() -  5 * 60000).toISOString(), items: [{ name: "Prawn Pil Pil", qty: 2, price: 720 }, { name: "Garden Salad", qty: 3, price: 320 }, { name: "Sangria Jug", qty: 1, price: 680 }] },
  { _id: "o4", tableId: "T12", tableName: "Table 12", status: "served",    total: 1750, createdAt: new Date(Date.now() - 40 * 60000).toISOString(), items: [{ name: "Mushroom Risotto", qty: 2, price: 580 }, { name: "Tiramisu", qty: 1, price: 320 }, { name: "Espresso", qty: 2, price: 135 }] },
  { _id: "o5", tableId: "T15", tableName: "Table 15", status: "preparing", total: 960,  createdAt: new Date(Date.now() - 18 * 60000).toISOString(), items: [{ name: "Patatas Bravas", qty: 2, price: 280 }, { name: "Gin & Tonic", qty: 2, price: 320 }] },
  { _id: "o6", tableId: "T17", tableName: "Table 17", status: "new",       total: 680,  createdAt: new Date(Date.now() -  3 * 60000).toISOString(), items: [{ name: "Truffle Fries", qty: 1, price: 380 }, { name: "Mocktail", qty: 2, price: 150 }] },
];

let _service = [
  { _id: "s1", tableId: "T02", tableName: "Table 2",  type: "call_waiter",  status: "new",          createdAt: new Date(Date.now() -  4 * 60000).toISOString() },
  { _id: "s2", tableId: "T06", tableName: "Table 6",  type: "bill_request", status: "acknowledged", createdAt: new Date(Date.now() - 12 * 60000).toISOString() },
  { _id: "s3", tableId: "T15", tableName: "Table 15", type: "call_waiter",  status: "new",          createdAt: new Date(Date.now() -  2 * 60000).toISOString() },
  { _id: "s4", tableId: "T08", tableName: "Table 8",  type: "bill_request", status: "completed",    createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
];

let _waitlist = [
  { _id: "w1", guestName: "Patel Family", partySize: 4, source: "WALK_IN",    waitStart: new Date(Date.now() - 22 * 60000).toISOString(), isVip: false, sectionPreference: "Garden" },
  { _id: "w2", guestName: "Ms. Ananya",   partySize: 2, source: "PHONE",      waitStart: new Date(Date.now() - 10 * 60000).toISOString(), isVip: true,  sectionPreference: "Terrace" },
  { _id: "w3", guestName: "Gupta Group",  partySize: 6, source: "WEBSITE",    waitStart: new Date(Date.now() - 35 * 60000).toISOString(), isVip: false, notes: "Birthday dinner" },
  { _id: "w4", guestName: "Mr. Iyer",     partySize: 2, source: "HOST_STAND", waitStart: new Date(Date.now() -  5 * 60000).toISOString(), isVip: false },
];

let _reservations = [
  { _id: "r1", name: "Aditya Khanna", phone: "+91 98765 43210", service: "table",       guests: 4,  date: "2026-05-29", time: "19:30", stage: "new",       createdAt: new Date(Date.now() -  2 * 3600000).toISOString() },
  { _id: "r2", name: "Riya Malhotra", phone: "+91 99887 76655", service: "golf_dining", guests: 2,  date: "2026-05-30", time: "12:00", stage: "contacted",  createdAt: new Date(Date.now() -  5 * 3600000).toISOString(), details: { occasion: "Anniversary" } },
  { _id: "r3", name: "Nair & Family", phone: "+91 70001 23456", service: "event",        guests: 30, date: "2026-06-05", time: "18:00", stage: "confirmed",  createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  { _id: "r4", name: "Priyanka Bose", phone: "+91 88990 11223", service: "golf",         guests: 2,  date: "2026-05-29", time: "10:00", stage: "declined",   createdAt: new Date(Date.now() - 10 * 3600000).toISOString() },
  { _id: "r5", name: "Suresh Pillai", phone: "+91 91234 56789", service: "table",        guests: 3,  date: "2026-05-28", time: "20:00", stage: "new",        createdAt: new Date(Date.now() -  1 * 3600000).toISOString() },
];

let MOCK_FINANCIAL_TXNS = [
  {
    id: "tx1001",
    date: "2026-05-30",
    channel: "dine_in",
    payment: "card",
    subtotal: 4820,
    tax: 434,
    discount: 120,
    aggregator: null,
    items: [
      { name: "Truffle Fries", category: "Food", qty: 2, total: 760 },
      { name: "Txuleta Steak", category: "Bar", qty: 1, total: 1800 },
      { name: "Basque Old Fashioned", category: "Beverage", qty: 2, total: 1100 },
      { name: "Mango Cheesecake", category: "Dessert", qty: 2, total: 860 },
    ],
  },
  {
    id: "tx1002",
    date: "2026-05-30",
    channel: "swiggy",
    payment: "aggregator",
    subtotal: 1620,
    tax: 146,
    discount: 80,
    aggregator: "Swiggy",
    items: [
      { name: "Butter Chicken Fondue", category: "Food", qty: 1, total: 545 },
      { name: "Quinoa Edamame Salad", category: "Food", qty: 1, total: 410 },
      { name: "Garden Bloom", category: "Beverage", qty: 2, total: 540 },
    ],
  },
  {
    id: "tx1003",
    date: "2026-05-29",
    channel: "dine_in",
    payment: "upi",
    subtotal: 3280,
    tax: 295,
    discount: 0,
    aggregator: null,
    items: [
      { name: "Pork Pepperoni Pizza", category: "Food", qty: 1, total: 925 },
      { name: "Sacred Grove", category: "Beverage", qty: 2, total: 1350 },
      { name: "Basque Cheesecake", category: "Dessert", qty: 1, total: 420 },
      { name: "Gin & Tonic", category: "Bar", qty: 2, total: 585 },
    ],
  },
  {
    id: "tx1004",
    date: "2026-05-28",
    channel: "zomato",
    payment: "aggregator",
    subtotal: 2180,
    tax: 196,
    discount: 150,
    aggregator: "Zomato",
    items: [
      { name: "Fiamma Pizza", category: "Food", qty: 1, total: 695 },
      { name: "Cream of Mushroom", category: "Food", qty: 2, total: 620 },
      { name: "Rosewood Calm", category: "Beverage", qty: 2, total: 810 },
    ],
  },
  {
    id: "tx1005",
    date: "2026-05-27",
    channel: "banquet",
    payment: "bank_transfer",
    subtotal: 12800,
    tax: 1152,
    discount: 1000,
    aggregator: null,
    items: [
      { name: "Vegetarian Tandoori Platter", category: "Food", qty: 4, total: 5196 },
      { name: "Basque Classic Butter Chicken", category: "Food", qty: 3, total: 2385 },
      { name: "Garden Bloom", category: "Beverage", qty: 6, total: 4050 },
      { name: "Basque Dal Makhni", category: "Food", qty: 4, total: 2580 },
    ],
  },
  {
    id: "tx1006",
    date: "2026-05-26",
    channel: "dine_in",
    payment: "cash",
    subtotal: 960,
    tax: 86,
    discount: 0,
    aggregator: null,
    items: [
      { name: "Morning in the Garden", category: "Beverage", qty: 2, total: 450 },
      { name: "Mini Vada Pav", category: "Food", qty: 2, total: 570 },
    ],
  },
  {
    id: "tx1007",
    date: "2026-05-25",
    channel: "swiggy",
    payment: "aggregator",
    subtotal: 1840,
    tax: 166,
    discount: 90,
    aggregator: "Swiggy",
    items: [
      { name: "Thai Raw Mango Salad", category: "Food", qty: 1, total: 330 },
      { name: "Mango Paneer Tikka", category: "Food", qty: 1, total: 510 },
      { name: "Mango Cheesecake", category: "Dessert", qty: 1, total: 360 },
      { name: "Mango Pahadi Cooler", category: "Beverage", qty: 2, total: 640 },
    ],
  },
  {
    id: "tx1008",
    date: "2026-05-24",
    channel: "events",
    payment: "invoice",
    subtotal: 15400,
    tax: 1386,
    discount: 1320,
    aggregator: null,
    items: [
      { name: "Non-Vegetarian Tandoori Platter", category: "Food", qty: 4, total: 7196 },
      { name: "Burrata Pizza", category: "Food", qty: 6, total: 5250 },
      { name: "Sacred Grove", category: "Beverage", qty: 8, total: 5400 },
      { name: "Mango Tiramisu", category: "Dessert", qty: 6, total: 2280 },
    ],
  },
];

const toDate = (dateStr) => new Date(`${dateStr}T00:00:00`);

const isWithinRange = (date, range, from, to) => {
  const target = typeof date === "string" ? toDate(date) : new Date(date);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  switch (range) {
    case "today":
      return target >= startOfToday;
    case "7d": {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 6);
      return target >= start && target <= startOfToday;
    }
    case "30d": {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 29);
      return target >= start && target <= startOfToday;
    }
    case "custom": {
      if (!from || !to) return true;
      const start = toDate(from);
      const end = toDate(to);
      return target >= start && target <= end;
    }
    default:
      return true;
  }
};

export const tablesApi = {
  getAll: async (params) => {
<<<<<<< Updated upstream
    await delay();
    let data = [..._tables];
    if (params?.status) data = data.filter((t) => t.status === params.status);
    return { data };
  },
  getOne: async (id) => { await delay(); return { data: _tables.find((t) => t.tableId === id) }; },
  getStats: async () => {
    await delay();
    return { data: { available: _tables.filter((t) => t.status === "available").length, occupied: _tables.filter((t) => t.status === "occupied").length } };
=======
    let q = supabase
      .from("tables")
      .select(
        "id, capacity, status, current_session, sort_order, is_active, sections(id, name, label), session:current_session(id, guest_name, party_size, is_vip, created_at)"
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

    const { data: ords, error: ordersError } = await supabase
      .from("orders")
      .select(
        "id, session_id, stage, subtotal, created_at, table_sessions(table_id), order_items(quantity, unit_price, menu_items(name))"
      )
      .neq("stage", "served");

    if (ordersError) throw ordersError;

    (ords || [])
      .filter((o) => !isDemoId(o.id))
      .forEach((o) => {
        const tableId = o.table_sessions?.table_id;
        if (!tableId) return;

        if (!ordersByTable[tableId]) ordersByTable[tableId] = [];

        ordersByTable[tableId].push({
          _id: o.id,
          id: o.id,
          status: stageToUi(o.stage),
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
          svcByTable[s.table_id].push({
            _id: s.id,
            id: s.id,
            type: s.type,
            status: s.status,
            tableName: s.table_name,
            createdAt: s.created_at,
          });
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
          pax: t.capacity,
          status: hasRealOrders ? "seated" : isDemoSession ? "available" : t.status,
          current_session: isDemoSession ? null : t.current_session,
          guest: isDemoSession ? null : t.session?.guest_name || null,
          isVip: isDemoSession ? false : t.session?.is_vip || false,
          seatedAt: isDemoSession ? null : t.session?.created_at || null,
          occupiedSince: isDemoSession ? null : t.session?.created_at || null,
          activeOrders: ordersByTable[t.id] || [],
          serviceRequests: svcByTable[t.id] || [],
        };
      }),
    };
  },

  getOne: async (tableId) => {
    const { data: table, error } = await supabase
      .from("tables")
      .select("id, capacity, status, current_session, sections(label)")
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
            .select("id, guest_name, party_size, is_vip, created_at")
            .eq("id", table.current_session)
            .maybeSingle()
        : Promise.resolve({ data: null }),

      supabase
        .from("orders")
        .select(
          "id, session_id, stage, subtotal, created_at, table_sessions(table_id), order_items(id, quantity, unit_price, menu_items(name))"
        )
        .eq("table_sessions.table_id", tableId)
        .neq("stage", "served"),

      supabase
        .from("service_requests")
        .select("id, type, status, table_name, created_at")
        .eq("table_id", tableId)
        .neq("status", "completed"),
    ]);

    sessionData = sessRes.data;

    activeOrders = (ordRes.data || [])
      .filter((o) => !isDemoId(o.id))
      .map((o) => ({
        _id: o.id,
        id: o.id,
        status: stageToUi(o.stage),
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
      .map((s) => ({
        _id: s.id,
        id: s.id,
        type: s.type,
        status: s.status,
        tableName: s.table_name,
        createdAt: s.created_at,
      }));

    const hasRealOrders = activeOrders.length > 0;
    const isDemoSession = isDemoId(table.current_session) && !hasRealOrders;

    return {
      data: {
        tableId: table.id,
        tableName: `Table ${table.id}`,
        section: table.sections?.label || "",
        pax: table.capacity,
        status: hasRealOrders ? "seated" : isDemoSession ? "available" : table.status,
        guest: isDemoSession ? null : sessionData?.guest_name || null,
        isVip: isDemoSession ? false : sessionData?.is_vip || false,
        seatedAt: isDemoSession ? null : sessionData?.created_at || null,
        activeOrders,
        serviceRequests,
      },
    };
  },

  getStats: async () => {
    const tablesRes = await tablesApi.getAll();
    const rows = tablesRes.data || [];

    return {
      data: {
        available: rows.filter((t) => t.status === "available").length,
        seated: rows.filter((t) => t.status === "seated").length,
        occupied: rows.filter((t) => t.status === "seated").length,
        bussing: rows.filter((t) => t.status === "needs_bussing").length,
        reserved: rows.filter((t) => t.status === "reserved").length,
      },
    };
>>>>>>> Stashed changes
  },
  updateStatus: async (tableId, body) => {
<<<<<<< Updated upstream
    await delay(200);
    _tables = _tables.map((t) =>
      t.tableId === tableId
        ? { ...t, ...body, occupiedSince: (body.status === "occupied" || body.status === "seated") ? new Date().toISOString() : t.occupiedSince }
        : t
    );
    return { data: _tables.find((t) => t.tableId === tableId) };
  },
};

export const ordersApi = {
  getAll: async (params) => {
    await delay();
    let data = [..._orders];
    if (params?.status) data = data.filter((o) => o.status === params.status);
    if (params?.tableId) data = data.filter((o) => o.tableId === params.tableId);
    return { data };
=======
    const { status, guest, isVip, performer } = body;

    if (status === "seated") {
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

    if (status === "available") {
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
            closed_at: new Date().toISOString(),
          })
          .eq("id", tbl.current_session);
      }

      const { data, error } = await supabase
        .from("tables")
        .update({ status: "available", current_session: null })
        .eq("id", tableId)
        .select()
        .single();

      if (error) throw error;

      _auditLog("table_status_change", "table", tableId, performer, {
        to: "available",
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
};

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export const ordersApi = {
  getAll: async (params) => {
    let q = supabase
      .from("orders")
      .select(
        "id, session_id, stage, subtotal, notes, created_at, placed_at, ready_at, served_at, table_sessions(table_id, guest_name), order_items(id, quantity, unit_price, menu_items(name))"
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
>>>>>>> Stashed changes
  },
  updateStatus: async (id, status) => {
<<<<<<< Updated upstream
    await delay(200);
    _orders = _orders.map((o) => o._id === id ? { ...o, status } : o);
    return { data: _orders.find((o) => o._id === id) };
=======
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
        "id, stage, subtotal, notes, created_at, placed_at, ready_at, served_at, table_sessions(table_id, guest_name), order_items(id, quantity, unit_price, menu_items(name))"
      )
      .single();

    if (error) throw error;

    return { data: _shapeOrder(data) };
>>>>>>> Stashed changes
  },
  deleteOrder: async (id) => {
<<<<<<< Updated upstream
    await delay(200);
    _orders = _orders.filter((o) => o._id !== id);
    return { data: { ok: true } };
  },
};

export const serviceApi = {
  getAll: async () => { await delay(); return { data: [..._service] }; },
  updateStatus: async (id, status) => {
    await delay(200);
    _service = _service.map((s) => s._id === id ? { ...s, status } : s);
    return { data: _service.find((s) => s._id === id) };
  },
};

export const waitlistApi = {
  getAll: async () => { await delay(); return { data: [..._waitlist] }; },
  getDeclined: async () => { await delay(); return { data: [] }; },
  add: async (data) => {
    await delay(300);
    const entry = { _id: `w${Date.now()}`, ...data, waitStart: new Date().toISOString() };
    _waitlist = [entry, ..._waitlist];
    return { data: entry };
  },
  update: async (id, data) => {
    await delay(200);
    _waitlist = _waitlist.map((w) => w._id === id ? { ...w, ...data } : w);
    return { data: _waitlist.find((w) => w._id === id) };
  },
  remove: async (id) => {
    await delay(200);
    _waitlist = _waitlist.filter((w) => w._id !== id);
    return { data: { ok: true } };
  },
  notify: async () => { await delay(200); return { data: { ok: true } }; },
  decline: async (id) => {
    await delay(200);
    _waitlist = _waitlist.filter((w) => w._id !== id);
    return { data: { ok: true } };
  },
};

export const reservationsApi = {
  getAll: async () => { await delay(); return { data: [..._reservations] }; },
  getStats: async () => {
    await delay();
    return {
      data: {
        total:     _reservations.length,
        newLeads:  _reservations.filter((r) => r.stage === "new").length,
        contacted: _reservations.filter((r) => r.stage === "contacted").length,
        confirmed: _reservations.filter((r) => r.stage === "confirmed").length,
        declined:  _reservations.filter((r) => r.stage === "declined").length,
        checkedIn: _reservations.filter((r) => r.stage === "checked_in").length,
      },
    };
  },
  create: async (data) => {
    await delay(300);
    const entry = { _id: `r${Date.now()}`, ...data, stage: "new", createdAt: new Date().toISOString() };
    _reservations = [entry, ..._reservations];
    return { data: entry };
=======
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
  return {
    _id: o.id,
    id: o.id,
    sessionId: o.session_id,
    tableId: o.table_sessions?.table_id || "",
    tableName: `Table ${o.table_sessions?.table_id || ""}`,
    status: stageToUi(o.stage),
    total: o.subtotal,
    createdAt: o.created_at,
    notes: o.notes,
    items: (o.order_items || []).map((i) => ({
      name: i.menu_items?.name || "Unknown",
      qty: i.quantity,
      price: i.unit_price,
    })),
  };
}

// ─── SERVICE REQUESTS ────────────────────────────────────────────────────────

export const serviceApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("service_requests")
      .select("id, table_id, table_name, type, status, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return {
      data: (data || [])
        .filter((s) => !isDemoId(s.id))
        .map((s) => ({
          _id: s.id,
          id: s.id,
          tableId: s.table_id,
          tableName: s.table_name || `Table ${s.table_id}`,
          type: s.type,
          status: s.status,
          createdAt: s.created_at,
        })),
    };
  },

  updateStatus: async (id, status) => {
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

    return {
      data: {
        _id: data.id,
        id: data.id,
        tableId: data.table_id,
        tableName: data.table_name,
        type: data.type,
        status: data.status,
        createdAt: data.created_at,
      },
    };
  },

  create: async (tableId, tableName, type) => {
    const { data, error } = await supabase
      .from("service_requests")
      .insert({
        table_id: tableId,
        table_name: tableName,
        type,
        status: "new",
      })
      .select()
      .single();

    if (error) throw error;

    return { data };
  },
};

// ─── WAITLIST ─────────────────────────────────────────────────────────────────

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
>>>>>>> Stashed changes
  },
  updateStage: async (id, body) => {
<<<<<<< Updated upstream
    await delay(200);
    _reservations = _reservations.map((r) =>
      r._id === id ? { ...r, stage: body.stage, stageNote: body.stageNote } : r
    );
    return { data: _reservations.find((r) => r._id === id) };
  },
};

export const insightsApi = {
  getToday: async () => {
    await delay();
    const served = _orders.filter((o) => o.status === "served");
    const revenue = served.reduce((s, o) => s + o.total, 0);
    const allItems = served.flatMap((o) => o.items || []);
    const itemCounts = allItems.reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + item.qty;
      return acc;
    }, {});
    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const occupiedTables = _tables.filter((t) => t.status === "occupied");
    const covers = occupiedTables.reduce((s, t) => s + t.pax, 0);
    return {
      data: {
        revenue,
        covers,
        orderCount: _orders.length,
        avgSpend: covers > 0 ? Math.round(revenue / covers) : 0,
        topItems,
      },
    };
  },
  getSectionPerf: async () => {
    await delay();
    const sections = ["Indoor", "Terrace", "Garden", "Bar"];
    return {
      data: sections.map((section) => {
        const tables = _tables.filter((t) => t.section === section);
        const tableIds = tables.map((t) => t.tableId);
        const sectionOrders = _orders.filter((o) => tableIds.includes(o.tableId) && o.status === "served");
        return {
          section,
          covers: tables.filter((t) => t.status === "occupied").reduce((s, t) => s + t.pax, 0),
          revenue: sectionOrders.reduce((s, o) => s + o.total, 0),
        };
      }),
    };
  },
  exportAudit: () => {
    const csv = "timestamp,action,performer\n" + new Date().toISOString() + ",demo export,system";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "audit_export.csv"; a.click();
    URL.revokeObjectURL(url);
  },
};

export const authApi = {
  login: async (role) => ({ data: { user: { role } } }),
};

export const auditApi = {
  getReport: async ({ range = "7d", from, to } = {}) => {
    await delay();
    const filtered = MOCK_FINANCIAL_TXNS.filter((txn) => isWithinRange(txn.date, range, from, to));

    const summary = filtered.reduce(
      (acc, txn) => {
        const gross = txn.subtotal + txn.tax;
        const net = gross - txn.discount;
        acc.gross += gross;
        acc.net += net;
        acc.discount += txn.discount;
        acc.tax += txn.tax;
        return acc;
      },
      { gross: 0, net: 0, discount: 0, tax: 0 }
    );

    const categories = {};
    const payments = {};
    const channels = {};
    const itemMap = {};
    const timelineMap = {};

    filtered.forEach((txn) => {
      const gross = txn.subtotal + txn.tax;

      channels[txn.channel] = (channels[txn.channel] || 0) + gross;
      payments[txn.payment] = (payments[txn.payment] || 0) + gross;

      txn.items.forEach((item) => {
        categories.total = (categories.total || 0) + item.total;
        categories[item.category] = (categories[item.category] || 0) + item.total;
        const key = item.name;
        if (!itemMap[key]) {
          itemMap[key] = { name: item.name, category: item.category, qty: 0, revenue: 0 };
        }
        itemMap[key].qty += item.qty;
        itemMap[key].revenue += item.total;
      });

      const day = txn.date;
      if (!timelineMap[day]) {
        timelineMap[day] = { date: day, gross: 0, net: 0, discount: 0 };
      }
      timelineMap[day].gross += gross;
      timelineMap[day].net += gross - txn.discount;
      timelineMap[day].discount += txn.discount;
    });

    const timeline = Object.values(timelineMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    const items = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12);

    return {
      data: {
        summary,
        categories,
        payments,
        channels,
        items,
        timeline,
      },
    };
=======
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
>>>>>>> Stashed changes
  },

  exportCsv: (report) => {
    if (!report) return;
<<<<<<< Updated upstream
    const headers = ["Item", "Category", "Qty", "Revenue"];
    const rows = report.items.map((item) => [item.name, item.category, item.qty, item.revenue]);
    const csv = [headers.join(",")]
      .concat(rows.map((r) => r.join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_items.csv";
    a.click();
=======

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

>>>>>>> Stashed changes
    URL.revokeObjectURL(url);
  },
};

<<<<<<< Updated upstream
export default {};
=======
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
>>>>>>> Stashed changes
