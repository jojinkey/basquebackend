import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import serviceRequestRoutes from "./routes/serviceRequestRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import waitlistRoutes from "./routes/waitlistRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

import Order from "./models/Order.js";
import Table from "./models/Table.js";
import AuditLog from "./models/AuditLog.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

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

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/reservations", reservationRoutes);

app.get("/api/insights/today", async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: "cancelled" } });
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const covers = await Table.countDocuments({ status: "seated" });

    const itemMap = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        itemMap[item.name] = (itemMap[item.name] || 0) + item.qty;
      });
    });
    const topItems = Object.entries(itemMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({ revenue, covers, avgSpend: covers > 0 ? Math.round(revenue / covers) : 0, topItems, orderCount: orders.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch insights" });
  }
});

app.get("/api/insights/section-perf", async (req, res) => {
  try {
    const tables = await Table.find();
    const orders = await Order.find({ status: { $ne: "cancelled" } });

    const sections = ["Indoor", "Terrace", "Garden", "Bar"];
    const result = sections.map((section) => {
      const sectionTableIds = tables.filter((t) => t.section === section).map((t) => t.tableId);
      const sectionOrders = orders.filter((o) => sectionTableIds.includes(o.tableId));
      const revenue = sectionOrders.reduce((s, o) => s + o.total, 0);
      const seatedCount = tables.filter((t) => t.section === section && t.status === "seated").length;
      return { section, revenue, covers: seatedCount };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch section performance" });
  }
});

app.get("/api/audit/export", async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(500);
    const csv = [
      "Timestamp,Action,Entity,EntityId,Performer,Details",
      ...logs.map((l) =>
        [
          new Date(l.createdAt).toISOString(),
          l.action,
          l.entity,
          l.entityId || "",
          `${l.performer.name} (${l.performer.role})`,
          JSON.stringify(l.details).replace(/,/g, ";"),
        ].join(",")
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-log.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: "Failed to export audit log" });
  }
});

app.get("/", (req, res) => {
  res.send("Basque Manager OS backend running");
});

const TABLES_SEED = [
  { tableId: "T1", section: "Indoor", pax: 2 },
  { tableId: "T2", section: "Indoor", pax: 4 },
  { tableId: "T3", section: "Indoor", pax: 4 },
  { tableId: "T4", section: "Indoor", pax: 6 },
  { tableId: "T5", section: "Indoor", pax: 2 },
  { tableId: "T6", section: "Indoor", pax: 4 },
  { tableId: "T7", section: "Indoor", pax: 8 },
  { tableId: "T8", section: "Terrace", pax: 4 },
  { tableId: "T9", section: "Terrace", pax: 6 },
  { tableId: "T10", section: "Terrace", pax: 4 },
  { tableId: "T11", section: "Terrace", pax: 2 },
  { tableId: "T12", section: "Garden", pax: 6 },
  { tableId: "T13", section: "Garden", pax: 4 },
  { tableId: "T14", section: "Garden", pax: 8 },
  { tableId: "T15", section: "Bar", pax: 2 },
  { tableId: "T16", section: "Bar", pax: 2 },
  { tableId: "T17", section: "Bar", pax: 4 },
  { tableId: "T18", section: "Bar", pax: 4 },
];

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      await Table.insertMany(TABLES_SEED);
      console.log("18 tables seeded");
    }

    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB error:", err.message);
  });