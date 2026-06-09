import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = {};

    if (req.query.status) query.status = req.query.status;
    if (req.query.tableId) query.tableId = req.query.tableId;

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { tableId, tableName, items, total } = req.body;

    if (!tableId || !tableName || !items || items.length === 0) {
      return res.status(400).json({
        message: "Invalid order data",
      });
    }

    const order = await Order.create({
      tableId,
      tableName,
      items,
      total,
      status: "pending_approval",
    });

    const io = req.app.get("io");

    io.emit("order:pending", order);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending_approval",
      "approved",
      "rejected",
      "preparing",
      "ready",
      "served",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const io = req.app.get("io");

    io.emit("order:updated", order);

    if (status === "approved") {
      io.emit("order:approved", order);
    }

    if (status === "rejected") {
      io.emit("order:rejected", order);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const io = req.app.get("io");

    io.emit("order:deleted", req.params.id);

    res.json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete order",
      error: error.message,
    });
  }
});

export default router;