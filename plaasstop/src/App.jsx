import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import FindFarms from './pages/FindFarms';
import AuthModal from './components/AuthModal'; 
import './index.css';

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        
        {/* Pass the function to open the modal to Navbar */}
        <Navbar onOpenAuth={() => setIsAuthOpen(true)} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<FindFarms />} />
          <Route path="/vendors" element={<div className="p-20 text-center">Vendor Portal Coming Soon</div>} />
        </Routes>

        {/* The Modal lives here, outside the routes */}
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />
        
      </div>
    </Router>
  )
}

export default App