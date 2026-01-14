import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import { Search, MapPin, Store, AlertCircle, Phone, ArrowRight } from 'lucide-react';
import { farmsData } from '../data/mockFarms';

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export default function FindFarms() {
    const [position, setPosition] = useState([-25.7479, 28.2293]);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [selectedFarm, setSelectedFarm] = useState(null);

    useEffect(() => {
        // Get User Location on load
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition([pos.coords.latitude, pos.coords.longitude]);
                setLoadingLocation(false);
            },
            (err) => {
                console.error("Location denied", err);
                setLoadingLocation(false);
            }
        );
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] md:flex-row bg-gray-50">
            
            {/* LEFT SIDE: List of Farms */}
            <div className="w-full md:w-1/3 overflow-y-auto p-4 border-r border-gray-200">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="text-green-600" /> Farms Near Me
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {loadingLocation ? "Locating you..." : "Showing results sorted by distance"}
                    </p>
                    
                    {/* Search Bar */}
                    <div className="mt-4 relative">
                        <input 
                            type="text" 
                            placeholder="Search for eggs, milk, or farm name..." 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <div className="space-y-4">
                    {farmsData.map((farm) => (
                        <div 
                            key={farm.id} 
                            onClick={() => {
                                setSelectedFarm(farm);
                                // In a real app, this would pan the map to the farm
                            }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                                selectedFarm?.id === farm.id ? 'ring-2 ring-green-500 bg-green-50' : 'bg-white border-gray-200'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{farm.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {farm.distance} away
                                    </p>
                                </div>
                                {farm.type === 'vendor' ? (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                        <Store className="h-3 w-3" /> Verified
                                    </span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> Unclaimed
                                    </span>
                                )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {farm.products.map(prod => (
                                    <span key={prod} className="text-xs border border-gray-200 px-2 py-1 rounded bg-gray-50 text-gray-600">
                                        {prod}
                                    </span>
                                ))}
                            </div>

                            {/* Action Buttons based on type */}
                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                {farm.type === 'vendor' ? (
                                    <button className="text-sm bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg w-full flex justify-center items-center gap-2 font-medium">
                                        Visit Shop <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <div className="w-full">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                            <Phone className="h-3 w-3" /> {farm.contact.phone}
                                        </div>
                                        <button className="text-xs w-full border border-green-600 text-green-700 py-1.5 rounded hover:bg-green-50 font-medium">
                                            Is this your farm? Claim it
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT SIDE: Map */}
            <div className="hidden md:block w-2/3 h-full relative z-0">
                <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* User Location */}
                    <Marker position={position}>
                        <Popup>You are here</Popup>
                    </Marker>

                    {/* Farms */}
                    {farmsData.map(farm => (
                        <Marker key={farm.id} position={[farm.lat, farm.lng]}>
                            <Popup>
                                <strong>{farm.name}</strong> <br />
                                {farm.products.join(", ")}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}