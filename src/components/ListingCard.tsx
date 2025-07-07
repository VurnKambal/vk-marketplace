import { Card, CardContent } from "@/components/ui/card";
import { Listing } from "@/lib/types";
import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import Image from "next/image";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const hasImages = listing.images && listing.images.length > 0;
  const imageUrl = hasImages ? listing.images[0] : null;

  return (
    <Link href={`/item/${listing.id}`} className="group block">
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-white rounded-3xl transform hover:scale-[1.03] hover:-translate-y-2 relative">
        {/* Image section with enhanced gradient and pattern */}
        <div className="aspect-square relative overflow-hidden rounded-t-3xl">
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
          
          {/* Floating elements for visual interest */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-200">
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Price badge overlay */}
          <div className="absolute top-4 left-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-2xl font-bold text-sm shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
              ${listing.price.toLocaleString()}
            </div>
          </div>
        </div>

        <CardContent className="p-5 bg-gradient-to-b from-white to-gray-50">
          <div className="space-y-3">
            {/* Title with enhanced typography */}
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
              {listing.title}
            </h3>
            
            {/* Location with icon effect */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-600 font-medium">
                {listing.location}
              </p>
            </div>

            {/* Time with playful styling */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                {listing.createdAt}
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                <span className="text-xs text-green-600 font-semibold">Available</span>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      </Card>
    </Link>
  );
}