import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser, fetchAuthSession, fetchUserAttributes, AuthUser } from "aws-amplify/auth"; 
import { API_URL, AMPLIFY_CONFIG } from "./config/api";
import { CartProvider } from "./context/CartContext";

import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import Home from "./pages/Home";
import FindFarms from "./pages/FindFarms";
import Marketplace from "./pages/Marketplace";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import "./index.css";

Amplify.configure(AMPLIFY_CONFIG);

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null); 

  useEffect(() => {
    checkUser();

    const listener = Hub.listen("auth", (data) => {
      switch (data.payload.event) {
        case "signedIn":
          checkUser(); 
          break;
        case "signedOut":
          setUser(null);
          setDbUser(null);
          break;
      }
    });

    return () => listener();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      await syncUserWithBackend(currentUser);
    } catch (err) {
      console.log("Not signed in");
      setUser(null);
      setDbUser(null);
    }
  }

  async function syncUserWithBackend(cognitoUser: AuthUser): Promise<void> {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      if (!token) throw new Error("No access token found");

      const attributes = await fetchUserAttributes();
      const realName = attributes.name || attributes.email || "Farmer";

      const payload = {
        id: cognitoUser.userId,
        role: "buyer", 
        name: realName 
      };

      const response = await fetch(`${API_URL}/api/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Sync failed");
      
      const profileResponse = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!profileResponse.ok) throw new Error("Failed to fetch profile");

      const profileData = await profileResponse.json();
      setDbUser(profileData);

    } catch (error) {
      console.error("Backend Sync Error:", error);
    }
  }

  return (
    <CartProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          
          {/* Navbar needs dbUser to show the Welcome message */}
          <Navbar 
            user={user} 
            dbUser={dbUser} 
            onOpenAuth={() => setIsAuthOpen(true)} 
          />
          
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Store / Listing View */}
            <Route path="/shop" element={<Marketplace />} />
            <Route path="/marketplace" element={<FindFarms />} />
            
            {/* Map / Geospatial View */}
            <Route path="/find-farms" element={<FindFarms />} />
            
            {/* Cart & Checkout */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            
            <Route path="/about" element={<About />} />
            
            {/* Fallback for old links or Vendor Portal */}
            <Route path="/vendors" element={<div className="p-20 text-center">Vendor Portal Coming Soon</div>} />
          </Routes>
          
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;