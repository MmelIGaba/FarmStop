require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. DB CONNECTION POOL ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

// --- 2. DYNAMIC CORS (The Fix) ---
// We allow Localhost AND the Production Frontend (S3)
const allowedOrigins = [
  "http://localhost:5173",  // Local Vite
  process.env.FRONTEND_URL  // injected by Terraform/User Data
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list OR if it's an S3 website URL
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes("s3-website")) {
      return callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin); // Debugging help
      return callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());
app.use(helmet());

// --- MOCK AUTH MIDDLEWARE ---
const mockAuth = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return next();
  req.user = { id: userId };
  next();
};

// --- ROUTES ---

// 1. Health Check
app.get("/health/ready", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");
    res.status(200).json({ status: "ready", database: "connected" });
  } catch (error) {
    console.error("DB Error:", error);
    res.status(503).json({ status: "not ready", error: error.message });
  }
});

// 2. Search Farms
app.post("/api/farms/search", async (req, res) => {
  const { lat, lng, radiusInKm } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: "Missing coordinates" });
  const radiusMeters = (radiusInKm || 50) * 1000;

  try {
    const query = `
      SELECT id, name, products, status, type,
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

// 3. Sync User
app.post("/api/auth/sync", mockAuth, async (req, res) => {
  const { role, name, email } = req.body;
  const id = req.user ? req.user.id : req.body.id;
  if (!id) return res.status(400).json({ error: "Missing User ID" });

  try {
    const query = `
      INSERT INTO users (id, email, role, name, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (id) 
      DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, name = EXCLUDED.name, updated_at = NOW();
    `;
    await pool.query(query, [id, email, role, name]);
    res.json({ message: "User synced successfully" });
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// 4. Get Profile
app.get("/api/auth/me", mockAuth, async (req, res) => {
  const id = req.user ? req.user.id : req.query.id;
  if (!id) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const user = userResult.rows[0];

    let farm = null;
    if (user.role === 'vendor') {
      const farmResult = await pool.query("SELECT * FROM farms WHERE owner_id = $1", [id]);
      farm = farmResult.rows[0] || null;
    }
    res.json({ ...user, farm });
  } catch (error) {
    console.error("Me Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 5. Claim Farm
app.post('/api/farms/:farmId/claim', mockAuth, async (req, res) => {
    const { farmId } = req.params;
    const userId = req.user ? req.user.id : null;
    if (!userId) return res.status(401).json({ error: "Must be logged in to claim" });

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const checkRes = await client.query("SELECT type FROM farms WHERE id = $1 FOR UPDATE", [farmId]);
            if (checkRes.rows.length === 0) throw new Error("Farm not found");
            if (checkRes.rows[0].type !== 'lead') throw new Error("Farm already claimed");

            await client.query("UPDATE farms SET owner_id = $1, type = 'vendor', status = 'pending_verification' WHERE id = $2", [userId, farmId]);
            await client.query("UPDATE users SET role = 'vendor' WHERE id = $1", [userId]);
            await client.query('COMMIT');
            res.json({ message: 'Farm claimed successfully!' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Claim Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});

// --- SERVER START ---

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Check health: http://localhost:${PORT}/health/ready`);
  console.log(`Deployed via GitHub Actions!`);
});