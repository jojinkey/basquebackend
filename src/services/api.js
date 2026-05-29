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

export const tablesApi = {
  getAll: async (params) => {
    await delay();
    let data = [..._tables];
    if (params?.status) data = data.filter((t) => t.status === params.status);
    return { data };
  },
  getOne: async (id) => { await delay(); return { data: _tables.find((t) => t.tableId === id) }; },
  getStats: async () => {
    await delay();
    return { data: { available: _tables.filter((t) => t.status === "available").length, occupied: _tables.filter((t) => t.status === "occupied").length } };
  },
  updateStatus: async (tableId, body) => {
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
  },
  updateStatus: async (id, status) => {
    await delay(200);
    _orders = _orders.map((o) => o._id === id ? { ...o, status } : o);
    return { data: _orders.find((o) => o._id === id) };
  },
  deleteOrder: async (id) => {
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
  },
  updateStage: async (id, body) => {
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

export default {};
