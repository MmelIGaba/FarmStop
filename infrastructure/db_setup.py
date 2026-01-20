import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to AWS RDS
try:
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    conn.autocommit = True # Needed to create extensions/databases
    cursor = conn.cursor()

    print("--- 1. Enabling PostGIS ---")
    cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    print("Success.")

    print("--- 2. Creating Farms Table ---")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS farms (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT,
            status TEXT,
            products TEXT[],
            contact JSONB,
            owner_id UUID,
            location GEOGRAPHY(POINT, 4326)
        );
    """)
    # Create a spatial index for fast searching
    cursor.execute("CREATE INDEX IF NOT EXISTS farms_geo_index ON farms USING GIST (location);")
    print("Success.")

    print("--- 3. Creating Users Table ---")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY, -- Matches Supabase/Auth ID
            email TEXT UNIQUE,
            role TEXT,
            name TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print("Success.")

    cursor.close()
    conn.close()
    print("\nDATABASE SETUP COMPLETE! ��")

except Exception as e:
    print(f"Error: {e}")
