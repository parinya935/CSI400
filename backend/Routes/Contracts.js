// ---- Contracts Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired, { roleRequired } from "../Auth/middle.js";

const router = express.Router();

/**
 * @swagger
 * /api/contracts:
 *   get:
 *     summary: Get contracts
 *     description: Retrieve contracts (Admin gets all, Customer gets own)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Contract'
 *       500:
 *         description: Internal server error
 */
// สัญญา
router.get("/contracts", authRequired, async (req, res) => {
  const { role, customer_id } = req.user || {};

  try {
    let sql = "SELECT * FROM contracts";
    const params = [];

    if (role === "customer") {
      sql += " WHERE customer_id = ?";
      params.push(customer_id || 0);
    }

    sql += " ORDER BY start_date DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Fetch contracts error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/contracts:
 *   post:
 *     summary: Create a new contract
 *     description: Create a new contract (Admin only)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - contract_code
 *               - contract_type
 *               - start_date
 *               - end_date
 *             properties:
 *               customer_id:
 *                 type: integer
 *               contract_code:
 *                 type: string
 *                 example: "C-001"
 *               contract_type:
 *                 type: string
 *                 example: "Standard"
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               maintenance_times_per_year:
 *                 type: integer
 *               included_items:
 *                 type: string
 *               excluded_items:
 *                 type: string
 *               notify_before_days:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Contract created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contract'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
// สร้างสัญญา
router.post("/contracts", authRequired, roleRequired("admin"), async (req, res) => {
	const { customer_id, contract_code, contract_type, start_date, end_date, maintenance_times_per_year, included_items, excluded_items, notify_before_days } = req.body || {};
	if (!customer_id || !contract_code || !contract_type || !start_date || !end_date) return res.status(400).json({ message: 'Missing required fields' });
	try {
		const [result] = await pool.query(
			'INSERT INTO contracts (customer_id, contract_code, contract_type, start_date, end_date, maintenance_times_per_year, included_items, excluded_items, notify_before_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
			[customer_id, contract_code, contract_type, start_date, end_date, maintenance_times_per_year || 0, included_items || null, excluded_items || null, notify_before_days || 30]
		);
		const [rows] = await pool.query('SELECT * FROM contracts WHERE id = ?', [result.insertId]);
		res.status(201).json(rows[0]);
	} catch (error) {
		console.error('Create contract error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

/**
 * @swagger
 * /api/contracts/{id}:
 *   put:
 *     summary: Update a contract
 *     description: Update contract information (Admin only)
 *     tags: [Contracts]
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
 *               - customer_id
 *               - contract_code
 *               - contract_type
 *               - start_date
 *               - end_date
 *             properties:
 *               customer_id:
 *                 type: integer
 *               contract_code:
 *                 type: string
 *               contract_type:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               maintenance_times_per_year:
 *                 type: integer
 *               included_items:
 *                 type: string
 *               excluded_items:
 *                 type: string
 *               notify_before_days:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Contract updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contract'
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Internal server error
 */
// แก้ไขสัญญา
router.put("/contracts/:id", authRequired, roleRequired("admin"), async (req, res) => {
  const { id } = req.params;
  const {
    customer_id,
    contract_code,
    contract_type,
    start_date,
    end_date,
    maintenance_times_per_year,
    included_items,
    excluded_items,
    notify_before_days,
  } = req.body || {};

  if (!customer_id || !contract_code || !contract_type || !start_date || !end_date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [result] = await pool.query(
      `
      UPDATE contracts
      SET customer_id = ?,
          contract_code = ?,
          contract_type = ?,
          start_date = ?,
          end_date = ?,
          maintenance_times_per_year = ?,
          included_items = ?,
          excluded_items = ?,
          notify_before_days = ?
      WHERE id = ?
      `,
      [
        customer_id,
        contract_code,
        contract_type,
        start_date,
        end_date,
        maintenance_times_per_year || 0,
        included_items || null,
        excluded_items || null,
        notify_before_days || 30,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const [rows] = await pool.query("SELECT * FROM contracts WHERE id = ?", [
      id,
    ]);
    res.json(rows[0]);
  } catch (error) {
    console.error("Update contract error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/contracts/{id}:
 *   delete:
 *     summary: Delete a contract
 *     description: Delete a contract (Admin only)
 *     tags: [Contracts]
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
 *         description: Contract deleted successfully
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Internal server error
 */
// ลบสัญญา
router.delete("/contracts/:id", authRequired, roleRequired("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM contracts WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    res.json({ message: "Contract deleted" });
  } catch (error) {
    console.error("Delete contract error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/quotations:
 *   get:
 *     summary: Get quotations
 *     description: Retrieve quotations (Admin gets all, Customer gets own)
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of quotations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   quotation_code:
 *                     type: string
 *                   customer_id:
 *                     type: integer
 *                   ticket_id:
 *                     type: integer
 *                   contract_id:
 *                     type: integer
 *                   status:
 *                     type: string
 *                   total_amount:
 *                     type: number
 *                   customer_name:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
// ดึงใบเสนอราคา (Admin = ทั้งหมด, Customer = ของตัวเอง)
router.get("/quotations", authRequired, async (req, res) => {
  const { role, customer_id } = req.user || {};

  try {
    let sql = `
      SELECT q.*, c.name AS customer_name
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
    `;
    const params = [];

    if (role === "customer") {
      sql += " WHERE q.customer_id = ?";
      params.push(customer_id || 0);
    }

    sql += " ORDER BY q.id DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Fetch quotations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// สร้างใบเสนอราคา
router.post("/quotations", authRequired, roleRequired("admin"), async (req, res) => {
  const {
    quotation_code,
    customer_id,
    ticket_id,
    contract_id,
    status,
    total_amount,
  } = req.body || {};

  if (!customer_id) {
    return res.status(400).json({ message: "customer_id is required" });
  }

  // ถ้าไม่ส่ง code มา จะ generate แบบง่าย ๆ
  const code = quotation_code || `Q-${Date.now()}`;

  try {
    const [result] = await pool.query(
      `
      INSERT INTO quotations
      (quotation_code, customer_id, ticket_id, contract_id, status, total_amount)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        code,
        customer_id,
        ticket_id || null,
        contract_id || null,
        status || "draft",
        total_amount || 0,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM quotations WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Create quotation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// แก้ไขใบเสนอราคา
router.put("/quotations/:id", authRequired, roleRequired("admin"), async (req, res) => {
  const { id } = req.params;
  const {
    quotation_code,
    customer_id,
    ticket_id,
    contract_id,
    status,
    total_amount,
  } = req.body || {};

  if (!customer_id || !quotation_code) {
    return res
      .status(400)
      .json({ message: "quotation_code และ customer_id จำเป็นต้องมี" });
  }

  try {
    const [result] = await pool.query(
      `
      UPDATE quotations
      SET
        quotation_code = ?,
        customer_id    = ?,
        ticket_id      = ?,
        contract_id    = ?,
        status         = ?,
        total_amount   = ?
      WHERE id = ?
      `,
      [
        quotation_code,
        customer_id,
        ticket_id || null,
        contract_id || null,
        status || "draft",
        total_amount || 0,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const [rows] = await pool.query("SELECT * FROM quotations WHERE id = ?", [
      id,
    ]);
    res.json(rows[0]);
  } catch (error) {
    console.error("Update quotation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ลบใบเสนอราคา
router.delete("/quotations/:id", authRequired, roleRequired("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM quotations WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete quotation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ดึงใบแจ้งหนี้ (พร้อมชื่อลูกค้า)
router.get("/invoices", authRequired, async (req, res) => {
  const { role, customer_id } = req.user || {};

  try {
    let sql = "SELECT * FROM invoices";
    const params = [];

    if (role === "customer") {
      sql += " WHERE customer_id = ?";
      params.push(customer_id || 0);
    }

    sql += " ORDER BY id DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Fetch invoices error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// สร้างใบแจ้งหนี้
router.post("/invoices", authRequired, roleRequired("admin"), async (req, res) => {
  const {
    invoice_code,
    customer_id,
    quotation_id,
    total_amount,
    paid_amount,
    status,
    due_date,
  } = req.body || {};

  if (!customer_id) {
    return res.status(400).json({ message: "customer_id is required" });
  }

  const code = invoice_code || `I-${Date.now()}`;

  try {
    const [result] = await pool.query(
      `
      INSERT INTO invoices
      (invoice_code, customer_id, quotation_id,
       total_amount, paid_amount, status, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        code,
        customer_id,
        quotation_id || null,
        total_amount || 0,
        paid_amount || 0,
        status || "unpaid",
        due_date || null,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM invoices WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// แก้ไขใบแจ้งหนี้
router.put("/invoices/:id", authRequired, roleRequired("admin"), async (req, res) => {
  const { id } = req.params;
  const {
    invoice_code,
    customer_id,
    quotation_id,
    total_amount,
    paid_amount,
    status,
    due_date,
  } = req.body || {};

  if (!customer_id || !invoice_code) {
    return res
      .status(400)
      .json({ message: "invoice_code และ customer_id จำเป็นต้องมี" });
  }

  try {
    const [result] = await pool.query(
      `
      UPDATE invoices
      SET
        invoice_code = ?,
        customer_id  = ?,
        quotation_id = ?,
        total_amount = ?,
        paid_amount  = ?,
        status       = ?,
        due_date     = ?
      WHERE id = ?
      `,
      [
        invoice_code,
        customer_id,
        quotation_id || null,
        total_amount || 0,
        paid_amount || 0,
        status || "unpaid",
        due_date || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const [rows] = await pool.query("SELECT * FROM invoices WHERE id = ?", [
      id,
    ]);
    res.json(rows[0]);
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ลบใบแจ้งหนี้
router.delete("/invoices/:id", authRequired, roleRequired("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM invoices WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ดึง config ล่าสุด (มีแค่ 1 record ก็พอ)
router.get("/pricing-settings", authRequired, roleRequired("admin") , async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM pricing_settings
      ORDER BY id DESC
      LIMIT 1
      `
    );
    // ถ้ายังไม่มี row เลย ให้คืนค่า default เบสิค
    if (rows.length === 0) {
      return res.json({
        id: null,
        call_fee: 0,
        labor_rate_per_hour: 0,
        parts_markup_percent: 0,
        currency: "THB",
      });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Fetch pricing settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// บันทึก/อัปเดต config (ถ้ามีแล้ว update, ถ้าไม่มี insert)
router.put("/pricing-settings", authRequired, roleRequired("admin"), async (req, res) => {
  const {
    id,
    call_fee,
    labor_rate_per_hour,
    parts_markup_percent,
    currency,
  } = req.body || {};

  try {
    if (id) {
      // update row เดิม
      const [result] = await pool.query(
        `
        UPDATE pricing_settings
        SET
          call_fee             = ?,
          labor_rate_per_hour  = ?,
          parts_markup_percent = ?,
          currency             = ?
        WHERE id = ?
        `,
        [
          call_fee || 0,
          labor_rate_per_hour || 0,
          parts_markup_percent || 0,
          currency || "THB",
          id,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Pricing settings not found" });
      }
    } else {
      // insert ใหม่
      await pool.query(
        `
        INSERT INTO pricing_settings
        (call_fee, labor_rate_per_hour, parts_markup_percent, currency)
        VALUES (?, ?, ?, ?)
        `,
        [
          call_fee || 0,
          labor_rate_per_hour || 0,
          parts_markup_percent || 0,
          currency || "THB",
        ]
      );
    }

    // ดึงค่าล่าสุดกลับไปให้ frontend
    const [rows] = await pool.query(
      `
      SELECT *
      FROM pricing_settings
      ORDER BY id DESC
      LIMIT 1
      `
    );
    res.json(rows[0]);
  } catch (error) {
    console.error("Update pricing settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;