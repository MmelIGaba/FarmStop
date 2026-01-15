import os
from dotenv import load_dotenv  
from supabase import create_client, Client
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time

load_dotenv()

# --- CONFIGURATION ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY. check your .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
geolocator = Nominatim(user_agent="plaasstop_scraper_v2")

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


print(f"--- Starting Import ---")

for lead in raw_leads:
    try:
        existing = (
            supabase.table("farms").select("*").eq("name", lead["name"]).execute()
        )
        if len(existing.data) > 0:
            print(f"[SKIP] {lead['name']} exists.")
            continue

        location = get_lat_long(lead["address"])

        if location:

            point_str = f"POINT({location.longitude} {location.latitude})"

            data = {
                "name": lead["name"],
                "type": "lead",
                "status": "unclaimed",
                "products": lead["products"],
                "contact": {"phone": lead["phone"], "address": lead["address"]},
                "location": point_str,
            }

            supabase.table("farms").insert(data).execute()
            print(f" -> ADDED: {lead['name']}")
        else:
            print(" -> ERROR: No Address Found")

        time.sleep(1.2)

    except Exception as e:
        print(f"Error: {e}")
