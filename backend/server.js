require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

// 1. Initialize Supabase Admin Client
// We use the SERVICE_ROLE key here to bypass RLS (Row Level Security) for admin tasks
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const app = express();
app.use((req, res, next) => {
  console.log("METHOD:", req.method);
  console.log("HEADERS:", req.headers["content-type"]);
  console.log("BODY RAW:", req.body);
  next();
});

// 2. Security Middleware
app.use(helmet());
app.use(hpp());
app.use(cors({ origin: "http://localhost:5173" })); // Allow Vite Frontend
app.use(express.json());

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// --- HEALTH CHECKS ---

app.get("/health/live", (req, res) => {
  res.status(200).json({ status: "up", uptime: process.uptime() });
});

app.get("/health/ready", async (req, res) => {
  try {
    // Simple check: try to read one row from farms
    const { error } = await supabase.from("farms").select("id").limit(1);
    if (error) throw error;
    res.status(200).json({ status: "ready", database: "connected" });
  } catch (error) {
    console.error("Health Check Failed:", error);
    res.status(503).json({ status: "not ready", error: error.message });
  }
});

// --- AUTH MIDDLEWARE ---

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Supabase Auth checks the JWT validity
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error("Invalid token");
    }

    req.user = user; // Contains id, email, app_metadata, etc.
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};

// --- ROUTES ---

/**
 * @route   POST /api/auth/sync
 * @desc    Creates/Updates User Profile in the public 'users' table
 */
app.post("/api/auth/sync", verifyToken, async (req, res) => {
  const { role, farmName, name } = req.body;
  const { id, email } = req.user;

  // Validate inputs
  if (!["buyer", "vendor"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    // 1. Upsert User Profile
    // Note: You must create a 'users' table in Supabase SQL Editor first!
    const { error: userError } = await supabase.from("users").upsert({
      id: id, // Link to Auth ID
      email: email,
      role: role,
      name: name || "Anonymous",
      updated_at: new Date(),
    });

    if (userError) throw userError;

    // 2. If Vendor, create Farm placeholder if it doesn't exist
    if (role === "vendor" && farmName) {
      // Check for existing farm owned by this user
      const { data: existingFarm } = await supabase
        .from("farms")
        .select("id")
        .eq("owner_id", id)
        .single();

      if (!existingFarm) {
        const { error: farmError } = await supabase.from("farms").insert({
          name: farmName,
          owner_id: id,
          type: "vendor",
          status: "pending",
          products: [],
          // Location is null until they set it
        });

        if (farmError) throw farmError;
      }
    }

    res.json({ message: "User synced successfully" });
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: "Database synchronization failed" });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Returns User Profile + Farm Details
 */
app.get("/api/auth/me", verifyToken, async (req, res) => {
  try {
    const { id } = req.user;

    // 1. Get User Profile
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (userError) return res.status(404).json({ error: "Profile not found" });

    // 2. If Vendor, Get Farm Details
    let farmData = null;
    if (userData.role === "vendor") {
      const { data: farm, error: farmError } = await supabase
        .from("farms")
        .select("*")
        .eq("owner_id", id)
        .single();

      // It's okay if farm is missing, just return null
      if (!farmError) farmData = farm;
    }

    res.json({
      uid: id,
      ...userData,
      farm: farmData,
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * @route   POST /api/farms/search
 * @desc    Find farms using Supabase PostGIS
 */
app.post("/api/farms/search", async (req, res) => {
  const { lat, lng, radiusInKm } = req.body;

  if (!lat || !lng)
    return res.status(400).json({ error: "Missing coordinates" });

  try {
    // Call the RPC function 'nearby_farms' we created in SQL Editor
    const { data, error } = await supabase.rpc("nearby_farms", {
      lat: lat,
      long: lng,
      radius_meters: (radiusInKm || 50) * 1000,
    });

    if (error) throw error;

    // Transform data for frontend
    const results = data.map((farm) => ({
      ...farm,
      // Convert meters back to readable string
      distance: (farm.dist_meters / 1000).toFixed(1) + " km",
    }));

    res.json(results);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: "Search failed" + error.message });
  }
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health checks available at /health/live and /health/ready`);
});
