// server.js (LiftCare Backend - Express + JWT + MySQL)
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mysql from 'mysql2/promise';
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config ----
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
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

// ---- Database Connection ----
const pool = mysql.createPool({
  host: process.env.DB_HOST || '10.23.251.151',
  user: process.env.DB_USER || 'Test',
  password: process.env.DB_PASSWORD || '',
  database: 'liftcare',
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
  const { email, password, name } = req.body || {};
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
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, password_hash, name, 'user']
    );

    const user = { id: result.insertId, email, name, role: 'user' };
    const token = signAccessToken(user);
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
      'SELECT id, email, password_hash, name, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/auth/me", authRequired, (req, res) => {
  return res.json({ user: req.user });
});

// ---- API (Protected) ----
app.get("/", (req, res) => res.send("🚀 LiftCare API is running..."));

app.get("/api/elevators", authRequired, async (req, res) => {
  try {
    const [elevators] = await pool.query(`
      SELECT e.*, b.name as building_name 
      FROM elevators e 
      LEFT JOIN buildings b ON e.building_id = b.id
      ORDER BY e.updated_at DESC
    `);
    res.json(elevators);
  } catch (error) {
    console.error('Fetch elevators error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/alerts", authRequired, async (req, res) => {
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

app.post("/api/tickets", authRequired, async (req, res) => {
  const { elevatorId, description } = req.body || {};
  if (!elevatorId || !description) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO tickets (id, elevator_id, description, reporter_id) VALUES (?, ?, ?, ?)',
      [`T-${Date.now()}`, elevatorId, description, req.user.id]
    );

    const [tickets] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({ message: "Ticket created", ticket: tickets[0] });
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---- Start ----
app.listen(PORT, () => {
  console.log(`✅ LiftCare backend running at http://localhost:${PORT}`);
  console.log(`CORS_ORIGIN: ${CORS_ORIGIN}`);
});
