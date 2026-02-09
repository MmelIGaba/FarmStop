import React from 'react';
import { ShoppingCart, User, Tractor, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth'; 

import { CognitoUser, DbUser } from '../types';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  user: CognitoUser | null;
  dbUser: DbUser | null;
  onOpenAuth: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, dbUser, onOpenAuth }) => {
  
  const { cartCount } = useCart();

  const displayName = dbUser?.name || user?.username || "Farmer";
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/'; 
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-green-50 p-2 rounded-lg group-hover:bg-green-100 transition">
              <Tractor className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Plaasstop</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/marketplace" className="text-gray-600 hover:text-green-600 font-medium transition">Marketplace</Link>
            
            {/* Conditional Vendor Link */}
            {dbUser?.role === 'vendor' ? (
               <Link to="/vendors" className="text-green-600 font-medium transition flex items-center gap-1">
                 Vendor Dashboard
               </Link>
            ) : (
               <Link to="/vendors" className="text-gray-600 hover:text-green-600 font-medium transition">For Farms</Link>
            )}
            
            <Link to="/about" className="text-gray-600 hover:text-green-600 font-medium transition">About Us</Link>
          </div>

          {/* Right Side Interactions */}
          <div className="flex items-center gap-4">
            
            {/* 4. DYNAMIC SHOPPING CART */}
            <Link 
              to="/cart" 
              className="p-2 hover:bg-gray-100 rounded-full relative cursor-pointer group transition"
            >
              <ShoppingCart className="h-6 w-6 text-gray-600 group-hover:text-green-600 transition" />
              
              {/* Only show badge if count > 0 */}
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {/* Separator Line */}
            <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>

            {/* User Profile Logic */}
            {user ? (
              <div className="flex items-center gap-3">
                
                {/* User Info (Text) */}
                <div className="hidden lg:flex flex-col items-end mr-1">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    {getGreeting()}
                  </span>
                  <span className="text-sm font-bold text-gray-800 leading-none">
                    {displayName}
                  </span>
                </div>

                {/* Avatar Circle */}
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm text-white font-bold text-sm tracking-widest border-2 border-white ring-1 ring-gray-100">
                  {getInitials(displayName)}
                </div>

                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  title="Sign Out"
                  className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full font-medium transition shadow-sm hover:shadow-md transform active:scale-95"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;