import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/service-requests
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT 
        id AS "_id",
        table_id AS "tableId",
        table_name AS "tableName",
        type,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM service_requests
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(sql);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error extracting system service requests:", error.message);
    return res.status(500).json({ message: "Failed to fetch service requests" });
  }
});

// POST /api/service-requests
router.post("/", async (req, res) => {
  try {
    const { tableId, tableName, type } = req.body;

    if (!tableId || !tableName) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const sql = `
      INSERT INTO service_requests (table_id, table_name, type, status)
      VALUES ($1, $2, $3, 'new')
      RETURNING 
        id AS "_id", 
        table_id AS "tableId", 
        table_name AS "tableName", 
        type, 
        status, 
        created_at AS "createdAt", 
        updated_at AS "updatedAt"
    `;
    const { rows } = await pool.query(sql, [tableId, tableName, type || "call_waiter"]);
    const spawnedRequest = rows[0];

    const io = req.app.get("io");
    if (io) {
      io.emit("service:new", spawnedRequest);
    }

    return res.status(201).json(spawnedRequest);
  } catch (error) {
    console.error("Error creating transactional service request:", error.message);
    return res.status(500).json({ message: "Failed to create service request" });
  }
});

// PUT /api/service-requests/:id/status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status string parameter is required." });
    }

    const sql = `
      UPDATE service_requests
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING 
        id AS "_id", 
        table_id AS "tableId", 
        table_name AS "tableName", 
        type, 
        status, 
        created_at AS "createdAt", 
        updated_at AS "updatedAt"
    `;
    const { rows } = await pool.query(sql, [status, id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Service request not found" });
    }

    const updatedRequest = rows[0];

    const io = req.app.get("io");
    if (io) {
      io.emit("service:updated", updatedRequest);
    }

    return res.status(200).json(updatedRequest);
  } catch (error) {
    console.error("Error updating system operational request ticket status:", error.message);
    return res.status(500).json({ message: "Failed to update request" });
  }
});

export default router;