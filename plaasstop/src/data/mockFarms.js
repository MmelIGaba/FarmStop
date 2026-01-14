export const farmsData = [
    {
      id: 1,
      name: "Green Valley Organics",
      type: "vendor", // This is a registered user
      distance: "2.5 km",
      lat: -25.7479, // Example: Pretoria coordinates
      lng: 28.2293,
      products: ["Tomatoes", "Spinach", "Free-range Eggs"],
      image: "https://images.unsplash.com/photo-1595855709915-445676396832?auto=format&fit=crop&w=300&q=80",
      contact: { phone: "012-555-0101", email: "sales@greenvalley.co.za" }
    },
    {
      id: 2,
      name: "Hansen's Dairy Farm",
      type: "lead", // This is scraped public info
      distance: "5.1 km",
      lat: -25.7800,
      lng: 28.2500,
      products: ["Milk", "Cream", "Cheese"],
      image: null, // Scraped leads might not have images
      contact: { phone: "082-555-0199", address: "Plot 44, Old Farm Rd" }
    },
    {
      id: 3,
      name: "Tannie Maria's Jams",
      type: "vendor",
      distance: "8.3 km",
      lat: -25.7200,
      lng: 28.1900,
      products: ["Apricot Jam", "Peach Preserves", "Honey"],
      image: "https://images.unsplash.com/photo-1600423115367-87ea7094592e?auto=format&fit=crop&w=300&q=80",
      contact: { phone: "012-555-0122", email: "maria@jams.co.za" }
    },
    {
      id: 4,
      name: "Pretoria East Wholesale",
      type: "lead",
      distance: "12.0 km",
      lat: -25.8000,
      lng: 28.3000,
      products: ["Potatoes", "Onions"],
      image: null,
      contact: { phone: "012-555-9999", address: "Sector 5, Farm Block C" }
    }
  ];