import React, { useState, useEffect } from "react";
import { formatEther } from "viem";
import { useTheme } from "../../contexts/ThemeContext";

function TokenList({ tokens, loading, error, selectedToken, onSelectToken, ethPrice, setIsTokenListCollapsed }) {
  const { theme } = useTheme();
  const [sortBy, setSortBy] = useState("value"); // Options: "value", "name", "balance"

  // Format balance with appropriate decimal places and handle large numbers
  const formatBalance = (balanceStr) => {
    if (!balanceStr) return "0";
    
    try {
      // First convert from string to number, handling scientific notation
      let balance;
      
      // Check if this is a very large string number (with many leading zeros)
      if (balanceStr.length > 30) {
        // Convert properly using formatEther for wei values
        try {
          balance = parseFloat(formatEther(balanceStr));
        } catch (err) {
          // Fall back to regular parsing if formatEther fails
          balance = parseFloat(balanceStr);
        }
      } else {
        balance = parseFloat(balanceStr);
      }
      
      if (isNaN(balance) || balance === 0) return "0";
      
      // Format with appropriate precision based on size
      if (balance < 0.0001) return balance.toExponential(4);
      if (balance < 1) return balance.toFixed(6);
      if (balance < 10) return balance.toFixed(4);
      if (balance < 1000) return balance.toFixed(2);
      if (balance < 1000000) return (balance / 1000).toFixed(2) + "K";
      if (balance < 1000000000) return (balance / 1000000).toFixed(2) + "M";
      return (balance / 1000000000).toFixed(2) + "B";
    } catch (e) {
      console.error("Error formatting balance:", e);
      return "0";
    }
  };
  
  // Calculate token value based on market cap and supply with better formatting
  const calculateValue = (marketCap, totalSupply, balance, volume) => {
    if (!marketCap || !totalSupply || !balance) return "$0.00";
    
    try {
      // Check if volume is 0 - if it is, token hasn't been traded yet
      if (!volume || parseFloat(volume) === 0) {
        return "$0.00";
      }
      
      // Handle string inputs
      const mcap = parseFloat(marketCap);
      const supply = parseFloat(totalSupply);
      
      // Handle potentially large balance strings
      let balanceValue;
      if (balance.length > 30) {
        try {
          balanceValue = parseFloat(formatEther(balance));
        } catch (err) {
          balanceValue = parseFloat(balance);
        }
      } else {
        balanceValue = parseFloat(balance);
      }
      
      if (mcap <= 0 || supply <= 0 || balanceValue <= 0) return "$0.00";
      
      // Calculate value
      const value = (mcap / supply) * balanceValue;
      
      // Format with appropriate suffixes
      if (value < 0.01) return "<$0.01";
      if (value < 1000) return "$" + value.toFixed(2);
      if (value < 1000000) return "$" + (value / 1000).toFixed(2) + "K";
      if (value < 1000000000) return "$" + (value / 1000000).toFixed(2) + "M";
      return "$" + (value / 1000000000).toFixed(2) + "B";
    } catch (e) {
      console.error("Error calculating value:", e);
      return "$0.00";
    }
  };
  
  // Truncate text if too long
  const truncateText = (text, maxLength = 16) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  // Format symbol to ensure it's not too long
  const formatSymbol = (symbol) => {
    if (!symbol) return "---";
    
    if (symbol.length > 10 || symbol.includes("/") || symbol.includes(" ")) {
      return truncateText(symbol, 6);
    }
    
    return symbol;
  };

  // Get token value for sorting
  const getTokenValue = (token) => {
    const value = parseFloat(calculateValue(
      token.node?.coin?.marketCap,
      token.node?.coin?.totalSupply,
      token.node?.balance,
      token.node?.coin?.totalVolume
    ).replace(/[^0-9.-]+/g, "")) || 0;
    
    return value;
  };

  // Sort tokens based on selected sort method
  const sortedTokens = React.useMemo(() => {
    if (!tokens) return [];
    
    return [...tokens].sort((a, b) => {
      if (sortBy === "value") {
        return getTokenValue(b) - getTokenValue(a); // Descending value
      } else if (sortBy === "name") {
        return (a.node?.coin?.name || "").localeCompare(b.node?.coin?.name || "");
      } else if (sortBy === "balance") {
        const aBalance = parseFloat(a.node?.balance || "0");
        const bBalance = parseFloat(b.node?.balance || "0");
        return bBalance - aBalance; // Descending balance
      }
      return 0;
    });
  }, [tokens, sortBy]);
  
  // Loading skeletons
  if (loading) {
    return (
      <div className="p-2">
        <div className="flex justify-between items-center mb-2 px-3 py-2">
          <div className="flex space-x-2">
            <div className={`h-8 w-20 rounded ${theme === "light" ? "bg-gray-200" : "bg-gray-700/50"} animate-pulse`}></div>
            <div className={`h-8 w-20 rounded ${theme === "light" ? "bg-gray-200" : "bg-gray-700/50"} animate-pulse`}></div>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className={`p-3 rounded-xl ${theme === "light" ? "bg-gray-200" : "bg-gray-700/50"} flex items-center space-x-3`}
            >
              <div className={`w-10 h-10 rounded-full ${theme === "light" ? "bg-gray-300" : "bg-gray-600"}`}></div>
              <div className="flex-1">
                <div className={`h-4 w-24 rounded ${theme === "light" ? "bg-gray-300" : "bg-gray-600"} mb-2`}></div>
                <div className={`h-3 w-16 rounded ${theme === "light" ? "bg-gray-300" : "bg-gray-600"}`}></div>
              </div>
              <div className={`h-6 w-16 rounded ${theme === "light" ? "bg-gray-300" : "bg-gray-600"}`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (error && (!tokens || tokens.length === 0)) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-600 dark:text-red-400 mb-2">Failed to load tokens</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    );
  }
  
  // Empty state
  if (!tokens || tokens.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-2">No tokens found</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Try connecting a different wallet or importing tokens</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
      {/* Sort controls */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 dark:border-gray-700/30">
        <div className="flex space-x-1">
          <button
            onClick={() => setSortBy("value")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              sortBy === "value"
                ? theme === "light"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-indigo-900/30 text-indigo-400"
                : theme === "light"
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Value
          </button>
          <button
            onClick={() => setSortBy("name")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              sortBy === "name"
                ? theme === "light"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-indigo-900/30 text-indigo-400"
                : theme === "light"
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Name
          </button>
          <button
            onClick={() => setSortBy("balance")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              sortBy === "balance"
                ? theme === "light"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-indigo-900/30 text-indigo-400"
                : theme === "light"
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Balance
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {tokens.length} tokens
        </div>
      </div>
      
      {/* Token list */}
      <div className="max-h-[350px] overflow-y-auto px-2 py-2">
        <div className="space-y-2 pb-4">
          {sortedTokens.map((token, index) => {
            const coin = token.node?.coin;
            const isSelected = selectedToken && coin?.address === selectedToken.address;
            const tokenValue = getTokenValue(token);
            
            return (
              <div
                key={coin?.address || index}
                className={`p-3 cursor-pointer transition-all duration-200 rounded-xl ${
                  isSelected 
                    ? theme === "light" 
                      ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                      : "bg-indigo-900/20 border-indigo-800/30 shadow-md"
                    : theme === "light" 
                      ? "bg-white hover:bg-gray-50 border border-gray-100" 
                      : "bg-gray-800/40 hover:bg-gray-700/40 border border-gray-700/20"
                }`}
                onClick={() => {
                  onSelectToken(coin);
                  // Close token list after selection
                  if (setIsTokenListCollapsed) {
                    setIsTokenListCollapsed(true);
                  }
                  // Add slight delay before scrolling to top of container
                  setTimeout(() => {
                    const container = document.querySelector('.max-h-\\[350px\\]');
                    if (container) container.scrollTop = 0;
                  }, 100);
                }}
              >
                <div className="flex items-center space-x-3">
                  {/* Token Icon */}
                  <div className="flex-shrink-0">
                    {coin?.mediaContent?.previewImage?.small ? (
                      <img
                        src={coin.mediaContent.previewImage.small}
                        alt={coin.name || "Token"}
                        className="w-10 h-10 rounded-full object-cover shadow-sm"
                       
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                        theme === "light" ? "bg-indigo-100 text-indigo-700" : "bg-indigo-900/30 text-indigo-400"
                      }`}>
                        <span className="text-lg font-bold">
                          {coin?.symbol?.slice(0, 1) || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Token Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className={`text-sm font-medium ${
                        theme === "light" ? "text-gray-900" : "text-white"
                      }`}>
                        {truncateText(coin?.name || "Unknown Token")}
                      </p>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {formatSymbol(coin?.symbol || "---")}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-1">
                      <span className={`text-sm ${
                        theme === "light" ? "text-gray-700" : "text-gray-300"
                      }`}>
                        {formatBalance(token.node?.balance)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        •
                      </span>
                      <span className={`text-xs ${tokenValue > 50 ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                        {calculateValue(
                          coin?.marketCap,
                          coin?.totalSupply,
                          token.node?.balance,
                          coin?.totalVolume
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className={`flex-shrink-0 ${theme === "light" ? "text-indigo-600" : "text-indigo-400"}`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty results message */}
          {sortedTokens.length === 0 && !loading && !error && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No tokens found matching your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TokenList; 