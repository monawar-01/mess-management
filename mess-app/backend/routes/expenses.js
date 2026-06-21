const express = require("express");
const { getDb } = require("../db");
const { authenticate, requireManager } = require("../middleware");

const router = express.Router();

// GET /api/expenses — all authenticated users can view
router.get("/", authenticate, (req, res) => {
  const db = getDb();
  const expenses = db.prepare("SELECT * FROM expenses ORDER BY expense_date DESC").all();
  res.json(expenses);
});

// POST /api/expenses — manager only
router.post("/", authenticate, requireManager, (req, res) => {
  const { amount, description, category, expense_date } = req.body;
  if (!amount || !description || !expense_date) return res.status(400).json({ error: "amount, description, and expense_date are required" });
  if (amount <= 0) return res.status(400).json({ error: "Amount must be positive" });
  const db = getDb();
  const result = db.prepare("INSERT INTO expenses (amount, description, category, expense_date, added_by) VALUES (?, ?, ?, ?, ?)")
    .run(parseFloat(amount), description, category || "general", expense_date, req.user.id);
  res.status(201).json(db.prepare("SELECT * FROM expenses WHERE id=?").get(result.lastInsertRowid));
});

// PUT /api/expenses/:id — manager only
router.put("/:id", authenticate, requireManager, (req, res) => {
  const { amount, description, category, expense_date } = req.body;
  if (!amount || !description || !expense_date) return res.status(400).json({ error: "All fields are required" });
  const db = getDb();
  const expense = db.prepare("SELECT id FROM expenses WHERE id=?").get(parseInt(req.params.id));
  if (!expense) return res.status(404).json({ error: "Expense not found" });
  db.prepare("UPDATE expenses SET amount=?, description=?, category=?, expense_date=?, updated_at=datetime('now') WHERE id=?")
    .run(parseFloat(amount), description, category || "general", expense_date, expense.id);
  res.json(db.prepare("SELECT * FROM expenses WHERE id=?").get(expense.id));
});

// DELETE /api/expenses/:id — manager only
router.delete("/:id", authenticate, requireManager, (req, res) => {
  const db = getDb();
  const expense = db.prepare("SELECT id FROM expenses WHERE id=?").get(parseInt(req.params.id));
  if (!expense) return res.status(404).json({ error: "Expense not found" });
  db.prepare("DELETE FROM expenses WHERE id=?").run(expense.id);
  res.json({ success: true });
});

module.exports = router;
