'use client';

import { ListingCard } from "./ListingCard";
import { Listing } from "@/lib/types";

interface ListingGridProps {
  listings: Listing[];
  title?: string;
}

export function ListingGrid({ listings, title = "Today's picks" }: ListingGridProps) {
  return (
    <div className="flex-1 p-8 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      {/* Enhanced header section */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-2">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{title}</h2>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
        <p className="text-gray-600 font-medium">
          {listings.length} items available • Updated just now
        </p>
      </div>

      {/* Grid with staggered animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {listings.map((listing, index) => (
          <div
            key={listing.id}
            className="animate-fade-in-up"
            style={{ 
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'both'
            }}
          >
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>

      {/* Empty state with fun illustration */}
      {listings.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
          <p className="text-gray-500 mb-6">Try browsing a different category or check back later!</p>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}