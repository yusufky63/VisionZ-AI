"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { ConnectKitButton } from "connectkit";
import { useTheme } from "../../contexts/ThemeContext";
import { getProfileBalance } from "../../services/sdk/getProfiles";
import { getETHPrice } from "../../services/ethPrice";
import { getCoinDetails } from "../../services/sdk/getCoins";
import TokenSearch from "./TokenSearch";
import TokenList from "./TokenList";
import TradePanel from "./TradePanel";
import DexScreener from "../DexScreener";
import { toast } from "react-hot-toast";

function TradePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [ethPrice, setEthPrice] = useState(null);
  const [isTokenListCollapsed, setIsTokenListCollapsed] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  
  // Fetch ETH price using ethPrice service
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const price = await getETHPrice();
        setEthPrice(price);
      } catch (error) {
        console.error("Error fetching ETH price:", error);
      }
    };
    
    fetchEthPrice();
    
    // Refresh price every 30 seconds
    const interval = setInterval(fetchEthPrice, 30 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Load user's token balances
  useEffect(() => {
    if (!isConnected || !address) {
      setLoading(false);
      return;
    }
    
    const loadTokens = async () => {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);
      
      try {
        let allTokens = [];
        let hasNextPage = true;
        let cursor = null;
        let pageCount = 0;
        
        while (hasNextPage) {
          try {
            // Update loading status
            setLoadingProgress((prev) => Math.min(95, prev + 10));
            
            // Fetch profile balances
            const balancesData = await getProfileBalance(
              address,
              50, // Number of items per page
              cursor
            );
            
            if (balancesData?.data?.profile?.coinBalances?.edges) {
              const newEdges = balancesData.data.profile.coinBalances.edges;
              
              if (newEdges.length > 0) {
                // Add new tokens
                allTokens = [...allTokens, ...newEdges];
                pageCount++;
                
                // Get pagination info
                const pageInfo = balancesData.data.profile.coinBalances.pageInfo || {};
                hasNextPage = pageInfo.hasNextPage === true;
                cursor = pageInfo.endCursor || null;
                
                console.log(`Loaded page ${pageCount}, tokens: ${allTokens.length}`);
                
                // If cursor exists but hasNextPage is false, continue anyway
                if (!hasNextPage && cursor) {
                  console.log("Cursor exists, continuing pagination...");
                  hasNextPage = true;
                }
                
                // Update state with current tokens
                setTokens(allTokens);
                
                // Progress tracking
                setLoadingProgress((prev) => Math.min(95, prev + 5));
              } else {
                // Empty page received, end pagination
                hasNextPage = false;
              }
            } else {
              // No coinBalances in response
              hasNextPage = false;
            }
            
            // Rate limit prevention - small delay between requests
            if (hasNextPage) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          } catch (err) {
            // Handle API errors
            console.error("Error loading token page:", err);
            
            // If it's a rate limit error, wait longer
            if (err.message?.toLowerCase().includes("rate limit") || err.status === 429) {
              console.log("Rate limit hit, waiting before retry...");
              await new Promise((resolve) => setTimeout(resolve, 5000));
              continue;
            }
            
            // For server errors, wait and retry
            if (err.status === 500 || err.message?.includes("500")) {
              console.log("Server error, waiting before retry...");
              await new Promise((resolve) => setTimeout(resolve, 3000));
              continue;
            }
            
            // For other errors, stop pagination but show what we have
            hasNextPage = false;
            if (allTokens.length === 0) {
              throw err; // Re-throw if we have no tokens yet
            }
          }
        }
        
        // Sort tokens by value (marketCap * balance ratio)
        const sortedTokens = allTokens.sort((a, b) => {
          const aMarketCap = parseFloat(a.node?.coin?.marketCap || 0);
          const aSupply = parseFloat(a.node?.coin?.totalSupply || 1);
          const aBalance = parseFloat(a.node?.balance || 0);
          const aValue = (aMarketCap / aSupply) * aBalance;
          
          const bMarketCap = parseFloat(b.node?.coin?.marketCap || 0);
          const bSupply = parseFloat(b.node?.coin?.totalSupply || 1);
          const bBalance = parseFloat(b.node?.balance || 0);
          const bValue = (bMarketCap / bSupply) * bBalance;
          
          return bValue - aValue; // Descending order
        });
        
        setTokens(sortedTokens);
        
        // If there are tokens, select the first one by default
        if (sortedTokens.length > 0) {
          setSelectedToken(sortedTokens[0].node.coin);
        }
      } catch (err) {
        console.error("Failed to load tokens:", err);
        setError(`Error loading tokens: ${err.message}`);
      } finally {
        setLoading(false);
        setLoadingProgress(100);
      }
    };
    
    loadTokens();
  }, [address, isConnected]);
  
  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens;
    
    const query = searchQuery.toLowerCase().trim();
    return tokens.filter(token => 
      token.node?.coin?.name?.toLowerCase().includes(query) || 
      token.node?.coin?.symbol?.toLowerCase().includes(query) ||
      token.node?.coin?.address?.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);
  
  // Handle token selection
  const handleSelectToken = (token) => {
    setSelectedToken(token);
  };
  
  // Function to refresh token data
  const refreshTokenData = async () => {
    try {
      setIsRefreshing(true);
      
      // Refresh ETH price
      const newEthPrice = await getETHPrice();
      setEthPrice(newEthPrice);

      // Refresh selected token data if exists
      if (selectedToken) {
        try {
          const updatedTokenData = await getCoinDetails(selectedToken.address);
          if (updatedTokenData) {
            setSelectedToken(prevSelected => ({
              ...prevSelected,
              ...updatedTokenData
            }));
          }
        } catch (err) {
          console.error("Error refreshing selected token:", err);
        }
      }

      // Refresh token list
      if (isConnected && address) {
        try {
          const balancesData = await getProfileBalance(address, 50);
          if (balancesData?.data?.profile?.coinBalances?.edges) {
            const newEdges = balancesData.data.profile.coinBalances.edges;
            if (newEdges.length > 0) {
              setTokens(newEdges);
            }
          }
        } catch (err) {
          console.error("Error refreshing token list:", err);
        }
      }

      setLastRefreshTime(new Date());
      
      // Show success toast
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshTokenData, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, [selectedToken]);

  // Format time since last refresh
  const getTimeSinceLastRefresh = () => {
    const now = new Date();
    const diff = now - lastRefreshTime;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    }
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
  };
  
  // Not connected state
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className={`relative overflow-hidden rounded-2xl shadow-xl border p-8 mx-auto max-w-2xl text-center ${
          theme === "light" 
            ? "bg-white/30 border-gray-200/20 text-gray-800" 
            : "bg-gray-900/40 border-gray-700/20 text-white"
        }`}>
          <div className="relative z-10 max-w-lg mx-auto">
            <h3 className="text-2xl font-bold mb-3">
              Connect Wallet to Trade
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Connect your wallet to view your token balances and start trading on Zora.
            </p>
            
            <div className="mb-6 mx-auto transition-transform hover:scale-[1.02] active:scale-[0.98] duration-200 flex justify-center">
              <ConnectKitButton 
                theme="rounded"
                mode={theme === "dark" ? "dark" : "light"}
                customTheme={{
                  "--ck-connectbutton-background": theme === "dark" ? "rgba(99, 102, 241, 0.9)" : "rgba(99, 102, 241, 0.9)",
                  "--ck-connectbutton-hover-background": theme === "dark" ? "rgba(79, 70, 229, 0.9)" : "rgba(79, 70, 229, 0.9)",
                  "--ck-connectbutton-active-background": theme === "dark" ? "rgba(67, 56, 202, 0.95)" : "rgba(67, 56, 202, 0.95)",
                  "--ck-connectbutton-color": "white",
                  "--ck-connectbutton-border-radius": "1rem",
                  "--ck-connectbutton-font-size": "1.25rem",
                  "--ck-connectbutton-font-weight": "600",
                  "--ck-connectbutton-box-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Token List Section */}
        <div className={`rounded-2xl overflow-hidden border shadow-sm ${
          theme === "light"
            ? "bg-white/80 border-gray-200/50"
            : "bg-gray-900/40 border-gray-700/30 backdrop-blur-md"
        }`}>
          {/* Token List Header */}
          <div 
            className="cursor-pointer"
            onClick={() => setIsTokenListCollapsed(!isTokenListCollapsed)}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <h3 className={`text-lg font-medium ${theme === "light" ? "text-gray-800" : "text-gray-100"}`}>
                  Your Tokens
                </h3>
                {tokens.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                    {tokens.length}
                  </span>
                )}
                <div className="flex items-center gap-2 ml-2">
                  {isRefreshing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshTokenData();
                      }}
                      className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1.5 rounded-full"
                      title="Refresh token data"
                      aria-label="Refresh token data"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getTimeSinceLastRefresh()}
                  </span>
                </div>
              </div>
              <button 
                className={`p-1.5 rounded-full transition-colors ${
                  theme === "light" 
                    ? "hover:bg-gray-100 text-gray-700" 
                    : "hover:bg-gray-800 text-gray-300"
                }`}
                aria-expanded={!isTokenListCollapsed}
                aria-label={isTokenListCollapsed ? "Expand token list" : "Collapse token list"}
              >
                <svg
                  className={`w-5 h-5 transform transition-transform ${isTokenListCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
            
            {/* Selected Token Preview (visible when list is collapsed) */}
            {isTokenListCollapsed && selectedToken && (
              <div className={`p-3 border-t ${
                theme === "light" ? "border-gray-100" : "border-gray-700/30"
              }`}>
                <div className="flex items-center space-x-3">
                  {/* Token Icon */}
                  <div className="flex-shrink-0">
                    {selectedToken?.mediaContent?.previewImage?.small ? (
                      <img
                        src={selectedToken.mediaContent.previewImage.small}
                        alt={selectedToken.name || "Token"}
                        className="w-10 h-10 rounded-full object-cover shadow-sm"
                      
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                        theme === "light" ? "bg-indigo-100 text-indigo-700" : "bg-indigo-900/30 text-indigo-400"
                      }`}>
                        <span className="text-lg font-bold">
                          {selectedToken?.symbol?.slice(0, 1) || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Token Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className={`text-sm font-medium truncate ${
                        theme === "light" ? "text-gray-900" : "text-white"
                      }`}>
                        {selectedToken.name || "Unknown Token"}
                      </p>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {selectedToken.symbol || "---"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400">
                        Selected
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Click to change
                      </span>
                    </div>
                  </div>
                  
                
                </div>
              </div>
            )}
          </div>
          
          {/* Collapsible Content */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isTokenListCollapsed ? 'max-h-0' : 'max-h-[500px]'
          }`}>
            <div className={`p-4 border-t border-gray-200/50 dark:border-gray-700/30 ${
              isTokenListCollapsed ? 'hidden' : 'block'
            }`}>
              <TokenSearch 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery}
                onSelectToken={handleSelectToken}
                setIsTokenListCollapsed={setIsTokenListCollapsed}
              />
            </div>
            
            <div className={isTokenListCollapsed ? 'hidden' : 'block'}>
              <TokenList 
                tokens={filteredTokens}
                loading={loading}
                error={error}
                selectedToken={selectedToken}
                onSelectToken={handleSelectToken}
                ethPrice={ethPrice}
                setIsTokenListCollapsed={setIsTokenListCollapsed}
              />
            </div>
          </div>
        </div>

        {/* DexScreener and Trade Panel Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {/* Left Column: DexScreener - Takes 4 columns */}
          <div className={`lg:col-span-4 rounded-2xl overflow-hidden border shadow-sm ${
            theme === "light"
              ? "bg-white/80 border-gray-200/50"
              : "bg-gray-900/40 border-gray-700/30 backdrop-blur-md"
          }`}>
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/30">
              <h3 className={`text-lg font-medium ${theme === "light" ? "text-gray-800" : "text-gray-100"}`}>
                {selectedToken?.name ? `${selectedToken.name} Chart` : 'Token Chart'}
              </h3>
            </div>
            <DexScreener 
              tokenAddress={selectedToken?.address}
              aspectRatio="full"
              containerClassName="border-0 rounded-none"
            />
          </div>
          
          {/* Right Column: Trading Panel - Takes 2 columns */}
          <div className="lg:col-span-2">
            {selectedToken ? (
              <TradePanel 
                coin={selectedToken}
                ethPrice={ethPrice}
              />
            ) : (
              <div className={`rounded-2xl border p-6 text-center h-full flex flex-col items-center justify-center ${
                theme === "light"
                  ? "bg-white/80 border-gray-200/50 shadow-sm"
                  : "bg-gray-900/40 border-gray-700/30 backdrop-blur-md"
              }`}>
                <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-3 mb-4">
                  <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className={`text-lg font-medium mb-2 ${theme === "light" ? "text-gray-800" : "text-gray-100"}`}>
                  Ready to Trade
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {loading ? "Loading your tokens..." : "Select a token from your list to start trading"}
                </p>
                {!isTokenListCollapsed && filteredTokens.length === 0 && !loading && (
                  <button
                    onClick={() => setIsTokenListCollapsed(false)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      theme === "light"
                        ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                        : "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-800/40"
                    }`}
                  >
                    Browse Your Tokens
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradePage; 