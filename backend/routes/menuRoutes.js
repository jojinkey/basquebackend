import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// Helper to convert frontend string labels into downcase snake slugs
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/&/g, "")
    .replace(/__+/g, "_");
};

// GET /api/menu
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT 
        mi.id AS "_id",
        mi.name,
        mi.price / 100.0 AS price,
        mi.description AS "desc",
        mc.label AS category,
        mi.image_url AS image,
        mi.is_available AS "isAvailable",
        mi.created_at AS "createdAt",
        mi.updated_at AS "updatedAt"
      FROM menu_items mi
      JOIN menu_categories mc ON mc.id = mi.category_id
      ORDER BY mc.sort_order ASC, mi.sort_order ASC
    `;
    const { rows } = await query(sql);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching menu items:", err.message);
    return res.status(500).json({ message: "Internal server error fetching menu data." });
  }
});

// POST /api/menu
router.post("/", async (req, res) => {
  const { name, price, desc, category, image, isAvailable } = req.body;
  
  try {
    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: "Name, price, and category are required parameters." });
    }

    // 1. Check or automatically provision the requested category mapping
    let catResult = await query("SELECT id FROM menu_categories WHERE label = $1", [category]);
    let categoryId;
    
    if (catResult.rows.length === 0) {
      const slug = slugify(category);
      const insertCat = await query(
        "INSERT INTO menu_categories (name, label, sort_order) VALUES ($1, $2, 99) RETURNING id",
        [slug, category]
      );
      categoryId = insertCat.rows[0].id;
    } else {
      categoryId = catResult.rows[0].id;
    }

    // 2. Perform write operation converting input currency (Rupees) into database storage format (Paise)
    const paisePrice = Math.round(price * 100);
    const itemSql = `
      INSERT INTO menu_items (category_id, name, description, price, image_url, is_available)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id AS "_id", name, price / 100.0 AS price, description AS "desc", image_url AS image, is_available AS "isAvailable", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const { rows } = await query(itemSql, [categoryId, name, desc || null, paisePrice, image || null, isAvailable !== false]);
    
    const createdItem = rows[0];
    createdItem.category = category; // Inject the plain string category label explicitly

    return res.status(201).json(createdItem);
  } catch (err) {
    console.error("Error creating menu item:", err.message);
    return res.status(500).json({ message: "Internal server error saving menu item." });
  }
});

// PUT /api/menu/:id (Handles full/partial item modifications)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, desc, category, image, isAvailable } = req.body;
  
  try {
    // 1. Locate the baseline item to guarantee correct fallbacks for unsupplied properties
    const currentItem = await query("SELECT * FROM menu_items WHERE id = $1", [id]);
    if (currentItem.rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    // 2. Resolve category changes if provided, or retain legacy relation link
    let targetCategoryId = currentItem.rows[0].category_id;
    let finalCategoryLabel = category;

    if (category) {
      let catResult = await query("SELECT id FROM menu_categories WHERE label = $1", [category]);
      if (catResult.rows.length === 0) {
        const slug = slugify(category);
        const insertCat = await query(
          "INSERT INTO menu_categories (name, label, sort_order) VALUES ($1, $2, 99) RETURNING id",
          [slug, category]
        );
        targetCategoryId = insertCat.rows[0].id;
      } else {
        targetCategoryId = catResult.rows[0].id;
      }
    } else {
      // Resolve existing string label name if user didn't modify it
      const labelRes = await query("SELECT label FROM menu_categories WHERE id = $1", [targetCategoryId]);
      finalCategoryLabel = labelRes.rows[0].label;
    }

    // 3. Assemble target mutation values maps
    const targetName = name !== undefined ? name : currentItem.rows[0].name;
    const targetDescription = desc !== undefined ? desc : currentItem.rows[0].description;
    const targetPrice = price !== undefined ? Math.round(price * 100) : currentItem.rows[0].price;
    const targetImage = image !== undefined ? image : currentItem.rows[0].image_url;
    const targetAvailable = isAvailable !== undefined ? isAvailable : currentItem.rows[0].is_available;

    const updateSql = `
      UPDATE menu_items 
      SET category_id = $1, name = $2, description = $3, price = $4, image_url = $5, is_available = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING id AS "_id", name, price / 100.0 AS price, description AS "desc", image_url AS image, is_available AS "isAvailable", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const { rows } = await query(updateSql, [targetCategoryId, targetName, targetDescription, targetPrice, targetImage, targetAvailable, id]);
    
    const updatedPayload = rows[0];
    updatedPayload.category = finalCategoryLabel;

    return res.status(200).json(updatedPayload);
  } catch (err) {
    console.error("Error executing item modification:", err.message);
    return res.status(500).json({ message: "Internal server error processing update configuration changes." });
  }
});

// PUT /api/menu/:id/availability (Frontend shortcut specific toggles handler)
router.put("/:id/availability", async (req, res) => {
  const { id } = req.params;
  const { isAvailable } = req.body;
  
  try {
    if (isAvailable === undefined) {
      return res.status(400).json({ message: "isAvailable state argument is required." });
    }

    const updateSql = `
      UPDATE menu_items 
      SET is_available = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id AS "_id", name, price / 100.0 AS price, description AS "desc", image_url AS image, is_available AS "isAvailable", created_at AS "createdAt", updated_at AS "updatedAt", category_id
    `;
    const { rows } = await query(updateSql, [isAvailable, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    const updatedItem = rows[0];
    
    // Retrieve correct label for the injected return context object mapping
    const labelRes = await query("SELECT label FROM menu_categories WHERE id = $1", [updatedItem.category_id]);
    updatedItem.category = labelRes.rows[0].label;
    delete updatedItem.category_id; // Clean up processing keys before final response delivery

    return res.status(200).json(updatedItem);
  } catch (err) {
    console.error("Error setting availability status flags:", err.message);
    return res.status(500).json({ message: "Internal server error altering availability states." });
  }
});

// DELETE /api/menu/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("DELETE FROM menu_items WHERE id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("Error executing system deletion sequence:", err.message);
    return res.status(500).json({ message: "Internal server error executing deletion runtime." });
  }
});

export default router;