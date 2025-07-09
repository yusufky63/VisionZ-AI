'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Create context
const WatchlistContext = createContext();

// Watchlist types
const WATCHLIST_TYPES = {
  COIN: 'coin',
  PROFILE: 'profile'
};

// Watchlist provider component
export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const loadWatchlist = () => {
      if (typeof window === 'undefined') return;
      
      try {
        const savedWatchlist = localStorage.getItem('zora-watchlist');
        if (savedWatchlist) {
          setWatchlist(JSON.parse(savedWatchlist));
        }
      } catch (error) {
        console.error('Failed to load watchlist:', error);
        // Reset if corrupted
        localStorage.removeItem('zora-watchlist');
      } finally {
        setIsInitialized(true);
      }
    };

    loadWatchlist();
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    localStorage.setItem('zora-watchlist', JSON.stringify(watchlist));
  }, [watchlist, isInitialized]);

  // Add item to watchlist
  const addToWatchlist = (item, type) => {
    if (!item || !item.address) return;
    
    setWatchlist(prevList => {
      // Check if already in watchlist
      const exists = prevList.some(
        listItem => listItem.address === item.address && listItem.type === type
      );
      
      if (exists) return prevList;
      
      // Add with timestamp for sorting
      return [...prevList, {
        ...item,
        type,
        dateAdded: new Date().toISOString()
      }];
    });
  };

  // Remove item from watchlist
  const removeFromWatchlist = (address, type) => {
    setWatchlist(prevList => 
      prevList.filter(item => !(item.address === address && item.type === type))
    );
  };

  // Check if item is in watchlist
  const isInWatchlist = (address, type) => {
    return watchlist.some(item => item.address === address && item.type === type);
  };

  // Get filtered watchlist (coins only, profiles only, or all)
  const getFilteredWatchlist = (type) => {
    if (!type) return watchlist;
    return watchlist.filter(item => item.type === type);
  };

  // Clear entire watchlist
  const clearWatchlist = () => {
    setWatchlist([]);
  };

  // Context value
  const value = {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    getFilteredWatchlist,
    clearWatchlist,
    types: WATCHLIST_TYPES
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

// Custom hook to use the watchlist context
export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
} 