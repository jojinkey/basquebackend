import express from "express";
import Table from "../models/Table.js";
import AuditLog from "../models/AuditLog.js";
import Order from "../models/Order.js";
import ServiceRequest from "../models/ServiceRequest.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const tables = await Table.find();
    const available = tables.filter((t) => t.status === "available").length;
    const seated = tables.filter((t) => t.status === "seated").length;
    const reserved = tables.filter((t) => t.status === "reserved").length;
    const needsBussing = tables.filter((t) => t.status === "needs_bussing").length;

    const seatedTables = tables.filter((t) => t.status === "seated" && t.seatedAt);
    const avgDuration =
      seatedTables.length > 0
        ? Math.round(
            seatedTables.reduce((sum, t) => {
              const mins = (Date.now() - new Date(t.seatedAt)) / 60000;
              return sum + mins;
            }, 0) / seatedTables.length
          )
        : 0;

    res.json({ available, seated, reserved, needsBussing, avgDuration, total: tables.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.section) query.section = req.query.section;
    if (req.query.status) query.status = req.query.status;

    const tables = await Table.find(query).sort({ tableId: 1 });

    const orders = await Order.find({ status: { $ne: "served" } });
    const serviceReqs = await ServiceRequest.find({ status: "new" });

    const enriched = tables.map((t) => {
      const tableOrders = orders.filter((o) => o.tableId === t.tableId);
      const tableServiceReqs = serviceReqs.filter((r) => r.tableId === t.tableId);
      return {
        ...t.toObject(),
        activeOrders: tableOrders,
        serviceRequests: tableServiceReqs,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tables" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const table = await Table.findOne({ tableId: req.params.id });
    if (!table) return res.status(404).json({ message: "Table not found" });

    const orders = await Order.find({ tableId: req.params.id, status: { $ne: "served" } });
    const serviceReqs = await ServiceRequest.find({ tableId: req.params.id, status: "new" });

    res.json({ ...table.toObject(), activeOrders: orders, serviceRequests: serviceReqs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch table" });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const { status, guest, isVip, reservation, notes, performer } = req.body;

    const prev = await Table.findOne({ tableId: req.params.id });
    if (!prev) return res.status(404).json({ message: "Table not found" });

    const updateData = { status };
    if (guest !== undefined) updateData.guest = guest;
    if (isVip !== undefined) updateData.isVip = isVip;
    if (reservation !== undefined) updateData.reservation = reservation;
    if (notes !== undefined) updateData.notes = notes;

    if (status === "seated" && prev.status !== "seated") {
      updateData.seatedAt = new Date();
    } else if (status === "available" || status === "needs_bussing") {
      if (status === "available") {
        updateData.seatedAt = null;
        updateData.guest = null;
        updateData.isVip = false;
        updateData.reservation = null;
      }
    }

    const table = await Table.findOneAndUpdate(
      { tableId: req.params.id },
      updateData,
      { new: true }
    );

    await AuditLog.create({
      action: "table_status_change",
      entity: "table",
      entityId: req.params.id,
      performer: performer || { name: "Staff", role: "unknown" },
      details: { from: prev.status, to: status, guest },
    });

    const io = req.app.get("io");
    io.emit("table:statusChanged", table);

    res.json(table);
  } catch (err) {
    res.status(500).json({ message: "Failed to update table" });
  }
});

export default router;
