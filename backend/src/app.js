const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./config/logger");
const pool = require("./config/db"); 
const farmRoutes = require("./routes/farmRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// --- Middleware ---
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  process.env.CLOUDFRONT_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        logger.warn(`Blocked by CORS: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());
app.use(helmet());

// --- Routes ---
app.use("/api/farms", farmRoutes);
app.use("/api/auth", authRoutes);

app.get("/health/ready", async (req, res) => {
  try {
    await pool.query("SELECT NOW()"); 
    res.status(200).json({ status: "ready", database: "connected" });
  } catch (error) {
    logger.error("Health Check DB Error: " + error.message);
    res.status(503).json({ status: "not ready", database: "disconnected" });
  }
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;