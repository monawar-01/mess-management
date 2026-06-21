require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDb } = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initDb();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/members", require("./routes/members"));
app.use("/api/deposits", require("./routes/deposits"));
app.use("/api/meals", require("./routes/meals"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/summary", require("./routes/summary"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Serve React frontend in production
if (process.env.NODE_ENV === "production") {
  const frontendBuild = path.join(__dirname, "../frontend/build");
  app.use(express.static(frontendBuild));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuild, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
