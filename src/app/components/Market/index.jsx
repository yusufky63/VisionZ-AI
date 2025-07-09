'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  fetchTopGainers,
  fetchTopVolume,
  fetchMostValuable,
  fetchNewCoins,
  fetchLastTraded,
  fetchLastTradedUnique,
  fetchWithRetry
} from "../../services/sdk/getMarket";
import { CoinService } from "../../services/coinService";

import TableView from "./TableView";
import GridView from "./GridView";
import MasonryView from "./MasonryView";
import CategoryScroll from "./CategoryScroll";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import NoResults from "./NoResults";

// Liste tiplerini tanımla
const LIST_TYPES = [
  { id: "PLATFORM_COINS", name: "Platform Coins", fn: null, isPlatform: true },
  { id: "TOP_GAINERS", name: "Top Gainers", fn: fetchTopGainers },
  { id: "TOP_VOLUME_24H", name: "Top Volume 24h", fn: fetchTopVolume },
  { id: "MOST_VALUABLE", name: "Most Valuable", fn: fetchMostValuable },
  { id: "NEW", name: "New Coins", fn: fetchNewCoins },
  { id: "LAST_TRADED", name: "Last Traded", fn: fetchLastTraded },
  {
    id: "LAST_TRADED_UNIQUE",
    name: "Last Traded Unique",
    fn: fetchLastTradedUnique,
  },
];

