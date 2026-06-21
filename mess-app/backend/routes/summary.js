const express = require("express");
const { getDb } = require("../db");
const { authenticate } = require("../middleware");

const router = express.Router();

function calcSummary(db, memberId) {
  const deposits = db.prepare("SELECT SUM(amount) as total FROM deposits WHERE member_id=?").get(memberId);
  const meals = db.prepare("SELECT SUM(breakfast+lunch+dinner) as total FROM meals WHERE member_id=?").get(memberId);
  const allMeals = db.prepare("SELECT SUM(breakfast+lunch+dinner) as total FROM meals").get();
  const allExpenses = db.prepare("SELECT SUM(amount) as total FROM expenses").get();

  const totalDeposit = deposits?.total || 0;
  const memberMeals = meals?.total || 0;
  const totalMeals = allMeals?.total || 0;
  const totalExpenses = allExpenses?.total || 0;
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
  const memberExpense = mealRate * memberMeals;
  const balance = totalDeposit - memberExpense;

  return { totalDeposit, memberMeals, totalMeals, totalExpenses, mealRate, memberExpense, balance };
}

// GET /api/summary — manager: all members; member: own only
router.get("/", authenticate, (req, res) => {
  const db = getDb();

  if (req.user.role === "manager") {
    const members = db.prepare("SELECT id, name, email, phone FROM users WHERE role='member' ORDER BY name").all();
    const allMeals = db.prepare("SELECT SUM(breakfast+lunch+dinner) as total FROM meals").get();
    const allExpenses = db.prepare("SELECT SUM(amount) as total FROM expenses").get();
    const totalMeals = allMeals?.total || 0;
    const totalExpenses = allExpenses?.total || 0;
    const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;

    const memberSummaries = members.map(m => {
      const s = calcSummary(db, m.id);
      return { member: m, ...s };
    });

    const totalAllDeposits = db.prepare("SELECT SUM(amount) as total FROM deposits").get()?.total || 0;

    return res.json({
      mealRate,
      totalMeals,
      totalExpenses,
      totalDeposits: totalAllDeposits,
      members: memberSummaries,
    });
  }

  // Member: own summary only
  const member = db.prepare("SELECT id, name, email, phone FROM users WHERE id=?").get(req.user.id);
  const s = calcSummary(db, req.user.id);
  res.json({ member, ...s });
});

module.exports = router;
