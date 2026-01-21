import os
import time
import json
import psycopg2
from dotenv import load_dotenv  
from geopy.geocoders import Nominatim

load_dotenv()

# --- 1. CONNECT TO AWS RDS ---
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("ERROR: DATABASE_URL is missing from .env")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True # Apply changes immediately
    cursor = conn.cursor()
    print("✅ Connected to AWS RDS")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
    exit(1)

geolocator = Nominatim(user_agent="plaasstop_scraper_v3")

raw_leads = [
    # --- PRETORIA & CENTURION ---
    {
        "name": "Dairy King Estate",
        "address": "Irene Dairy Farm, Pretoria, South Africa",
        "products": ["Milk", "Cream", "Butter"],
        "phone": "012-000-1111",
    },
    {
        "name": "Centurion Egg Depot",
        "address": "Rooihuiskraal, Centurion, South Africa",
        "products": ["Free Range Eggs"],
        "phone": "012-666-7777",
    },
    
    # --- JOHANNESBURG & WEST RAND ---
    {
        "name": "Jozi Organic Veg",
        "address": "Muldersdrift, Gauteng, South Africa",
        "products": ["Spinach", "Kale", "Tomatoes"],
        "phone": "082-999-8888",
    },
    {
        "name": "Lanseria Berry Farm",
        "address": "Lanseria, Gauteng, South Africa",
        "products": ["Strawberries", "Jam"],
        "phone": "011-555-4321",
    },

    # --- HARTBEESPOORT & BRITS ---
    {
        "name": "Harties Fresh Fish",
        "address": "Hartbeespoort, North West, South Africa",
        "products": ["Tilapia", "Trout"],
        "phone": "012-253-1000",
    },
    {
        "name": "Brits Citrus Co-op",
        "address": "Brits, North West, South Africa",
        "products": ["Oranges", "Lemons", "Juice"],
        "phone": "012-250-9999",
    },

    # --- MAGALIESBURG ---
    {
        "name": "Magalies Mushroom Shack",
        "address": "Magaliesburg, Gauteng, South Africa",
        "products": ["Oyster Mushrooms", "Button Mushrooms"],
        "phone": "014-577-1234",
    }
]


def get_lat_long(address):
    try:
        return geolocator.geocode(address, timeout=10)
    except:
        return None


print(f"--- Starting AWS Import ---")

for lead in raw_leads:
    try:
        # --- CHECK DUPLICATES (SQL) ---
        cursor.execute("SELECT id FROM farms WHERE name = %s", (lead["name"],))
        existing = cursor.fetchone()
        
        if existing:
            print(f"[SKIP] {lead['name']} exists.")
            continue

        location = get_lat_long(lead["address"])

        if location:
            # --- INSERT INTO AWS (SQL) ---
            insert_query = """
                INSERT INTO farms (name, type, status, products, contact, location)
                VALUES (%s, 'lead', 'unclaimed', %s, %s, ST_GeomFromText(%s, 4326))
            """
            
            # Create PostGIS Point string: POINT(Long Lat)
            point_str = f"POINT({location.longitude} {location.latitude})"
            
            cursor.execute(insert_query, (
                lead["name"], 
                lead["products"], 
                json.dumps({"phone": lead["phone"], "address": lead["address"]}),
                point_str
            ))
            
            print(f" -> ADDED: {lead['name']}")
        else:
            print(" -> ERROR: No Address Found")

        time.sleep(1.2) # Be nice to the geocoding API

    except Exception as e:
        print(f"Error processing {lead['name']}: {e}")

cursor.close()
conn.close()
print("--- Import Complete ---")