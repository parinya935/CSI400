// ---- Core Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired, { roleRequired } from "../Auth/middle.js";

const router = express.Router();

// ดึงลูกค้าทั้งหมด (Admin เท่านั้น)
router.get(
  "/customers",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, business_type, address,
              contact_name, contact_phone, contact_email,
              created_at, updated_at
       FROM customers
       ORDER BY created_at DESC`
      );
      res.json(rows);
    } catch (err) {
      console.error("GET /customers error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// เพิ่มลูกค้าใหม่ (Admin เท่านั้น)
router.post(
  "/customers",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const {
      name,
      business_type,
      address,
      contact_name,
      contact_phone,
      contact_email,
    } = req.body || {};

    if (!name || !business_type) {
      return res
        .status(400)
        .json({ message: "name และ business_type จำเป็นต้องมี" });
    }

    try {
      const [result] = await pool.query(
        `INSERT INTO customers
       (name, business_type, address, contact_name, contact_phone, contact_email)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [
          name,
          business_type,
          address || null,
          contact_name || null,
          contact_phone || null,
          contact_email || null,
        ]
      );

      const [rows] = await pool.query(
        `SELECT id, name, business_type, address,
              contact_name, contact_phone, contact_email,
              created_at, updated_at
       FROM customers
       WHERE id = ?`,
        [result.insertId]
      );

      res.status(201).json(rows[0]);
    } catch (err) {
      console.error("POST /customers error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// แก้ไขลูกค้า (Admin เท่านั้น)
router.put(
  "/customers/:id",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const { id } = req.params;
    const {
      name,
      business_type,
      address,
      contact_name,
      contact_phone,
      contact_email,
    } = req.body || {};

    if (!name || !business_type) {
      return res
        .status(400)
        .json({ message: "name และ business_type จำเป็นต้องมี" });
    }

    try {
      const [result] = await pool.query(
        `UPDATE customers
         SET name = ?, business_type = ?, address = ?,
             contact_name = ?, contact_phone = ?, contact_email = ?
         WHERE id = ?`,
        [
          name,
          business_type,
          address || null,
          contact_name || null,
          contact_phone || null,
          contact_email || null,
          id,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const [rows] = await pool.query(
        `SELECT id, name, business_type, address,
                contact_name, contact_phone, contact_email,
                created_at, updated_at
         FROM customers
         WHERE id = ?`,
        [id]
      );

      res.json(rows[0]);
    } catch (err) {
      console.error("PUT /customers/:id error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ลบลูกค้า (Admin เท่านั้น)
router.delete(
  "/customers/:id",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await pool.query("DELETE FROM customers WHERE id = ?", [
        id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ message: "Customer deleted" });
    } catch (err) {
      console.error("DELETE /customers/:id error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// NEW: ลูกค้าดูข้อมูลตัวเอง
router.get("/customers/me", authRequired, async (req, res) => {
  const { role, customer_id } = req.user || {};
  if (role !== "customer" || !customer_id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, name, business_type, address,
              contact_name, contact_phone, contact_email,
              created_at, updated_at
       FROM customers
       WHERE id = ?`,
      [customer_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("GET /customers/me error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ดึงอาคารทั้งหมด (filter ตาม role)
router.get("/buildings", authRequired, async (req, res) => {
  const { role, customer_id } = req.user || {};

  try {
    let sql = `
      SELECT b.*,
             c.name AS customer_name
      FROM buildings b
      LEFT JOIN customers c ON b.customer_id = c.id
    `;
    const params = [];

    if (role === "customer") {
      sql += " WHERE b.customer_id = ?";
      params.push(customer_id || 0);
    }

    sql += " ORDER BY b.id DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Fetch buildings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// สร้างอาคารใหม่
router.post(
  "/buildings",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const { customer_id, name, address, building_type } = req.body || {};

    if (!customer_id || !name) {
      return res
        .status(400)
        .json({ message: "customer_id และ name จำเป็นต้องมี" });
    }

    try {
      const [result] = await pool.query(
        `
      INSERT INTO buildings (customer_id, name, address, building_type)
      VALUES (?, ?, ?, ?)
      `,
        [customer_id, name, address || null, building_type || null]
      );

      const [rows] = await pool.query(
        `
      SELECT b.*, c.name as customer_name
      FROM buildings b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
      `,
        [result.insertId]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Create building error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// แก้ไขอาคาร
router.put(
  "/buildings/:id",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const { id } = req.params;
    const { customer_id, name, address, building_type } = req.body || {};

    if (!customer_id || !name) {
      return res
        .status(400)
        .json({ message: "customer_id และ name จำเป็นต้องมี" });
    }

    try {
      const [result] = await pool.query(
        `
      UPDATE buildings
      SET customer_id = ?,
          name        = ?,
          address     = ?,
          building_type = ?
      WHERE id = ?
      `,
        [customer_id, name, address || null, building_type || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Building not found" });
      }

      const [rows] = await pool.query(
        `
      SELECT b.*, c.name as customer_name
      FROM buildings b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
      `,
        [id]
      );

      res.json(rows[0]);
    } catch (error) {
      console.error("Update building error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ลบอาคาร
router.delete(
  "/buildings/:id",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const { id } = req.params;

    try {
      const [result] = await pool.query("DELETE FROM buildings WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Building not found" });
      }

      res.json({ message: "Building deleted" });
    } catch (error) {
      console.error("Delete building error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ดึงลิฟต์ทั้งหมด (filter ตาม role)
router.get("/elevators", authRequired, async (req, res) => {
  const { role, customer_id } = req.user || {};

  try {
    let sql = `
      SELECT
        e.*,
        b.name AS building_name,
        c.name AS customer_name
      FROM elevators e
      LEFT JOIN buildings b ON e.building_id = b.id
      LEFT JOIN customers c ON b.customer_id = c.id
    `;
    const params = [];

    if (role === "customer") {
      sql += " WHERE b.customer_id = ?";
      params.push(customer_id || 0);
    }

    sql += " ORDER BY e.id DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Fetch elevators error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// สร้างลิฟต์ใหม่
router.post(
  "/elevators",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const {
      id,
      name,
      building_id,
      brand,
      model,
      install_year,
      install_location,
      capacity,
      state,
      current_floor,
      current_load,
      last_maintenance_at,
      next_maintenance_at,
    } = req.body || {};

    if (!id || !name || !building_id) {
      return res
        .status(400)
        .json({ message: "id, name และ building_id จำเป็นต้องมี" });
    }

    // map state ให้ตรง ENUM
    const allowedStates = [
      "normal",
      "fault",
      "in_maintenance",
      "waiting_maintenance",
      "waiting_quotation",
    ];
    const safeState = allowedStates.includes(state) ? state : "normal";

    try {
      const [result] = await pool.query(
        `
      INSERT INTO elevators
      (id, name, building_id, brand, model,
       install_year, install_location,
       current_floor, current_load,
       state, capacity,
       last_maintenance_at, next_maintenance_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          id,
          name,
          building_id,
          brand || null,
          model || null,
          install_year || null,
          install_location || null,
          current_floor || 1,
          current_load || 0,
          safeState, // ใช้ safeState ที่ผ่านการเช็คแล้ว
          capacity || null,
          last_maintenance_at || null,
          next_maintenance_at || null,
        ]
      );

      const [rows] = await pool.query(
        `
      SELECT e.*, b.name as building_name
      FROM elevators e
      LEFT JOIN buildings b ON e.building_id = b.id
      WHERE e.id = ?
      `,
        [id]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Create elevator error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// แก้ไขลิฟต์ (ไม่ให้เปลี่ยน id)
router.put(
  "/elevators/:id",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const { id } = req.params;
    const {
      name,
      building_id,
      brand,
      model,
      install_year,
      install_location,
      capacity,
      state,
      current_floor,
      current_load,
      last_maintenance_at,
      next_maintenance_at,
    } = req.body || {};

    if (!name || !building_id) {
      return res
        .status(400)
        .json({ message: "name และ building_id จำเป็นต้องมี" });
    }

    // map state ให้ตรง ENUM
    const allowedStates = [
      "normal",
      "fault",
      "in_maintenance",
      "waiting_maintenance",
      "waiting_quotation",
    ];
    const safeState = allowedStates.includes(state) ? state : "normal";

    try {
      const [result] = await pool.query(
        `
      UPDATE elevators
      SET name = ?,
          building_id = ?,
          brand = ?,
          model = ?,
          install_year = ?,
          install_location = ?,
          current_floor = ?,
          current_load = ?,
          state = ?,
          capacity = ?,
          last_maintenance_at = ?,
          next_maintenance_at = ?
      WHERE id = ?
      `,
        [
          name,
          building_id,
          brand || null,
          model || null,
          install_year || null,
          install_location || null,
          current_floor || 1,
          current_load || 0,
          safeState,
          capacity || null,
          last_maintenance_at || null,
          next_maintenance_at || null,
          id,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Elevator not found" });
      }

      const [rows] = await pool.query(
        `
      SELECT e.*, b.name as building_name
      FROM elevators e
      LEFT JOIN buildings b ON e.building_id = b.id
      WHERE e.id = ?
      `,
        [id]
      );

      res.json(rows[0]);
    } catch (error) {
      console.error("Update elevator error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ลบลิฟต์
router.delete(
  "/elevators/:id",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const { id } = req.params;

    try {
      const [result] = await pool.query("DELETE FROM elevators WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Elevator not found" });
      }

      res.json({ message: "Elevator deleted" });
    } catch (error) {
      console.error("Delete elevator error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// รายชื่อ user ที่เป็นช่าง (role = 'technician')
router.get(
  "/technician-users",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `
      SELECT id, name, email
      FROM users
      WHERE role = 'technician'
      ORDER BY name ASC
      `
      );
      res.json(rows);
    } catch (error) {
      console.error("Fetch technician users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ช่างเทคนิค
router.get(
  "/technicians",
  authRequired,
  roleRequired(["admin", "technician"]),
  async (req, res) => {
    try {
      const [rows] = await pool.query(`
      SELECT
        t.id,
        t.user_id,
        u.name,
        u.email,
        t.phone,
        t.specialty,
        t.notes,
        t.created_at,
        t.updated_at
      FROM technicians t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.id DESC
    `);
      res.json(rows);
    } catch (error) {
      console.error("Fetch technicians error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// POST /api/technicians
router.post(
  "/technicians",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const { user_id, phone, specialty, notes } = req.body || {};

    if (!user_id) {
      return res.status(400).json({ message: "user_id จำเป็นต้องมี" });
    }

    try {
      const [result] = await pool.query(
        `
      INSERT INTO technicians (user_id, phone, specialty, notes)
      VALUES (?, ?, ?, ?)
      `,
        [user_id, phone || null, specialty || null, notes || null]
      );

      const [rows] = await pool.query(
        `
      SELECT
        t.id,
        t.user_id,
        u.name,
        u.email,
        t.phone,
        t.specialty,
        t.notes,
        t.created_at,
        t.updated_at
      FROM technicians t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
      `,
        [result.insertId]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Create technician error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// PUT /api/technicians/:id
router.put(
  "/technicians/:id",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const { id } = req.params;
    const { phone, specialty, notes } = req.body || {};

    try {
      const [result] = await pool.query(
        `
      UPDATE technicians
      SET phone = ?, specialty = ?, notes = ?
      WHERE id = ?
      `,
        [phone || null, specialty || null, notes || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Technician not found" });
      }

      const [rows] = await pool.query(
        `
      SELECT
        t.id,
        t.user_id,
        u.name,
        u.email,
        t.phone,
        t.specialty,
        t.notes,
        t.created_at,
        t.updated_at
      FROM technicians t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
      `,
        [id]
      );

      res.json(rows[0]);
    } catch (error) {
      console.error("Update technician error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// DELETE /api/technicians/:id
router.delete(
  "/technicians/:id",
  authRequired,
  roleRequired("admin"),
  async (req, res) => {
    const { id } = req.params;

    try {
      const [result] = await pool.query(
        `DELETE FROM technicians WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Technician not found" });
      }

      res.json({ message: "Technician deleted" });
    } catch (error) {
      console.error("Delete technician error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Alerts
router.get("/alerts", authRequired, async (req, res) => {
  try {
    let sql = `
      SELECT a.*, e.name as elevator_name 
      FROM alerts a
      LEFT JOIN elevators e ON a.elevator_id = e.id
      WHERE a.resolved_at IS NULL
    `;
    const params = [];

    // ถ้าเป็นลูกค้า → เห็นเฉพาะ alert ของลิฟต์ตัวเอง
    if (req.user.role === "customer" && req.user.customer_id) {
      sql += " AND e.customer_id = ?";
      params.push(req.user.customer_id);
    }

    sql += " ORDER BY a.created_at DESC";

    const [alerts] = await pool.query(sql, params);
    res.json(alerts);
  } catch (error) {
    console.error("Fetch alerts error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ADD: Notifications routes (moved from server.js)
router.get("/notifications", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, type, channel, title, body, is_read, sent_at, read_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY sent_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/notifications/:id/read", authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE notifications 
         SET is_read = 1, read_at = NOW() 
       WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    return res.json({ message: "ok" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ADD: Dashboard summary (moved from server.js)
router.get("/dashboard/summary", authRequired, async (req, res) => {
  try {
    let elevatorSql = "SELECT COUNT(*) AS count FROM elevators";
    let ticketSql = `
      SELECT COUNT(*) AS count 
      FROM tickets 
      WHERE status IN ('pending', 'in_progress')
    `;
    let alertSql = `
      SELECT COUNT(*) AS count 
      FROM alerts a
      LEFT JOIN elevators e ON a.elevator_id = e.id
      WHERE a.resolved_at IS NULL
    `;

    const elevatorParams = [];
    const ticketParams = [];
    const alertParams = [];

    if (req.user.role === "customer" && req.user.customer_id) {
      elevatorSql += " WHERE customer_id = ?";
      elevatorParams.push(req.user.customer_id);

      ticketSql += " AND customer_id = ?";
      ticketParams.push(req.user.customer_id);

      alertSql += " AND e.customer_id = ?";
      alertParams.push(req.user.customer_id);
    }

    const [[elevatorsCount]] = await pool.query(elevatorSql, elevatorParams);
    const [[openTickets]] = await pool.query(ticketSql, ticketParams);
    const [[openAlerts]] = await pool.query(alertSql, alertParams);

    return res.json({
      elevators: elevatorsCount.count,
      tickets_open: openTickets.count,
      alerts_open: openAlerts.count,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
