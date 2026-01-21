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

// --- MOCK AUTH MIDDLEWARE (For Dev/AWS Testing) ---
// Since we removed Supabase Auth, we simulate it for now.
// The frontend should send a header: "x-user-id: some-uuid"
const mockAuth = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    // Fallback: If no header, allow request but user is undefined
    // For production, you would return 401 here.
    return next();
  }
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

// 2. Search Farms (Geo-Spatial)
app.post("/api/farms/search", async (req, res) => {
  const { lat, lng, radiusInKm } = req.body;

  if (!lat || !lng) return res.status(400).json({ error: "Missing coordinates" });

  const radiusMeters = (radiusInKm || 50) * 1000;

  try {
    const query = `
      SELECT 
        id, name, products, status, type,
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

// 3. Sync User Profile (Upsert)
app.post("/api/auth/sync", mockAuth, async (req, res) => {
  const { role, name, email } = req.body;
  const id = req.user ? req.user.id : req.body.id; // Handle mock auth

  if (!id) return res.status(400).json({ error: "Missing User ID" });

  try {
    // SQL UPSERT: Insert, or if ID exists, update the fields
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

// 4. Get User Profile
app.get("/api/auth/me", mockAuth, async (req, res) => {
  const id = req.user ? req.user.id : req.query.id;
  if (!id) return res.status(401).json({ error: "Not authenticated" });

  try {
    // Get User
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const user = userResult.rows[0];

    // Get Farm (if vendor)
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

// 5. Claim a Farm
app.post('/api/farms/:farmId/claim', mockAuth, async (req, res) => {
    const { farmId } = req.params;
    const userId = req.user ? req.user.id : null;

    if (!userId) return res.status(401).json({ error: "Must be logged in to claim" });

    try {
        // Transaction: Check status then Update
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Check if farm exists and is claimable
            const checkRes = await client.query("SELECT type FROM farms WHERE id = $1 FOR UPDATE", [farmId]);
            if (checkRes.rows.length === 0) throw new Error("Farm not found");
            
            if (checkRes.rows[0].type !== 'lead') {
                throw new Error("Farm already claimed");
            }

            // Update Farm
            await client.query(
                "UPDATE farms SET owner_id = $1, type = 'vendor', status = 'pending_verification' WHERE id = $2",
                [userId, farmId]
            );

            // Update User Role
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} \n http://localhost:${PORT}/health/ready`);
});