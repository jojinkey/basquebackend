import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import pool from "./db.js";

// Migrated PostgreSQL API Routers
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import serviceRequestRoutes from "./routes/serviceRequestRoutes.js";
import leadsRoutes from "./routes/leadsRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Initialize Socket.io Server Engine
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Mounted Operational PostgreSQL Endpoints
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/leads", leadsRoutes);

// Fallback Mock Handlers to Bypass Un-migrated MongoDB Files and Prevent Startup Crashes
app.use("/api/auth", (req, res) => res.status(200).json({ status: "migration", message: "Auth porting in progress" }));
app.use("/api/tables", (req, res) => res.status(200).json([]));
app.use("/api/waitlist", (req, res) => res.status(200).json([]));
app.use("/api/reservations", (req, res) => res.status(200).json([]));

// GET /api/insights/today
app.get("/api/insights/today", async (req, res) => {
  try {
    // 1. Fetch orders mapping directly out of PostgreSQL (excluding cancelled equivalents: 'ready_for_cleaning', 'table_reset')
    const ordersQuery = `
      SELECT 
        o.id,
        o.subtotal,
        COALESCE(
          json_agg(
            json_build_object(
              'name', COALESCE(mi.name, oi.special_instructions),
              'qty', oi.quantity
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.stage NOT IN ('ready_for_cleaning', 'table_reset')
      GROUP BY o.id
    `;
    const ordersRes = await pool.query(ordersQuery);
    const orders = ordersRes.rows;

    // 2. Map totals converting baseline integers (paise) back into rupees
    const revenue = orders.reduce((s, o) => s + (Number(o.subtotal) / 100), 0);

    // 3. Count covers using the structural active table status mapping 'seated'
    const coversQuery = "SELECT COUNT(*) FROM tables WHERE status = 'seated'";
    const coversRes = await pool.query(coversQuery);
    const covers = parseInt(coversRes.rows[0].count, 10);

    // 4. Calculate top items dynamically
    const itemMap = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.name) {
          itemMap[item.name] = (itemMap[item.name] || 0) + item.qty;
        }
      });
    });

    const topItems = Object.entries(itemMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      revenue,
      covers,
      avgSpend: covers > 0 ? Math.round(revenue / covers) : 0,
      topItems,
      orderCount: orders.length,
    });
  } catch (err) {
    console.error("Failed to fetch daily insights:", err.message);
    res.status(500).json({ message: "Failed to fetch insights" });
  }
});

// GET /api/insights/section-perf
app.get("/api/insights/section-perf", async (req, res) => {
  try {
    // Aggregates performance by structural sections from the dynamic PostgreSQL database schema
    const performanceQuery = `
      SELECT 
        s.name AS section_slug,
        s.label AS section,
        COALESCE(SUM(o.subtotal) / 100.0, 0) AS revenue,
        COUNT(DISTINCT CASE WHEN t.status = 'seated' THEN t.id END) AS covers
      FROM sections s
      LEFT JOIN tables t ON t.section_id = s.id
      LEFT JOIN table_sessions ts ON ts.table_id = t.id AND ts.is_active = true
      LEFT JOIN orders o ON o.session_id = ts.id AND o.stage NOT IN ('ready_for_cleaning', 'table_reset')
      GROUP BY s.id, s.name, s.label
      ORDER BY s.sort_order ASC
    `;
    const { rows } = await pool.query(performanceQuery);

    // Map output safely into legacy UI title configurations
    const result = rows.map(r => ({
      section: r.section, // Returns readable string labels e.g. "Indoor", "Terrace"
      revenue: parseFloat(r.revenue),
      covers: parseInt(r.covers, 10)
    }));

    res.json(result);
  } catch (err) {
    console.error("Failed to fetch section performance metrics:", err.message);
    res.status(500).json({ message: "Failed to fetch section performance" });
  }
});

// GET /api/audit/export
app.get("/api/audit/export", async (req, res) => {
  try {
    const auditQuery = `
      SELECT 
        al.created_at,
        al.action,
        al.target_type,
        al.target_id,
        u.name AS performer_name,
        u.role AS performer_role,
        al.details
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT 500
    `;
    const { rows } = await pool.query(auditQuery);

    const csv = [
      "Timestamp,Action,Entity,EntityId,Performer,Details",
      ...rows.map((l) =>
        [
          new Date(l.created_at).toISOString(),
          l.action,
          l.target_type,
          l.target_id || "",
          l.performer_name ? `${l.performer_name} (${l.performer_role})` : "System / Unknown",
          JSON.stringify(l.details || {}).replace(/,/g, ";"),
        ].join(",")
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-log.csv");
    res.send(csv);
  } catch (err) {
    console.error("Failed to compile CSV export file:", err.message);
    res.status(500).json({ message: "Failed to export audit log" });
  }
});

app.get("/", (req, res) => {
  res.send("Basque Manager OS backend running cleanly on Supabase Cloud Infrastructure.");
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Ping to verify the Supabase network initialization handshake
    await pool.query("SELECT 1");
    console.log("Database connected successfully via pg Pool.");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection verification error on application startup:", err.message);
    process.exit(1);
  }
}

startServer();