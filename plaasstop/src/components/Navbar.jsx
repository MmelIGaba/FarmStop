import { ShoppingCart, Menu, User, Tractor } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Tractor className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Plaasstop</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/marketplace" className="text-gray-600 hover:text-green-600 font-medium transition">Marketplace</Link>
            <Link to="/vendors" className="text-gray-600 hover:text-green-600 font-medium transition">For Farms</Link>
            <Link to="/about" className="text-gray-600 hover:text-green-600 font-medium transition">About Us</Link>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full relative cursor-pointer">
              <ShoppingCart className="h-6 w-6 text-gray-600" />
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">0</span>
            </button>
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition cursor-pointer">
              <User className="h-4 w-4" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}