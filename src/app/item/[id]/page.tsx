'use client';

import { Header } from "@/components/Header";
import { MessageSeller } from "@/components/MessageSeller";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getListing } from "@/lib/api";
import { convertDatabaseListing, Listing, CATEGORIES } from "@/lib/types";
import { favoritesUtils } from "@/lib/utils";
import { ArrowLeft, Share2, Heart, MapPin, Clock, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

interface ItemDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ItemDetailPage({ params }: ItemDetailPageProps) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Resolve async params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (!resolvedParams?.id) return;

    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getListing(resolvedParams.id);
        if (data) {
          const convertedListing = convertDatabaseListing(data);
          setListing(convertedListing);
          
          // Check if listing is favorited
          const isFav = await favoritesUtils.isFavorite(resolvedParams.id);
          setIsFavorited(isFav);
        } else {
          setError('Listing not found');
        }
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError('Failed to load listing. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [resolvedParams]);

  const handleFavoriteClick = async () => {
    if (!listing || favoriteLoading) return;
    
    try {
      setFavoriteLoading(true);
      
      if (isFavorited) {
        await favoritesUtils.removeFavorite(listing.id);
        setIsFavorited(false);
      } else {
        await favoritesUtils.addFavorite(listing);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Please sign in to save items to your favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShareClick = () => {
    if (listing) {
      // Always copy to clipboard instead of using native share API
      navigator.clipboard.writeText(window.location.href);
      alert('Listing URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading listing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const category = CATEGORIES.find(cat => cat.id === listing.category);
  const hasImages = listing.images && listing.images.length > 0;
  const currentImage = hasImages ? listing.images[selectedImageIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-8 relative">
        {/* Floating background elements */}
        <div className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full animate-float"></div>
        <div className="absolute bottom-32 left-10 w-32 h-32 bg-gradient-to-br from-green-400/20 to-teal-500/20 rounded-full animate-float-delayed"></div>

        {/* Back Button */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 group transition-all duration-300">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-semibold text-lg">Back to Marketplace</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-6">
            <div className="aspect-square rounded-3xl relative overflow-hidden shadow-2xl group">
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt={listing.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 relative">
                  {/* Enhanced pattern with animation */}
                  <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity duration-500">
                    <svg width="100%" height="100%" className="text-indigo-400">
                      <defs>
                        <pattern id="detail-pattern" patternUnits="userSpaceOnUse" width="24" height="24">
                          <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.4"/>
                          <path d="M0,24 L24,0" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
                          <path d="M6,24 L24,6" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#detail-pattern)" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Action buttons overlay */}
              <div className="absolute top-6 right-6 flex space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button 
                  onClick={handleFavoriteClick}
                  className={`w-12 h-12 backdrop-blur-sm rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                    isFavorited 
                      ? 'bg-red-500/90 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={handleShareClick}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/30 transition-colors duration-200 hover:scale-110 transform"
                  title="Share this listing"
                >
                  <Share2 className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Verified badge */}
              <div className="absolute top-6 left-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-2xl font-bold text-sm shadow-lg flex items-center space-x-2">
                  <Star className="w-4 h-4 fill-current" />
                  <span>Verified Seller</span>
                </div>
              </div>
            </div>

            {/* Thumbnail navigation */}
            {hasImages && listing.images.length > 1 && (
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {listing.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden transition-all duration-200 shadow-lg ${
                      selectedImageIndex === index 
                        ? 'ring-4 ring-blue-500 scale-105' 
                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${listing.title} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-8">
            {/* Title and Price */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-0">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {listing.title}
              </h1>
              <div className="flex items-baseline space-x-4 mb-6">
                <p className="text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  ${listing.price.toLocaleString()}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">{listing.location}</span>
                </div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">{listing.createdAt}</span>
                </div>
                {category && (
                  <>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1 rounded-xl font-semibold">
                      {category.name}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-0">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <span>📋</span>
                <span>Description</span>
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                {listing.description}
              </p>
              
              {/* Features list */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Student owned</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Quick delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Negotiable price</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Local pickup</span>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-0">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <span>👤</span>
                <span>Seller Information</span>
              </h3>
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">
                    {listing.seller.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xl text-gray-900">{listing.seller.name}</p>
                  <p className="text-gray-600 mb-2">{listing.seller.email}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-semibold">4.9</span>
                      <span className="text-gray-500">(New seller)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">Usually responds quickly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <MessageSeller listing={listing} />
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={handleFavoriteClick}
                  variant="outline" 
                  size="lg" 
                  className={`rounded-2xl font-semibold py-4 border-2 transition-all duration-300 hover:scale-105 ${
                    isFavorited 
                      ? 'bg-red-50 border-red-300 text-red-600' 
                      : 'hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Saved' : 'Save Item'}
                </Button>
                <Button 
                  onClick={handleShareClick}
                  variant="outline" 
                  size="lg" 
                  className="rounded-2xl font-semibold py-4 border-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-300 hover:scale-105"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}