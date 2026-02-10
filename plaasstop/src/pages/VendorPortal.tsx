import React, { useState } from "react";

interface VendorPortalProps {
  dbUser?: { role: string };
}

const VendorPortal: React.FC<VendorPortalProps> = ({ dbUser }) => {
  const [activeTab, setActiveTab] = useState("products");

  const tabs = [
    { id: "products", label: "Products" },
    { id: "orders", label: "Orders" },
    { id: "analytics", label: "Analytics" },
    { id: "profile", label: "Farm Profile" },
  ];
  if (dbUser) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-bold">For Farms</h2>
        <p className="text-gray-600 mt-4">
          Only registered vendors can access the dashboard. Interested in
          selling on Plaasstop? Apply to become a vendor today.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Vendor Dashboard
      </h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition ${
              activeTab === tab.id
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === "products" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Manage Products</h2>
            <p className="text-gray-600">
              Add, edit, or remove your farm products here.
            </p>
            {/* TODO: Product form + product list */}
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Orders</h2>
            <p className="text-gray-600">View and update customer orders.</p>
            {/* TODO: Orders table */}
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <p className="text-gray-600">Track your sales and performance.</p>
            {/* TODO: Charts/graphs */}
          </div>
        )}

        {activeTab === "profile" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Farm Profile</h2>
            <p className="text-gray-600">
              Update your farm details and branding.
            </p>
            {/* TODO: Profile form */}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorPortal;
