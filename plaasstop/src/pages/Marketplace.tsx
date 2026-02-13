import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  AlertTriangle,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  category: "Livestock" | "Produce";
  subcategory: "Cattle" | "Sheep" | "Vegetables" | "Fruit";
  price: number;
  unit: string;
  image: string;
  farmName: string;
  location: string;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Angus Bull (Breeding Stock)",
    category: "Livestock",
    subcategory: "Cattle",
    price: 25000,
    unit: "per head",
    image:
      "https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&q=80&w=600",
    farmName: "Highland Cattle Estate",
    location: "Mooi River, KZN",
  },
  {
    id: 2,
    name: "Merino Ewes",
    category: "Livestock",
    subcategory: "Sheep",
    price: 2500,
    unit: "per head",
    image:
      "https://images.unsplash.com/photo-1484557985045-6f550bb43282?auto=format&fit=crop&q=80&w=600",
    farmName: "Karoo Wool Farms",
    location: "Graaff-Reinet, EC",
  },
  {
    id: 3,
    name: "Organic Potatoes (Sifrafine)",
    category: "Produce",
    subcategory: "Vegetables",
    price: 45,
    unit: "per 10kg bag",
    image:
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600",
    farmName: "Green Valley Veg",
    location: "Brits, NW",
  },
  {
    id: 4,
    name: "Dormer Ram",
    category: "Livestock",
    subcategory: "Sheep",
    price: 8500,
    unit: "per head",
    image:
      "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=600",
    farmName: "Elite Genetics",
    location: "Bloemfontein, FS",
  },
  {
    id: 5,
    name: "Fresh Tomatoes (Jam)",
    category: "Produce",
    subcategory: "Vegetables",
    price: 120,
    unit: "per 5kg box",
    image:
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600",
    farmName: "Red Earth Farms",
    location: "Tzaneen, LP",
  },
  {
    id: 6,
    name: "Bonsmara Heifers",
    category: "Livestock",
    subcategory: "Cattle",
    price: 18000,
    unit: "per head",
    image:
      "https://images.unsplash.com/photo-1596733430204-070a92b92539?auto=format&fit=crop&q=80&w=600",
    farmName: "Bushveld Beef",
    location: "Thabazimbi, LP",
  },
];

const Marketplace: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchParams] = useSearchParams();
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const categoryFromURL = searchParams.get("category");
  const subcategoryFromURL = searchParams.get("subcategory");

  useEffect(() => {
    if (categoryFromURL) {
      setSelectedCategory(categoryFromURL);
    }

    if (subcategoryFromURL) {
      setSelectedSubcategory(subcategoryFromURL);
    }
  }, [categoryFromURL, subcategoryFromURL]);

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.farmName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;

    const matchesSubcategory =
      selectedSubcategory === "All" ||
      product.subcategory === selectedSubcategory;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1. Header & Disclaimer */}
      <div className="bg-white border-b border-gray-200">
        <div className="bg-yellow-50 border-b border-yellow-100 p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-yellow-800 font-medium">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Beta Mode: These listings are currently for demonstration purposes
              only. Transactions are disabled.
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <p className="mt-2 text-gray-500">
            Find direct-from-farm livestock and fresh produce.
          </p>

          {/* Search & Filter Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Search products, livestock, or farms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-lg"
              >
                <option value="All">All Categories</option>
                <option value="Livestock">Livestock</option>
                <option value="Produce">Fresh Produce</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-lg"
              >
                <option value="All">All Types</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruit">Fruit</option>
                <option value="Cattle">Cattle</option>
                <option value="Sheep">Sheep</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-gray-900">
              No products found
            </h3>
            <p className="mt-1 text-gray-500">
              Try adjusting your search or filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 group"
              >
                {/* Image Area */}
                <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                      ${product.category === "Livestock" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}
                    `}
                    >
                      {product.subcategory}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                        {product.name}
                      </h3>
                      <Link
                        to="#"
                        className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline"
                      >
                        @{product.farmName}
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    {product.location}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        R {product.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        / {product.unit}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        alert(
                          "This is a demo listing. Transactions are currently disabled.",
                        )
                      }
                      className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                      title="View Details"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
