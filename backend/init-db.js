require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});

async function init() {
  try {
    await client.connect();
    console.log("🔌 Connected to AWS RDS...");

    console.log("1. Enabling PostGIS...");
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");

    console.log("2. Creating Users Table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        role VARCHAR(50),
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("3. 🚜 Creating Farms Table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS farms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'lead',
        status VARCHAR(50) DEFAULT 'unclaimed',
        products TEXT[],
        contact JSONB,
        owner_id VARCHAR(255),
        location GEOGRAPHY(POINT, 4326),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("4. 🔍 Creating Indexes...");
    await client.query("CREATE INDEX IF NOT EXISTS farms_geo_idx ON farms USING GIST (location);");

    console.log("5. 🌱 Seeding Dummy Data...");
    await client.query(`
      INSERT INTO farms (name, type, status, products, location)
      VALUES 
      ('Happy Cow Dairy', 'vendor', 'verified', ARRAY['Milk', 'Cheese'], ST_SetSRID(ST_MakePoint(28.2293, -25.7479), 4326)),
      ('Sunshine Veggies', 'lead', 'unclaimed', ARRAY['Carrots', 'Spinach'], ST_SetSRID(ST_MakePoint(28.0473, -26.2041), 4326))
      ON CONFLICT DO NOTHING;
    `);

    console.log("✅ Database initialized successfully!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.end();
  }
}

init();