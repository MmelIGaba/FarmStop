require("dotenv").config();
const express = require("express");
const { Pool } = require("pg"); 
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// --- 1. DB CONNECTION POOL ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") 
       ? false 
       : { rejectUnauthorized: false },
});

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173" }));

// --- HEALTH CHECK ---
app.get("/health/ready", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");
    res.status(200).json({ status: "ready", database: "connected" });
  } catch (error) {
    console.error("DB Error:", error);
    res.status(503).json({ status: "not ready", error: error.message });
  }
});

// --- SEARCH ROUTE (The Logic Change) ---
app.post("/api/farms/search", async (req, res) => {
  const { lat, lng, radiusInKm } = req.body;

  if (!lat || !lng) return res.status(400).json({ error: "Missing coordinates" });

  const radiusMeters = (radiusInKm || 50) * 1000;

  try {
    // --- 2. RAW POSTGIS SQL ---
    const query = `
      SELECT 
        id, name, products, status,
        ST_Distance(location, ST_MakePoint($1, $2)::geography) as dist_meters
      FROM farms
      WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)
      ORDER BY dist_meters ASC;
    `;

    const { rows } = await pool.query(query, [lng, lat, radiusMeters]);

    const results = rows.map((farm) => ({
      ...farm,
      distance: (farm.dist_meters / 1000).toFixed(1) + " km",
    }));

    res.json(results);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});