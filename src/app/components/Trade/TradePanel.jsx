'use client';

import React, { useState, useEffect, useMemo } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useBalance,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getTradeContractCallParams,
  validateTradeBalance,
  checkTokenBalance,
} from "../../services/sdk/getTradeCoin";
import { searchTokenByAddress } from "../../services/sdk/getCoins";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

function TradePanel({ coin, ethPrice, tokens = [], onSelectToken }) {
  const [amount, setAmount] = useState("0.01");
  const [tradeType, setTradeType] = useState("buy");
  const [loading, setLoading] = useState(false);
  const [ethBalance, setEthBalance] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [sliderValue, setSliderValue] = useState(0);
  const [pulseInput, setPulseInput] = useState(false);
  const [estimatedTokensToReceive, setEstimatedTokensToReceive] = useState("0");
  const [tokenPrice, setTokenPrice] = useState(null);
  const [slippage, setSlippage] = useState(0.05);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("value");
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const router = useRouter();

  // Use useBalance hook from wagmi to get ETH balance
  const { data: ethBalanceData } = useBalance({
    address: address,
    watch: true,
  });

  useEffect(() => {
    if (coin && coin.marketCap && coin.totalSupply) {
      // Check if volume is 0 - if it is, token hasn't been traded yet
      if (!coin.totalVolume || parseFloat(coin.totalVolume) === 0) {
        setTokenPrice(0);
        return;
      }
      
      // Calculate token price from market cap and supply
      const marketCap = parseFloat(coin.marketCap);
      const totalSupply = parseFloat(coin.totalSupply);
      
      if (marketCap > 0 && totalSupply > 0 && ethPrice > 0) {
        // If marketCap is in wei (very large number), convert to ETH first then to USD
        let marketCapInUSD;
        if (marketCap > 1e15) { // If marketCap seems to be in wei format (very large)
          // Convert from wei to ETH, then ETH to USD
          const marketCapInEth = marketCap / 1e18; // Convert wei to ETH
          marketCapInUSD = marketCapInEth * ethPrice; // Convert ETH to USD
        } else {
          // Assume marketCap is already in USD
          marketCapInUSD = marketCap;
        }
        
        // Calculate token price in USD
        const tokenSupply = totalSupply > 1e15 ? totalSupply / 1e18 : totalSupply; // Handle supply in wei format too
        const price = marketCapInUSD / tokenSupply;
        setTokenPrice(price);
      }
    }
  }, [coin, ethPrice]);

  // Load token balance and ETH balance
  useEffect(() => {
    async function loadBalances() {
      if (isConnected && address && publicClient && coin?.address) {
        try {
          // ETH balance
          if (ethBalanceData) {
            setEthBalance(ethBalanceData.formatted);
          }

          // Token balance
          try {
            const balance = await checkTokenBalance(
              address,
              coin.address,
              publicClient
            );
            setTokenBalance(formatEther(balance));
          } catch (error) {
            console.error("Token balance loading error:", error);
            setTokenBalance("0");
          }
        } catch (error) {
          console.error("Balance loading error:", error);
        }
      }
    }

    loadBalances();
    
    // Set up auto-refresh balances every 15 seconds
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing balances...");
      loadBalances();
    }, 15000); // 15 seconds

    // Clean up the interval when component unmounts
    return () => clearInterval(refreshInterval);
  }, [isConnected, address, publicClient, coin?.address, ethBalanceData]);

  // Global token search function
  const performGlobalSearch = async (query) => {
    if (!query || query.length < 2) {
      setGlobalSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Check if it's an Ethereum address
      const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(query);
      
      if (isEthereumAddress) {
        const result = await searchTokenByAddress(query);
        
        if (result.success && result.data) {
          setGlobalSearchResults([{
            id: query,
            name: result.data.name || 'Unknown Token',
            symbol: result.data.symbol || '???',
            address: query,
            marketCap: result.data.marketCap || 0,
            totalSupply: result.data.totalSupply || 0,
            totalVolume: result.data.totalVolume || 0,
            mediaContent: result.data.mediaContent,
            type: 'global'
          }]);
        } else {
          setGlobalSearchResults([]);
        }
      } else {
        // For name/symbol search, we'll search through existing tokens first
        // Future: Could be extended to search through a larger database
        setGlobalSearchResults([]);
      }
    } catch (error) {
      console.error("Global search error:", error);
      setGlobalSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced global search
  useEffect(() => {
    const timer = setTimeout(() => {
      performGlobalSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate amount based on slider percentage
  const calculatePercentage = (balance, percentage) => {
    if (!balance || isNaN(parseFloat(balance)) || percentage === 0) return "0";

    // Account for gas fee for ETH (approximately 0.002 ETH)
    if (tradeType === "buy") {
      const estimatedGas = 0.002; // Estimated gas fee
      const availableBalance = Math.max(0, parseFloat(balance) - estimatedGas);
      const value = (availableBalance * (percentage / 100)).toFixed(6);
      return value;
    } else {
      // For sell operations, apply 99.5% when 100% is selected (slippage)
      const adjustedPercentage = percentage === 100 ? 99.5 : percentage;
      const value = (parseFloat(balance) * (adjustedPercentage / 100)).toFixed(6);
      return value;
    }
  };

  // Calculate USD value
  const calculateUSDValue = (ethAmount) => {
    if (!ethAmount || !ethPrice) return "0.00";
    return (parseFloat(ethAmount) * ethPrice).toFixed(2);
  };

  // Calculate estimated tokens to receive
  const calculateEstimatedTokens = (ethAmount) => {
    if (!ethAmount || !coin?.marketCap || !coin?.totalSupply) return "0";
    
    // If volume is 0, token hasn't been traded yet, return 0
    if (!coin.totalVolume || parseFloat(coin.totalVolume) === 0) {
      return "0";
    }
    
    // Convert input to numbers
    const ethAmountFloat = parseFloat(ethAmount);
    const totalSupply = parseFloat(coin.totalSupply);
    const marketCap = parseFloat(coin.marketCap);
    
    if (ethAmountFloat <= 0 || totalSupply <= 0 || marketCap <= 0) return "0";
    
    // Constant product formula (x * y = k) used by AMMs like Uniswap
    // We need to account for:
    // 1. Price impact - larger trades have higher price impact
    // 2. Fee - typically 0.3% on Uniswap
    
    // Get pool details from coin data if available
    const liquidityEth = parseFloat(coin.liquidityInEth || marketCap / ethPrice / 2);
    const liquidityToken = parseFloat(coin.liquidityTokens || totalSupply / 2);
    
    // Price impact calculation
    const fee = 0.003; // 0.3% swap fee
    const adjustedEthAmount = ethAmountFloat * (1 - fee);
    
    // Use constant product formula: x * y = k
    // Where k is constant, x is ETH amount, y is token amount
    // For a trade: (x + Δx) * (y - Δy) = x * y
    // Solving for Δy: Δy = y * Δx / (x + Δx)
    
    // Calculate tokens to receive
    const tokensToReceive = (liquidityToken * adjustedEthAmount) / (liquidityEth + adjustedEthAmount);
    
    // Add slippage buffer (reduce by ~1.5% to match what users typically see)
    const withSlippage = tokensToReceive * 0.985;
    
    // Format with appropriate decimals
    if (withSlippage < 0.001) {
      return withSlippage.toExponential(4);
    } else if (withSlippage < 1) {
      return withSlippage.toFixed(6);
    } else if (withSlippage < 1000) {
      return withSlippage.toFixed(4);
    } else {
      return withSlippage.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
  };

  // Calculate estimated ETH to receive when selling
  const calculateEstimatedEth = (tokenAmount) => {
    if (!tokenAmount || !coin?.marketCap || !coin?.totalSupply || !ethPrice) return "0";
    
    // If volume is 0, token hasn't been traded yet, return 0
    if (!coin.totalVolume || parseFloat(coin.totalVolume) === 0) {
      return "0";
    }
    
    // Convert input to numbers
    const tokenAmountFloat = parseFloat(tokenAmount);
    const totalSupply = parseFloat(coin.totalSupply);
    const marketCap = parseFloat(coin.marketCap);
    
    if (tokenAmountFloat <= 0 || totalSupply <= 0 || marketCap <= 0) return "0";
    
    // Simple price calculation based on market cap and supply
    const tokenPrice = marketCap / totalSupply;
    const ethValue = (tokenAmountFloat * tokenPrice) / ethPrice;
    
    // Add fee/slippage (reduce by ~3% to account for fees and slippage)
    const withSlippage = ethValue * 0.97;
    
    // Format with appropriate decimals
    if (withSlippage < 0.0001) {
      return withSlippage.toExponential(4);
    } else if (withSlippage < 1) {
      return withSlippage.toFixed(6);
    } else if (withSlippage < 10) {
      return withSlippage.toFixed(4);
    } else {
      return withSlippage.toFixed(2);
    }
  };

  // Update estimated tokens when amount changes
  useEffect(() => {
    if (tradeType === "buy") {
      const estimated = calculateEstimatedTokens(amount);
      setEstimatedTokensToReceive(estimated);
    }
  }, [amount, coin, ethPrice, tradeType]);

  // Update estimated ETH when amount changes for sell orders
  useEffect(() => {
    if (tradeType === "buy") {
      const estimated = calculateEstimatedTokens(amount);
      setEstimatedTokensToReceive(estimated);
    }
  }, [amount, coin, ethPrice, tradeType]);

  // Execute trade
  const handleTrade = async () => {
    if (!isConnected || !coin?.address || !amount || !address) {
      toast.error("Order details are missing or wallet is not connected");
      return;
    }

    if (loading || isPending) return;

    setLoading(true);

    try {
      const orderSizeWei = parseEther(amount);
      let minAmountOutWei = 0n;
      if (slippage > 0) {
        if (tradeType === "buy") {
          const estimatedTokens = calculateEstimatedTokens(amount);
          const minTokens = (parseFloat(estimatedTokens) * (1 - slippage)).toString();
          minAmountOutWei = parseEther(minTokens);
        } else {
          const estimatedEth = calculateEstimatedEth(amount);
          const minEth = (parseFloat(estimatedEth) * (1 - slippage)).toString();
          minAmountOutWei = parseEther(minEth);
        }
      }

      // Create contract call parameters, including slippage
      const params = getTradeContractCallParams(
        tradeType,
        coin.address,
        address,
        orderSizeWei,
        minAmountOutWei,
        address,
        slippage
      );

      const hash = await writeContractAsync(params);

      if (hash) {
        toast.success(
          tradeType === "buy" ? "Buy order sent" : "Sell order sent"
        );

        setAmount("0.001");
        setSliderValue(0);
      }
    } catch (error) {
      console.error("Order error:", error);

      if (error.message?.includes("User rejected") || error.code === 4001) {
        toast.info("Order cancelled");
        setAmount("0.001");
        setSliderValue(0);
      } else {
        let errorMessage = error.message || "Transaction failed";
        if (errorMessage.includes("AddressZero()")) {
          errorMessage = "Invalid address: Please connect your wallet";
        }
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // When slider value changes
  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);

    if (tradeType === "buy" && ethBalance) {
      const calculatedAmount = calculatePercentage(ethBalance, value);
      setAmount(calculatedAmount);

      // Visual pulse animation on input field
      setPulseInput(true);
      setTimeout(() => setPulseInput(false), 500);
    } else if (tradeType === "sell" && tokenBalance) {
      const calculatedAmount = calculatePercentage(tokenBalance, value);
      setAmount(calculatedAmount);

      // Visual pulse animation on input field
      setPulseInput(true);
      setTimeout(() => setPulseInput(false), 500);
    }
  };

  // Format large numbers with appropriate suffixes
  const formatLargeNumber = (num) => {
    if (!num) return "0";
    
    const value = parseFloat(num);
    if (isNaN(value)) return "0";
    
    if (value < 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (value < 1000000) return (value / 1000).toFixed(2) + "K";
    if (value < 1000000000) return (value / 1000000).toFixed(2) + "M";
    return (value / 1000000000).toFixed(2) + "B";
  };

  // Enhanced balance formatting with proper handling
  const formatBalance = (balanceStr) => {
    if (!balanceStr) return "0";
    
    try {
      let balance;
      
      // Check if this is a very large string number (with many leading zeros)
      if (typeof balanceStr === 'string' && balanceStr.length > 30) {
        // Convert properly using formatEther for wei values
        try {
          balance = parseFloat(formatEther(balanceStr));
        } catch (err) {
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

  // Format token balance with appropriate abbreviations (kept for backward compatibility)
  const formatTokenBalance = (balanceStr) => {
    return formatBalance(balanceStr);
  };
  
  // Format token symbol to handle unusually long symbols
  const formatSymbol = (symbol) => {
    if (!symbol) return "";
    
    // Check if symbol contains unusual characters like "/" which might indicate it's not a traditional symbol
    if (symbol.length > 10 || symbol.includes("/") || symbol.includes(" ")) {
      // It might be using name as symbol, truncate aggressively
      return symbol.slice(0, 6) + "...";
    }
    
    return symbol;
  };

  // Navigate to coin details
  const handleViewCoinDetails = () => {
    router.push(`/coin/${coin.address}`);
  };

  // Handle token selection
  const handleTokenSelect = (selectedToken) => {
    if (onSelectToken) {
      onSelectToken(selectedToken);
    }
    setShowTokenDropdown(false);
    setSearchQuery(""); // Clear search after selection
    setGlobalSearchResults([]); // Clear global search results
  };

  // Helper function to format token price with better precision
  const formatTokenPrice = (price) => {
    if (!price || isNaN(price) || price === 0) return "0";
    
    if (price < 0.000001) {
      // Use scientific notation for very small prices
      return price.toExponential(2);
    } else if (price < 0.001) {
      // Show 6 decimal places for small prices
      return price.toFixed(6);
    } else if (price < 0.01) {
      // Show 5 decimal places 
      return price.toFixed(5);
    } else if (price < 0.1) {
      // Show 4 decimal places
      return price.toFixed(4);
    } else if (price < 1) {
      // Show 3 decimal places
      return price.toFixed(3);
    } else if (price < 10) {
      // Show 2 decimal places
      return price.toFixed(2);
    } else {
      // Show 2 decimal places for higher prices
      return price.toFixed(2);
    }
  };

  // Helper function to calculate token price in USD
  const calculateTokenPrice = (tokenData) => {
    if (!tokenData?.marketCap || !tokenData?.totalSupply || !ethPrice) {
      return 0;
    }
    
    // Check if volume is 0 - if it is, token hasn't been traded yet
    if (!tokenData.totalVolume || parseFloat(tokenData.totalVolume) === 0) {
      return 0;
    }
    
    const marketCap = parseFloat(tokenData.marketCap);
    const totalSupply = parseFloat(tokenData.totalSupply);
    
    if (marketCap > 0 && totalSupply > 0) {
      // If marketCap is in wei (very large number), convert to ETH first then to USD
      let marketCapInUSD;
      if (marketCap > 1e15) { // If marketCap seems to be in wei format (very large)
        // Convert from wei to ETH, then ETH to USD
        const marketCapInEth = marketCap / 1e18; // Convert wei to ETH
        marketCapInUSD = marketCapInEth * ethPrice; // Convert ETH to USD
      } else {
        // Assume marketCap is already in USD
        marketCapInUSD = marketCap;
      }
      
      // Calculate token price in USD
      const tokenSupply = totalSupply > 1e15 ? totalSupply / 1e18 : totalSupply; // Handle supply in wei format too
      return marketCapInUSD / tokenSupply;
    }
    
    return 0;
  };

  // Enhanced token value calculation with better formatting - FIXED USD calculation
  const calculateTokenValue = (token) => {
    const tokenData = token.node?.coin;
    const balance = parseFloat(token.node?.balance || "0");
    
    if (!tokenData?.marketCap || !tokenData?.totalSupply || balance === 0) {
      return 0;
    }
    
    // Check if volume is 0 - if it is, token hasn't been traded yet
    if (!tokenData.totalVolume || parseFloat(tokenData.totalVolume) === 0) {
      return 0;
    }
    
    const marketCap = parseFloat(tokenData.marketCap);
    const totalSupply = parseFloat(tokenData.totalSupply);
    
    if (marketCap > 0 && totalSupply > 0 && ethPrice > 0) {
      // If marketCap is in wei (very large number), convert to ETH first then to USD
      let marketCapInUSD;
      if (marketCap > 1e15) { // If marketCap seems to be in wei format (very large)
        // Convert from wei to ETH, then ETH to USD
        const marketCapInEth = marketCap / 1e18; // Convert wei to ETH
        marketCapInUSD = marketCapInEth * ethPrice; // Convert ETH to USD
      } else {
        // Assume marketCap is already in USD
        marketCapInUSD = marketCap;
      }
      
      // Calculate token price in USD
      const tokenSupply = totalSupply > 1e15 ? totalSupply / 1e18 : totalSupply; // Handle supply in wei format too
      const tokenPriceInUSD = marketCapInUSD / tokenSupply;
      
      // Calculate user's token value
      const userBalance = balance > 1e15 ? balance / 1e18 : balance; // Handle balance in wei format too
      return tokenPriceInUSD * userBalance;
    }
    
    return 0;
  };

  // Format USD value with better precision - FIXED
  const formatUSDValue = (value) => {
    if (!value || isNaN(value)) return "$0.00";
    
    if (value < 0.01) return value < 0.001 ? "$<0.001" : `$${value.toFixed(3)}`;
    if (value < 1) return `$${value.toFixed(3)}`;
    if (value < 1000) return `$${value.toFixed(2)}`;
    if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
    if (value < 1000000000) return `$${(value / 1000000).toFixed(2)}M`;
    return `$${(value / 1000000000).toFixed(2)}B`;
  };

  // Filter and sort tokens based on search query and sort method
  const filteredAndSortedTokens = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];
    
    // Filter based on search query
    let filtered = tokens;
    if (searchQuery.trim() && globalSearchResults.length === 0) {
      const query = searchQuery.toLowerCase().trim();
      filtered = tokens.filter(token => {
        const tokenData = token.node?.coin;
        return (
          tokenData?.name?.toLowerCase().includes(query) ||
          tokenData?.symbol?.toLowerCase().includes(query) ||
          tokenData?.address?.toLowerCase().includes(query)
        );
      });
    }
    
    // Sort based on selected sort method
    return filtered.sort((a, b) => {
      if (sortBy === "value") {
        return calculateTokenValue(b) - calculateTokenValue(a); // Descending value
      } else if (sortBy === "name") {
        return (a.node?.coin?.name || "").localeCompare(b.node?.coin?.name || "");
      } else if (sortBy === "balance") {
        const aBalance = parseFloat(a.node?.balance || "0");
        const bBalance = parseFloat(b.node?.balance || "0");
        return bBalance - aBalance; // Descending balance
      }
      return 0;
    });
  }, [tokens, searchQuery, sortBy, globalSearchResults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTokenDropdown && !event.target.closest('.token-dropdown-container')) {
        setShowTokenDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTokenDropdown]);

  if (!coin) {
    return (
      <div className={`rounded-2xl border p-6 text-center ${
        theme === "light" ? "bg-white/70 border-gray-200/50" : "bg-gray-900/30 border-gray-700/30"
      }`}>
        <p className="text-gray-500 dark:text-gray-400">Select a token to trade</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden border shadow-sm ${
      theme === "light" ? "bg-white/80 border-gray-200/50" : "bg-gray-900/40 border-gray-700/30 backdrop-blur-md"
    }`}>
      <style jsx>{`
        @keyframes pulse-light {
          0%, 100% { box-shadow: 0 0 0 0 ${theme === "light" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.4)"}; }
          50% { box-shadow: 0 0 0 4px ${theme === "light" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.2)"}; }
        }
        .animate-pulse-light {
          animation: pulse-light 0.5s ease-in-out;
        }

        .custom-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 5px;
          background: ${theme === "light" ? "#e5e7eb" : "#374151"};
          outline: none;
        }

        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${theme === "light" ? "#6366f1" : "#818cf8"};
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 3px ${theme === "light" ? "rgba(99, 102, 241, 0.2)" : "rgba(129, 140, 248, 0.2)"};
        }

        .custom-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${theme === "light" ? "#6366f1" : "#818cf8"};
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .custom-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 3px ${theme === "light" ? "rgba(99, 102, 241, 0.2)" : "rgba(129, 140, 248, 0.2)"};
        }

        .dropdown-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .dropdown-scrollbar::-webkit-scrollbar-track {
          background: ${theme === "light" ? "#f1f5f9" : "#374151"};
          border-radius: 10px;
        }
        
        .dropdown-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme === "light" ? "#cbd5e1" : "#6b7280"};
          border-radius: 10px;
        }
        
        .dropdown-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme === "light" ? "#94a3b8" : "#9ca3af"};
        }
      `}</style>

      <div className="p-4">
        {/* Modern Token Selection with Enhanced Dropdown */}
        <div className="token-dropdown-container relative mb-4">
          <div 
            className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
              theme === "light" 
                ? "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300" 
                : "bg-gray-800/30 border-gray-700/30 hover:bg-gray-700/40 hover:border-gray-600/50"
            } ${showTokenDropdown ? 
              theme === "light" 
                ? 'ring-2 ring-indigo-500/20 border-indigo-300 bg-indigo-50/30' 
                : 'ring-2 ring-indigo-500/20 border-indigo-600/50 bg-indigo-900/20' 
              : ''}`} 
            onClick={() => setShowTokenDropdown(!showTokenDropdown)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  {coin?.mediaContent?.previewImage?.small ? (
                    <img
                      src={coin.mediaContent.previewImage.small}
                      alt={coin.name || "Token"}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://via.placeholder.com/32/6366f1/FFFFFF?text=${coin?.symbol?.slice(0, 1) || "?"}`
                      }}
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-700 ${
                      theme === "light" ? "bg-indigo-100 text-indigo-700" : "bg-indigo-900/30 text-indigo-400"
                    }`}>
                      <span className="text-sm font-bold">
                        {coin?.symbol?.slice(0, 1) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h3 className={`text-sm font-semibold truncate ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                      {coin.name || "Unknown Token"}
                    </h3>
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                      {formatSymbol(coin.symbol || "---")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className={`text-xs font-semibold ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                      {tokenPrice ? `$${formatTokenPrice(tokenPrice)}` : "N/A"}
                    </div>
                    <div className="text-xs text-gray-500">
                      MCap: ${formatLargeNumber((() => {
                        const marketCap = parseFloat(coin.marketCap || 0);
                        if (marketCap > 1e15) {
                          return (marketCap / 1e18) * ethPrice; // Convert wei to USD
                        }
                        return marketCap;
                      })())}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewCoinDetails();
                  }}
                  className="text-xs px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-colors font-medium border border-indigo-200 dark:border-indigo-800/50"
                >
                  Details
                </button>
                <div className={`p-1 rounded-lg transition-colors ${
                  showTokenDropdown 
                    ? "bg-indigo-100 dark:bg-indigo-900/40" 
                    : "bg-gray-100 dark:bg-gray-700/50"
                }`}>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showTokenDropdown ? 'rotate-180' : ''
                    } ${
                      showTokenDropdown 
                        ? "text-indigo-600 dark:text-indigo-400" 
                        : "text-gray-400"
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Token Dropdown with Global Search */}
          {showTokenDropdown && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl z-50 backdrop-blur-lg ${
              theme === "light" 
                ? "bg-white/95 border-gray-200 shadow-gray-300/20" 
                : "bg-gray-800/95 border-gray-700 shadow-black/20"
            }`}>
              
              {/* Search Header */}
              <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tokens or paste address..."
                    className={`w-full pl-10 pr-10 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                      theme === "light"
                        ? "bg-gray-50 border-gray-200 placeholder-gray-500 text-gray-900 focus:border-indigo-300 focus:ring-indigo-500/20"
                        : "bg-gray-800/50 border-gray-700 placeholder-gray-500 text-gray-100 focus:border-indigo-600 focus:ring-indigo-500/20"
                    }`}
                  />
                  {isSearching ? (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                    </div>
                  ) : searchQuery ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setGlobalSearchResults([]);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : null}
                </div>
                
                {/* Sort Options */}
                {!searchQuery && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">Sort by:</span>
                    {["value", "name", "balance"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option)}
                        className={`text-xs px-2 py-1 rounded-md transition-colors capitalize ${
                          sortBy === option
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Token List */}
              <div className="max-h-64 overflow-y-auto dropdown-scrollbar">
                {/* Global Search Results */}
                {globalSearchResults.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-2">Global Search Results</div>
                    {globalSearchResults.map((token, index) => (
                      <div
                        key={token.address || index}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-150 border border-green-200 dark:border-green-800/30 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-800/30`}
                        onClick={() => handleTokenSelect(token)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            {token?.mediaContent?.previewImage?.small ? (
                              <img
                                src={token.mediaContent.previewImage.small}
                                alt={token.name || "Token"}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://via.placeholder.com/32/6366f1/FFFFFF?text=${token?.symbol?.slice(0, 1) || "?"}`
                                }}
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-700 ${
                                theme === "light" ? "bg-green-100 text-green-700" : "bg-green-900/30 text-green-400"
                              }`}>
                                <span className="text-sm font-bold">
                                  {token?.symbol?.slice(0, 1) || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center min-w-0">
                                <p className={`text-sm font-semibold truncate ${
                                  theme === "light" ? "text-gray-900" : "text-white"
                                }`}>
                                  {token?.name || "Unknown Token"}
                                </p>
                                <span className="ml-2 text-xs text-gray-500 font-medium">
                                  {formatSymbol(token?.symbol || "---")}
                                </span>
                                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 font-medium">
                                  New
                                </span>
                              </div>
                            </div>
                            
                                                                                      {/* Token metrics */}
                             <div className="flex items-center gap-3 mt-1">
                               <div className="text-xs text-gray-600 dark:text-gray-400">
                                 MCap: ${formatLargeNumber((() => {
                                   const marketCap = parseFloat(token?.marketCap || 0);
                                   if (marketCap > 1e15) {
                                     return (marketCap / 1e18) * ethPrice; // Convert wei to USD
                                   }
                                   return marketCap;
                                 })())}
                               </div>
                               {token?.totalVolume && parseFloat(token.totalVolume) > 0 && (
                                 <div className="text-xs text-gray-600 dark:text-gray-400">
                                   Vol: ${formatLargeNumber((() => {
                                     const volume = parseFloat(token.totalVolume);
                                     if (volume > 1e15) {
                                       return (volume / 1e18) * ethPrice; // Convert wei to USD
                                     }
                                     return volume;
                                   })())}
                                 </div>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* User's Tokens */}
                {(filteredAndSortedTokens.length > 0 || (!searchQuery && tokens.length > 0)) && (
                  <div className="p-2">
                    {globalSearchResults.length > 0 && (
                      <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-2 border-t border-gray-200/50 dark:border-gray-700/50 pt-3">Your Tokens</div>
                    )}
                    {(searchQuery ? filteredAndSortedTokens : filteredAndSortedTokens).map((token, index) => {
                      const tokenData = token.node?.coin;
                      const isCurrentlySelected = tokenData?.address === coin?.address;
                      const tokenValue = calculateTokenValue(token);
                      
                      return (
                        <div
                          key={tokenData?.address || index}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-150 ${
                            isCurrentlySelected
                              ? theme === "light"
                                ? "bg-indigo-50 border border-indigo-200 shadow-sm"
                                : "bg-indigo-900/30 border border-indigo-800/30 shadow-md"
                              : theme === "light"
                                ? "hover:bg-gray-50 border border-transparent"
                                : "hover:bg-gray-700/40 border border-transparent"
                          }`}
                          onClick={() => handleTokenSelect(tokenData)}
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 mr-3">
                              {tokenData?.mediaContent?.previewImage?.small ? (
                                <img
                                  src={tokenData.mediaContent.previewImage.small}
                                  alt={tokenData.name || "Token"}
                                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://via.placeholder.com/32/6366f1/FFFFFF?text=${tokenData?.symbol?.slice(0, 1) || "?"}`
                                  }}
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-700 ${
                                  theme === "light" ? "bg-indigo-100 text-indigo-700" : "bg-indigo-900/30 text-indigo-400"
                                }`}>
                                  <span className="text-sm font-bold">
                                    {tokenData?.symbol?.slice(0, 1) || "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0">
                                  <p className={`text-sm font-semibold truncate ${
                                    theme === "light" ? "text-gray-900" : "text-white"
                                  }`}>
                                    {tokenData?.name || "Unknown Token"}
                                  </p>
                                  <span className="ml-2 text-xs text-gray-500 font-medium">
                                    {formatSymbol(tokenData?.symbol || "---")}
                                  </span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
                                    {formatBalance(token.node?.balance)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatUSDValue(tokenValue)}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Token metrics */}
                              <div className="flex items-center gap-3 mt-1">
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  MCap: ${formatLargeNumber((() => {
                                    const marketCap = parseFloat(tokenData?.marketCap || 0);
                                    if (marketCap > 1e15) {
                                      return (marketCap / 1e18) * ethPrice; // Convert wei to USD
                                    }
                                    return marketCap;
                                  })())}
                                </div>
                                {tokenData?.totalVolume && parseFloat(tokenData.totalVolume) > 0 && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    Vol: ${formatLargeNumber((() => {
                                      const volume = parseFloat(tokenData.totalVolume);
                                      if (volume > 1e15) {
                                        return (volume / 1e18) * ethPrice; // Convert wei to USD
                                      }
                                      return volume;
                                    })())}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* No Results */}
                {filteredAndSortedTokens.length === 0 && globalSearchResults.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {searchQuery ? "No tokens found matching your search" : "No tokens available"}
                    </p>
                    {searchQuery && searchQuery.length > 10 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Try pasting a token contract address for global search
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className={`p-3 border-t border-gray-200/50 dark:border-gray-700/50 ${
                theme === "light" ? "bg-gray-50/50" : "bg-gray-800/50"
              }`}>
                <p className="text-xs text-gray-500 text-center">
                  {globalSearchResults.length > 0 
                    ? `${globalSearchResults.length} global result${globalSearchResults.length !== 1 ? 's' : ''} • ${filteredAndSortedTokens.length} owned`
                    : `${filteredAndSortedTokens.length} token${filteredAndSortedTokens.length !== 1 ? 's' : ''} available`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Trade type selection */}
        <div className="grid grid-cols-2 gap-1 mb-4 rounded-xl overflow-hidden">
          <button
            className={`py-2.5 px-4 font-medium text-center transition-all rounded-lg ${
              tradeType === "buy"
                ? theme === "light"
                  ? "text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  : "text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
                : theme === "light"
                ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                : "text-gray-300 bg-gray-800 hover:bg-gray-700"
            }`}
            onClick={() => {
              setTradeType("buy");
              setSliderValue(0);
            }}
          >
            Buy
          </button>
          <button
            className={`py-2.5 px-4 font-medium text-center transition-all rounded-lg ${
              tradeType === "sell"
                ? theme === "light"
                  ? "text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  : "text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
                : theme === "light"
                ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                : "text-gray-300 bg-gray-800 hover:bg-gray-700"
            }`}
            onClick={() => {
              setTradeType("sell");
              setSliderValue(0);
            }}
          >
            Sell
          </button>
        </div>

        {/* Balance Display */}
        <div className={`mb-4 p-3 rounded-xl ${
          theme === "light" ? "bg-gray-50 border border-gray-100" : "bg-gray-800/30 border border-gray-700/30"
        }`}>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Available Balance</p>
            {tradeType === "buy" ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                ETH
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                {formatSymbol(coin.symbol)}
              </span>
            )}
          </div>
          <div className="font-medium mt-1">
            {tradeType === "buy" ? (
              <div className="flex items-center justify-between">
                <span className={`text-base ${theme === "light" ? "text-gray-800" : "text-gray-200"}`}>
                  {parseFloat(ethBalance).toFixed(4)}
                </span>
                {ethPrice && (
                  <span className="text-xs text-gray-500">
                    ≈${(parseFloat(ethBalance) * ethPrice).toFixed(2)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className={`text-base ${theme === "light" ? "text-gray-800" : "text-gray-200"}`}>
                  {formatTokenBalance(tokenBalance)}
                </span>
                {tokenPrice && (
                  <span className="text-xs text-gray-500">
                    ≈${(parseFloat(tokenBalance) * tokenPrice).toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-3">
          <label className={`block mb-2 text-sm font-medium ${
            theme === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            Amount to {tradeType}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full p-3 pr-24 rounded-xl border ${
                theme === "light"
                  ? "border-gray-200 bg-white text-gray-900 focus:border-indigo-300"
                  : "border-gray-700 bg-gray-800/20 text-white focus:border-indigo-600"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                pulseInput ? "animate-pulse-light" : ""
              }`}
              placeholder="0.00"
              disabled={loading || isPending}
            />
            <div className="absolute right-3 top-0 h-full flex items-center">
              <div className="flex items-center">
                <span className={`text-sm font-medium ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}>
                  {tradeType === "buy" ? "ETH" : formatSymbol(coin.symbol)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-1 px-1">
            <span className="text-xs text-gray-500">
              {tradeType === "buy" 
                ? "≈$" + calculateUSDValue(amount) 
                : "≈" + calculateEstimatedEth(amount) + " ETH"
              }
            </span>
          </div>
        </div>

        {/* Amount slider */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliderValue}
            onChange={handleSliderChange}
            className="custom-slider"
            disabled={loading || isPending}
          />
          <div className="flex justify-between mt-2 px-1 gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors w-full  ${
                  sliderValue === percent
                    ? theme === "light"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-indigo-900/40 text-indigo-400"
                    : theme === "light"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-800/40 text-gray-300 hover:bg-gray-700/60"
                }`}
                onClick={() => handleSliderChange({ target: { value: percent } })}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        {/* Slippage Tolerance Input */}
        <div className="mb-4">
          <label className={`block mb-2 text-sm font-medium ${
            theme === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            Slippage Tolerance
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="0.99"
              value={slippage}
              onChange={(e) => setSlippage(Number(e.target.value))}
              className={`w-full p-3 pr-12 rounded-xl border ${
                theme === "light"
                  ? "border-gray-200 bg-white text-gray-900 focus:border-indigo-300"
                  : "border-gray-700 bg-gray-800/20 text-white focus:border-indigo-600"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all`}
              placeholder="0.05"
              disabled={loading || isPending}
            />
            <span className="absolute right-3 top-0 h-full flex items-center text-sm text-gray-500">
              %
            </span>
          </div>
        </div>

        {/* You receive section */}
        {tradeType === "buy" ? (
          <div className={`mb-4 p-3 rounded-xl ${
            theme === "light" ? "bg-indigo-50 border border-indigo-100" : "bg-indigo-900/20 border border-indigo-800/30"
          }`}>
            <div className="flex justify-between items-center">
              <p className="text-xs text-indigo-600 dark:text-indigo-400">You Receive (Estimated)</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400">
                {formatSymbol(coin.symbol)}
              </span>
            </div>
            <p className={`text-base font-medium mt-1 ${theme === "light" ? "text-indigo-700" : "text-indigo-300"}`}>
              {estimatedTokensToReceive}
            </p>
          </div>
        ) : (
          <div className={`mb-4 p-3 rounded-xl ${
            theme === "light" ? "bg-indigo-50 border border-indigo-100" : "bg-indigo-900/20 border border-indigo-800/30"
          }`}>
            <div className="flex justify-between items-center">
              <p className="text-xs text-indigo-600 dark:text-indigo-400">You Receive (Estimated)</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400">
                ETH
              </span>
            </div>
            <div className="mt-1">
              <p className={`text-base font-medium ${theme === "light" ? "text-indigo-700" : "text-indigo-300"}`}>
                {calculateEstimatedEth(amount)} ETH
              </p>
              <p className="text-xs text-indigo-500/70 dark:text-indigo-400/70 mt-0.5">
                ≈${(parseFloat(calculateEstimatedEth(amount)) * ethPrice).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Trade button */}
        <button
          onClick={handleTrade}
          disabled={loading || isPending || parseFloat(amount) <= 0}
          className={`w-full py-3 px-4 rounded-xl text-center font-medium transition-all ${
            loading || isPending || parseFloat(amount) <= 0
              ? theme === "light"
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
              : tradeType === "buy"
              ? theme === "light"
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              : theme === "light"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          }`}
        >
          {loading || isPending ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              <span>Processing...</span>
            </div>
          ) : (
            `${tradeType === "buy" ? "Buy" : "Sell"} ${formatSymbol(coin.symbol)}`
          )}
        </button>
      </div>
    </div>
  );
}

export default TradePanel; 