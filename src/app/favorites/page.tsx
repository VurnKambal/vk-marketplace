'use client';

import { Header } from "@/components/Header";
import { ListingCard } from "@/components/ListingCard";
import { favoritesUtils } from "@/lib/utils";
import { Listing } from "@/lib/types";
import { useState, useEffect } from "react";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Listing[]>([]);

  useEffect(() => {
    setFavorites(favoritesUtils.getFavorites());

    // Listen for favorites changes
    const handleFavoritesChange = (event: any) => {
      setFavorites(event.detail.favorites);
    };

    window.addEventListener('favoritesChanged', handleFavoritesChange);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChange);
  }, []);

  const handleClearAll = () => {
    if (confirm('Are you sure you want to remove all saved items?')) {
      favoritesUtils.clearFavorites();
    }
  };

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
                  {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
            </div>
            
            {favorites.length > 0 && (
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

        {/* Content */}
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No saved items yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start browsing the marketplace and save items you're interested in. They'll appear here.
            </p>
            <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <a href="/">Browse Marketplace</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}