import { Card, CardContent } from "@/components/ui/card";
import { Listing } from "@/lib/types";
import Link from "next/link";
import { Heart, Eye, Share2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { favoritesUtils } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 50) + 5);
  const [loading, setLoading] = useState(false);

  const hasImages = listing.images && listing.images.length > 0;
  const imageUrl = hasImages ? listing.images[0] : null;

  // Check if listing is favorited on component mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const isFav = await favoritesUtils.isFavorite(listing.id);
        setIsFavorited(isFav);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [listing.id]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    try {
      setLoading(true);
      
      if (isFavorited) {
        await favoritesUtils.removeFavorite(listing.id);
        setIsFavorited(false);
      } else {
        await favoritesUtils.addFavorite(listing);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Show user-friendly error message
      alert('Please sign in to save items to your favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewCount(prev => prev + 1);
    // Navigate to the listing page
    window.location.href = `/item/${listing.id}`;
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Always copy to clipboard instead of using native share API
    navigator.clipboard.writeText(`${window.location.origin}/item/${listing.id}`);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="group block relative">
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-white rounded-2xl sm:rounded-3xl transform hover:scale-[1.03] hover:-translate-y-2 relative">
        {/* Image section with enhanced gradient and pattern */}
        <Link href={`/item/${listing.id}`} className="block">
          <div className="aspect-square relative overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={listing.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 relative group-hover:scale-110 transition-transform duration-700">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
                  <svg width="100%" height="100%" className="text-indigo-400">
                    <defs>
                      <pattern id={`pattern-${listing.id}`} patternUnits="userSpaceOnUse" width="20" height="20">
                        <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.5"/>
                        <path d="M0,20 L20,0" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#pattern-${listing.id})`} />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Action buttons overlay */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-200">
              <div className="flex space-x-1 sm:space-x-2">
                <button
                  onClick={handleFavoriteClick}
                  disabled={loading}
                  className={`w-6 h-6 sm:w-8 sm:h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-125 active:scale-110 disabled:opacity-50 shadow-lg border border-white/20 btn-ripple ${
                    isFavorited 
                      ? 'bg-red-500/90 text-white shadow-red-500/50 animate-pulse' 
                      : 'bg-black/60 text-white hover:bg-black/70 shadow-black/50'
                  }`}
                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isFavorited ? 'fill-current' : ''} drop-shadow-lg transition-transform duration-200 ${isFavorited ? 'animate-pulse' : ''}`} />
                </button>
                <button
                  onClick={handleViewClick}
                  className="w-6 h-6 sm:w-8 sm:h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all duration-200 hover:scale-125 active:scale-110 shadow-lg shadow-black/50 border border-white/20 btn-ripple"
                  title="Quick preview"
                  aria-label="Quick preview"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-white drop-shadow-lg" />
                </button>
                <button
                  onClick={handleShareClick}
                  className="w-6 h-6 sm:w-8 sm:h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all duration-200 hover:scale-125 active:scale-110 shadow-lg shadow-black/50 border border-white/20 btn-ripple"
                  title="Share this listing"
                  aria-label="Share this listing"
                >
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4 text-white drop-shadow-lg" />
                </button>
              </div>
            </div>

            {/* Price badge overlay */}
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-green-500/30 border border-white/20 transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                ${listing.price.toLocaleString()}
              </div>
            </div>

            {/* View count badge */}
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 shadow-lg shadow-black/50 border border-white/20">
                <Eye className="w-3 h-3 drop-shadow-lg" />
                <span className="drop-shadow-lg">{viewCount}</span>
              </div>
            </div>
          </div>
        </Link>

        <Link href={`/item/${listing.id}`} className="block">
          <CardContent className="p-3 sm:p-5 bg-gradient-to-b from-white to-gray-50">
            <div className="space-y-2 sm:space-y-3">
              {/* Title with enhanced typography */}
              <h3 className="font-bold text-sm sm:text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                {listing.title}
              </h3>
              
              {/* Location with icon effect */}
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                  {listing.location}
                </p>
              </div>

              {/* Time and status */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                  {listing.createdAt}
                </span>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full animate-ping"></div>
                    <span className="text-xs text-green-600 font-semibold">Available</span>
                  </div>
                  {isFavorited && (
                    <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-current" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Link>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      </Card>
    </div>
  );
}