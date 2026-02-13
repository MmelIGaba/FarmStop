import { ArrowRight, Leaf, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-emerald-900 py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center" />
        <div className="relative max-w-7xl mx-auto px-6 text-center lg:text-left">
          <div className="lg:w-1/2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl mb-6">
              Fresh from the Farm,
              <br />
              <span className="text-green-400">Direct to You.</span>
            </h1>
            <p className="mt-4 text-xl text-emerald-100 max-w-2xl mb-10">
              Plaasstop connects local farmers directly with businesses and
              households. No middlemen, just fresh produce and fair prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/marketplace"
                className="bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-8 rounded-full transition flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/30"
              >
                Start Shopping <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/vendors"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold py-4 px-8 rounded-full transition flex items-center justify-center"
              >
                Become a Vendor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">
            Why choose Plaasstop?
          </h2>
          <p className="mt-4 text-gray-600">
            Supporting local agriculture while ensuring quality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Leaf className="h-8 w-8 text-green-600" />,
              title: "100% Organic Options",
              desc: "Verified organic produce from certified local partners.",
            },
            {
              icon: <Truck className="h-8 w-8 text-blue-600" />,
              title: "Farm to Doorstep",
              desc: "Logistics handled for you. Fresh delivery within 24 hours.",
            },
            {
              icon: <ShieldCheck className="h-8 w-8 text-purple-600" />,
              title: "Fair Trade",
              desc: "Farmers set their prices. You get transparency.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="bg-gray-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">Shop by Category</h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              {
                label: "Livestock",
                type: "category",
                value: "Livestock",
                image:
                  "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80",
              },
              {
                label: "Vegetables",
                type: "subcategory",
                value: "Vegetables",
                image:
                  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
              },
              {
                label: "Fruits",
                type: "subcategory",
                value: "Fruit",
                image:
                  "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80",
              },
              {
                label: "Dairy & Eggs",
                type: "subcategory",
                value: "Dairy",
                image:
                  "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
              },
              {
                label: "Meat & Poultry",
                type: "subcategory",
                value: "Meat",
                image:
                  "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80",
              },
            ].map((cat) => {
              const url =
                cat.type === "category"
                  ? `/marketplace?category=${encodeURIComponent(cat.value)}`
                  : `/marketplace?subcategory=${encodeURIComponent(cat.value)}`;

              return (
                <Link
                  key={cat.label}
                  to={url}
                  className="relative h-40 rounded-2xl overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition" />

                  <div className="relative h-full flex items-center justify-center">
                    <h3 className="text-white text-lg md:text-xl font-bold tracking-wide">
                      {cat.label}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
