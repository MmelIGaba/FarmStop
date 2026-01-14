import { useState } from 'react';
import { X, Mail, Lock, User, Store, Tractor, ArrowLeft, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  // view: 'login' | 'signup' | 'forgot-password'
  const [view, setView] = useState('login'); 
  const [role, setRole] = useState('buyer'); // 'buyer' | 'vendor'
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    farmName: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call / Firebase interaction
    console.log(`Action: ${view}, Role: ${role}`, formData);
    
    setTimeout(() => {
        setLoading(false);
        alert("Authentication logic will go here (Firebase)");
        onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition z-10"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Tractor className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {view === 'login' && 'Welcome back'}
              {view === 'signup' && 'Create an account'}
              {view === 'forgot-password' && 'Reset Password'}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {view === 'login' && 'Enter your details to sign in.'}
              {view === 'signup' && 'Join the community of local produce.'}
              {view === 'forgot-password' && 'We’ll email you a reset link.'}
            </p>
          </div>

          {/* Role Toggle (Only for Signup) */}
          {view === 'signup' && (
             <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                        role === 'buyer' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <User className="h-4 w-4" /> Buyer
                </button>
                <button
                    type="button"
                    onClick={() => setRole('vendor')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                        role === 'vendor' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Store className="h-4 w-4" /> Farmer
                </button>
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Field (Signup Only) */}
            {view === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="John Doe"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}

            {/* Farm Name (Signup + Vendor Only) */}
            {view === 'signup' && role === 'vendor' && (
              <div className="animate-in slide-in-from-top-2 fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm / Business Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="Sunny Side Up Farms"
                  onChange={(e) => setFormData({...formData, farmName: e.target.value})}
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="you@example.com"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* Password Field (Not for Forgot Password) */}
            {view !== 'forgot-password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Forgot Password Link (Login Only) */}
            {view === 'login' && (
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setView('forgot-password')}
                  className="text-sm font-medium text-green-600 hover:text-green-500"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition shadow-sm hover:shadow flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                view === 'login' ? 'Sign In' : (view === 'signup' ? 'Create Account' : 'Send Reset Link')
              )}
            </button>
          </form>

          {/* Footer / Switch View */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {view === 'login' ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => setView('signup')} className="font-semibold text-green-600 hover:text-green-500">
                  Sign up
                </button>
              </>
            ) : view === 'signup' ? (
              <>
                Already have an account?{' '}
                <button onClick={() => setView('login')} className="font-semibold text-green-600 hover:text-green-500">
                  Log in
                </button>
              </>
            ) : (
              <button onClick={() => setView('login')} className="font-semibold text-green-600 hover:text-green-500 flex items-center justify-center gap-1 mx-auto">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}