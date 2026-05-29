import express from "express";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const items = await MenuItem.find().sort({ category: 1, name: 1 });
  res.json(items);
});

router.post("/", async (req, res) => {
  const item = await MenuItem.create(req.body);
  res.status(201).json(item);
});

router.put("/:id", async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });

  if (!item) return res.status(404).json({ message: "Item not found" });

  res.json(item);
});

router.put("/:id/availability", async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(
    req.params.id,
    { isAvailable: req.body.isAvailable },
    { new: true }
  );
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json(item);
});

router.delete("/:id", async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);

  if (!item) return res.status(404).json({ message: "Item not found" });

  res.json({ message: "Item deleted successfully" });
});

export default router;