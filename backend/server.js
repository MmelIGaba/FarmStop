require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const helmet = require("helmet");
const { CognitoJwtVerifier } = require("aws-jwt-verify");

const app = express();
const PORT = process.env.PORT || 5000;

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
});

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.includes("s3-website")) {
        return callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

app.use(express.json());
app.use(helmet());

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = await verifier.verify(token);
    req.user = { id: payload.sub, email: payload.email || payload.username };
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
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
  if (!lat || !lng)
    return res.status(400).json({ error: "Missing coordinates" });
  const radiusMeters = (radiusInKm || 50) * 1000;

  try {
    const query = `
      SELECT id, name, products, status, type,
        ST_Distance(location, ST_MakePoint($1, $2)::geography) as dist_meters,
        ST_Y(location::geometry) as lat, 
        ST_X(location::geometry) as lng
      FROM farms
      WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)
      ORDER BY dist_meters ASC;
    `;
    const { rows } = await pool.query(query, [lng, lat, radiusMeters]);

    const results = rows.map((farm) => ({
      ...farm,
      distance: (farm.dist_meters / 1000).toFixed(1) + " km",
      lat: parseFloat(farm.lat),
      lng: parseFloat(farm.lng),
    }));

    res.json(results);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});
// 3. Sync User
app.post("/api/auth/sync", authMiddleware, async (req, res) => {
  const { role, name, email } = req.body;
  const id = req.user?.id || req.body.id;
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
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  const id = req.user?.id || req.query.id;
  if (!id) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (userResult.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    const user = userResult.rows[0];

    let farm = null;
    if (user.role === "vendor") {
      const farmResult = await pool.query(
        "SELECT * FROM farms WHERE owner_id = $1",
        [id],
      );
      farm = farmResult.rows[0] || null;
    }
    res.json({ ...user, farm });
  } catch (error) {
    console.error("Me Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 5. Claim Farm
app.post("/api/farms/:farmId/claim", authMiddleware, async (req, res) => {
  const { farmId } = req.params;
  const userId = req.user?.id;
  if (!userId)
    return res.status(401).json({ error: "Must be logged in to claim" });

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const checkRes = await client.query(
        "SELECT type FROM farms WHERE id = $1 FOR UPDATE",
        [farmId],
      );
      if (checkRes.rows.length === 0) throw new Error("Farm not found");
      if (checkRes.rows[0].type !== "lead")
        throw new Error("Farm already claimed");

      await client.query(
        "UPDATE farms SET owner_id = $1, type = 'vendor', status = 'pending_verification' WHERE id = $2",
        [userId, farmId],
      );
      await client.query("UPDATE users SET role = 'vendor' WHERE id = $1", [
        userId,
      ]);
      await client.query("COMMIT");
      res.json({ message: "Farm claimed successfully!" });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Claim Error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Check health: http://localhost:${PORT}/health/ready`);
});
