import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import './index.css';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Navbar stays at the top of all pages */}
        <Navbar />
        
        {/* Routes change the content below the Navbar */}
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Placeholders for future pages */}
          <Route path="/marketplace" element={<div className="p-20 text-center">Marketplace Coming Soon</div>} />
          <Route path="/vendors" element={<div className="p-20 text-center">Vendor Portal Coming Soon</div>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App