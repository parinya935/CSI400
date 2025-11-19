// server.js (LiftCare Backend - Express + JWT + MySQL)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import Routes from "./Auth/Auth.js";
import main from "./Routes/Core.js";
import contract from "./Routes/Contracts.js";
import maintain from "./Routes/Maintenance.js";
import parts from "./Routes/Parts.js";

dotenv.config();

// ---- Config ----
const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// ---- Security & middleware ----
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ---- API (Protected) ----
app.get("/", (req, res) => res.send("🚀 LiftCare API is running..."));

// ---- Database Connection ----
const pool = mysql.createPool({
  host: process.env.DB_HOST || '10.23.251.151',
  user: process.env.DB_USER || 'Test',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'liftcare',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ---- Helpers ----
function signAccessToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "2h" });
}

function authRequired(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ---- Auth Routes ----
app.post("/auth/register", async (req, res) => {
  const { email, password, name, customerId } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ message: "email, password, name are required" });
  }

  try {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, name, role, customer_id) VALUES (?, ?, ?, ?, ?)',
      [email, password_hash, name, 'customer', customerId || null]
    );

    const user = {
      id: result.insertId,
      email,
      name,
      role: 'customer',
      customer_id: customerId || null,
    };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "8h" });

    return res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  try {
    const [users] = await pool.query(
      'SELECT id, email, password_hash, name, role, customer_id FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customer_id: user.customer_id || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

    res.json({
      token,
      user: payload,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/auth/me", authRequired, (req, res) => {
  return res.json({ user: req.user });
});

// ---- API (Protected) ----
app.get("/", (req, res) => res.send("🚀 LiftCare API is running..."));

app.get("/api/elevators", authRequired, async (req, res) => {
  try {
    let sql = `
      SELECT 
        e.*,
        b.name AS building_name
      FROM elevators e
      LEFT JOIN buildings b ON e.building_id = b.id
    `;
    const params = [];

    // ถ้าเป็นลูกค้า → filter ตาม customer_id
    if (req.user.role === 'customer' && req.user.customer_id) {
      sql += " WHERE e.customer_id = ?";
      params.push(req.user.customer_id);
    }

    sql += " ORDER BY e.name ASC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Fetch elevators error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/api/alerts", authRequired, async (req, res) => {
  try {
    let sql = `
      SELECT a.*, e.name as elevator_name 
      FROM alerts a
      LEFT JOIN elevators e ON a.elevator_id = e.id
      WHERE a.resolved_at IS NULL
    `;
    const params = [];

    // ถ้าเป็นลูกค้า → เห็นเฉพาะ alert ของลิฟต์ตัวเอง
    if (req.user.role === 'customer' && req.user.customer_id) {
      sql += " AND e.customer_id = ?";
      params.push(req.user.customer_id);
    }

    sql += " ORDER BY a.created_at DESC";

    const [alerts] = await pool.query(sql, params);
    res.json(alerts);
  } catch (error) {
    console.error('Fetch alerts error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/api/tickets", authRequired, async (req, res) => {
  try {
    let sql = `
      SELECT 
        t.*,
        e.name AS elevator_name
      FROM tickets t
      LEFT JOIN elevators e ON t.elevator_id = e.id
    `;
    const params = [];

    // ถ้าเป็นลูกค้า → เห็นเฉพาะของตัวเอง
    if (req.user.role === 'customer' && req.user.customer_id) {
      sql += " WHERE t.customer_id = ?";
      params.push(req.user.customer_id);
    }

    sql += " ORDER BY t.created_at DESC LIMIT 100";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Fetch tickets error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.post("/api/tickets", authRequired, async (req, res) => {
  const { elevatorId, description, title, priority } = req.body || {};
  if (!elevatorId || !description) {
    return res.status(400).json({ message: "Missing data" });
  }

  const ticketId = `T-${Date.now()}`;

  try {
    await pool.query(
      `INSERT INTO tickets 
        (id, elevator_id, reporter_id, customer_id, description, title, priority, source) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticketId,
        elevatorId,
        req.user.id,
        req.user.customer_id || null,   // ✅ ผูก ticket กับ customer ถ้ามี
        description,
        title || null,
        priority || 'medium',
        'internal'
      ]
    );

    const [tickets] = await pool.query(
      `SELECT t.*, e.name AS elevator_name
       FROM tickets t
       LEFT JOIN elevators e ON t.elevator_id = e.id
       WHERE t.id = ?`,
      [ticketId]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, channel, title, body)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        'new_ticket',
        'in_app',
        `สร้างใบงาน ${ticketId}`,
        description.slice(0, 200)
      ]
    );

    return res.status(201).json({ message: "Ticket created", ticket: tickets[0] });
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// ---- Notifications (E) ----
app.get("/api/notifications", authRequired, async (req, res) => {
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
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/notifications/:id/read", authRequired, async (req, res) => {
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
    console.error('Mark notification read error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---- Dashboard Summary (G) ----
app.get("/api/dashboard/summary", authRequired, async (req, res) => {
  try {
    let elevatorSql = 'SELECT COUNT(*) AS count FROM elevators';
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

    if (req.user.role === 'customer' && req.user.customer_id) {
      elevatorSql += ' WHERE customer_id = ?';
      elevatorParams.push(req.user.customer_id);

      ticketSql += ' AND customer_id = ?';
      ticketParams.push(req.user.customer_id);

      alertSql += ' AND e.customer_id = ?';
      alertParams.push(req.user.customer_id);
    }

    const [[elevatorsCount]] = await pool.query(elevatorSql, elevatorParams);
    const [[openTickets]] = await pool.query(ticketSql, ticketParams);
    const [[openAlerts]] = await pool.query(alertSql, alertParams);

    return res.json({
      elevators: elevatorsCount.count,
      tickets_open: openTickets.count,
      alerts_open: openAlerts.count
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});



// ---- Start ----
app.use('/auth', Routes)
app.use('/api', main, contract, maintain, parts);
app.listen(PORT, () => {
  console.log(`✅ LiftCare backend running at http://localhost:${PORT}`);
  console.log(`CORS_ORIGIN: ${CORS_ORIGIN}`);
});