function MarketPage() {
  const router = useRouter();
  const [activeListType, setActiveListType] = useState("ALL");
  const [viewStyle, setViewStyle] = useState("masonry");
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [endCursor, setEndCursor] = useState(null);
  const [hasMoreCoins, setHasMoreCoins] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchResults, setIsSearchResults] = useState(false);
  const [categoryCoins, setCategoryCoins] = useState({});
  const [platformCoins, setPlatformCoins] = useState([]);
  const [platformStats, setPlatformStats] = useState({ totalCoins: 0, totalCreators: 0 });
  const loadingRef = useRef(null);

  // URL'den arama terimini al
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const search = query.get("search");

    if (search) {
      setSearchTerm(search);
      setIsSearchResults(true);
      loadCoins(activeListType, search);
    } else {
      setIsSearchResults(false);
      loadCoins(activeListType);
    }
  }, []);

  // Aktif liste değiştiğinde coinleri yükle
  useEffect(() => {
    loadCoins(activeListType, searchTerm);
  }, [activeListType]);

  // Platform coins yüklendiğinde coins state'ini güncelle
  useEffect(() => {
    if (activeListType === "PLATFORM_COINS") {
      setCoins(platformCoins);
    }
  }, [platformCoins, activeListType]);

  // Her kategori için coinleri yükle
  useEffect(() => {
    if (activeListType === "ALL") {
      LIST_TYPES.forEach(async (type) => {
        try {
          if (type.isPlatform) {
            // Platform coins için özel handling
            const formattedPlatformCoins = await loadPlatformCoinsData("");
            // Sadece ilk 10 tanesini al
            const limitedCoins = formattedPlatformCoins.slice(0, 10);
            
            setCategoryCoins((prev) => ({
              ...prev,
              [type.id]: limitedCoins,
            }));
          } else {
            const response = await fetchWithRetry(type.fn, {
              count: 10,
              chainId: 8453,
            });

            if (response?.data?.exploreList?.edges) {
              setCategoryCoins((prev) => ({
                ...prev,
                [type.id]: response.data.exploreList.edges,
              }));
            }
          }
        } catch (error) {
          console.error(`Error loading ${type.id}:`, error);
        }
      });
    }
  }, [activeListType]);

  const navigateToCoinDetails = (address) => {
    router.push(`/coin/${address}`);
  };

  const calculatePercentageChange = (currentMarketCap, delta24h) => {
    if (!currentMarketCap || !delta24h) return null;

    const current = parseFloat(currentMarketCap);
    const delta = parseFloat(delta24h);
    const previous = current - delta;

    if (previous <= 0) return 100;
    return (delta / previous) * 100;
  };

  // Platform coin'lerini yükle ve return et
  const loadPlatformCoinsData = async (searchQuery = "") => {
    try {
      console.log("🔄 Loading platform coins...");
      
      const params = {
        limit: 50,
        ...(searchQuery && { search: searchQuery })
      };
      
      const platformData = await CoinService.getPlatformCoins(params);
      
      // Platform verilerini Zora formatına dönüştür
      const formattedPlatformCoins = platformData.map(coin => ({
        node: {
          // Temel coin bilgileri
          name: coin.name,
          symbol: coin.symbol,
          description: coin.description,
          address: coin.contract_address,
          createdAt: coin.created_at,
          creatorAddress: coin.creator_address,
          chainId: coin.chain_id,
          
          // Market verileri
          marketCap: "0",
          marketCapDelta24h: "0",
          volume24h: "0",
          totalVolume: "0",
          totalSupply: "1000000000", // Default value
          
          // Creator profili (platform için basit format)
          creatorProfile: {
            handle: coin.creator_name && coin.creator_name !== coin.creator_address 
              ? coin.creator_name 
              : `${coin.creator_address.substring(0, 6)}...${coin.creator_address.slice(-4)}`,
            avatar: {
              previewImage: {
                small: null, // Platform'da creator avatar yok
                medium: null
              }
            }
          },
          
          // Media content (coin image)
          mediaContent: {
            mimeType: "image/jpeg",
            originalUri: coin.image_url,
            previewImage: {
              small: coin.image_url,
              medium: coin.image_url,
              blurhash: ""
            }
          },
          
          // Holder bilgileri
          uniqueHolders: 1, // Platform coin'leri için default
          
          // Platform coin identifier
          isPlatformCoin: true,
          
          // Eski format compatibility
          imageUrl: coin.image_url,
          holders: 1
        }
      }));

      // State'leri de güncelle
      setPlatformCoins(formattedPlatformCoins);
      
      // İstatistikleri de yükle
      const stats = await CoinService.getPlatformStats();
      setPlatformStats(stats);
      
      console.log(`✅ Loaded ${formattedPlatformCoins.length} platform coins`);
      return formattedPlatformCoins;
    } catch (error) {
      console.error("❌ Error loading platform coins:", error);
      setError({
        message: "Error loading platform coins. Please try again later.",
        type: "error",
      });
      return [];
    }
  };

  // Coinleri yükle
  const loadCoins = async (listTypeParam, searchQuery = "") => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // Platform coins özel durumu
      if (listTypeParam === "PLATFORM_COINS") {
        console.log("📋 Loading Platform Coins tab...");
        const platformData = await loadPlatformCoinsData(searchQuery);
        console.log("📋 Platform coins loaded:", platformData.length, "coins");
        setCoins(platformData);
        setEndCursor(null);
        setHasMoreCoins(false);
        setLoading(false);
        return;
      }

      const selectedType =
        LIST_TYPES.find((type) => type.id === listTypeParam) || LIST_TYPES[1]; // Skip platform coins for default

      const response = await fetchWithRetry(selectedType.fn, {
        count: 50,
        after: null,
        chainId: 8453,
      });

      if (!response?.data?.exploreList?.edges) {
        throw new Error("Invalid API response format");
      }

      let filteredResults = response.data.exploreList.edges;

      if (searchQuery) {
        filteredResults = filteredResults.filter(
          (edge) =>
            edge.node.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            edge.node.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (filteredResults.length === 0 && searchQuery) {
        setError({
          message: `No results found for "${searchQuery}".`,
          type: "warning",
        });
      }

      setCoins(filteredResults);
      setEndCursor(response.data.exploreList.pageInfo?.endCursor || null);
      setHasMoreCoins(response.data.exploreList.pageInfo?.hasNextPage || false);
    } catch (error) {
      console.error("Coin loading error:", error);
      setError({
        message: "Error loading coins. Please try again later.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMoreCoins = async () => {
    if (!hasMoreCoins || loading || loadingMore || !endCursor) return;

    setLoadingMore(true);

    try {
      const selectedType =
        LIST_TYPES.find((type) => type.id === activeListType) || LIST_TYPES[0];

      const response = await fetchWithRetry(selectedType.fn, {
        count: 20,
        after: endCursor,
        chainId: 8453,
      });

      if (response?.data?.exploreList?.edges) {
        let newResults = response.data.exploreList.edges;

        if (searchTerm) {
          newResults = newResults.filter(
            (edge) =>
              edge.node.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              edge.node.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setCoins((prevCoins) => [...prevCoins, ...newResults]);
        setEndCursor(response.data.exploreList.pageInfo?.endCursor || null);
        setHasMoreCoins(
          response.data.exploreList.pageInfo?.hasNextPage || false
        );
      } else {
        setHasMoreCoins(false);
      }
    } catch (error) {
      console.error("More coins loading error:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries;
      if (target.isIntersecting && !loading && !loadingMore && hasMoreCoins) {
        loadMoreCoins();
      }
    },
    [loading, loadingMore, hasMoreCoins]
  );

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "200px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(handleObserver, options);

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [handleObserver]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-end items-center mb-6">
        {/* View Style Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewStyle("table")}
            className={`p-2 rounded-lg ${
              viewStyle === "table"
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title="Table View"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </button>
          <button
            onClick={() => setViewStyle("grid")}
            className={`p-2 rounded-lg ${
              viewStyle === "grid"
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title="Grid View"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z"
              />
            </svg>
          </button>
          <button
            onClick={() => setViewStyle("masonry")}
            className={`p-2 rounded-lg ${
              viewStyle === "masonry"
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title="Masonry View"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Categories */}
      {!isSearchResults && (
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
            {/* ALL Categories Button */}
            <button
              onClick={() => setActiveListType("ALL")}
              className={`relative p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-200 shadow-sm border border-gray-200 dark:border-gray-800 group focus:outline-none focus:ring-2 focus:ring-indigo-400/40
                ${activeListType === "ALL"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-2 ring-indigo-400/30"
                  : "bg-white dark:bg-gray-900/20 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400"}
              `}
            >
              <div className="flex justify-center mb-2">
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xs md:text-sm font-medium">All Categories</h3>
                {activeListType === "ALL" && (
                  <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-indigo-500 dark:bg-indigo-400"></div>
                )}
              </div>
              {activeListType === "ALL" && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400"></div>
                </div>
              )}
            </button>

            {/* Other Category Buttons */}
            {LIST_TYPES.map((listType) => (
              <button
                key={listType.id}
                onClick={() => setActiveListType(listType.id)}
                className={`relative p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-200 shadow-sm border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/40
                  ${activeListType === listType.id
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-2 ring-indigo-400/30"
                    : "bg-white dark:bg-gray-900/20 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400"}
                `}
              >
                <div className="flex justify-center mb-2">
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {listType.id === "PLATFORM_COINS" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"
                      />
                    )}
                    {listType.id === "TOP_GAINERS" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    )}
                    {listType.id === "TOP_VOLUME_24H" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    )}
                    {listType.id === "MOST_VALUABLE" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    )}
                    {listType.id === "NEW" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    )}
                    {listType.id === "LAST_TRADED" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    )}
                    {listType.id === "LAST_TRADED_UNIQUE" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    )}
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-xs md:text-sm font-medium">{listType.name}</h3>
                  {activeListType === listType.id && (
                    <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-indigo-500 dark:bg-indigo-400"></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* ALL Categories View with Auto-Scrolling */}
          {activeListType === "ALL" && (
            <div className="space-y-8 mt-8">
              {LIST_TYPES.map((listType, index) => (
                <div key={listType.id} className="relative">
                  <CategoryScroll
                    listType={listType}
                    index={index}
                    categoryCoins={categoryCoins}
                    navigateToCoinDetails={navigateToCoinDetails}
                    calculatePercentageChange={calculatePercentageChange}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingState isSearchResults={isSearchResults} />}

      {/* Error State */}
      {error && (
        <ErrorState
          error={error}
          onRetry={() =>
            isSearchResults
              ? loadCoins(activeListType, searchTerm)
              : loadCoins(activeListType)
          }
          isSearchResults={isSearchResults}
        />
      )}

      {/* Coin List - Different View Styles */}
      {!loading && !error && coins.length > 0 && activeListType !== "ALL" && (
        <>
          {viewStyle === "table" && (
            <TableView
              coins={coins}
              navigateToCoinDetails={navigateToCoinDetails}
              calculatePercentageChange={calculatePercentageChange}
            />
          )}

          {viewStyle === "grid" && (
            <GridView
              coins={coins}
              navigateToCoinDetails={navigateToCoinDetails}
              calculatePercentageChange={calculatePercentageChange}
            />
          )}

          {viewStyle === "masonry" && (
            <MasonryView
              coins={coins}
              navigateToCoinDetails={navigateToCoinDetails}
              calculatePercentageChange={calculatePercentageChange}
            />
          )}

          {/* Sonsuz Kaydırma için Yükleme Göstergesi */}
          <div ref={loadingRef} className="h-10" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          )}
        </>
      )}

      {/* No Results */}
      {!loading && !error && coins.length === 0 && (
        <NoResults isSearchResults={isSearchResults} searchTerm={searchTerm} />
      )}
    </div>
  );
}

export default MarketPage;
