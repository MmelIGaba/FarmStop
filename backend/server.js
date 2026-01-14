const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const { geohashQueryBounds, distanceBetween } = require('geofire-common');

// Load Service Account
// Make sure this file exists and is in .gitignore!
const serviceAccount = require('./plaasstop-firebase-adminsdk-fbsvc-fe7e01a362.json');

// 1. Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();

// 2. Security Middleware
app.use(helmet()); 
app.use(hpp()); 
app.use(cors({ origin: 'http://localhost:5173' })); // Allow Vite Frontend
app.use(express.json());

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true,
  legacyHeaders: false, 
});
app.use(limiter);

// --- HEALTH CHECKS (Must be before Auth Middleware) ---

/**
 * @route   GET /health/live
 * @desc    Liveness Probe - Checks if the Node process is up
 */
app.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'up', uptime: process.uptime() });
});

/**
 * @route   GET /health/ready
 * @desc    Readiness Probe - Checks if we can talk to Firestore
 */
app.get('/health/ready', async (req, res) => {
    try {
        // Lightweight check: list collections (or read a dummy doc)
        await db.listCollections(); 
        res.status(200).json({ status: 'ready', database: 'connected' });
    } catch (error) {
        console.error("Health Check Failed:", error);
        res.status(503).json({ status: 'not ready', error: error.message });
    }
});

// --- AUTH MIDDLEWARE ---

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // contains uid, email, etc.
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

// --- AUTH ROUTES ---

/**
 * @route   POST /api/auth/sync
 * @desc    Creates/Updates User & Farm in Firestore after Firebase Signup
 */
app.post('/api/auth/sync', verifyToken, async (req, res) => {
    const { role, farmName, name } = req.body;
    const { uid, email } = req.user;

    if (!['buyer', 'vendor'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    try {
        const batch = db.batch();
        const userRef = db.collection('users').doc(uid);

        // 1. Prepare User Data
        const userData = {
            email,
            role,
            name: name || 'Anonymous',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Only set createdAt if it's new (merge: true handles updates)
        batch.set(userRef, userData, { merge: true });

        // 2. If Vendor, create/link Farm
        if (role === 'vendor' && farmName) {
            // Check if user already has a farm to avoid duplicates
            const existingFarmQuery = await db.collection('farms').where('ownerId', '==', uid).get();
            
            if (existingFarmQuery.empty) {
                const farmRef = db.collection('farms').doc(); // Auto-ID
                batch.set(farmRef, {
                    name: farmName,
                    ownerId: uid,
                    type: 'vendor',
                    status: 'pending',
                    products: [],
                    location: null, 
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        await batch.commit();
        res.json({ message: 'User profile synced' });

    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ error: 'Database write failed' });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Returns the User Profile + Farm Details (if vendor)
 */
app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;

        // 1. Get User Profile
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        const userData = userDoc.data();

        // 2. If Vendor, Get Farm Details
        let farmData = null;
        if (userData.role === 'vendor') {
            const farmQuery = await db.collection('farms').where('ownerId', '==', uid).limit(1).get();
            if (!farmQuery.empty) {
                const doc = farmQuery.docs[0];
                farmData = { id: doc.id, ...doc.data() };
            }
        }

        // 3. Return combined data
        res.json({
            uid,
            ...userData,
            farm: farmData // Will be null for buyers
        });

    } catch (error) {
        console.error("Get Me Error:", error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});


/**
 * @route   POST /api/farms/search
 * @desc    Find farms within a specific radius (km)
 * @body    { lat: number, lng: number, radiusInKm: number }
 */
app.post('/api/farms/search', async (req, res) => {
    try {
        const { lat, lng, radiusInKm } = req.body;
        const center = [lat, lng];
        const radiusInM = radiusInKm * 1000;

        // 1. Calculate the "Geohash Bounds"
        // This gives us square regions on the map to query
        const bounds = geohashQueryBounds(center, radiusInM);

        const promises = [];
        
        // 2. Query Firestore for each bound
        for (const b of bounds) {
            const q = db.collection('farms')
                .orderBy('geohash')
                .startAt(b[0])
                .endAt(b[1]);
            promises.push(q.get());
        }

        // 3. Execute all queries
        const snapshots = await Promise.all(promises);
        const matchingDocs = [];

        for (const snap of snapshots) {
            for (const doc of snap.docs) {
                const data = doc.data();
                
                // 4. Client-side filtering (False Positive Check)
                // Geohashes are square, our radius is a circle.
                // We must calculate exact distance to be accurate.
                // data.location should be a Firestore GeoPoint
                const farmLat = data.location.latitude;
                const farmLng = data.location.longitude;
                
                const distanceInKm = distanceBetween([farmLat, farmLng], center);
                const distanceInM = distanceInKm * 1000;

                if (distanceInM <= radiusInM) {
                    matchingDocs.push({
                        id: doc.id,
                        ...data,
                        distance: distanceInKm.toFixed(1) + " km" // Add distance for UI
                    });
                }
            }
        }

        // 5. Sort by nearest
        matchingDocs.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        res.json(matchingDocs);

    } catch (error) {
        console.error("Geo Query Error:", error);
        res.status(500).json({ error: 'Failed to search farms' });
    }
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:/${PORT}`);
  console.log(`Health checks available at /health/live and /health/ready`);
});