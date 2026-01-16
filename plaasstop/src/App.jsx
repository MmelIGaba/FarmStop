import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

// Components
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';

// Pages
import Home from './pages/Home';
import FindFarms from './pages/FindFarms'; // Ensure file is named FindFarms.jsx (capital F)

import './index.css';

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1. Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Listen for auth changes (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        
        {/* Navbar: Pass session and open-modal function */}
        <Navbar 
            session={session} 
            onOpenAuth={() => setIsAuthOpen(true)} 
        />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<FindFarms />} />
          <Route path="/vendors" element={<div className="p-20 text-center">Vendor Portal Coming Soon</div>} />
        </Routes>

        {/* Global Auth Modal */}
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />
        
      </div>
    </Router>
  )
}

export default App;
