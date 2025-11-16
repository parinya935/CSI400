// ---- Contracts Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired from "../Auth/middle.js";

const router = express.Router();

// สัญญา
router.get("/contracts", authRequired, async (req, res) => {
	try {
		const [rows] = await pool.query('SELECT * FROM contracts ORDER BY start_date DESC');
		res.json(rows);
	} catch (error) {
		console.error('Fetch contracts error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

router.post("/contracts", authRequired, async (req, res) => {
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

// ใบเสนอราคา
router.get("/quotations", authRequired, async (req, res) => {
	try {
		const [rows] = await pool.query('SELECT * FROM quotations ORDER BY id DESC');
		res.json(rows);
	} catch (error) {
		console.error('Fetch quotations error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

router.post("/quotations", authRequired, async (req, res) => {
	// For now insert minimal quotation record; detailed items handled separately
	const { contract_id, customer_id, total_amount } = req.body || {};
	try {
		const [result] = await pool.query('INSERT INTO quotations (contract_id, customer_id, total_amount) VALUES (?, ?, ?)', [contract_id || null, customer_id || null, total_amount || 0]);
		const [rows] = await pool.query('SELECT * FROM quotations WHERE id = ?', [result.insertId]);
		res.status(201).json(rows[0]);
	} catch (error) {
		console.error('Create quotation error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

// ใบแจ้งหนี้
router.get("/invoices", authRequired, async (req, res) => {
	try {
		const [rows] = await pool.query('SELECT * FROM invoices ORDER BY id DESC');
		res.json(rows);
	} catch (error) {
		console.error('Fetch invoices error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

router.post("/invoices", authRequired, async (req, res) => {
	const { customer_id, contract_id, total_amount } = req.body || {};
	try {
		const [result] = await pool.query('INSERT INTO invoices (customer_id, contract_id, total_amount) VALUES (?, ?, ?)', [customer_id || null, contract_id || null, total_amount || 0]);
		const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [result.insertId]);
		res.status(201).json(rows[0]);
	} catch (error) {
		console.error('Create invoice error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

export default router;