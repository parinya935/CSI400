// ---- Parts Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired, { roleRequired } from "../Auth/middle.js";

const router = express.Router();

/**
 * @swagger
 * /api/parts:
 *   get:
 *     summary: Get all parts
 *     description: Retrieve all parts (Admin and Technician only)
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of parts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Part'
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/parts:
 *   post:
 *     summary: Create a new part
 *     description: Add a new part (Admin and Manager only)
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - part_code
 *               - name
 *             properties:
 *               part_code:
 *                 type: string
 *                 example: "P-001"
 *               name:
 *                 type: string
 *                 example: "Motor"
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               unit:
 *                 type: string
 *                 example: "pcs"
 *               cost_price:
 *                 type: number
 *               sell_price:
 *                 type: number
 *               min_stock:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Part created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Part'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/parts/{id}:
 *   put:
 *     summary: Update a part
 *     description: Update part information (Admin and Manager only)
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - part_code
 *               - name
 *             properties:
 *               part_code:
 *                 type: string
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               unit:
 *                 type: string
 *               cost_price:
 *                 type: number
 *               sell_price:
 *                 type: number
 *               min_stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Part updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Part'
 *       404:
 *         description: Part not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/parts/{id}:
 *   delete:
 *     summary: Delete a part
 *     description: Delete a part (Admin and Manager only)
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Part deleted successfully
 *       404:
 *         description: Part not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/parts/stocks:
 *   get:
 *     summary: Get parts stock levels
 *     description: Retrieve current stock levels for all parts (Admin and Technician only)
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of parts with stock quantities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   part_id:
 *                     type: integer
 *                   part_code:
 *                     type: string
 *                   part_name:
 *                     type: string
 *                   quantity:
 *                     type: number
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/parts/stocks/adjust:
 *   post:
 *     summary: Adjust part stock
 *     description: Adjust stock quantity for a part (Admin only)
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - part_id
 *               - change_qty
 *             properties:
 *               part_id:
 *                 type: integer
 *               change_qty:
 *                 type: number
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stock adjusted successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/parts/movements:
 *   get:
 *     summary: Get part movements
 *     description: Retrieve part movement history (Admin and Technician only)
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of part movements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   part_id:
 *                     type: integer
 *                   part_code:
 *                     type: string
 *                   part_name:
 *                     type: string
 *                   change_qty:
 *                     type: number
 *                   movement_type:
 *                     type: string
 *                   ref_type:
 *                     type: string
 *                   note:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 */
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