import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Listing } from "./types"

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

// Favorites utilities
export const favoritesUtils = {
  getFavorites(): Listing[] {
    if (typeof window === 'undefined') return [];
    const favorites = localStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
  },

  addFavorite(listing: Listing): void {
    if (typeof window === 'undefined') return;
    const favorites = this.getFavorites();
    const isAlreadyFavorited = favorites.some(fav => fav.id === listing.id);
    
    if (!isAlreadyFavorited) {
      const updated = [listing, ...favorites];
      localStorage.setItem('favorites', JSON.stringify(updated));
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('favoritesChanged', {
        detail: { favorites: updated }
      }));
    }
  },

  removeFavorite(listingId: string): void {
    if (typeof window === 'undefined') return;
    const favorites = this.getFavorites();
    const updated = favorites.filter(fav => fav.id !== listingId);
    localStorage.setItem('favorites', JSON.stringify(updated));
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { favorites: updated }
    }));
  },

  isFavorite(listingId: string): boolean {
    if (typeof window === 'undefined') return false;
    const favorites = this.getFavorites();
    return favorites.some(fav => fav.id === listingId);
  },

  clearFavorites(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('favorites');
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { favorites: [] }
    }));
  }
};

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
