// ---- Maintenance Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired, { roleRequired } from "../Auth/middle.js";

const router = express.Router();

// Template + Checklist (Maintenance Templates)
// GET: ดึงทั้งหมด
router.get("/maintenance/templates", authRequired, roleRequired(["admin", "technician"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM maintenance_templates ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Fetch templates error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST: สร้าง template ใหม่
router.post("/maintenance/templates", authRequired, roleRequired("admin"), async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: "Missing name" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO maintenance_templates (name, description) VALUES (?, ?)",
      [name, description || null]
    );
    const [rows] = await pool.query(
      "SELECT * FROM maintenance_templates WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Create template error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT: แก้ไข template ตาม id
router.put("/maintenance/templates/:id", authRequired, roleRequired("admin"), async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body || {};

  if (!name) {
    return res.status(400).json({ message: "Missing name" });
  }

  try {
    const [result] = await pool.query(
      `
      UPDATE maintenance_templates
      SET name = ?, description = ?
      WHERE id = ?
      `,
      [name, description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Template not found" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM maintenance_templates WHERE id = ?",
      [id]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error("Update template error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE: ลบ template ตาม id
router.delete("/maintenance/templates/:id", authRequired, roleRequired("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM maintenance_templates WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete template error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Plan
router.get("/maintenance/plans", authRequired, async (req, res) => {
  const { role, customer_id } = req.user || {};

  try {
    let sql = `
      SELECT
        mp.*,
        c.contract_code AS contract_code,
        e.name AS elevator_name
      FROM maintenance_plans mp
      LEFT JOIN contracts c ON mp.contract_id = c.id
      LEFT JOIN elevators e ON mp.elevator_id = e.id
      LEFT JOIN buildings b ON e.building_id = b.id
    `;
    const params = [];

    if (role === "customer") {
      sql += " WHERE b.customer_id = ?";
      params.push(customer_id || 0);
    }

    sql += " ORDER BY mp.id DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Fetch plans error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/maintenance/plans", authRequired, roleRequired(["admin", "technician"]), async (req, res) => {
  const {
    contract_id,
    elevator_id,
    template_id,
    frequency_per_year,
    next_run_at,
    is_active,
  } = req.body || {};

  if (!elevator_id || !template_id || !frequency_per_year) {
    return res
      .status(400)
      .json({ message: "Missing elevator_id, template_id or frequency_per_year" });
  }

  try {
    const [result] = await pool.query(
      `
      INSERT INTO maintenance_plans
        (elevator_id, contract_id, template_id, frequency_per_year, next_run_at, last_run_at, is_active)
      VALUES (?, ?, ?, ?, ?, NULL, ?)
      `,
      [
        elevator_id,
        contract_id || null,
        template_id,
        Number(frequency_per_year),
        next_run_at || null,
        is_active != null ? Number(is_active) : 1,
      ]
    );

    const [rows] = await pool.query(
      "SELECT * FROM maintenance_plans WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Create plan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/maintenance/plans/:id", authRequired, roleRequired(["admin", "technician"]), async (req, res) => {
  const { id } = req.params;
  const {
    contract_id,
    elevator_id,
    template_id,
    frequency_per_year,
    next_run_at,
    is_active,
  } = req.body || {};

  if (!elevator_id || !template_id || !frequency_per_year) {
    return res
      .status(400)
      .json({ message: "Missing elevator_id, template_id or frequency_per_year" });
  }

  try {
    const [result] = await pool.query(
      `
      UPDATE maintenance_plans
      SET
        elevator_id        = ?,
        contract_id        = ?,
        template_id        = ?,
        frequency_per_year = ?,
        next_run_at        = ?,
        is_active          = ?
      WHERE id = ?
      `,
      [
        elevator_id,
        contract_id || null,
        template_id,
        Number(frequency_per_year),
        next_run_at || null,
        is_active != null ? Number(is_active) : 1,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const [rows] = await pool.query(
      `
      SELECT
        mp.*,
        c.contract_code AS contract_code,
        e.name AS elevator_name
      FROM maintenance_plans mp
      LEFT JOIN contracts c ON mp.contract_id = c.id
      LEFT JOIN elevators e ON mp.elevator_id = e.id
      WHERE mp.id = ?
      `,
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("Update plan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/maintenance/plans/:id", authRequired, roleRequired("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM maintenance_plans WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete plan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/maintenance/jobs", authRequired, async (req, res) => {
  const { role, id: userId, customer_id } = req.user || {};
  try {
    let sql = `
      SELECT
        mj.*,
        e.name AS elevator_name,
        b.name AS building_name,
        u.name AS technician_name,
        c.contract_code
      FROM maintenance_jobs mj
      LEFT JOIN elevators e ON mj.elevator_id = e.id
      LEFT JOIN buildings b ON e.building_id = b.id
      LEFT JOIN technicians tech ON mj.technician_id = tech.id
      LEFT JOIN users u ON tech.user_id = u.id
      LEFT JOIN contracts c ON mj.contract_id = c.id
    `;
    const params = [];

    if (role === "technician") {
      sql += " WHERE u.id = ?";
      params.push(userId);
    } else if (role === "customer") {
      sql += " WHERE b.customer_id = ?";
      params.push(customer_id || 0);
    }

    sql += " ORDER BY mj.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Fetch maintenance jobs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/maintenance/jobs", authRequired, roleRequired(["admin", "technician"]), async (req, res) => {
  const {
    elevator_id,
    job_type, // planned / emergency
    technician_id,
    contract_id,
    ticket_id,
    remarks,
    total_labor_hours,
    labor_cost,
    parts_cost,
    total_cost,
  } = req.body || {};

  if (!elevator_id || !job_type) {
    return res
      .status(400)
      .json({ message: "elevator_id และ job_type จำเป็นต้องมี" });
  }

  // คำนวณ total_cost ถ้า frontend ไม่ส่งมา
  const labor = Number(labor_cost || 0);
  const parts = Number(parts_cost || 0);
  const safeTotal = total_cost != null ? Number(total_cost) : labor + parts;

  try {
    const [result] = await pool.query(
      `
      INSERT INTO maintenance_jobs
      (
        elevator_id,
        plan_id,
        template_id,
        contract_id,
        ticket_id,
        technician_id,
        job_type,
        started_at,
        finished_at,
        remarks,
        total_labor_hours,
        labor_cost,
        parts_cost,
        total_cost
      )
      VALUES (?, NULL, NULL, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?)
      `,
      [
        elevator_id,
        contract_id || null,
        ticket_id || null,
        technician_id || null,
        job_type,
        remarks || null,
        total_labor_hours || 0,
        labor,
        parts,
        safeTotal,
      ]
    );

    const [rows] = await pool.query(
      `
      SELECT
        mj.*,
        e.name AS elevator_name,
        b.name AS building_name,
        u.name AS technician_name,
        c.contract_code
      FROM maintenance_jobs mj
      LEFT JOIN elevators e ON mj.elevator_id = e.id
      LEFT JOIN buildings b ON e.building_id = b.id
      LEFT JOIN technicians tech ON mj.technician_id = tech.id
      LEFT JOIN users u ON tech.user_id = u.id
      LEFT JOIN contracts c ON mj.contract_id = c.id
      WHERE mj.id = ?
      `,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Create maintenance job error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// แก้ไข job
router.put("/maintenance/jobs/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  const {
    elevator_id,
    job_type,
    technician_id,
    contract_id,
    ticket_id,
    remarks,
    total_labor_hours,
    labor_cost,
    parts_cost,
    total_cost,
  } = req.body || {};

  const { role, id: userId } = req.user || {};

  if (!elevator_id || !job_type) {
    return res
      .status(400)
      .json({ message: "elevator_id และ job_type จำเป็นต้องมี" });
  }

  const labor = Number(labor_cost || 0);
  const parts = Number(parts_cost || 0);
  const safeTotal = total_cost != null ? Number(total_cost) : labor + parts;

  try {
    // ถ้าเป็น technician → เช็คก่อนว่าเป็นงานของตัวเองไหม
    if (role === "technician") {
      const [check] = await pool.query(
        `
        SELECT mj.id
        FROM maintenance_jobs mj
        LEFT JOIN technicians tech ON mj.technician_id = tech.id
        LEFT JOIN users u ON tech.user_id = u.id
        WHERE mj.id = ? AND u.id = ?
        `,
        [id, userId]
      );

      if (check.length === 0) {
        return res.status(403).json({
          message: "คุณไม่มีสิทธิ์แก้งานนี้",
        });
      }
    } else if (role === "customer") {
      // ลูกค้าห้ามแก้
      return res.status(403).json({ message: "Forbidden" });
    }
    // Admin = ผ่านได้

    const [result] = await pool.query(
      `
      UPDATE maintenance_jobs
      SET
        elevator_id        = ?,
        contract_id        = ?,
        ticket_id          = ?,
        technician_id      = ?,
        job_type           = ?,
        remarks            = ?,
        total_labor_hours  = ?,
        labor_cost         = ?,
        parts_cost         = ?,
        total_cost         = ?
      WHERE id = ?
      `,
      [
        elevator_id,
        contract_id || null,
        ticket_id || null,
        technician_id || null,
        job_type,
        remarks || null,
        total_labor_hours || 0,
        labor,
        parts,
        safeTotal,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    const [rows] = await pool.query(
      `
      SELECT
        mj.*,
        e.name AS elevator_name,
        b.name AS building_name,
        u.name AS technician_name,
        c.contract_code
      FROM maintenance_jobs mj
      LEFT JOIN elevators e ON mj.elevator_id = e.id
      LEFT JOIN buildings b ON e.building_id = b.id
      LEFT JOIN technicians tech ON mj.technician_id = tech.id
      LEFT JOIN users u ON tech.user_id = u.id
      LEFT JOIN contracts c ON mj.contract_id = c.id
      WHERE mj.id = ?
      `,
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("Update maintenance job error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/maintenance/jobs/:id", authRequired, roleRequired("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM maintenance_jobs WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete maintenance job error:", error);
    res.status(500).json({ message: "Internal server error" });
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