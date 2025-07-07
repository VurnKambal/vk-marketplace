'use client';

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ListingGrid } from "@/components/ListingGrid";
import { getListings } from "@/lib/api";
import { convertDatabaseListing, Listing } from "@/lib/types";
import { useState, useEffect } from "react";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch listings from Supabase
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getListings({
          category: selectedCategory || undefined,
          search: searchQuery || undefined
        });
        const convertedListings = data.map(convertDatabaseListing);
        setListings(convertedListings);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [selectedCategory, searchQuery]);

  // Get category name for title
  const categoryName = selectedCategory 
    ? selectedCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    : "Today's picks";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header onSearch={setSearchQuery} />
      <div className="flex relative">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-pink-400/10 to-yellow-400/10 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-green-400/10 to-teal-400/10 rounded-full animate-float-slow"></div>
        </div>
        
        <div className="relative z-10 flex w-full">
          <Sidebar 
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
          
          {/* Loading state */}
          {loading ? (
            <div className="flex-1 p-8 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading awesome deals...</p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 p-8 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-6xl mb-4">😔</div>
                  <p className="text-red-600 font-medium mb-4">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ListingGrid 
              listings={listings}
              title={categoryName}
            />
          )}
        </div>
      </div>
    </div>
  );
}
