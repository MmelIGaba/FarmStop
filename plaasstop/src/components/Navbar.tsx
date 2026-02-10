import React, { useEffect, useState } from "react";
import { ShoppingCart, User, Tractor, LogOut, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import { CognitoUser, DbUser } from "../types";
import { useCart } from "../context/CartContext";

interface NavbarProps {
  user: CognitoUser | null;
  dbUser: DbUser | null;
  onOpenAuth: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, dbUser, onOpenAuth }) => {
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      console.log(
        "STRINGIFIED COGNITO USER 👇",
        JSON.parse(JSON.stringify(user.signInDetails)),
        JSON.parse(JSON.stringify(dbUser))
      );
    }
  }, [user]);

  const displayName =
    dbUser?.name || user?.signInDetails?.loginId?.split("@")[0] || "Farmer";

  const getInitials = (name: string) => {
    if (!name || name.includes("-")) return "👨‍🌾";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
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
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navLinks = (
    <>
      <Link to="/" className="block px-3 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-50">
        Home
      </Link>

      <Link to="/marketplace" className="block px-3 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-50">
        Marketplace
      </Link>
      <Link to="/farms" className="block px-3 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-50">
        Farms
      </Link>
      <Link to="/about" className="block px-3 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-50">
        About Us
      </Link>
      {dbUser?.role === "vendor" ? (
        <Link to="/vendors" className="block px-3 py-2 rounded-md text-green-600 hover:bg-green-700 hover:bg-gray-50">
          Vendor Dashboard
        </Link>
      ) : (
        <Link to="/vendors" className="block px-3 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-50">
         Vendor-Portal
        </Link>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-green-50 p-2 rounded-lg group-hover:bg-green-100 transition">
              <Tractor className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              Plaasstop
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">{navLinks}</div>

          {/* Right Side Interactions */}
          <div className="flex items-center gap-4">
            {/* Shopping Cart */}
            <Link
              to="/cart"
              className="p-2 hover:bg-gray-100 rounded-full relative cursor-pointer group transition"
            >
              <ShoppingCart className="h-6 w-6 text-gray-600 group-hover:text-green-600 transition" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile Logic */}
            {user ? (
              <div className="hidden sm:flex items-center gap-3">
                <div className="hidden lg:flex flex-col items-end mr-1">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    {getGreeting()}
                  </span>
                  <span className="text-sm font-bold text-gray-800 leading-none">
                    {displayName}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm text-white font-bold text-sm tracking-widest border-2 border-white ring-1 ring-gray-100">
                  {getInitials(displayName)}
                </div>
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
                className="hidden sm:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full font-medium transition shadow-sm hover:shadow-md transform active:scale-95"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-gray-100 transition"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-sm">
          <div className="px-4 pt-2 pb-3 space-y-1">{navLinks}</div>
          <div className="px-4 py-3 border-t border-gray-100">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-100 transition"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition"
              >
                <User className="h-5 w-5" />
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
