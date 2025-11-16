// ---- Parts Routes ----
import express from "express";
import pool from "../DB/db.js";
import authRequired from "../Auth/middle.js";

const router = express.Router();

// อะไหล่
router.get("/parts", authRequired, async (req, res) => {});
router.post("/parts", authRequired, async (req, res) => {});

// สต๊อก
router.get("/parts/stocks", authRequired, async (req, res) => {});
router.post("/parts/stocks/adjust", authRequired, async (req, res) => {});

// movement
router.get("/parts/movements", authRequired, async (req, res) => {});

export default router;