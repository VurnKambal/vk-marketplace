'use client';

import { Header } from "@/components/Header";
import { ListingCard } from "@/components/ListingCard";
import { favoritesUtils } from "@/lib/utils";
import { Listing } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const userFavorites = await favoritesUtils.getFavorites();
      setFavorites(userFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle authentication check and initial load
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadFavorites();
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Remove user dependency to prevent infinite loop

  // Handle favorites changes event listener
  useEffect(() => {
    const handleFavoritesChange = () => {
      if (user) {
        loadFavorites();
      }
    };

    window.addEventListener('favoritesChanged', handleFavoritesChange);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChange);
  }, [user, loadFavorites]); // Keep user dependency here but separate from auth check

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to remove all saved items?')) {
      try {
        await favoritesUtils.clearFavorites();
        setFavorites([]);
      } catch (error) {
        console.error('Error clearing favorites:', error);
        alert('Failed to clear favorites. Please try again.');
      }
    }
  };

  // Show sign-in prompt if not authenticated
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-red-200 to-pink-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign in to view your favorites</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Save items you're interested in and access them from any device by signing in to your account.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Sign In with Google
              </Button>
              <div>
                <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                  ← Back to Marketplace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Saved Items</h1>
                <p className="text-gray-600">
                  {loading ? 'Loading...' : `${favorites.length} ${favorites.length === 1 ? 'item' : 'items'} saved`}
                </p>
              </div>
            </div>
            
            {favorites.length > 0 && !loading && (
              <Button
                onClick={handleClearAll}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your saved items...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          favorites.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No saved items yet</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start browsing the marketplace and save items you're interested in. They'll appear here.
              </p>
              <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Link href="/" className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Browse Marketplace</span>
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}