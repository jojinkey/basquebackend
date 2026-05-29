import express from "express";
import WaitlistEntry from "../models/WaitlistEntry.js";

const router = express.Router();

router.get("/declined", async (req, res) => {
  try {
    const declined = await WaitlistEntry.find({ status: "DECLINED" }).sort({ declinedAt: -1 }).limit(50);
    res.json(declined);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch declined list" });
  }
});

router.get("/", async (req, res) => {
  try {
    const entries = await WaitlistEntry.find({ status: { $in: ["WAITING", "NOTIFIED"] } }).sort({
      isVip: -1,
      priority: -1,
      waitStart: 1,
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch waitlist" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { guestName, partySize, source, phone, notes, isVip, sectionPreference } = req.body;
    if (!guestName || !partySize) {
      return res.status(400).json({ message: "Guest name and party size required" });
    }

    const entry = await WaitlistEntry.create({
      guestName,
      partySize,
      source: source || "WALK_IN",
      phone: phone || "",
      notes: notes || "",
      isVip: isVip || false,
      sectionPreference: sectionPreference || null,
      waitStart: new Date(),
    });

    const io = req.app.get("io");
    io.emit("waitlist:added", entry);

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: "Failed to add to waitlist" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const entry = await WaitlistEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    const io = req.app.get("io");
    io.emit("waitlist:updated", entry);

    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: "Failed to update waitlist entry" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const entry = await WaitlistEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    const io = req.app.get("io");
    io.emit("waitlist:removed", req.params.id);

    res.json({ message: "Removed from waitlist" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove from waitlist" });
  }
});

router.post("/:id/notify", async (req, res) => {
  try {
    const entry = await WaitlistEntry.findByIdAndUpdate(
      req.params.id,
      { status: "NOTIFIED" },
      { new: true }
    );
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    const io = req.app.get("io");
    io.emit("waitlist:updated", entry);

    res.json({ message: "Notification sent (simulated)", entry });
  } catch (err) {
    res.status(500).json({ message: "Failed to notify guest" });
  }
});

router.post("/:id/decline", async (req, res) => {
  try {
    const { reason, performer } = req.body;
    const entry = await WaitlistEntry.findByIdAndUpdate(
      req.params.id,
      {
        status: "DECLINED",
        declineReason: reason || "No reason given",
        declinedAt: new Date(),
        declinedBy: performer || { name: "Staff", role: "unknown" },
      },
      { new: true }
    );
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    const io = req.app.get("io");
    io.emit("waitlist:removed", req.params.id);

    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: "Failed to decline guest" });
  }
});

export default router;
