import { Tractor, Users, Leaf, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative isolate overflow-hidden bg-green-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">We bridge the gap between Soil & Table.</h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Plaas-Stop was born from a simple idea: Local food tastes better, costs less, and supports the people who actually live near you.
            </p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h3>
                <p className="text-gray-600 mb-4">
                    Large retail chains have disconnected us from our food sources. We assume food comes from a factory, but it starts in the soil.
                </p>
                <p className="text-gray-600">
                    Plaasstop provides the digital infrastructure for smallholders, community gardens, and commercial farms to sell directly to their neighbors. No warehouses, no long-haul trucks, just fresh produce.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-6 rounded-2xl">
                    <Leaf className="h-8 w-8 text-green-600 mb-2"/>
                    <h4 className="font-bold">Freshness</h4>
                    <p className="text-sm text-gray-600">Harvested hours ago, not weeks ago.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl">
                    <Users className="h-8 w-8 text-blue-600 mb-2"/>
                    <h4 className="font-bold">Community</h4>
                    <p className="text-sm text-gray-600">Know the face behind your food.</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-2xl">
                    <Tractor className="h-8 w-8 text-orange-600 mb-2"/>
                    <h4 className="font-bold">Support Local</h4>
                    <p className="text-sm text-gray-600">Keep money in your local economy.</p>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl">
                    <Heart className="h-8 w-8 text-red-600 mb-2"/>
                    <h4 className="font-bold">Fair Prices</h4>
                    <p className="text-sm text-gray-600">Farmers set the price. No middlemen.</p>
                </div>
                  </div>
              </div>
            </div>
          </div>
        );
      }