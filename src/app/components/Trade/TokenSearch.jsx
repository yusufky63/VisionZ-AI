import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { searchTokenByAddress } from '../../services/sdk/getCoins';

function TokenSearch({ searchQuery, setSearchQuery, onSelectToken, setIsTokenListCollapsed }) {
  const { theme } = useTheme();
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Debounced search function
  const performSearch = async (query) => {
    if (!query) return;
    
    // Check if input looks like an address
    if (query.startsWith('0x') && query.length === 42) {
      setIsSearching(true);
      setSearchError(null);

      try {
        const result = await searchTokenByAddress(query);
        
        if (result.success && result.data) {
          // Add token to list and select it
          onSelectToken(result.data);
          setSearchQuery(''); // Clear search after success
          setIsTokenListCollapsed(true); // Close token list
        } else {
          setSearchError(result.error || 'Token not found');
        }
      } catch (error) {
        setSearchError(error.message || 'Failed to search token');
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Handle search input changes with debounce
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const newTimeout = setTimeout(() => {
      const query = searchQuery.trim();
      if (query) {
        performSearch(query);
      } else {
        setSearchError(null);
      }
    }, 500); // 500ms delay

    setSearchTimeout(newTimeout);

    // Cleanup
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      await performSearch(query);
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchError(null);
            }}
            placeholder="Search tokens or paste address..."
            className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm ${
              theme === "light"
                ? "bg-white border-gray-200 placeholder-gray-500 text-gray-900 shadow-sm focus:border-indigo-300"
                : "bg-gray-800/70 border-gray-700 placeholder-gray-500 text-gray-100 focus:border-indigo-700"
            } focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200`}
          />
          
          {/* Action Buttons (Loading Spinner or Clear) */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isSearching ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                ETH/Zora
              </div>
            )}
          </div>
        </div>

        {/* Search Tips */}
        {!searchQuery && !searchError && (
          <div className="mt-2 px-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tip: Search by token name or paste a contract address
            </p>
          </div>
        )}

        {/* Error Message */}
        {searchError && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-500 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">
                {searchError}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default TokenSearch; 