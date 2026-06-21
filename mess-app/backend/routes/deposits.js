const express = require("express");
const { getDb } = require("../db");
const { authenticate, requireManager } = require("../middleware");

const router = express.Router();

// GET /api/deposits — manager: all deposits; member: own only
router.get("/", authenticate, (req, res) => {
  const db = getDb();
  if (req.user.role === "manager") {
    const deposits = db.prepare(`
      SELECT d.*, u.name as member_name, u.email as member_email
      FROM deposits d
      JOIN users u ON u.id = d.member_id
      ORDER BY d.deposit_date DESC
    `).all();
    return res.json(deposits);
  }
  // Member: strictly own deposits only
  const deposits = db.prepare("SELECT * FROM deposits WHERE member_id=? ORDER BY deposit_date DESC").all(req.user.id);
  res.json(deposits);
});

// GET /api/deposits/member/:id — manager only, specific member
router.get("/member/:id", authenticate, requireManager, (req, res) => {
  const db = getDb();
  const memberId = parseInt(req.params.id);
  const member = db.prepare("SELECT id, name FROM users WHERE id=? AND role='member'").get(memberId);
  if (!member) return res.status(404).json({ error: "Member not found" });
  const deposits = db.prepare("SELECT * FROM deposits WHERE member_id=? ORDER BY deposit_date ASC").all(memberId);
  const total = deposits.reduce((s, d) => s + d.amount, 0);
  res.json({ member, deposits, total });
});

// POST /api/deposits — manager only
router.post("/", authenticate, requireManager, (req, res) => {
  const { member_id, amount, deposit_date } = req.body;
  if (!member_id || !amount || !deposit_date) return res.status(400).json({ error: "member_id, amount, and deposit_date are required" });
  if (amount <= 0) return res.status(400).json({ error: "Amount must be positive" });
  const db = getDb();
  const member = db.prepare("SELECT id FROM users WHERE id=? AND role='member'").get(parseInt(member_id));
  if (!member) return res.status(404).json({ error: "Member not found" });
  const result = db.prepare("INSERT INTO deposits (member_id, amount, deposit_date) VALUES (?, ?, ?)").run(parseInt(member_id), parseFloat(amount), deposit_date);
  const deposit = db.prepare("SELECT * FROM deposits WHERE id=?").get(result.lastInsertRowid);
  res.status(201).json(deposit);
});

// PUT /api/deposits/:id — manager only
router.put("/:id", authenticate, requireManager, (req, res) => {
  const { member_id, amount, deposit_date } = req.body;
  if (!member_id || !amount || !deposit_date) return res.status(400).json({ error: "All fields are required" });
  if (amount <= 0) return res.status(400).json({ error: "Amount must be positive" });
  const db = getDb();
  const deposit = db.prepare("SELECT id FROM deposits WHERE id=?").get(parseInt(req.params.id));
  if (!deposit) return res.status(404).json({ error: "Deposit not found" });
  db.prepare("UPDATE deposits SET member_id=?, amount=?, deposit_date=?, updated_at=datetime('now') WHERE id=?")
    .run(parseInt(member_id), parseFloat(amount), deposit_date, deposit.id);
  const updated = db.prepare("SELECT * FROM deposits WHERE id=?").get(deposit.id);
  res.json(updated);
});

// DELETE /api/deposits/:id — manager only
router.delete("/:id", authenticate, requireManager, (req, res) => {
  const db = getDb();
  const deposit = db.prepare("SELECT id FROM deposits WHERE id=?").get(parseInt(req.params.id));
  if (!deposit) return res.status(404).json({ error: "Deposit not found" });
  db.prepare("DELETE FROM deposits WHERE id=?").run(deposit.id);
  res.json({ success: true });
});

module.exports = router;
