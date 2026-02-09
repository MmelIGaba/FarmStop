const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./config/logger");
const pool = require("./config/db");
const farmRoutes = require("./routes/farmRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://plaasstop-frontend-mmeli.s3-website-us-east-1.amazonaws.com",
  "https://farmstop.mmeligabriel.online",
  process.env.FRONTEND_URL,
  process.env.CLOUDFRONT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(helmet());

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

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
