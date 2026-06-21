const express = require("express");
const bcrypt = require("bcryptjs");
const { getDb } = require("../db");
const { authenticate, requireManager } = require("../middleware");

const router = express.Router();

// GET /api/members — manager gets all, member gets only self
router.get("/", authenticate, (req, res) => {
  const db = getDb();
  if (req.user.role === "manager") {
    const members = db.prepare("SELECT id, name, email, role, phone, created_at FROM users WHERE role='member' ORDER BY name").all();
    return res.json(members);
  }
  const user = db.prepare("SELECT id, name, email, role, phone, created_at FROM users WHERE id=?").get(req.user.id);
  res.json(user ? [user] : []);
});

// POST /api/members — manager only
router.post("/", authenticate, requireManager, (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });
  const db = getDb();
  const exists = db.prepare("SELECT id FROM users WHERE email=?").get(email.trim().toLowerCase());
  if (exists) return res.status(409).json({ error: "Email already in use" });
  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare("INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, 'member', ?)").run(name, email.trim().toLowerCase(), hashed, phone || null);
  const user = db.prepare("SELECT id, name, email, role, phone, created_at FROM users WHERE id=?").get(result.lastInsertRowid);
  res.status(201).json(user);
});

// PUT /api/members/:id — manager only
router.put("/:id", authenticate, requireManager, (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });
  const db = getDb();
  const member = db.prepare("SELECT * FROM users WHERE id=? AND role='member'").get(parseInt(req.params.id));
  if (!member) return res.status(404).json({ error: "Member not found" });
  if (password) {
    const hashed = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE users SET name=?, email=?, phone=?, password=?, updated_at=datetime('now') WHERE id=?").run(name, email, phone || null, hashed, member.id);
  } else {
    db.prepare("UPDATE users SET name=?, email=?, phone=?, updated_at=datetime('now') WHERE id=?").run(name, email, phone || null, member.id);
  }
  const updated = db.prepare("SELECT id, name, email, role, phone, created_at FROM users WHERE id=?").get(member.id);
  res.json(updated);
});

// DELETE /api/members/:id — manager only
router.delete("/:id", authenticate, requireManager, (req, res) => {
  const db = getDb();
  const member = db.prepare("SELECT id FROM users WHERE id=? AND role='member'").get(parseInt(req.params.id));
  if (!member) return res.status(404).json({ error: "Member not found" });
  db.prepare("DELETE FROM users WHERE id=?").run(member.id);
  res.json({ success: true });
});

module.exports = router;
