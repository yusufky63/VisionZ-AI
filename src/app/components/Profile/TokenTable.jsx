import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { useRouter } from "next/navigation";
import Image from "next/image";

function TokenTable({
  balances,
  activeTab,
  walletAddress,
  setActiveTab,
  refreshData,
  isLoading,
  loadError,
  loadingProgress,
  loadedAllPages,
  profile,
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"
  const [currentPage, setCurrentPage] = useState(1);
  const tokensPerPage = 12;
  const [sortField, setSortField] = useState("name"); // Default sort field
  const [sortDirection, setSortDirection] = useState("asc"); // 'asc' or 'desc'
  const [searchQuery, setSearchQuery] = useState(""); // State for search query

  // Format balance
  const formatBalance = (balanceStr) => {
    try {
      // Return 0 if balance is empty or not a string
      if (!balanceStr || typeof balanceStr !== "string") return "0";

      // Convert string to BigInt
      const balanceBigInt = BigInt(balanceStr);

      // Use formatEther function
      const formattedBalance = formatEther(balanceBigInt);

      // Convert to number
      const numBalance = parseFloat(formattedBalance);

      // Avoid scientific notation for very small values
      if (numBalance < 0.0001 && numBalance > 0) {
        return "< 0.0001";
      }

      // For large numbers use K, M, B notation
      if (numBalance >= 1_000_000_000) {
        return `${(numBalance / 1_000_000_000).toFixed(2)}B`;
      } else if (numBalance >= 1_000_000) {
        return `${(numBalance / 1_000_000).toFixed(2)}M`;
      } else if (numBalance >= 10_000) {
        return `${(numBalance / 1_000).toFixed(2)}K`;
      }

      // For smaller numbers, show with appropriate decimal places
      if (numBalance < 1) {
        return numBalance.toLocaleString(undefined, {
          maximumFractionDigits: 6,
        });
      } else if (numBalance < 100) {
        return numBalance.toLocaleString(undefined, {
          maximumFractionDigits: 4,
        });
      } else {
        return numBalance.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        });
      }
    } catch (error) {
      console.error("Balance format error:", error);
      return "0";
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (!price || price === "N/A") return "N/A";

    const numPrice = parseFloat(price.replace("$", ""));

    if (numPrice === 0) return "$0";

    // Scientific notation for very small numbers
    if (numPrice < 0.000001) {
      return `$${numPrice.toExponential(2)}`;
    }
    // 6 decimals for numbers between 0.000001 and 0.01
    else if (numPrice < 0.01) {
      return `$${numPrice.toFixed(6)}`;
    }
    // 4 decimals for numbers between 0.01 and 1
    else if (numPrice < 1) {
      return `$${numPrice.toFixed(4)}`;
    }
    // 2 decimals for numbers greater than 1
    else {
      return `$${numPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  // Calculate coin price
  const calculatePrice = (marketCap, totalSupply, totalVolume) => {
    try {
      if (!marketCap || !totalSupply) return "N/A";

      // Check totalVolume
      const volume = parseFloat(totalVolume);
      if (volume <= 0) return "N/A";

      // marketCap is already in USD
      const marketCapUSD = parseFloat(marketCap);

      // Convert totalSupply to normal number
      const totalSupplyAmount = parseFloat(totalSupply);

      if (totalSupplyAmount === 0) return "N/A";

      // Price = MarketCap / TotalSupply
      const price = marketCapUSD / totalSupplyAmount;

      // Format price
      if (price < 0.01) {
        return `$${price.toFixed(4)}`;
      }

      return `$${price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } catch (error) {
      console.error("Price calculation error:", error);
      return "N/A";
    }
  };

  // Calculate total value
  const calculateValue = (marketCap, totalSupply, balance, totalVolume) => {
    try {
      if (!marketCap || !totalSupply || !balance) return "N/A";

      // Check totalVolume
      const volume = parseFloat(totalVolume);
      if (volume <= 0) return "N/A";

      // marketCap is already in USD
      const marketCapUSD = parseFloat(marketCap);

      // Convert totalSupply to normal number
      const totalSupplyAmount = parseFloat(totalSupply);

      // Convert balance from Wei to normal value
      const balanceAmount = parseFloat(formatEther(balance));

      if (totalSupplyAmount === 0) return "N/A";

      // First calculate coin price
      const price = marketCapUSD / totalSupplyAmount;

      // Total value = Price * Balance
      const value = price * balanceAmount;

      // Format value
      return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } catch (error) {
      console.error("Value calculation error:", error);
      return "N/A";
    }
  };

  // Name truncation function
  const truncateName = (name, limit = 15) => {
    if (!name) return "";
    return name.length > limit ? `${name.substring(0, limit)}...` : name;
  };

  // Filter tokens based on active tab and search query
  const filterTokens = () => {
    if (!balances?.coinBalances?.edges) return [];

    let filteredTokens = [];

    if (activeTab === "created") {
      // Get all wallet addresses from linkedWallets
      const userWallets = profile?.linkedWallets?.edges
        ? profile.linkedWallets.edges
            .map((edge) => edge.node?.walletAddress?.toLowerCase())
            .filter(Boolean)
        : [];

      // Include current wallet if not already included
      if (walletAddress && !userWallets.includes(walletAddress.toLowerCase())) {
        userWallets.push(walletAddress.toLowerCase());
      }

      // Filter tokens created by any of the user's wallets
      filteredTokens = balances.coinBalances.edges.filter((edge) => {
        const creatorAddress = edge.node?.coin?.creatorAddress?.toLowerCase();
        return creatorAddress && userWallets.includes(creatorAddress);
      });
    } else {
      filteredTokens = balances.coinBalances.edges;
    }

    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return filteredTokens.filter((edge) => {
        const coin = edge.node?.coin;
        return (
          coin?.name?.toLowerCase().includes(query) ||
          coin?.symbol?.toLowerCase().includes(query) ||
          coin?.address?.toLowerCase().includes(query) ||
          (coin?.description && coin.description.toLowerCase().includes(query))
        );
      });
    }

    return filteredTokens;
  };

  // Calculate total values for summary
  const calculateTotalValue = () => {
    if (
      !balances?.coinBalances?.edges ||
      balances.coinBalances.edges.length === 0
    )
      return "$0.00";

    let totalValue = 0;

    balances.coinBalances.edges.forEach((edge) => {
      const value = calculateValue(
        edge.node?.coin?.marketCap,
        edge.node?.coin?.totalSupply,
        edge.node?.balance,
        edge.node?.coin?.totalVolume
      );

      // Skip "N/A" values
      if (value === "N/A") return;

      totalValue += parseFloat(value.replace("$", ""));
    });

    return `$${totalValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Count created tokens - Checking against all linked wallets
  const countCreatedTokens = () => {
    if (!balances?.coinBalances?.edges) return 0;

    // If profile doesn't have linkedWallets, just use the current walletAddress
    if (
      !profile?.linkedWallets?.edges ||
      profile.linkedWallets.edges.length === 0
    ) {
      return balances.coinBalances.edges.filter(
        (edge) =>
          edge.node?.coin?.creatorAddress?.toLowerCase() ===
          walletAddress?.toLowerCase()
      ).length;
    }

    // Get all wallet addresses from linkedWallets
    const userWallets = profile.linkedWallets.edges
      .map((edge) => edge.node?.walletAddress?.toLowerCase())
      .filter(Boolean);

    // Also include the current wallet address if not in linkedWallets
    if (!userWallets.includes(walletAddress?.toLowerCase()) && walletAddress) {
      userWallets.push(walletAddress.toLowerCase());
    }

    // Count tokens created by any of the user's wallets
    return balances.coinBalances.edges.filter(
      (edge) =>
        edge.node?.coin?.creatorAddress &&
        userWallets.includes(edge.node.coin.creatorAddress.toLowerCase())
    ).length;
  };

  // Count total tokens
  const countTotalTokens = () => {
    if (!balances?.coinBalances?.edges) return 0;
    return balances.coinBalances.edges.length;
  };

  // Get total earnings - Updated to handle the new creatorEarnings structure
  const getTotalEarnings = () => {
    if (
      !balances?.coinBalances?.edges ||
      balances.coinBalances.edges.length === 0
    )
      return "$0.00";

    let totalEarnings = 0;

    // Get all wallet addresses if profile is available
    const userWallets = profile?.linkedWallets?.edges
      ? profile.linkedWallets.edges
          .map((edge) => edge.node?.walletAddress?.toLowerCase())
          .filter(Boolean)
      : [];

    // Include current wallet if not already included
    if (walletAddress && !userWallets.includes(walletAddress.toLowerCase())) {
      userWallets.push(walletAddress.toLowerCase());
    }

    balances.coinBalances.edges.forEach((edge) => {
      // Check if token was created by any of the user's wallets
      const isCreatedByUser =
        edge.node?.coin?.creatorAddress &&
        (userWallets.length > 0
          ? userWallets.includes(edge.node.coin.creatorAddress.toLowerCase())
          : edge.node.coin.creatorAddress.toLowerCase() ===
            walletAddress?.toLowerCase());

      // Only calculate for tokens created by user
      if (isCreatedByUser) {
        const earnings = edge.node?.coin?.creatorEarnings || [];
        earnings.forEach((earning) => {
          // Handle the new structure: check if amountUsd exists directly or in a nested structure
          let earningUsd = 0;
          if (typeof earning === "object") {
            if (earning.amountUsd) {
              // Direct amountUsd property
              earningUsd = parseFloat(earning.amountUsd || "0");
            } else if (earning.amount && earning.amount.amountDecimal) {
              // If amountUsd is not available, try using amountDecimal
              earningUsd = parseFloat(earning.amount.amountDecimal || "0");
            }
          } else if (typeof earning === "string") {
            // If earning is directly a string (old format)
            earningUsd = parseFloat(earning || "0");
          }

          if (!isNaN(earningUsd)) {
            totalEarnings += earningUsd;
          }
        });
      }
    });

    return `$${totalEarnings.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Get description for token
  const getTokenDescription = (coin) => {
    return coin?.description || "No description available";
  };

  // Render token card
  const renderTokenCard = (edge, index) => {
    const coin = edge.node?.coin;
    const imageUrl = coin?.mediaContent?.previewImage?.small;

    // Card style with gradient based on whether it's created by the user
    const isCreatedByUser =
      coin?.creatorAddress?.toLowerCase() === walletAddress?.toLowerCase();
    const cardGradient = isCreatedByUser
      ? "backdrop-blur-lg border-indigo-200/50 dark:border-indigo-800/30"
      : "backdrop-blur-lg border-gray-200/50 dark:border-gray-700/30";

    return (
      <div
        key={index}
        className={`rounded-xl shadow-sm hover:shadow-md transition-all p-4 cursor-pointer ${cardGradient} border dark:bg-gray-900/10`}
        onClick={() => router.push(`/coin/${coin?.address}`)}
      >
        <div className="flex items-center gap-3 mb-3">
          {imageUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-3">
              <img
                src={imageUrl}
                alt={coin?.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.95-11h3.9v1.5h-3.9v3.9h-1.5v-3.9h-3.9v-1.5h3.9v-3.9h1.5v3.9z" />
              </svg>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {truncateName(coin?.name) || "Anonymous Token"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ${truncateName(coin?.symbol)}
            </p>
          </div>
          {isCreatedByUser && (
            <span className="ml-auto px-2 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-xs rounded-full">
              Creator
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm p-2 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Value</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {calculateValue(
                coin?.marketCap,
                coin?.totalSupply,
                edge.node?.balance,
                coin?.totalVolume
              )}
            </p>
          </div>
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm p-2 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatBalance(edge.node?.balance)}
            </p>
          </div>
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm p-2 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Market Cap
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatMarketCap(coin?.marketCap)}
            </p>
          </div>
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm p-2 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Volume</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatVolume(coin?.totalVolume)}
            </p>
          </div>
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm p-2 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Holders</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {coin?.uniqueHolders || 0}
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <a
            href={`https://basescan.org/token/${coin?.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-full bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            title="Basescan"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </a>
          <a
            href={`https://zora.co/coin/base:${coin?.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-full bg-indigo-50/50 dark:bg-indigo-900/30 border border-indigo-100/50 dark:border-indigo-800/30 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            title="Zora"
          >
            <img src="/images/zora.png" alt="Zora Logo" className="w-4 h-4" />
          </a>
          <a
            href={`https://dexscreener.com/base/${coin?.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-full bg-blue-50/50 dark:bg-blue-900/30 border border-blue-100/50 dark:border-blue-800/30 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            title="Dexscreener"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
            </svg>
          </a>
        </div>
      </div>
    );
  };

  // Sorting logic
  const handleSort = (field) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, set as ascending by default
      setSortField(field);
      setSortDirection("asc");
    }
    // Reset to page 1 when sorting changes
    setCurrentPage(1);
  };

  // Get sorted tokens
  const getSortedTokens = (tokens) => {
    if (!tokens || tokens.length === 0) return [];

    return [...tokens].sort((a, b) => {
      let valueA, valueB;

      switch (sortField) {
        case "name":
          valueA = a.node?.coin?.name || "";
          valueB = b.node?.coin?.name || "";
          return sortDirection === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);

        case "balance":
          valueA = a.node?.balance
            ? parseFloat(formatEther(a.node.balance))
            : 0;
          valueB = b.node?.balance
            ? parseFloat(formatEther(b.node.balance))
            : 0;
          return sortDirection === "asc" ? valueA - valueB : valueB - valueA;

        case "marketCap":
          valueA = parseFloat(a.node?.coin?.marketCap || 0);
          valueB = parseFloat(b.node?.coin?.marketCap || 0);

          // Handle invalid values
          if (isNaN(valueA)) valueA = 0;
          if (isNaN(valueB)) valueB = 0;

          return sortDirection === "asc" ? valueA - valueB : valueB - valueA;

        case "volume":
          valueA = parseFloat(a.node?.coin?.totalVolume || 0);
          valueB = parseFloat(b.node?.coin?.totalVolume || 0);

          // Handle invalid values
          if (isNaN(valueA)) valueA = 0;
          if (isNaN(valueB)) valueB = 0;

          return sortDirection === "asc" ? valueA - valueB : valueB - valueA;

        case "value":
          // Direct calculation of values for sorting to avoid string formatting issues
          try {
            // For token A
            let valA = 0;
            if (
              a.node?.coin?.marketCap &&
              a.node?.coin?.totalSupply &&
              a.node?.balance &&
              parseFloat(a.node?.coin?.totalVolume) > 0
            ) {
              const marketCapA = parseFloat(a.node.coin.marketCap);
              const totalSupplyA = parseFloat(a.node.coin.totalSupply);
              const balanceA = parseFloat(formatEther(a.node.balance));

              if (totalSupplyA > 0) {
                const priceA = marketCapA / totalSupplyA;
                valA = priceA * balanceA;
              }
            }

            // For token B
            let valB = 0;
            if (
              b.node?.coin?.marketCap &&
              b.node?.coin?.totalSupply &&
              b.node?.balance &&
              parseFloat(b.node?.coin?.totalVolume) > 0
            ) {
              const marketCapB = parseFloat(b.node.coin.marketCap);
              const totalSupplyB = parseFloat(b.node.coin.totalSupply);
              const balanceB = parseFloat(formatEther(b.node.balance));

              if (totalSupplyB > 0) {
                const priceB = marketCapB / totalSupplyB;
                valB = priceB * balanceB;
              }
            }

            return sortDirection === "asc" ? valA - valB : valB - valA;
          } catch (error) {
            console.error("Error during value sorting:", error);
            return 0;
          }

        default:
          return 0;
      }
    });
  };

  // Updated filter tokens to include sorting
  const filterAndSortTokens = () => {
    const filtered = filterTokens();
    return getSortedTokens(filtered);
  };

  // Pagination logic with sorting - Always paginate regardless of load status
  const paginatedTokens = () => {
    const filteredAndSortedTokens = filterAndSortTokens();

    // Always apply pagination
    const startIndex = (currentPage - 1) * tokensPerPage;
    const endIndex = startIndex + tokensPerPage;
    return filteredAndSortedTokens.slice(startIndex, endIndex);
  };

  const totalPages = () => {
    const filteredTokens = filterTokens();
    return Math.ceil(filteredTokens.length / tokensPerPage);
  };

  // Reset to page 1 when tab changes, sort changes, or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortField, sortDirection, searchQuery]);

  // Render loading placeholder
  const renderLoadingPlaceholder = () => {
    if (
      balances &&
      balances.coinBalances &&
      balances.coinBalances.edges.length > 0
    ) {
      return (
        <div className="flex flex-col items-center py-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-500 relative"
              style={{ width: `${loadingProgress}%` }}
            >
              <div
                className="absolute inset-0 bg-white/30 dark:bg-white/10 overflow-hidden"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)",
                  backgroundSize: "1rem 1rem",
                  animation: "progress-bar-stripes 1s linear infinite",
                }}
              ></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading tokens... {loadingProgress}%</span>
          </p>
          <div className="text-gray-500 dark:text-gray-500 text-xs mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <span>
              Loaded {balances.coinBalances.edges.length} tokens so far
            </span>
            {!loadedAllPages && (
              <span className="flex items-center">
                <span className="mx-2 hidden sm:inline">•</span>
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium leading-none bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-full">
                  Data stream in progress
                </span>
              </span>
            )}
          </div>
          <style jsx>{`
            @keyframes progress-bar-stripes {
              0% {
                background-position: 1rem 0;
              }
              100% {
                background-position: 0 0;
              }
            }
          `}</style>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
            Loading Token Data...
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs max-w-sm text-center">
            This operation may take a while depending on the number of tokens
            you own. Please wait...
          </p>
        </div>
      </div>
    );
  };

  // Format Market Cap
  const formatMarketCap = (marketCap) => {
    if (!marketCap) return "N/A";

    const num = parseFloat(marketCap);
    if (isNaN(num)) return "N/A";

    // For large numbers use K, M, B notation
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  // Format Volume
  const formatVolume = (volume) => {
    if (!volume) return "N/A";

    const num = parseFloat(volume);
    if (isNaN(num)) return "N/A";

    // For large numbers use K, M, B notation
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  return (
    <div className="backdrop-blur-lg dark:bg-gray-900/20 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/30 p-4 relative z-0">
      <div className="flex flex-col space-y-6">
        {/* Header with Stats and Actions */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-grow">
            {/* Total Token Value */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 p-4 rounded-xl backdrop-blur-sm">
              <h3 className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Portfolio Value
              </h3>
              <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                {isLoading && !balances ? "Loading..." : calculateTotalValue()}
              </p>
            </div>

            {/* Total Tokens Held */}
            <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 p-4 rounded-xl backdrop-blur-sm">
              <h3 className="text-xs text-green-600 dark:text-green-400 font-medium">
                Total Coins
              </h3>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">
                {isLoading && !balances ? "Loading..." : countTotalTokens()}
              </p>
            </div>

            {/* Created Token Count */}
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 rounded-xl backdrop-blur-sm">
              <h3 className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Created Coins
              </h3>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {isLoading && !balances ? "Loading..." : countCreatedTokens()}
              </p>
            </div>

            {/* Total Earnings */}
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-4 rounded-xl backdrop-blur-sm">
              <h3 className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Total Earnings
              </h3>
              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                {isLoading && !balances ? "Loading..." : getTotalEarnings()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={() => refreshData && refreshData()}
              className={`w-10 h-10 flex items-center justify-center ${
                isLoading
                  ? "bg-gray-100/50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-200/50 dark:hover:bg-blue-800/30"
              } rounded-lg transition-colors backdrop-blur-sm`}
              disabled={isLoading}
              title="Refresh"
            >
              <svg
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* View Toggle */}
            <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-1 flex items-center backdrop-blur-sm">
              <button
                onClick={() => setViewMode("table")}
                className={`w-9 h-9 rounded flex items-center justify-center ${
                  viewMode === "table"
                    ? "bg-white/70 dark:bg-gray-700/70 text-gray-800 dark:text-gray-200 shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                title="Table View"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 10h18M3 14h18M3 18h18M3 6h18" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`w-9 h-9 rounded flex items-center justify-center ${
                  viewMode === "card"
                    ? "bg-white/70 dark:bg-gray-700/70 text-gray-800 dark:text-gray-200 shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                title="Card View"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar and Tabs */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Search Input */}

          {/* Tabs - moved to separate line on mobile */}
          <div className="border-b border-gray-200/50 dark:border-gray-800/30 w-full sm:w-auto">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("all")}
                className={`${
                  activeTab === "all"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                All Coins
              </button>
              <button
                onClick={() => setActiveTab("created")}
                className={`${
                  activeTab === "created"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Created Coins
              </button>
            </nav>
          </div>
          <div className="w-full sm:w-1/2 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block  p-2.5 pl-10 text-sm bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg outline-none  backdrop-blur-sm w-full"
              placeholder="Search coins..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-2 flex items-center"
                title="Clear search"
              >
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Loading Placeholder or Error Message */}
        {isLoading && !balances && renderLoadingPlaceholder()}
        {isLoading &&
          balances &&
          balances.coinBalances.pageInfo.hasNextPage &&
          renderLoadingPlaceholder()}

        {loadError && (
          <div
            className={`${
              loadError.startsWith("_ERROR_:")
                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                : loadError.startsWith("_LOADING_INFO_:")
                ? "bg-blue-50/70 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400"
                : "bg-amber-50/70 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400"
            } p-6 rounded-lg my-6`}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                {loadError.startsWith("_ERROR_:") ? (
                  <>
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold">
                      Data Loading Error
                    </h3>
                  </>
                ) : loadError.startsWith("_LOADING_INFO_:") ? (
                  <>
                    <svg
                      className="w-6 h-6 text-blue-500 animate-pulse"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold">Data Loading</h3>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6 text-amber-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold">Data Status</h3>
                  </>
                )}
              </div>
              <p>
                {loadError.startsWith("_ERROR_:")
                  ? loadError.replace("_ERROR_:", "")
                  : loadError.startsWith("_LOADING_INFO_:")
                  ? loadError.replace("_LOADING_INFO_:", "")
                  : loadError}
              </p>

              {loadError.startsWith("_ERROR_:") && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => refreshData && refreshData()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Reloading...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span>Retry</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    Refresh Page
                  </button>
                </div>
              )}

              {loadError.startsWith("_LOADING_INFO_:") && (
                <div className="w-full bg-blue-200/50 dark:bg-blue-800/20 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500 relative"
                    style={{ width: `${loadingProgress}%` }}
                  >
                    <div
                      className="absolute inset-0 bg-white/30 dark:bg-white/10 overflow-hidden"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)",
                        backgroundSize: "1rem 1rem",
                        animation: "progress-bar-stripes 1s linear infinite",
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Display search results status if searching */}
        {searchQuery && balances && balances.coinBalances && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filterTokens().length === 0 ? (
              <p>No coins found matching "{searchQuery}"</p>
            ) : (
              <p>
                Found {filterTokens().length} coins matching "{searchQuery}"
              </p>
            )}
          </div>
        )}

        {/* Token List - Table View */}
        {balances &&
          balances.coinBalances &&
          balances.coinBalances.edges.length > 0 &&
          viewMode === "table" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/30">
                <thead>
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Coin
                        {sortField === "name" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleSort("value")}
                    >
                      <div className="flex items-center">
                        Value
                        {sortField === "value" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleSort("balance")}
                    >
                      <div className="flex items-center">
                        Balance
                        {sortField === "balance" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleSort("marketCap")}
                    >
                      <div className="flex items-center">
                        Market Cap
                        {sortField === "marketCap" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleSort("volume")}
                    >
                      <div className="flex items-center">
                        Volume
                        {sortField === "volume" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/30">
                  {paginatedTokens().map((edge, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50/30 dark:hover:bg-gray-700/30 transition-colors cursor-pointer backdrop-blur-sm"
                      onClick={() =>
                        router.push(`/coin/${edge.node?.coin?.address}`)
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {edge.node?.coin?.mediaContent?.previewImage
                            ?.small && (
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-3">
                              <img
                                src={
                                  edge.node.coin.mediaContent.previewImage.small
                                }
                                alt={edge.node.coin.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-xs md:text-sm text-gray-900 dark:text-white">
                              {truncateName(edge.node?.coin?.name)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ${truncateName(edge.node?.coin?.symbol)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs md:text-sm text-gray-900 dark:text-white">
                        {calculateValue(
                          edge.node?.coin?.marketCap,
                          edge.node?.coin?.totalSupply,
                          edge.node?.balance,
                          edge.node?.coin?.totalVolume
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs md:text-sm text-gray-900 dark:text-white">
                        {formatBalance(edge.node?.balance)}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-xs md:text-sm text-gray-900 dark:text-white">
                        {formatMarketCap(edge.node?.coin?.marketCap)}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-xs md:text-sm text-gray-900 dark:text-white">
                        {formatVolume(edge.node?.coin?.totalVolume)}
                      </td>
                      <td className="px-2 md:px-6 py-4">
                        <div className="flex gap-2">
                          <a
                            href={`https://basescan.org/token/${edge.node?.coin?.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-full bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                            title="Basescan"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                            </svg>
                          </a>
                          <a
                            href={`https://zora.co/coin/base:${edge.node?.coin?.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-full bg-indigo-50/50 dark:bg-indigo-900/30 border border-indigo-100/50 dark:border-indigo-800/30 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                            title="Zora"
                          >
                            <img
                              src="/images/zora.png"
                              alt="Zora Logo"
                              className="w-4 h-4"
                            />
                          </a>
                          <a
                            href={`https://dexscreener.com/base/${edge.node?.coin?.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-full bg-blue-50/50 dark:bg-blue-900/30 border border-blue-100/50 dark:border-blue-800/30 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                            title="Dexscreener"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
                            </svg>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filterTokens().length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    {activeTab === "all"
                      ? "No coins found"
                      : "No created coins found"}
                  </p>
                </div>
              )}
            </div>
          )}

        {/* Boş Token Tablosu ve Hata Durumu */}
        {(!balances ||
          !balances.coinBalances ||
          balances.coinBalances.edges.length === 0) &&
          loadError &&
          viewMode === "table" && (
            <div className="text-center py-12 bg-white/30 dark:bg-gray-900/20 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/30">
              <div className="flex flex-col items-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400">
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-center max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Token Verisi Yüklenemedi
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Token verilerini çekerken bir sorun oluştu. Sunucu hatası
                    veya rate limit nedeniyle veri getirilemedi.
                  </p>
                  <button
                    onClick={() => refreshData && refreshData()}
                    className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span>Verileri Yenile</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Token List - Card View */}
        {balances &&
          balances.coinBalances &&
          balances.coinBalances.edges.length > 0 &&
          viewMode === "card" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2">
              {paginatedTokens().map((edge, index) =>
                renderTokenCard(edge, index)
              )}

              {filterTokens().length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    {activeTab === "all"
                      ? "No coins found"
                      : "No created coins found"}
                  </p>
                </div>
              )}
            </div>
          )}

        {/* Boş Card Durumu ve Hata */}
        {(!balances ||
          !balances.coinBalances ||
          balances.coinBalances.edges.length === 0) &&
          loadError &&
          viewMode === "card" && (
            <div className="bg-white/30 dark:bg-gray-900/20 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/30 p-8 text-center">
              <div className="flex flex-col items-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400">
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-center max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Token Verisi Yüklenemedi
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Token verilerini çekerken bir sorun oluştu. Sunucu hatası
                    veya rate limit nedeniyle veri getirilemedi.
                  </p>
                  <button
                    onClick={() => refreshData && refreshData()}
                    className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span>Verileri Yenile</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Pagination - Show whenever we have tokens, regardless of loading status */}
        {balances &&
          balances.coinBalances &&
          balances.coinBalances.edges.length > 0 &&
          totalPages() > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isLoading && !loadedAllPages
                    ? `Showing page ${currentPage} of the tokens loaded so far...`
                    : `Showing page ${currentPage} of ${totalPages()}`}
                </p>
              </div>
              <nav className="flex items-center gap-2" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center justify-center w-10 h-10 rounded-md border ${
                    currentPage === 1
                      ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Page number display */}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {currentPage} / {totalPages()}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages(), p + 1))
                  }
                  disabled={currentPage === totalPages()}
                  className={`flex items-center justify-center w-10 h-10 rounded-md border ${
                    currentPage === totalPages()
                      ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          )}
      </div>
    </div>
  );
}

export default TokenTable;
