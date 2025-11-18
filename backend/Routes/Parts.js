// ---- Parts Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired, { roleRequired } from "../Auth/middle.js";

const router = express.Router();

// อะไหล่
router.get("/parts", authRequired, roleRequired(["admin", "technician"]), async (req, res) => {
	try {
		const [rows] = await pool.query('SELECT * FROM parts ORDER BY id DESC');
		res.json(rows);
	} catch (error) {
		console.error('Fetch parts error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

// สร้างอะไหล่ใหม่
router.post("/parts", authRequired, roleRequired(["admin", "manager"]) , async (req, res) => {
  const {
    part_code,
    name,
    brand,
    model,
    unit,
    cost_price,
    sell_price,
    min_stock,
  } = req.body || {};

  if (!part_code || !name) {
    return res.status(400).json({ message: "Missing part_code or name" });
  }

  try {
    const [result] = await pool.query(
      `
      INSERT INTO parts
        (part_code, name, brand, model, unit, cost_price, sell_price, min_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        part_code,
        name,
        brand || null,
        model || null,
        unit || "pcs",
        cost_price != null ? Number(cost_price) : 0,
        sell_price != null ? Number(sell_price) : 0,
        min_stock != null ? Number(min_stock) : 0,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM parts WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Create part error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// แก้ไขอะไหล่
router.put("/parts/:id", authRequired, roleRequired(["admin", "manager"]), async (req, res) => {
  const { id } = req.params;
  const {
    part_code,
    name,
    brand,
    model,
    unit,
    cost_price,
    sell_price,
    min_stock,
  } = req.body || {};

  if (!part_code || !name) {
    return res.status(400).json({ message: "Missing part_code or name" });
  }

  try {
    const [result] = await pool.query(
      `
      UPDATE parts
      SET
        part_code  = ?,
        name       = ?,
        brand      = ?,
        model      = ?,
        unit       = ?,
        cost_price = ?,
        sell_price = ?,
        min_stock  = ?
      WHERE id = ?
      `,
      [
        part_code,
        name,
        brand || null,
        model || null,
        unit || "pcs",
        cost_price != null ? Number(cost_price) : 0,
        sell_price != null ? Number(sell_price) : 0,
        min_stock != null ? Number(min_stock) : 0,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Part not found" });
    }

    const [rows] = await pool.query("SELECT * FROM parts WHERE id = ?", [
      id,
    ]);
    res.json(rows[0]);
  } catch (error) {
    console.error("Update part error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ลบอะไหล่
router.delete("/parts/:id", authRequired, roleRequired(["admin", "manager"]), async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM parts WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Part not found" });
    }
    res.json({ message: "Part deleted" });
  } catch (error) {
    console.error("Delete part error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// สต๊อก
router.get("/parts/stocks", authRequired, roleRequired(["admin", "technician"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        pm.part_id,
        p.part_code,
        p.name AS part_name,
        COALESCE(SUM(pm.qty), 0) AS quantity
      FROM part_movements pm
      JOIN parts p ON pm.part_id = p.id
      GROUP BY pm.part_id
      ORDER BY p.part_code
      `
    );
    res.json(rows);
  } catch (error) {
    console.error("Fetch parts stocks error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/parts/stocks/adjust", authRequired, roleRequired("admin"), async (req, res) => {
  const { part_id, change_qty, note } = req.body || {};

  if (!part_id || change_qty == null) {
    return res
      .status(400)
      .json({ message: "part_id และ change_qty จำเป็นต้องมี" });
  }

  const change = Number(change_qty);
  if (!change) {
    return res.status(400).json({ message: "change_qty ต้องไม่เป็น 0" });
  }

  try {
    await pool.query(
      `
      INSERT INTO part_movements
        (part_id, movement_type, qty, ref_type, ref_id)
      VALUES (?, 'adjust', ?, 'stock_adjust', ?)
      `,
      [part_id, change, note || null]
    );

    res.status(201).json({ message: "Stock adjusted" });
  } catch (error) {
    console.error("Adjust stock error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// movement
router.get("/parts/movements", authRequired, roleRequired(["admin", "technician"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        pm.id,
        pm.part_id,
        p.part_code,
        p.name AS part_name,
        pm.qty AS change_qty,
        pm.movement_type,
        pm.ref_type,
        pm.ref_id AS note,
        pm.created_at
      FROM part_movements pm
      JOIN parts p ON pm.part_id = p.id
      ORDER BY pm.created_at DESC
      `
    );
    res.json(rows);
  } catch (error) {
    console.error("Fetch part movements error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;