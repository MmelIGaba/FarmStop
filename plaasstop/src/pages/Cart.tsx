import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const shipping = 50.00; 

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <Link to="/marketplace" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
            <ul className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <li key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">Sold by: {item.farmName}</p>
                      </div>
                      <p className="text-lg font-medium text-gray-900">R {item.price.toFixed(2)}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-gray-100"><Minus className="h-4 w-4" /></button>
                        <span className="px-4 font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-gray-100"><Plus className="h-4 w-4" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1">
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <Link to="/marketplace" className="text-green-600 font-medium flex items-center gap-2 hover:underline">
              <ArrowLeft className="h-4 w-4" /> Continue Shopping
            </Link>
          </div>
        </div>

        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <div className="bg-white shadow-sm rounded-lg border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Order Summary</h2>
            <div className="flow-root">
              <dl className="-my-4 text-sm divide-y divide-gray-200">
                <div className="py-4 flex justify-between"><dt>Subtotal</dt><dd>R {cartTotal.toFixed(2)}</dd></div>
                <div className="py-4 flex justify-between"><dt>Shipping</dt><dd>R {shipping.toFixed(2)}</dd></div>
                <div className="py-4 flex justify-between border-t border-gray-200"><dt className="text-base font-bold">Total</dt><dd className="text-xl font-bold text-green-600">R {(cartTotal + shipping).toFixed(2)}</dd></div>
              </dl>
            </div>
            <button onClick={() => navigate('/checkout')} className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">Proceed to Checkout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
