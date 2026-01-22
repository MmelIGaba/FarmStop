import json
import time
import psycopg2
from geopy.geocoders import Nominatim
from pydantic_settings import BaseSettings, SettingsConfigDict

# --- MODERN CONFIG MANAGEMENT ---
class Settings(BaseSettings):
    database_url: str 
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

def get_db_connection():
    return psycopg2.connect(settings.database_url)

def get_lat_long(geolocator, address):
    try:
        return geolocator.geocode(address, timeout=10)
    except:
        return None


# --- THE LAMBDA HANDLER ---
# This is what AWS calls when the scheduled event fires
def lambda_handler(event, context):
    print("--- Starting Scraper Job ---")
    
    conn = get_db_connection()
    conn.autocommit = True
    cursor = conn.cursor()
    
    geolocator = Nominatim(user_agent="plaasstop_scraper_lambda")

    raw_leads = [
        {"name": "Dairy King Estate", "address": "Irene Dairy Farm, Pretoria, South Africa", "products": ["Milk"], "phone": "012-000-1111"},
        {"name": "Centurion Egg Depot", "address": "Rooihuiskraal, Centurion, South Africa", "products": ["Eggs"], "phone": "012-666-7777"},
        # ... Add more leads here ... maybe automate this later from db of current leads? 
    ]

    added_count = 0

    for lead in raw_leads:
        try:
            cursor.execute("SELECT id FROM farms WHERE name = %s", (lead["name"],))
            if cursor.fetchone():
                print(f"[SKIP] {lead['name']}")
                continue

            location = get_lat_long(geolocator, lead["address"])

            if location:
                query = """
                    INSERT INTO farms (name, type, status, products, contact, location)
                    VALUES (%s, 'lead', 'unclaimed', %s, %s, ST_GeomFromText(%s, 4326))
                """
                point_str = f"POINT({location.longitude} {location.latitude})"
                
                cursor.execute(query, (
                    lead["name"], 
                    lead["products"], 
                    json.dumps({"phone": lead["phone"], "address": lead["address"]}),
                    point_str
                ))
                print(f" -> ADDED: {lead['name']}")
                added_count += 1
                
            time.sleep(1.0) 

        except Exception as e:
            print(f"Error on {lead['name']}: {e}")

    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps(f"Scrape Complete. Added {added_count} farms.")
    }

# Local testing support
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    lambda_handler(None, None)