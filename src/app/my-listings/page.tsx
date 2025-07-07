'use client';

import { Header } from "@/components/Header";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

// Mock data - in a real app, this would come from your backend
const mockUserListings = [
  {
    id: "1",
    title: "MacBook Pro 2021 - Excellent Condition",
    price: 1299,
    description: "Barely used MacBook Pro with M1 chip",
    location: "Campus Area",
    seller: { name: "You", email: "your.email@university.edu" },
    category: "electronics",
    images: [],
    createdAt: "2 days ago",
    status: "active"
  },
  {
    id: "2", 
    title: "Calculus Textbook - 8th Edition",
    price: 45,
    description: "Used textbook in good condition",
    location: "Campus Area",
    seller: { name: "You", email: "your.email@university.edu" },
    category: "textbooks",
    images: [],
    createdAt: "1 week ago",
    status: "sold"
  }
];

export default function MyListingsPage() {
  const activeListings = mockUserListings.filter(listing => listing.status === 'active');
  const soldListings = mockUserListings.filter(listing => listing.status === 'sold');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
                <p className="text-gray-600">
                  {activeListings.length} active • {soldListings.length} sold
                </p>
              </div>
            </div>
            
            <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Link href="/create" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create New Listing</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{activeListings.length}</div>
                  <div className="text-sm text-gray-500">Active Listings</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{soldListings.length}</div>
                  <div className="text-sm text-gray-500">Sold Items</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">247</div>
                  <div className="text-sm text-gray-500">Total Views</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">$1,344</div>
                  <div className="text-sm text-gray-500">Total Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Listings */}
        {activeListings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeListings.map((listing) => (
                <div key={listing.id} className="relative group">
                  <ListingCard listing={listing} />
                  
                  {/* Action overlay */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <div className="flex space-x-2">
                      <button className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sold Listings */}
        {soldListings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sold Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {soldListings.map((listing) => (
                <div key={listing.id} className="relative opacity-75">
                  <ListingCard listing={listing} />
                  <div className="mt-2">
                    <Badge className="bg-gray-100 text-gray-700">
                      Sold
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeListings.length === 0 && soldListings.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No listings yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start selling your items on the marketplace. Create your first listing to get started.
            </p>
            <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Link href="/create">Create First Listing</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}