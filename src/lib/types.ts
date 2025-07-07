export interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  location: string;
  seller: {
    name: string;
    email: string;
  };
  category: string;
  images: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  count?: number;
}

export const CATEGORIES: Category[] = [
  { id: 'vehicles', name: 'Vehicles', count: 120 },
  { id: 'property-rentals', name: 'Property Rentals', count: 85 },
  { id: 'apparel', name: 'Apparel', count: 200 },
  { id: 'classifieds', name: 'Classifieds', count: 45 },
  { id: 'electronics', name: 'Electronics', count: 150 },
  { id: 'entertainment', name: 'Entertainment', count: 75 },
  { id: 'family', name: 'Family', count: 90 },
  { id: 'free-stuff', name: 'Free Stuff', count: 30 },
  { id: 'garden-outdoor', name: 'Garden & Outdoor', count: 65 },
  { id: 'hobbies', name: 'Hobbies', count: 40 },
  { id: 'home-goods', name: 'Home Goods', count: 180 },
  { id: 'home-improvement', name: 'Home Improvement', count: 95 },
  { id: 'home-sales', name: 'Home Sales', count: 25 },
  { id: 'musical-instruments', name: 'Musical Instruments', count: 35 },
  { id: 'office-supplies', name: 'Office Supplies', count: 50 },
  { id: 'pet-supplies', name: 'Pet Supplies', count: 70 },
  { id: 'sporting-goods', name: 'Sporting Goods', count: 85 },
  { id: 'toys-games', name: 'Toys & Games', count: 110 },
  { id: 'buy-sell-groups', name: 'Buy and sell groups', count: 15 }
];

export const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Bike 24 inch',
    price: 99,
    description: 'Great condition mountain bike, perfect for trails and city riding. Includes helmet and lock.',
    location: 'Palo Alto, CA',
    seller: {
      name: 'Wei Gu',
      email: 'wei.gu@example.com'
    },
    category: 'sporting-goods',
    images: ['/placeholder-bike.jpg'],
    createdAt: '1 hour ago'
  },
  {
    id: '2',
    title: 'iPhone 14 Pro Max',
    price: 2300,
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    location: 'Palo Alto, CA',
    seller: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    },
    category: 'electronics',
    images: ['/placeholder-phone.jpg'],
    createdAt: '2 hours ago'
  },
  {
    id: '3',
    title: 'Vintage Guitar',
    price: 850,
    description: 'Beautiful vintage acoustic guitar in excellent condition.',
    location: 'San Francisco, CA',
    seller: {
      name: 'Sarah Music',
      email: 'sarah@example.com'
    },
    category: 'musical-instruments',
    images: ['/placeholder-guitar.jpg'],
    createdAt: '3 hours ago'
  },
  {
    id: '4',
    title: 'Gaming Chair',
    price: 299,
    description: 'Comfortable ergonomic gaming chair with RGB lighting.',
    location: 'San Jose, CA',
    seller: {
      name: 'Mike Gamer',
      email: 'mike@example.com'
    },
    category: 'home-goods',
    images: ['/placeholder-chair.jpg'],
    createdAt: '4 hours ago'
  },
  {
    id: '5',
    title: 'Kitchen Appliance Set',
    price: 450,
    description: 'Complete kitchen appliance set including blender, toaster, and coffee maker.',
    location: 'Mountain View, CA',
    seller: {
      name: 'Lisa Cook',
      email: 'lisa@example.com'
    },
    category: 'home-goods',
    images: ['/placeholder-appliances.jpg'],
    createdAt: '5 hours ago'
  }
];

// Repeat the listings to fill the grid
export const EXTENDED_LISTINGS = Array(15).fill(null).flatMap((_, index) => 
  MOCK_LISTINGS.map(listing => ({
    ...listing,
    id: `${listing.id}-${index}`,
    title: `${listing.title} ${index > 0 ? `(${index + 1})` : ''}`.trim()
  }))
);

// Add database listing interface
export interface DatabaseListing {
  id: string
  title: string
  price: number
  description: string
  location: string
  seller_name: string
  seller_email: string
  category: string
  image_urls: string[]
  created_at: string
  updated_at: string
}

// Convert database listing to frontend listing format
export function convertDatabaseListing(dbListing: DatabaseListing): Listing {
  return {
    id: dbListing.id,
    title: dbListing.title,
    price: dbListing.price,
    description: dbListing.description,
    location: dbListing.location,
    seller: {
      name: dbListing.seller_name,
      email: dbListing.seller_email
    },
    category: dbListing.category,
    images: dbListing.image_urls,
    createdAt: formatTimeAgo(dbListing.created_at)
  }
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  
  // Convert to different time units
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)
  
  // Return appropriate format based on time difference
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
}