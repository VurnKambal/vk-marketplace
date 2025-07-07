import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Listing } from "./types"
import { addToFavorites, removeFromFavorites, getUserFavorites, isListingFavorited } from "./api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Search utilities
export const searchUtils = {
  getRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];
    const searches = localStorage.getItem('recentSearches');
    return searches ? JSON.parse(searches) : [];
  },

  addRecentSearch(query: string): void {
    if (typeof window === 'undefined') return;
    const searches = this.getRecentSearches();
    const filtered = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, 5); // Keep only 5 recent searches
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  },

  clearRecentSearches(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('recentSearches');
  }
};

// Enhanced favorites utilities with Supabase integration
export const favoritesUtils = {
  async getFavorites(): Promise<Listing[]> {
    try {
      const favorites = await getUserFavorites();
      return favorites.map(listing => ({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        description: listing.description,
        location: listing.location,
        images: listing.image_urls || [],
        category: listing.category,
        createdAt: new Date(listing.created_at).toLocaleDateString(),
        seller: {
          name: listing.seller_name,
          email: listing.seller_email
        }
      }));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  async addFavorite(listing: Listing): Promise<void> {
    try {
      await addToFavorites(listing.id);
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('favoritesChanged', {
        detail: { action: 'added', listingId: listing.id }
      }));
    } catch (error) {
      console.error('Error adding favorite:', error);
      // Only throw if it's an authentication error, otherwise handle gracefully
      if (error instanceof Error && error.message.includes('logged in')) {
        throw error;
      }
    }
  },

  async removeFavorite(listingId: string): Promise<void> {
    try {
      await removeFromFavorites(listingId);
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('favoritesChanged', {
        detail: { action: 'removed', listingId }
      }));
    } catch (error) {
      console.error('Error removing favorite:', error);
      // Only throw if it's an authentication error
      if (error instanceof Error && error.message.includes('logged in')) {
        throw error;
      }
    }
  },

  async isFavorite(listingId: string): Promise<boolean> {
    try {
      return await isListingFavorited(listingId);
    } catch (error) {
      console.error('Error checking if favorited:', error);
      // Return false instead of throwing to prevent app crashes
      return false;
    }
  },

  async clearFavorites(): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      for (const favorite of favorites) {
        await removeFromFavorites(favorite.id);
      }
      
      window.dispatchEvent(new CustomEvent('favoritesChanged', {
        detail: { action: 'cleared' }
      }));
    } catch (error) {
      console.error('Error clearing favorites:', error);
      throw error;
    }
  }
};

// Enhanced search categories
export const searchCategories = [
  { id: 'electronics', name: 'Electronics', emoji: '📱' },
  { id: 'textbooks', name: 'Textbooks', emoji: '📚' },
  { id: 'furniture', name: 'Furniture', emoji: '🪑' },
  { id: 'clothing', name: 'Clothing', emoji: '👕' },
  { id: 'sports-equipment', name: 'Sports Equipment', emoji: '⚽' },
  { id: 'home-garden', name: 'Home & Garden', emoji: '🏡' },
  { id: 'vehicles', name: 'Vehicles', emoji: '🚗' },
  { id: 'music-instruments', name: 'Music & Instruments', emoji: '🎸' },
  { id: 'art-collectibles', name: 'Art & Collectibles', emoji: '🎨' },
  { id: 'kitchen-appliances', name: 'Kitchen & Appliances', emoji: '🍳' }
];

// Notification utilities
export const notificationUtils = {
  getNotifications(): Array<{id: string, title: string, message: string, timestamp: Date, read: boolean}> {
    if (typeof window === 'undefined') return [];
    const notifications = localStorage.getItem('notifications');
    return notifications ? JSON.parse(notifications) : [];
  },

  addNotification(title: string, message: string): void {
    if (typeof window === 'undefined') return;
    const notifications = this.getNotifications();
    const newNotification = {
      id: Date.now().toString(),
      title,
      message,
      timestamp: new Date(),
      read: false
    };
    const updated = [newNotification, ...notifications].slice(0, 50); // Keep only 50 notifications
    localStorage.setItem('notifications', JSON.stringify(updated));
  },

  markAsRead(notificationId: string): void {
    if (typeof window === 'undefined') return;
    const notifications = this.getNotifications();
    const updated = notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    localStorage.setItem('notifications', JSON.stringify(updated));
  },

  getUnreadCount(): number {
    return this.getNotifications().filter(notif => !notif.read).length;
  }
};
