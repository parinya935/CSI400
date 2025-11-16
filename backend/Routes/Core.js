// ---- Core Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired from "../Auth/middle.js";

const router = express.Router();

// ลูกค้า
router.get("/customers", authRequired, async (req, res) => {
  // SELECT * FROM customers
});

router.post("/customers", authRequired, async (req, res) => {
  // INSERT INTO customers ...
});

// อาคาร
router.get("/buildings", authRequired, async (req, res) => {
  // SELECT b.*, c.name as customer_name FROM buildings b JOIN customers c ...
});

// ลิฟต์ (ที่ G มีอยู่แล้วใน server.js)
router.get("/elevators", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, b.name as building_name
      FROM elevators e
      LEFT JOIN buildings b ON e.building_id = b.id
      ORDER BY e.updated_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Fetch elevators error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;