const express = require("express");
const { getDb } = require("../db");
const { authenticate, requireManager } = require("../middleware");

const router = express.Router();

// GET /api/meals — manager: all; member: own
router.get("/", authenticate, (req, res) => {
  const db = getDb();
  if (req.user.role === "manager") {
    const meals = db.prepare(`
      SELECT m.*, u.name as member_name
      FROM meals m JOIN users u ON u.id = m.member_id
      ORDER BY m.date DESC
    `).all();
    return res.json(meals);
  }
  const meals = db.prepare("SELECT * FROM meals WHERE member_id=? ORDER BY date DESC").all(req.user.id);
  res.json(meals);
});

// POST /api/meals — manager only
router.post("/", authenticate, requireManager, (req, res) => {
  const { member_id, date, breakfast, lunch, dinner } = req.body;
  if (!member_id || !date) return res.status(400).json({ error: "member_id and date are required" });
  const db = getDb();
  const b = breakfast ? 1 : 0, l = lunch ? 1 : 0, d = dinner ? 1 : 0;
  const existing = db.prepare("SELECT id FROM meals WHERE member_id=? AND date=?").get(parseInt(member_id), date);
  if (existing) {
    db.prepare("UPDATE meals SET breakfast=?, lunch=?, dinner=?, updated_at=datetime('now') WHERE id=?").run(b, l, d, existing.id);
    return res.json(db.prepare("SELECT * FROM meals WHERE id=?").get(existing.id));
  }
  const result = db.prepare("INSERT INTO meals (member_id, date, breakfast, lunch, dinner) VALUES (?, ?, ?, ?, ?)").run(parseInt(member_id), date, b, l, d);
  res.status(201).json(db.prepare("SELECT * FROM meals WHERE id=?").get(result.lastInsertRowid));
});

// PUT /api/meals/:id — manager only
router.put("/:id", authenticate, requireManager, (req, res) => {
  const { date, breakfast, lunch, dinner } = req.body;
  if (!date) return res.status(400).json({ error: "Date is required" });
  const db = getDb();
  const meal = db.prepare("SELECT * FROM meals WHERE id=?").get(parseInt(req.params.id));
  if (!meal) return res.status(404).json({ error: "Meal not found" });
  db.prepare("UPDATE meals SET date=?, breakfast=?, lunch=?, dinner=?, updated_at=datetime('now') WHERE id=?")
    .run(date, breakfast ? 1 : 0, lunch ? 1 : 0, dinner ? 1 : 0, meal.id);
  res.json(db.prepare("SELECT * FROM meals WHERE id=?").get(meal.id));
});

// DELETE /api/meals/:id — manager only
router.delete("/:id", authenticate, requireManager, (req, res) => {
  const db = getDb();
  const meal = db.prepare("SELECT id FROM meals WHERE id=?").get(parseInt(req.params.id));
  if (!meal) return res.status(404).json({ error: "Meal not found" });
  db.prepare("DELETE FROM meals WHERE id=?").run(meal.id);
  res.json({ success: true });
});

module.exports = router;
