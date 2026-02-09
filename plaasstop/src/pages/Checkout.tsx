import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Store, CreditCard, Banknote, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartTotal, clearCart, cartItems } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  
  const shipping = deliveryMethod === 'delivery' ? 50.00 : 0.00;
  const total = cartTotal + shipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      alert(`Order processed for R${total.toFixed(2)}!`);
      clearCart();
      navigate('/');
    }, 1000);
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          
          <section className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4">Contact & Delivery</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="First Name" required className="border p-3 rounded-md w-full" />
                    <input type="text" placeholder="Last Name" required className="border p-3 rounded-md w-full" />
                  </div>
                  <input type="email" placeholder="Email Address" required className="border p-3 rounded-md w-full" />
                  <input type="text" placeholder="Address" required className="border p-3 rounded-md w-full" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4">Delivery Method</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => setDeliveryMethod('delivery')} className={`border p-4 rounded-lg cursor-pointer flex gap-3 ${deliveryMethod === 'delivery' ? 'border-green-600 bg-green-50' : ''}`}>
                    <Truck className="text-green-600" /> <div><p className="font-medium">Delivery</p><p className="text-sm text-gray-500">R50.00</p></div>
                  </div>
                  <div onClick={() => setDeliveryMethod('pickup')} className={`border p-4 rounded-lg cursor-pointer flex gap-3 ${deliveryMethod === 'pickup' ? 'border-green-600 bg-green-50' : ''}`}>
                    <Store className="text-green-600" /> <div><p className="font-medium">Pickup</p><p className="text-sm text-gray-500">Free</p></div>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700">Pay R {total.toFixed(2)}</button>
            </form>
          </section>

          <section className="lg:col-span-5 mt-8 lg:mt-0">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>
              <ul className="divide-y divide-gray-200 mb-4">
                {cartItems.map(item => (
                  <li key={item.id} className="py-2 flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>R {(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-bold text-xl pt-4 border-t">
                <span>Total</span><span>R {total.toFixed(2)}</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <ShieldCheck className="h-4 w-4 text-green-600" /> Secure SSL Encryption
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
