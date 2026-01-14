import firebase_admin
from firebase_admin import credentials, firestore
from geopy.geocoders import Nominatim
from geolib import geohash
import time

# 1. Initialize Firestore
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# 2. Initialize Geocoder (Use a custom user_agent to avoid blocking)
geolocator = Nominatim(user_agent="plaasstop_scraper_v1")

# 3. Mock Data (This is what you would usually scrape from a website)
raw_leads = [
    {
        "name": "Dairy King Estate",
        "address": "Irene Dairy Farm, Pretoria",
        "products": ["Milk", "Cream", "Butter"],
        "phone": "012-000-1111"
    },
    {
        "name": "Jozi Organic Veg",
        "address": "Muldersdrift, Gauteng",
        "products": ["Spinach", "Kale", "Tomatoes"],
        "phone": "082-999-8888"
    },
    {
        "name": "Stellenbosch Berries",
        "address": "Stellenbosch Central, Western Cape",
        "products": ["Strawberries", "Blueberries"],
        "phone": "021-888-7777"
    }
]

print(f"Starting Scrape/Upload for {len(raw_leads)} leads...")

for lead in raw_leads:
    try:
        print(f"Processing: {lead['name']}...")
        
        # A. Geocode (Convert Address -> Lat/Lon)
        location = geolocator.geocode(lead['address'])
        
        if location:
            lat = location.latitude
            lng = location.longitude
            
            # B. Generate Geohash (Precision 10 is very accurate)
            # We use the python geolib library or write a simple helper
            # For simplicity here, assuming you install 'geolib' or similar
            # If geolib isn't installed, we can skip or use a simple algorithm.
            # Let's use the 'geohash' string manually if needed, but 'geolib' is standard.
            hash_str = geohash.encode(lat, lng, 10)

            # C. Prepare Data Structure
            farm_data = {
                "name": lead['name'],
                "type": "lead", # It's a lead, not a verified vendor yet
                "status": "unclaimed",
                "products": lead['products'],
                "contact": {
                    "phone": lead['phone'],
                    "address": lead['address']
                },
                # Firestore Native GeoPoint
                "location": firestore.GeoPoint(lat, lng),
                "geohash": hash_str,
                "createdAt": firestore.SERVER_TIMESTAMP
            }
            
            # D. Upload to Firestore
            db.collection('farms').add(farm_data)
            print(f" -> Uploaded successfully! ({lat}, {lng})")
            
        else:
            print(" -> Could not find address coordinates.")

        # Respect API limits (Nominatim allows 1 req/sec)
        time.sleep(1.5)

    except Exception as e:
        print(f" -> Error: {e}")

print("Done.")