import json
import time
import psycopg2
from geopy.geocoders import Nominatim
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str 
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

def get_db_connection():
    return psycopg2.connect(settings.database_url)

def get_lat_long(geolocator, address, province=None):
    try:
        query = f"{address}, {province}, South Africa" if province else f"{address}, South Africa"
        return geolocator.geocode(query, country_codes="za", timeout=10)
    except Exception:
        return None

def fetch_leads_from_db(cursor, province=None):
    """
    Example: fetch unclaimed leads from DB, optionally filtered by province.
    """
    if province:
        cursor.execute("SELECT name, address, products, contact->>'phone' AS phone FROM leads WHERE province = %s", (province,))
    else:
        cursor.execute("SELECT name, address, products, contact->>'phone' AS phone FROM leads")
    rows = cursor.fetchall()
    return [
        {"name": r[0], "address": r[1], "products": r[2], "phone": r[3]}
        for r in rows
    ]

def lambda_handler(event, context):
    print("--- Starting Scraper Job ---")

    province = None
    if event and "province" in event:
        province = event["province"]

    conn = get_db_connection()
    conn.autocommit = True
    cursor = conn.cursor()

    geolocator = Nominatim(user_agent="plaasstop_scraper_lambda")

    raw_leads = fetch_leads_from_db(cursor, province)

    added_count = 0

    for lead in raw_leads:
        try:
            cursor.execute("SELECT id FROM farms WHERE name = %s", (lead["name"],))
            if cursor.fetchone():
                print(f"[SKIP] {lead['name']}")
                continue

            location = get_lat_long(geolocator, lead["address"], province)

            if location:
                query = """
                    INSERT INTO farms (name, type, status, products, contact, location, province)
                    VALUES (%s, 'lead', 'unclaimed', %s, %s, ST_GeomFromText(%s, 4326), %s)
                """
                point_str = f"POINT({location.longitude} {location.latitude})"

                cursor.execute(query, (
                    lead["name"],
                    lead["products"],
                    json.dumps({"phone": lead["phone"], "address": lead["address"]}),
                    point_str,
                    province if province else "Unknown"
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

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    lambda_handler({"province": "Gauteng"}, None)
