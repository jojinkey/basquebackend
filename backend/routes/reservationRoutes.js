import express from "express";
import Reservation from "../models/Reservation.js";
import AuditLog from "../models/AuditLog.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const all = await Reservation.find();
    res.json({
      newLeads: all.filter((r) => r.stage === "new").length,
      contacted: all.filter((r) => r.stage === "contacted").length,
      confirmed: all.filter((r) => r.stage === "confirmed").length,
      declined: all.filter((r) => r.stage === "declined").length,
      checkedIn: all.filter((r) => r.stage === "checked_in").length,
      total: all.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.stage) query.stage = req.query.stage;
    const reservations = await Reservation.find(query).sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, phone, service, date, time, guests, source, details } = req.body;
    if (!name || !phone || !service) {
      return res.status(400).json({ message: "Name, phone, and service required" });
    }

    const reservation = await Reservation.create({
      name,
      phone,
      service,
      date: date || "",
      time: time || "",
      guests: guests || 2,
      source: source || "website",
      details: details || {},
    });

    const io = req.app.get("io");
    io.emit("reservation:new", reservation);

    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ message: "Failed to create reservation" });
  }
});

router.put("/:id/stage", async (req, res) => {
  try {
    const { stage, stageNote, performer } = req.body;

    const prev = await Reservation.findById(req.params.id);
    if (!prev) return res.status(404).json({ message: "Reservation not found" });

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { stage, stageNote: stageNote || "" },
      { new: true }
    );

    await AuditLog.create({
      action: "reservation_stage_change",
      entity: "reservation",
      entityId: req.params.id,
      performer: performer || { name: "Staff", role: "unknown" },
      details: { from: prev.stage, to: stage, guest: prev.name },
    });

    const io = req.app.get("io");
    io.emit("reservation:updated", reservation);

    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: "Failed to update reservation stage" });
  }
});

export default router;
