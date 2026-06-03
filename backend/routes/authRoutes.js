import express from "express";
import User from "../models/User.js";

const router = express.Router();

const DEMO_USERS = [
  { name: "Avantika", role: "owner", password: "owner@2024" },
  { name: "Arjun", role: "restaurant_manager", password: "manager@24" },
  { name: "Priya", role: "floor_manager", pin: "4455" },
  { name: "Rahul", role: "server", pin: "1122" },
  { name: "Kitchen", role: "kitchen", pin: "7788" },
  { name: "Audit", role: "auditor", password: "audit@26" },
];

router.post("/login", async (req, res) => {
  try {
    const { role, credential } = req.body;
    if (!role || !credential) {
      return res.status(400).json({ message: "Role and credential required" });
    }

    const match = DEMO_USERS.find((u) => {
      if (u.role !== role) return false;
      if (u.pin) return u.pin === credential;
      if (u.password) return u.password === credential;
      return false;
    });

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const sessionUser = {
      name: match.name,
      role: match.role,
      loginTime: new Date().toISOString(),
    };

    return res.json({ user: sessionUser });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/session", (req, res) => {
  res.json({ message: "Use localStorage session" });
});

export default router;
