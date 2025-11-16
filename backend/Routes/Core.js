// ---- Core Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired from "../Auth/middle.js";

const router = express.Router();

// ลูกค้า
router.get("/customers", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/customers", authRequired, async (req, res) => {
  const { name, business_type, address, contact_name, contact_phone, contact_email } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Missing name' });
  try {
    const [result] = await pool.query(
      'INSERT INTO customers (name, business_type, address, contact_name, contact_phone, contact_email) VALUES (?, ?, ?, ?, ?, ?)',
      [name, business_type || null, address || null, contact_name || null, contact_phone || null, contact_email || null]
    );
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// อาคาร
router.get("/buildings", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, c.name as customer_name
      FROM buildings b
      LEFT JOIN customers c ON b.customer_id = c.id
      ORDER BY b.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Fetch buildings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
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
// Alerts
router.get("/alerts", authRequired, async (req, res) => {
  try {
    const [alerts] = await pool.query(`
      SELECT a.*, e.name as elevator_name 
      FROM alerts a
      LEFT JOIN elevators e ON a.elevator_id = e.id
      WHERE a.resolved_at IS NULL
      ORDER BY a.created_at DESC
    `);
    res.json(alerts);
  } catch (error) {
    console.error('Fetch alerts error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;