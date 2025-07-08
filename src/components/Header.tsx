'use client';

import { Search, Bell, Heart, UserIcon, Menu, ShoppingBag, LogIn, LogOut, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { searchUtils, favoritesUtils, searchCategories } from "@/lib/utils";
import { supabase, signInWithGoogle, signOut } from "@/lib/supabase";
import { getUnreadMessageCount, getUserMessages } from "@/lib/api";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  onSearch?: (query: string) => void;
  currentCategory?: string;
}

// Google Logo SVG Component following Google's brand guidelines
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" width="20" height="20">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Separate component for search functionality that uses searchParams
function HeaderWithSearchParams({ onSearch, currentCategory }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Check if we're on the main marketplace page
  const isMarketplacePage = pathname === '/';
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Add loading state for auth
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsAuthLoading(false); // Set loading to false after checking session
      }
    };
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsAuthLoading(false); // Also set loading to false on auth state change
        
        if (session?.user) {
          // Update favorite count and messages when user logs in
          updateFavoriteCount();
          updateUnreadCount();
          loadRecentMessages();
        } else {
          setFavoriteCount(0);
          setUnreadCount(0);
          setRecentMessages([]);
        }
      }
    );

    // Initialize data
    setRecentSearches(searchUtils.getRecentSearches());
    if (user) {
      updateFavoriteCount();
      updateUnreadCount();
      loadRecentMessages();
    }

    // Listen for favorites changes
    const handleFavoritesChange = () => {
      if (user) {
        updateFavoriteCount();
      }
    };

    // Listen for message changes
    const handleMessagesChange = () => {
      if (user) {
        updateUnreadCount();
        loadRecentMessages();
      }
    };

    window.addEventListener('favoritesChanged', handleFavoritesChange);
    window.addEventListener('messagesChanged', handleMessagesChange);

    // Set up real-time subscription for messages
    let messageSubscription: any = null;
    if (user) {
      messageSubscription = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `seller_email=eq.${user.email}`
        }, () => {
          updateUnreadCount();
          loadRecentMessages();
        })
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('favoritesChanged', handleFavoritesChange);
      window.removeEventListener('messagesChanged', handleMessagesChange);
      if (messageSubscription) {
        messageSubscription.unsubscribe();
      }
    };
  }, [user]);

  // Sync search input with URL parameters - only on marketplace page
  useEffect(() => {
    if (isMarketplacePage) {
      const urlSearch = searchParams?.get('search') || '';
      setSearchQuery(urlSearch);
    }
  }, [searchParams, isMarketplacePage]);

  // Get current category for placeholder text
  const currentCategoryFromUrl = searchParams?.get('category') || currentCategory;
  const selectedCategoryInfo = searchCategories.find(cat => cat.id === currentCategoryFromUrl);
  
  // Dynamic placeholder based on selected category
  const searchPlaceholder = selectedCategoryInfo 
    ? `Search in ${selectedCategoryInfo.name}...`
    : "Search for textbooks, furniture, electronics...";

  const updateFavoriteCount = async () => {
    try {
      const favorites = await favoritesUtils.getFavorites();
      setFavoriteCount(favorites.length);
    } catch (error) {
      console.error('Error updating favorite count:', error);
    }
  };

  const updateUnreadCount = async () => {
    try {
      const count = await getUnreadMessageCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  const loadRecentMessages = async () => {
    try {
      const messages = await getUserMessages();
      // Get the 3 most recent unread messages
      const unreadMessages = messages
        .filter(msg => !msg.read && msg.seller_email === user?.email)
        .slice(0, 3);
      setRecentMessages(unreadMessages);
    } catch (error) {
      console.error('Error loading recent messages:', error);
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
    // Always trigger search, even for empty queries to allow clearing
    const trimmedQuery = query.trim();
    
    if (trimmedQuery) {
      searchUtils.addRecentSearch(trimmedQuery);
      setRecentSearches(searchUtils.getRecentSearches());
    }
    
    setShowSearchSuggestions(false);
    onSearch?.(trimmedQuery);
    
    // Get current category from URL to preserve it
    const currentCategory = searchParams?.get('category');
    
    // Build URL with both search and category parameters
    const params = new URLSearchParams();
    if (trimmedQuery) {
      params.set('search', trimmedQuery);
    }
    if (currentCategory) {
      params.set('category', currentCategory);
    }
    
    // Navigate with preserved category and search parameters
    const queryString = params.toString();
    if (queryString) {
      router.push(`/?${queryString}`);
    } else {
      router.push('/'); // Clear all filters if no search or category
    }
  };

  const handleCategorySearch = (categoryId: string) => {
    // DON'T clear search query when changing categories
    setShowSearchSuggestions(false);
    
    // Get current search query to preserve it
    const currentSearch = searchParams?.get('search');
    
    // Build URL with both search and category parameters
    const params = new URLSearchParams();
    if (currentSearch) {
      params.set('search', currentSearch);
    }
    if (categoryId) {
      params.set('category', categoryId);
    }
    
    // Navigate with preserved search and new category
    const queryString = params.toString();
    if (queryString) {
      router.push(`/?${queryString}`);
    } else {
      router.push('/');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Remove immediate search on keystroke - only search on submit or suggestion click
    setShowSearchSuggestions(value.length > 0 || recentSearches.length > 0);
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
        <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-white to-blue-100 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-300 group-hover:rotate-3">
            <span className="text-blue-600 font-bold text-xl sm:text-2xl">V</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              VK Marketplace
            </h1>
            <p className="text-blue-100 text-xs font-medium">
              Student Trading Hub
            </p>
          </div>
        </Link>

        {/* Search Bar - Only show on marketplace page */}
        {isMarketplacePage && (
          <div className="hidden md:flex flex-1 max-w-lg mx-8 relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative group w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors duration-200 z-10" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
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
                      <span className="text-sm text-gray-700">Search for &quot;{searchQuery}&quot;</span>
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
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Search Button - Only show on marketplace page */}
          {isMarketplacePage && (
            <Button
              variant="outline"
              size="sm"
              className="md:hidden bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-blue-600 transition-all duration-300 rounded-xl"
              onClick={() => setShowSearchSuggestions(true)}
            >
              <Search className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden sm:inline-flex bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-blue-600 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Link href="/create" className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden lg:inline">Sell Something</span>
              <span className="lg:hidden">Sell</span>
            </Link>
          </Button>

          {/* Mobile Sell Button */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="sm:hidden bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-blue-600 transition-all duration-300 rounded-xl"
          >
            <Link href="/create">
              <ShoppingBag className="w-4 h-4" />
            </Link>
          </Button>

          {user && (
            <>
              {/* Messages Button */}
              <Link
                href="/messages"
                className="relative w-8 h-8 lg:w-10 lg:h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
              >
                <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Notifications - Hidden on small screens */}
              <div className="hidden sm:block relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative w-8 h-8 lg:w-10 lg:h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
                >
                  <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  {recentMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {recentMessages.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <Link 
                        href="/messages"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all
                      </Link>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {recentMessages.length > 0 ? (
                        recentMessages.map((message) => (
                          <Link
                            key={message.id}
                            href="/messages"
                            onClick={() => setShowNotifications(false)}
                            className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
                          >
                            <p className="text-sm font-medium text-gray-900">New message received</p>
                            <p className="text-xs text-gray-500 truncate">
                              {message.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(message.created_at).toLocaleDateString()}
                            </p>
                          </Link>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Favorites */}
              <Link
                href="/favorites"
                className="relative w-8 h-8 lg:w-10 lg:h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
              >
                <Heart className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {favoriteCount > 9 ? '9+' : favoriteCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* User Menu / Sign In - Only show if not loading */}
          {!isAuthLoading && (
            <>
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
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
                        href="/messages"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Messages
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
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
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg px-4 py-3 font-medium text-sm transition-all duration-200 hover:shadow-md shadow-sm flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed btn-ripple hover:scale-105"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      <span className="hidden sm:inline">Signing in...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon className="shrink-0" />
                      <span className="hidden sm:inline">Sign in with Google</span>
                      <span className="sm:hidden">Google</span>
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {/* Loading state for authentication */}
          {isAuthLoading && (
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar - Only show on marketplace page */}
      {isMarketplacePage && showSearchSuggestions && (
        <div className="md:hidden mt-4 px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border-white/20 rounded-2xl focus:bg-white focus:ring-2 focus:ring-white/50 focus:border-transparent placeholder:text-gray-500 text-gray-800 shadow-lg w-full"
            />
          </div>
        </div>
      )}
    </header>
  );
}

// Loading fallback component for header
function HeaderSkeleton() {
  return (
    <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 border-b border-purple-200 px-4 py-4 shadow-lg backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl animate-pulse"></div>
          <div className="hidden sm:block">
            <div className="h-6 w-32 bg-white/20 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-24 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="w-8 h-8 bg-white/20 rounded-xl animate-pulse"></div>
          <div className="w-20 h-8 bg-white/20 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </header>
  );
}

// Main Header component with Suspense wrapper
export function Header({ onSearch, currentCategory }: HeaderProps) {
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <HeaderWithSearchParams onSearch={onSearch} currentCategory={currentCategory} />
    </Suspense>
  );
}