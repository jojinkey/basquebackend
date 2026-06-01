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
  },

  exportCsv: (report) => {
    if (!report) return;
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
    URL.revokeObjectURL(url);
  },
};

export default {};
