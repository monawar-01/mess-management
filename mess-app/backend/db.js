const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "mess.db");
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('manager','member')),
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      deposit_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      breakfast INTEGER DEFAULT 0,
      lunch INTEGER DEFAULT 0,
      dinner INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(member_id, date)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      expense_date TEXT NOT NULL,
      added_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (added_by) REFERENCES users(id)
    );
  `);

  const manager = database.prepare("SELECT id FROM users WHERE role = ?").get("manager");
  if (!manager) {
    const managerPw = bcrypt.hashSync("manager123", 10);
    database
      .prepare("INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)")
      .run("Manager", "manager@mess.com", managerPw, "manager", "01700000000");

    const memberPw = bcrypt.hashSync("member123", 10);
    const r1 = database
      .prepare("INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)")
      .run("Rahim Uddin", "rahim@mess.com", memberPw, "member", "01711111111");
    const r2 = database
      .prepare("INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)")
      .run("Karim Hossain", "karim@mess.com", memberPw, "member", "01722222222");

    // Seed sample data
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      database.prepare("INSERT INTO deposits (member_id, amount, deposit_date) VALUES (?, ?, ?)").run(r1.lastInsertRowid, 500 + i * 50, dateStr);
      database.prepare("INSERT INTO deposits (member_id, amount, deposit_date) VALUES (?, ?, ?)").run(r2.lastInsertRowid, 400 + i * 30, dateStr);
      database.prepare("INSERT OR IGNORE INTO meals (member_id, date, breakfast, lunch, dinner) VALUES (?, ?, ?, ?, ?)").run(r1.lastInsertRowid, dateStr, 1, 1, 1);
      database.prepare("INSERT OR IGNORE INTO meals (member_id, date, breakfast, lunch, dinner) VALUES (?, ?, ?, ?, ?)").run(r2.lastInsertRowid, dateStr, 0, 1, 1);
      const mgr = database.prepare("SELECT id FROM users WHERE role='manager'").get();
      database.prepare("INSERT INTO expenses (amount, description, category, expense_date, added_by) VALUES (?, ?, ?, ?, ?)").run(300 + i * 20, "Groceries", "food", dateStr, mgr.id);
    }

    console.log("Default accounts created:");
    console.log("  Manager : manager@mess.com / manager123");
    console.log("  Member  : rahim@mess.com   / member123");
    console.log("  Member  : karim@mess.com   / member123");
  }

  console.log("Database ready:", DB_PATH);
  return database;
}

module.exports = { getDb, initDb };
