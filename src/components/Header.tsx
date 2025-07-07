'use client';

import { Search, Bell, Heart, UserIcon, Menu, ShoppingBag, LogIn, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchUtils, favoritesUtils, searchCategories } from "@/lib/utils";
import { supabase, signInWithGoogle, signOut } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Update favorite count when user logs in
          updateFavoriteCount();
        } else {
          setFavoriteCount(0);
        }
      }
    );

    // Initialize data
    setRecentSearches(searchUtils.getRecentSearches());
    if (user) {
      updateFavoriteCount();
    }

    // Listen for favorites changes
    const handleFavoritesChange = () => {
      if (user) {
        updateFavoriteCount();
      }
    };

    window.addEventListener('favoritesChanged', handleFavoritesChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('favoritesChanged', handleFavoritesChange);
    };
  }, [user]);

  const updateFavoriteCount = async () => {
    try {
      const favorites = await favoritesUtils.getFavorites();
      setFavoriteCount(favorites.length);
    } catch (error) {
      console.error('Error updating favorite count:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      setShowUserMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      searchUtils.addRecentSearch(query.trim());
      setRecentSearches(searchUtils.getRecentSearches());
      setShowSearchSuggestions(false);
      onSearch?.(query.trim());
      router.push(`/?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleCategorySearch = (categoryId: string) => {
    setSearchQuery('');
    setShowSearchSuggestions(false);
    router.push(`/?category=${categoryId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
    setShowSearchSuggestions(value.length > 0);
  };

  const handleSearchFocus = () => {
    if (searchQuery.length > 0 || recentSearches.length > 0) {
      setShowSearchSuggestions(true);
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 border-b border-purple-200 px-4 py-4 shadow-lg backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-12 h-12 bg-gradient-to-br from-white to-blue-100 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-300 group-hover:rotate-3">
            <span className="text-blue-600 font-bold text-2xl">V</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              VK Marketplace
            </h1>
            <p className="text-blue-100 text-xs font-medium">
              Student Trading Hub
            </p>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-8 relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors duration-200 z-10" />
            <Input
              type="text"
              placeholder="Search for textbooks, furniture, electronics..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              className="pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border-white/20 rounded-2xl focus:bg-white focus:ring-2 focus:ring-white/50 focus:border-transparent placeholder:text-gray-500 text-gray-800 shadow-lg transition-all duration-300 hover:shadow-xl focus:scale-[1.02] w-full"
            />
          </form>

          {/* Enhanced Search Suggestions Dropdown */}
          {showSearchSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-20 max-h-80 overflow-y-auto">
              {searchQuery.length > 0 && (
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Search for "{searchQuery}"</span>
                  </div>
                </button>
              )}
              
              {searchQuery.length === 0 && recentSearches.length > 0 && (
                <>
                  <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-100">
                    Recent Searches
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(search);
                        handleSearch(search);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                    >
                      {search}
                    </button>
                  ))}
                </>
              )}

              {/* Enhanced Categories */}
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-100">
                Browse Categories
              </div>
              <div className="grid grid-cols-2 gap-1 p-2">
                {searchCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySearch(category.id)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <span className="text-lg">{category.emoji}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="default"
            asChild
            className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-blue-600 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Link href="/create" className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Sell Something</span>
            </Link>
          </Button>

          {user && (
            <>
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
                >
                  <Bell className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    2
                  </span>
                </button>

                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">New message received</p>
                        <p className="text-xs text-gray-500">Someone is interested in your iPhone listing</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">Price drop alert</p>
                        <p className="text-xs text-gray-500">MacBook Pro price dropped by $50</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Favorites */}
              <Link
                href="/favorites"
                className="relative w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
              >
                <Heart className="w-5 h-5 text-white" />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {favoriteCount > 9 ? '9+' : favoriteCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* User Menu / Sign In */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
              >
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-white" />
                )}
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-20">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  
                  <Link
                    href="/profile"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/my-listings"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    My Listings
                  </Link>
                  <Link
                    href="/favorites"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Saved Items
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <Link
                    href="/settings"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Settings
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    disabled={loading}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {loading ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={handleSignIn}
              disabled={loading}
              className="bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-blue-600 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}