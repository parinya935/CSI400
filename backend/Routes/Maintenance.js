// ---- Maintenance Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired from "../Auth/middle.js";

const router = express.Router();

// Template + Checklist
router.get("/maintenance/templates", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM maintenance_templates ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Fetch templates error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/maintenance/templates", authRequired, async (req, res) => {
  const { name, description, checklist_items } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Missing name' });
  try {
    const [result] = await pool.query(
      'INSERT INTO maintenance_templates (name, description, checklist_items) VALUES (?, ?, ?)',
      [name, description || null, checklist_items || null]
    );
    const [rows] = await pool.query('SELECT * FROM maintenance_templates WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Plan
router.get("/maintenance/plans", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT mp.*, c.name as contract_name, e.name as elevator_name
      FROM maintenance_plans mp
      LEFT JOIN contracts c ON mp.contract_id = c.id
      LEFT JOIN elevators e ON mp.elevator_id = e.id
      ORDER BY mp.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Fetch plans error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/maintenance/plans", authRequired, async (req, res) => {
  const { contract_id, elevator_id, template_id, scheduled_date, status } = req.body || {};
  if (!elevator_id || !scheduled_date) return res.status(400).json({ message: 'Missing elevator_id or scheduled_date' });
  try {
    const [result] = await pool.query(
      'INSERT INTO maintenance_plans (contract_id, elevator_id, template_id, scheduled_date, status) VALUES (?, ?, ?, ?, ?)',
      [contract_id || null, elevator_id, template_id || null, scheduled_date, status || 'pending']
    );
    const [rows] = await pool.query('SELECT * FROM maintenance_plans WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Jobs (ประวัติการซ่อม/ตรวจจริง)
router.get("/maintenance/jobs", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT mj.*, p.name as plan_name, e.name as elevator_name, t.name as technician_name
      FROM maintenance_jobs mj
      LEFT JOIN maintenance_plans p ON mj.plan_id = p.id
      LEFT JOIN elevators e ON mj.elevator_id = e.id
      LEFT JOIN technicians t ON mj.technician_id = t.id
      ORDER BY mj.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Fetch jobs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/maintenance/jobs", authRequired, async (req, res) => {
  const { plan_id, elevator_id, technician_id, start_time, end_time, status, notes } = req.body || {};
  if (!elevator_id) return res.status(400).json({ message: 'Missing elevator_id' });
  try {
    const [result] = await pool.query(
      'INSERT INTO maintenance_jobs (plan_id, elevator_id, technician_id, start_time, end_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [plan_id || null, elevator_id, technician_id || null, start_time || null, end_time || null, status || 'pending', notes || null]
    );
    const [rows] = await pool.query('SELECT * FROM maintenance_jobs WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Tickets
router.get("/tickets", authRequired, async (req, res) => {
    try {
      const [tickets] = await pool.query(`
        SELECT t.*, e.name as elevator_name 
        FROM tickets t
        LEFT JOIN elevators e ON t.elevator_id = e.id
        ORDER BY t.created_at DESC
      `);
      res.json(tickets);
    } catch (error) {
      console.error('Fetch tickets error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/tickets", authRequired, async (req, res) => {
  const { elevator_id, description, type, priority, source } = req.body || {};
  if (!elevator_id || !description) {
    return res.status(400).json({ message: "Missing elevator_id or description" });
  }

  try {
    const ticketId = `T-${Date.now()}`;

    await pool.query(
      'INSERT INTO tickets (id, elevator_id, description, reporter_id, type, priority, source, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [ticketId, elevator_id, description, req.user.id, type || 'emergency_repair', priority || 'medium', source || 'system', 'pending']
    );

    const [tickets] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [ticketId]
    );

    return res.status(201).json({ message: "Ticket created", ticket: tickets[0] });
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;