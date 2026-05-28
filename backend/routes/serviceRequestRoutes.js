import express from "express";
import ServiceRequest from "../models/ServiceRequest.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const requests = await ServiceRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch service requests" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { tableId, tableName, type } = req.body;

    if (!tableId || !tableName) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const request = await ServiceRequest.create({
      tableId,
      tableName,
      type: type || "call_waiter",
    });

    const io = req.app.get("io");
    io.emit("service:new", request);

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: "Failed to create service request" });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    const io = req.app.get("io");
    io.emit("service:updated", request);

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Failed to update request" });
  }
});

export default router;