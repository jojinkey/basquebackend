import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import serviceRequestRoutes from "./routes/serviceRequestRoutes.js";
// 🆕 NEW: Import the Delivery Order Route
import deliveryOrderRoutes from "./routes/deliveryOrderRoutes.js";

dotenv.config();

const app = express();

// 1. UPDATE: Configure CORS for Express
const allowedOrigins = [
  "http://localhost:5174",            // For local development
  "https://basquedehradun.com",       // Live production domain
  "https://www.basquedehradun.com"    // Live production domain (www)
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

// 2. UPDATE: Configure CORS for Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
// 🆕 NEW: Register Delivery Order Route
app.use("/api/delivery-orders", deliveryOrderRoutes);

app.get("/", (req, res) => {
  res.send("Basque realtime backend running securely!");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB error:", err.message);
  });