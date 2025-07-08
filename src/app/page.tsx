'use client';

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ListingGrid } from "@/components/ListingGrid";
import { getListings } from "@/lib/api";
import { convertDatabaseListing, Listing } from "@/lib/types";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Separate component for search functionality
function SearchableHomePage() {
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

  // Fetch listings from Supabase - Use URL params directly for immediate effect
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get parameters directly from URL to avoid state timing issues
        const urlCategory = searchParams.get('category') || '';
        const urlSearch = searchParams.get('search') || '';
        
        console.log('Fetching with filters:', { category: urlCategory, search: urlSearch });
        
        const data = await getListings({
          category: urlCategory || undefined,
          search: urlSearch || undefined
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
  }, [searchParams]); // Depend directly on searchParams, not local state

  // Get category name for title - use URL params directly
  const urlCategory = searchParams.get('category') || '';
  const categoryName = urlCategory 
    ? urlCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
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

// Loading fallback component
function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-20 animate-pulse"></div>
      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-80 bg-white/50 h-screen animate-pulse"></div>
        <div className="flex-1 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/50 h-64 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <SearchableHomePage />
    </Suspense>
  );
}
