import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth"; 
import { Hub } from "aws-amplify/utils";

import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import Home from "./pages/Home";
import FindFarms from "./pages/FindFarms";
import About from "./pages/About";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; 

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    },
  },
});

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null); 

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

  async function syncUserWithBackend(cognitoUser) {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.accessToken.toString();
      const payload = {
        id: cognitoUser.userId,
        role: "buyer", 
        name: cognitoUser.username 
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
      
      // Optional: 
      // const profile = await fetch(`${API_URL}/api/auth/me`...)
      // setDbUser(profile);

    } catch (error) {
      console.error("Backend Sync Error:", error);
    }
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Pass user AND dbUser so Navbar can show "Vendor" links if applicable */}
        <Navbar user={user} onOpenAuth={() => setIsAuthOpen(true)} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<FindFarms />} />
          <Route
            path="/vendors"
            element={
              <div className="p-20 text-center">Vendor Portal Coming Soon</div>
            }
          />
          <Route path="/about" element={<About />} />
        </Routes>
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    </Router>
  );
}

export default App;