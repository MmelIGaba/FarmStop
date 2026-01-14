import { ArrowRight, Leaf, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <section className="relative bg-emerald-900 py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center" />
        <div className="relative max-w-7xl mx-auto px-6 text-center lg:text-left">
          <div className="lg:w-1/2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl mb-6">
              Fresh from the Farm,<br /> 
              <span className="text-green-400">Direct to You.</span>
            </h1>
            <p className="mt-4 text-xl text-emerald-100 max-w-2xl mb-10">
              Plaasstop connects local farmers directly with businesses and households. 
              No middlemen, just fresh produce and fair prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/marketplace" className="bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-8 rounded-full transition flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/30">
                Start Shopping <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/vendors" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold py-4 px-8 rounded-full transition flex items-center justify-center">
                Become a Vendor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Why choose Plaasstop?</h2>
          <p className="mt-4 text-gray-600">Supporting local agriculture while ensuring quality.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: <Leaf className="h-8 w-8 text-green-600" />, 
              title: "100% Organic Options", 
              desc: "Verified organic produce from certified local partners." 
            },
            { 
              icon: <Truck className="h-8 w-8 text-blue-600" />, 
              title: "Farm to Doorstep", 
              desc: "Logistics handled for you. Fresh delivery within 24 hours." 
            },
            { 
              icon: <ShieldCheck className="h-8 w-8 text-purple-600" />, 
              title: "Fair Trade", 
              desc: "Farmers set their prices. You get transparency." 
            },
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-gray-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold mb-8">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Vegetables', 'Fruits', 'Dairy & Eggs', 'Meat & Poultry'].map((cat) => (
                    <div key={cat} className="h-32 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 border border-transparent cursor-pointer transition">
                        {cat}
                    </div>
                ))}
            </div>
        </div>
      </section>

    </div>
  );
}