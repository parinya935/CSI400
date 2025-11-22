// backend/Auth/Auth.js
// รวมทุกอย่างที่เกี่ยวกับการยืนยันตัวตน: register / login / me / change-password
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// middleware ตรวจ JWT
import authRequired from "./middle.js";

// การเชื่อมต่อฐานข้อมูล (pool)
// *** ตรงนี้สมมติว่าคุณมีไฟล์ DB/db.js ที่ export pool ออกมาแล้ว ***
// ถ้าไม่มีไฟล์นี้ ให้เปลี่ยนมา import pool จากที่คุณใช้อยู่จริง
import pool from "../DB/db.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// ใช้ Router เพราะใน server.js มี app.use("/auth", Routes)
const Routes = express.Router();

// ---------------- Helper ----------------
function buildUserPayload(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    customer_id: row.customer_id ?? null,
  };
}

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

// ---------------------------------------------------------------------------
// POST /auth/register  (ผ่าน server.js → app.use('/auth', Routes))
// ---------------------------------------------------------------------------
Routes.post("/register", async (req, res) => {
  const { email, password, name, role, customerId } = req.body || {};

  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ message: "email, password, name are required" });
  }

  // ตรวจสอบ role ที่ถูกต้อง (customer หรือ technician)
  const validRole = role === "technician" ? "technician" : "customer";

  try {
    // เช็กว่า email ซ้ำหรือยัง
    const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // hash password แล้วบันทึก
    const password_hash = await bcrypt.hash(password, 10);
    
    // สำหรับ technician ไม่ต้องมี customer_id (เป็น null)
    // สำหรับ customer อาจจะมี customer_id หรือ null
    const finalCustomerId = validRole === "technician" ? null : (customerId || null);
    
    const [result] = await pool.query(
      "INSERT INTO users (email, password_hash, name, role, customer_id) VALUES (?, ?, ?, ?, ?)",
      [email, password_hash, name, validRole, finalCustomerId]
    );

    const userPayload = {
      id: result.insertId,
      email,
      name,
      role: validRole,
      customer_id: finalCustomerId,
    };

    const token = signAccessToken(userPayload);

    return res.status(201).json({
      user: userPayload,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
Routes.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "email and password are required" });
  }

  try {
    const [users] = await pool.query(
      "SELECT id, email, password_hash, name, role, customer_id FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userRow = users[0];

    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ จัดการ customer_id ให้ถูกต้อง
    let customer_id = userRow.customer_id || null;

    // ถ้าใน users.customer_id ยังว่าง แต่ role = customer → ไปหาในตาราง customers เพิ่ม
    if (!customer_id && userRow.role === "customer") {
      const [customers] = await pool.query(
        "SELECT id FROM customers WHERE contact_email = ? LIMIT 1",
        [email]
      );
      if (customers.length > 0) {
        customer_id = customers[0].id;
      }
    }

    // ✅ ใช้ userRow แทน users
    const tokenPayload = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role,
    };

    if (customer_id) {
      tokenPayload.customer_id = customer_id;
    }

    const token = signAccessToken(tokenPayload);

    const responseUser = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role,
    };

    if (customer_id) {
      responseUser.customer_id = customer_id;
    }

    return res.json({
      user: responseUser,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// ---------------------------------------------------------------------------
// GET /auth/me  (ดึงข้อมูลผู้ใช้จาก token)
// ---------------------------------------------------------------------------
Routes.get("/me", authRequired, (req, res) => {
  return res.json({ user: req.user });
});

// ---------------------------------------------------------------------------
// POST /auth/change-password  (ใช้กับหน้า ChangePasswordPage)
// ---------------------------------------------------------------------------
Routes.post("/change-password", authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "ต้องกรอกรหัสผ่านเดิมและรหัสผ่านใหม่" });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "รหัสผ่านใหม่ควรมีอย่างน้อย 8 ตัวอักษร" });
  }

  try {
    const userId = req.user.id;

    // ดึง hash เดิมจากฐานข้อมูล
    const [rows] = await pool.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });
    }

    const row = rows[0];

    // ตรวจรหัสผ่านเดิมว่าถูกไหม
    const ok = await bcrypt.compare(currentPassword, row.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" });
    }

    // hash ใหม่แล้วอัปเดต
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      newHash,
      userId,
    ]);

    return res.json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default Routes;
