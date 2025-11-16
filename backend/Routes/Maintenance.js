// ---- Maintenance Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired from "../Auth/middle.js";

const router = express.Router();

// Template + Checklist
router.get("/maintenance/templates", authRequired, async (req, res) => {});
router.post("/maintenance/templates", authRequired, async (req, res) => {});

// Plan
router.get("/maintenance/plans", authRequired, async (req, res) => {});
router.post("/maintenance/plans", authRequired, async (req, res) => {});

// Jobs (ประวัติการซ่อม/ตรวจจริง)
router.get("/maintenance/jobs", authRequired, async (req, res) => {});
router.post("/maintenance/jobs", authRequired, async (req, res) => {});

export default router;