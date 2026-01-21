require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for AWS RDS
});

async function init() {
  try {
    await client.connect();
    console.log("Connected to AWS RDS...");

    console.log("1. Enabling PostGIS...");
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");

    console.log("2. Creating Tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS farms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'lead',
        status TEXT DEFAULT 'unclaimed',
        products TEXT[],
        contact JSONB,
        owner_id UUID,
        location GEOGRAPHY(POINT, 4326),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE,
        role TEXT,
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("3. Creating Indexes...");
    await client.query("CREATE INDEX IF NOT EXISTS farms_geo_idx ON farms USING GIST (location);");

    console.log("✅ Database initialized successfully on AWS!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.end();
  }
}

init();
