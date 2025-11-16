// server.js (LiftCare Backend - Express + JWT + MySQL)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pool from "./DB/db.js";
import path from "path";
import { fileURLToPath } from "url";
import Routes from "./Auth/Auth.js";
import authRequired from "./Auth/middle.js";
import main from "./Routes/Core.js";
import contract from "./Routes/Contracts.js";
import maintain from "./Routes/Maintenance.js";
import parts from "./Routes/Parts.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use('/auth', Routes)
app.use('/api', main, contract, maintain, parts);
app.listen(PORT, () => {
  console.log(`✅ LiftCare backend running at http://localhost:${PORT}`);
  console.log(`CORS_ORIGIN: ${CORS_ORIGIN}`);
});