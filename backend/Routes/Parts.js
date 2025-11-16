// ---- Parts Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired from "../Auth/middle.js";

const router = express.Router();

// อะไหล่
router.get("/parts", authRequired, async (req, res) => {
	try {
		const [rows] = await pool.query('SELECT * FROM parts ORDER BY id DESC');
		res.json(rows);
	} catch (error) {
		console.error('Fetch parts error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

router.post("/parts", authRequired, async (req, res) => {
	const { part_code, name, description, unit, price } = req.body || {};
	if (!part_code || !name) return res.status(400).json({ message: 'Missing part_code or name' });
	try {
		const [result] = await pool.query('INSERT INTO parts (part_code, name, description, unit, price) VALUES (?, ?, ?, ?, ?)', [part_code, name, description || null, unit || null, price || 0]);
		const [rows] = await pool.query('SELECT * FROM parts WHERE id = ?', [result.insertId]);
		res.status(201).json(rows[0]);
	} catch (error) {
		console.error('Create part error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

// สต๊อก
router.get("/parts/stocks", authRequired, async (req, res) => {
	try {
		const [rows] = await pool.query(`
			SELECT ps.*, p.part_code, p.name as part_name
			FROM part_stocks ps
			LEFT JOIN parts p ON ps.part_id = p.id
			ORDER BY ps.id DESC
		`);
		res.json(rows);
	} catch (error) {
		console.error('Fetch part stocks error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

router.post("/parts/stocks/adjust", authRequired, async (req, res) => {
	const { part_id, change_qty, note } = req.body || {};
	if (!part_id || typeof change_qty !== 'number') return res.status(400).json({ message: 'Missing part_id or change_qty' });
	try {
		// insert movement
		await pool.query('INSERT INTO part_movements (part_id, change_qty, note) VALUES (?, ?, ?)', [part_id, change_qty, note || null]);

		// update stock (try update, otherwise insert)
		const [updateResult] = await pool.query('UPDATE part_stocks SET quantity = quantity + ? WHERE part_id = ?', [change_qty, part_id]);
		if (updateResult.affectedRows === 0) {
			await pool.query('INSERT INTO part_stocks (part_id, quantity) VALUES (?, ?)', [part_id, change_qty]);
		}

		const [stocks] = await pool.query('SELECT * FROM part_stocks WHERE part_id = ?', [part_id]);
		res.status(200).json(stocks[0] || {});
	} catch (error) {
		console.error('Adjust stock error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

// movement
router.get("/parts/movements", authRequired, async (req, res) => {
	try {
		const [rows] = await pool.query(`
			SELECT pm.*, p.part_code, p.name as part_name
			FROM part_movements pm
			LEFT JOIN parts p ON pm.part_id = p.id
			ORDER BY pm.id DESC
		`);
		res.json(rows);
	} catch (error) {
		console.error('Fetch movements error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

export default router;