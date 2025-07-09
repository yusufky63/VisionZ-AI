'use client';

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyAddressType } from "../../services/sdk/getProfiles";
import Image from "next/image";
interface SearchProps {
  className?: string;
  theme: string;
}

interface SearchResult {
  id: string;
  name: string;
  symbol?: string;
  handle?: string;
  avatar?: string;
  type: 'token' | 'profile';
}

const Search = ({ className = "", theme }: SearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // Handle search
  const performSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(query);
      const isHandle = !isEthereumAddress;

      if (isEthereumAddress || isHandle) {
        const result = await verifyAddressType(query);
        
        if (result && typeof result === 'object') {
          if ('isToken' in result && result.isToken && 'data' in result && result.data) {
            // Token result found
            const tokenData = result.data as { name?: string; symbol?: string };
            setSearchResults([{
              id: query,
              name: tokenData.name || 'Unknown Token',
              symbol: tokenData.symbol || '???',
              type: 'token'
            }]);
          } else if ('isProfile' in result && result.isProfile && 'data' in result && result.data) {
            // Profile result found
            const profileData = result.data as { 
              address?: string; 
              walletAddress?: string; 
              handle?: string;
              displayName?: string;
              avatar?: { small?: string }
            };
            
            setSearchResults([{
              id: profileData.address || profileData.walletAddress || profileData.handle || query,
              name: profileData.displayName || profileData.handle || 'Unknown Profile',
              handle: profileData.handle || '',
              avatar: profileData.avatar?.small || '',
              type: 'profile'
            }]);
          } else {
            // No match found
            setSearchResults([]);
          }
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (searchResults.length > 0) {
      const result = searchResults[0];
      if (result.type === 'token') {
        router.push(`/coin/${result.id}`);
      } else {
        router.push(`/profile/${result.id}`);
      }
    } else {
      // Try direct navigation if Ethereum address
      const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(query);
      router.push(isEthereumAddress ? `/profile/${query}` : `/profile/${query}`);
    }
    
    // Clear search and results after navigation
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`${className}`}>
      <form onSubmit={handleSearch} className="relative" ref={searchRef}>
        <input
          type="text"
          placeholder="Search address or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full px-4 py-2 rounded-xl border-0 focus:outline-none focus:ring-2 ${
            theme === "light"
              ? "bg-gray-50/50 placeholder-gray-400 focus:ring-indigo-200 shadow-sm"
              : "bg-gray-800/50 placeholder-gray-500 focus:ring-indigo-500/30 shadow-inner shadow-black/10"
          }`}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className={`absolute top-full mt-1 w-full rounded-lg shadow-xl border-2 overflow-hidden z-[9999] ${
            theme === "light" 
              ? "bg-white border-indigo-100" 
              : "bg-gray-900 border-indigo-900"
          }`}>
            <div className={`px-4 py-2 ${
              theme === "light" 
                ? "bg-indigo-50 text-indigo-900 border-b border-indigo-100" 
                : "bg-indigo-900/30 text-indigo-100 border-b border-indigo-800"
            }`}>
              <div className="text-xs font-medium">Search Results</div>
            </div>
            
            <div>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => {
                    if (result.type === 'token') {
                      router.push(`/coin/${result.id}`);
                    } else {
                      router.push(`/profile/${result.id}`);
                    }
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className={`px-4 py-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 block ${
                    theme === "light" ? "border-gray-100 hover:text-indigo-600" : "border-gray-800 hover:text-indigo-400"
                  }`}
                >
                  <div className="flex items-center">
                    {result.type === 'token' ? (
                      <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full mr-3">
                        <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    ) : (
                      result.avatar ? (
                        <Image 
                          src={result.avatar} 
                          alt={result.name} 
                          className="w-8 h-8 rounded-full mr-3 border border-gray-200 dark:border-gray-700"
                          loading="lazy"
                          width={32}
                          height={32}
                          priority={false}
                         
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full mr-3 bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        </div>
                      )
                    )}
                    <div>
                      <div className="font-medium">{result.name}</div>
                      {result.type === 'token' && result.symbol && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ${result.symbol}
                        </div>
                      )}
                      {result.type === 'profile' && result.handle && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          @{result.handle}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Search; 