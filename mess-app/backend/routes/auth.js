const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../db");
const { authenticate, JWT_SECRET } = require("../middleware");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
  });
});

router.get("/me", authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare("SELECT id, name, email, role, phone FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

router.put("/profile", authenticate, (req, res) => {
  const { name, phone, password } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const db = getDb();
  if (password) {
    const hashed = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE users SET name=?, phone=?, password=?, updated_at=datetime('now') WHERE id=?")
      .run(name, phone || null, hashed, req.user.id);
  } else {
    db.prepare("UPDATE users SET name=?, phone=?, updated_at=datetime('now') WHERE id=?")
      .run(name, phone || null, req.user.id);
  }
  const updated = db.prepare("SELECT id, name, email, role, phone FROM users WHERE id = ?").get(req.user.id);
  res.json(updated);
});

module.exports = router;
