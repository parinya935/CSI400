// ---- Contracts Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired from "../Auth/middle.js";

const router = express.Router();

// สัญญา
router.get("/contracts", authRequired, async (req, res) => { /* ... */ });
router.post("/contracts", authRequired, async (req, res) => { /* ... */ });

// ใบเสนอราคา
router.get("/quotations", authRequired, async (req, res) => { /* ... */ });
router.post("/quotations", authRequired, async (req, res) => { /* ... */ });

// ใบแจ้งหนี้
router.get("/invoices", authRequired, async (req, res) => { /* ... */ });
router.post("/invoices", authRequired, async (req, res) => { /* ... */ });

export default router;