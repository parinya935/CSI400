// server.js (LiftCare Backend - Express + JWT + LowDB)
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
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

// ---- DB (LowDB JSON) ----
const dbFile = path.join(__dirname, "db.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { users: [] });
await db.read();
db.data ||= { users: [] };

async function saveDb() { return db.write(); }

// seed admin ถ้ายังไม่มีผู้ใช้
if ((db.data.users || []).length === 0) {
  const hash = bcrypt.hashSync("admin123", 10);
  db.data.users.push({
    id: 1,
    email: "admin@liftcare.local",
    password_hash: hash,
    name: "Administrator",
    role: "admin",
    created_at: new Date().toISOString(),
  });
  await saveDb();
  console.log("✅ Seeded user: admin@liftcare.local / admin123");
}

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

  const exists = db.data.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(409).json({ message: "Email already in use" });

  const password_hash = await bcrypt.hash(password, 10);
  const id = (db.data.users.at(-1)?.id || 0) + 1;
  const user = { id, email, password_hash, name, role: "user", created_at: new Date().toISOString() };
  db.data.users.push(user);
  await saveDb();

  const token = signAccessToken({ id, email, name, role: "user" });
  return res.status(201).json({ user: { id, email, name, role: "user" }, token });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }
  const u = db.data.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!u) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signAccessToken({ id: u.id, email: u.email, name: u.name, role: u.role });
  return res.json({ user: { id: u.id, email: u.email, name: u.name, role: u.role }, token });
});

app.get("/auth/me", authRequired, (req, res) => {
  return res.json({ user: req.user });
});

// ---- Demo data ----
const elevators = [
  { id: "ELV-001", name: "Lift A", building: "Central Tower", floor: 12, load: 58, state: "operational", updated_at: new Date() },
  { id: "ELV-002", name: "Lift B", building: "Central Tower", floor: 3, load: 0, state: "maintenance", updated_at: new Date(Date.now()-5*60*1000) },
  { id: "ELV-003", name: "Lift C", building: "East Wing", floor: 21, load: 34, state: "operational", updated_at: new Date(Date.now()-60*1000) },
];

const alerts = [
  { id: "AL-1", type: "fault", title: "Fault E12 – Lift B", at: new Date(Date.now()-5*60*1000) },
  { id: "AL-2", type: "recover", title: "ระบบกลับมาทำงาน – Lift A", at: new Date(Date.now()-20*60*1000) },
];

// ---- API (Protected) ----
app.get("/", (req, res) => res.send("🚀 LiftCare API is running..."));

app.get("/api/elevators", authRequired, (req, res) => res.json(elevators));
app.get("/api/alerts", authRequired, (req, res) => res.json(alerts));

app.post("/api/tickets", authRequired, (req, res) => {
  const { elevatorId, description } = req.body || {};
  if (!elevatorId || !description) return res.status(400).json({ message: "Missing data" });
  const ticket = {
    id: "T-" + Date.now(),
    elevatorId,
    description,
    reporter: req.user.email,
    status: "pending",
    created_at: new Date(),
  };
  return res.status(201).json({ message: "Ticket created", ticket });
});

// ---- Start ----
app.listen(PORT, () => {
  console.log(`✅ LiftCare backend running at http://localhost:${PORT}`);
  console.log(`CORS_ORIGIN: ${CORS_ORIGIN}`);
});
