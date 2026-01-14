import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import FindFarms from './pages/findFarms';
import './index.css';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<FindFarms />} /> {/* Pointing marketplace here for now */}
          <Route path="/vendors" element={<div className="p-20 text-center">Vendor Portal Coming Soon</div>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App