const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_in_prod";

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = auth.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireManager(req, res, next) {
  if (req.user?.role !== "manager") {
    return res.status(403).json({ error: "Manager access required" });
  }
  next();
}

module.exports = { authenticate, requireManager, JWT_SECRET };
