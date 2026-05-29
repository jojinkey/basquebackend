import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * Bidirectional Mapping Helpers
 * Maps PostgreSQL order_stage enums to Frontend status strings
 */
const mapStageToStatus = (stage) => {
  switch (stage) {
    case "placed":
    case "acknowledged": 
      return "new";
    case "under_preparation":
    case "ready": 
      return "preparing";
    case "served":
    case "bill_requested":
    case "paid": 
      return "served";
    case "ready_for_cleaning":
    case "table_reset": 
      return "cancelled";
    default: 
      return "new";
  }
};

/**
 * Maps Frontend status strings to PostgreSQL order_stage enums
 */
const mapStatusToStage = (status) => {
  switch (status) {
    case "new": 
      return "placed";
    case "preparing": 
      return "under_preparation";
    case "served": 
      return "served";
    case "cancelled": 
      return "table_reset";
    default: 
      return "placed";
  }
};

/**
 * Reshapes DB relational rows back into the flat shape expected by the frontend contract
 */
const formatOrder = (row) => {
  return {
    _id: row.id,
    tableId: row.table_id,
    tableName: row.guest_name || row.table_id,
    items: row.items || [],
    total: Number(row.subtotal) / 100, // Handle read price conversion (Paise to Rupees)
    status: mapStageToStatus(row.stage),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// GET /api/orders
router.get("/", async (req, res) => {
  try {
    const { status, tableId } = req.query;
    
    let queryParams = [];
    let whereClauses = [];

    if (tableId) {
      queryParams.push(tableId);
      whereClauses.push(`ts.table_id = $${queryParams.length}`);
    }

    if (status) {
      let targetedStages = [];
      if (status === "new") targetedStages = ["placed", "acknowledged"];
      else if (status === "preparing") targetedStages = ["under_preparation", "ready"];
      else if (status === "served") targetedStages = ["served", "bill_requested", "paid"];
      else if (status === "cancelled") targetedStages = ["ready_for_cleaning", "table_reset"];

      if (targetedStages.length > 0) {
        queryParams.push(targetedStages);
        whereClauses.push(`o.stage = ANY($${queryParams.length})`);
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const sql = `
      SELECT 
        o.id,
        o.stage,
        o.subtotal,
        o.placed_at AS created_at,
        o.placed_at AS updated_at,
        ts.table_id,
        ts.guest_name,
        COALESCE(
          json_agg(
            json_build_object(
              'name', COALESCE(mi.name, oi.special_instructions),
              'price', oi.unit_price / 100.0,
              'qty', oi.quantity
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      JOIN table_sessions ts ON ts.id = o.session_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      ${whereSql}
      GROUP BY o.id, ts.table_id, ts.guest_name
      ORDER BY o.placed_at DESC
    `;

    const { rows } = await pool.query(sql, queryParams);
    const legacyPayloads = rows.map(formatOrder);
    
    return res.json(legacyPayloads);
  } catch (error) {
    console.error("Error collecting orders:", error.message);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// POST /api/orders
router.post("/", async (req, res) => {
  const { tableId, tableName, items, total, status } = req.body;

  if (!tableId || !tableName || !items || items.length === 0) {
    return res.status(400).json({ message: "Invalid order data" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let sessionRes = await client.query(
      "SELECT id FROM table_sessions WHERE table_id = $1 AND is_active = true LIMIT 1",
      [tableId]
    );
    
    let sessionId;
    const paiseTotal = Math.round(total * 100); 

    if (sessionRes.rows.length === 0) {
      const createSessionSql = `
        INSERT INTO table_sessions (table_id, guest_name, party_size, is_active, total_bill)
        VALUES ($1, $2, 1, true, $3)
        RETURNING id
      `;
      const fallbackSession = await client.query(createSessionSql, [tableId, tableName, paiseTotal]);
      sessionId = fallbackSession.rows[0].id;

      await client.query("UPDATE tables SET current_session = $1 WHERE id = $2", [sessionId, tableId]);
    } else {
      sessionId = sessionRes.rows[0].id;
      await client.query("UPDATE table_sessions SET total_bill = total_bill + $1 WHERE id = $2", [paiseTotal, sessionId]);
    }

    const targetStage = mapStatusToStage(status || "new");
    const orderSql = `
      INSERT INTO orders (session_id, stage, subtotal)
      VALUES ($1, $2, $3)
      RETURNING id, stage, subtotal, placed_at AS created_at, placed_at AS updated_at
    `;
    const orderRes = await client.query(orderSql, [sessionId, targetStage, paiseTotal]);
    const spawnedOrder = orderRes.rows[0];

    const responseItems = [];

    for (const item of items) {
      const itemLookup = await client.query("SELECT id FROM menu_items WHERE name = $1 LIMIT 1", [item.name]);
      const menuItemId = itemLookup.rows.length > 0 ? itemLookup.rows[0].id : null;
      const paisePrice = Math.round(item.price * 100);

      const itemInsertSql = `
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, special_instructions)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(itemInsertSql, [
        spawnedOrder.id,
        menuItemId,
        item.qty,
        paisePrice,
        menuItemId ? null : item.name 
      ]);

      responseItems.push({
        name: item.name,
        price: item.price,
        qty: item.qty
      });
    }

    await client.query("COMMIT");

    const completedLegacyPayload = {
      _id: spawnedOrder.id,
      tableId,
      tableName,
      items: responseItems,
      total,
      status: mapStageToStatus(spawnedOrder.stage),
      createdAt: spawnedOrder.created_at,
      updatedAt: spawnedOrder.updated_at
    };

    const io = req.app.get("io");
    if (io) io.emit("order:new", completedLegacyPayload);

    return res.status(201).json(completedLegacyPayload);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transactional order execution crashed:", error.message);
    return res.status(500).json({ message: "Failed to create order" });
  } finally {
    client.release();
  }
});

// PUT /api/orders/:id/status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const targetStageValue = mapStatusToStage(status);
    
    const updateSql = `
      UPDATE orders
      SET stage = $1
      WHERE id = $2
      RETURNING id
    `;
    const checkRes = await pool.query(updateSql, [targetStageValue, req.params.id]);
    
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const sql = `
      SELECT 
        o.id, o.stage, o.subtotal, o.placed_at AS created_at, o.placed_at AS updated_at,
        ts.table_id, ts.guest_name,
        COALESCE(
          json_agg(
            json_build_object(
              'name', COALESCE(mi.name, oi.special_instructions),
              'price', oi.unit_price / 100.0,
              'qty', oi.quantity
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      JOIN table_sessions ts ON ts.id = o.session_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.id = $1
      GROUP BY o.id, ts.table_id, ts.guest_name
    `;
    const { rows } = await pool.query(sql, [req.params.id]);
    const updatedPayload = formatOrder(rows[0]);

    const io = req.app.get("io");
    if (io) io.emit("order:updated", updatedPayload);

    return res.json(updatedPayload);
  } catch (error) {
    console.error("Error setting order execution status state:", error.message);
    return res.status(500).json({ message: "Failed to update order" });
  }
});

// DELETE /api/orders/:id
router.delete("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    await client.query("DELETE FROM order_items WHERE order_id = $1", [req.params.id]);
    const deleteRes = await client.query("DELETE FROM orders WHERE id = $1", [req.params.id]);
    
    if (deleteRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found" });
    }

    await client.query("COMMIT");

    const io = req.app.get("io");
    if (io) io.emit("order:deleted", req.params.id);

    return res.json({ message: "Order deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Cascade deletion processing failure:", error.message);
    return res.status(500).json({ message: "Failed to delete order" });
  } finally {
    client.release();
  }
});

export default router;