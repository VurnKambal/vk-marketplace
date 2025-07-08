'use client';

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ListingGrid } from "@/components/ListingGrid";
import { getListings } from "@/lib/api";
import { convertDatabaseListing, Listing } from "@/lib/types";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize state from URL parameters
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || '';
    
    setSearchQuery(urlSearch);
    setSelectedCategory(urlCategory);
  }, [searchParams]);

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
      <Header onSearch={setSearchQuery} currentCategory={selectedCategory} />
      <div className="flex flex-col lg:flex-row relative">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-16 h-16 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full animate-float"></div>
          <div className="absolute top-40 right-10 sm:right-20 w-12 h-12 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-400/10 to-yellow-400/10 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 sm:w-40 sm:h-40 bg-gradient-to-br from-green-400/10 to-teal-400/10 rounded-full animate-float-slow"></div>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row w-full">
          <Sidebar 
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
          
          {/* Loading state */}
          {loading ? (
            <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">Loading awesome deals...</p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
              <div className="flex items-center justify-center h-64">
                <div className="text-center px-4">
                  <div className="text-4xl sm:text-6xl mb-4">😔</div>
                  <p className="text-red-600 font-medium mb-4 text-sm sm:text-base">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm sm:text-base"
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
