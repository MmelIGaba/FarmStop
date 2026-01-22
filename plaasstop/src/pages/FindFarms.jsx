import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, Store, Loader2 } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function FindFarms() {
  const [position, setPosition] = useState(null);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(50); // Default 50km
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => {
          console.warn("Location access denied, using default (Pretoria).");
          setPosition([-25.7479, 28.2293]);
        }
      );
    } else {
      setPosition([-25.7479, 28.2293]);
    }
  }, []);

  const fetchFarms = async () => {
    if (!position) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/farms/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: position[0],
            lng: position[1],
            radiusInKm: radius,
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to fetch farms");
      const data = await res.json();
      setFarms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, [position, radius]);

  const handleClaim = async (farm) => {
    setClaimingId(farm.id);
    try {
      let session;
      try {
        session = await fetchAuthSession();
        if (!session.tokens) throw new Error("No session");
      } catch (e) {
        alert("Please log in to claim a farm.");
        setClaimingId(null);
        return;
      }

      const token = session.tokens.accessToken.toString();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/farms/${farm.id}/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to claim");

      alert("Success! You are now the owner of this farm profile.");
      fetchFarms();
    } catch (error) {
      alert(error.message);
    } finally {
      setClaimingId(null);
    }
  };

  if (!position)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-green-600 h-8 w-8" />
      </div>
    );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:flex-row bg-gray-50">
      {/* --- LEFT PANEL: LIST --- */}
      <div className="w-full md:w-1/3 overflow-y-auto p-4 border-r border-gray-200 bg-white z-10 shadow-lg relative">
        <div className="mb-6 sticky top-0 bg-white pt-2 pb-4 border-b z-20">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="text-green-600" /> Farms Near Me
          </h1>
          <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Search Radius</span>
              <span className="text-green-600">{radius} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
          </div>
        </div>

        <div className="space-y-4 pb-20">
          {farms.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-10">
                No farms found in this area. Try increasing the radius.
            </div>
          )}
          
          {farms.map((farm) => (
            <div
              key={farm.id}
              onClick={() => {
                setSelectedFarm(farm);
                // Optional: Pan map to selected farm
                setPosition([farm.lat, farm.lng]); 
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedFarm?.id === farm.id ? "ring-2 ring-green-500 bg-green-50" : "bg-white border-gray-200"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{farm.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {farm.distance} away
                  </p>
                </div>
                {farm.type === "vendor" ? (
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1">
                    <Store className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1">
                    Community
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {farm.products?.map((p, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600"
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* CLAIM BUTTON */}
              {farm.type === "lead" && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClaim(farm);
                    }}
                    disabled={claimingId === farm.id}
                    className="text-xs w-full border border-green-600 text-green-700 py-2 rounded-lg hover:bg-green-50 font-medium transition flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {claimingId === farm.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Is this your farm? Claim it"
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- RIGHT PANEL: MAP --- */}
      <div className="hidden md:block w-2/3 h-full relative">
        <MapContainer
          center={position}
          zoom={10}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={position} />
          
          {/* USER LOCATION */}
          <Marker position={position}>
            <Popup>You are here</Popup>
          </Marker>

          {/* FARM LOCATIONS - Now using real coordinates */}
          {farms.map((farm) => (
             (farm.lat && farm.lng) ? (
              <Marker
                key={farm.id}
                position={[farm.lat, farm.lng]}
                eventHandlers={{ click: () => setSelectedFarm(farm) }}
              >
                <Popup>
                  <div className="p-1">
                      <strong>{farm.name}</strong><br/>
                      <span className="text-xs">{farm.products?.join(", ")}</span>
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
        </MapContainer>
      </div>
    </div>
  );
}