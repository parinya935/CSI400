// ---- Authentication Middleware ----
import express from "express";
import jwt from "jsonwebtoken";
import authRequired from "./middle.js";
import bcrypt from "bcryptjs";
import pool from "../DB/db.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const Routes = express.Router();

function signAccessToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "2h" });
}

// ---- Auth Routes ----
Routes.post("/register", async (req, res) => {
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

    // ค่า default เป็น 'customer'
    const defaultRole = 'customer';

    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, password_hash, name, defaultRole]
    );

    const user = { id: result.insertId, email, name, role: defaultRole };
    const token = signAccessToken(user);
    return res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

Routes.post("/login", async (req, res) => {
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

    // ✅ ถ้า role เป็น customer ให้ดึง customer_id
    let customer_id = null;
    if (user.role === 'customer') {
      const [customers] = await pool.query(
        'SELECT id FROM customers WHERE contact_email = ? LIMIT 1',
        [email]
      );
      if (customers.length > 0) {
        customer_id = customers[0].id;
      }
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    // ✅ เพิ่ม customer_id ใน token ถ้ามี
    if (customer_id) {
      tokenPayload.customer_id = customer_id;
    }

    const token = signAccessToken(tokenPayload);

    const responseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    // ✅ เพิ่ม customer_id ในการตอบกลับ
    if (customer_id) {
      responseUser.customer_id = customer_id;
    }

    return res.json({
      user: responseUser,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

Routes.get("/me", authRequired, (req, res) => {
  return res.json({ user: req.user });
});

export default Routes;