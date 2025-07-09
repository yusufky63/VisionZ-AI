'use client';

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { getCoinsMostValuable, getCoinsTopGainers } from "@zoralabs/coins-sdk";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import WatchlistButton from "./WatchlistButton";
import { useWatchlist } from "../context/WatchlistContext";

// In-memory cache (SSR-safe)
let memoryCache = {
  data: null,
  timestamp: 0,
  isLoading: false
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// SSR-safe cache functions
const getFromMemoryCache = () => {
  if (!memoryCache.data || !memoryCache.timestamp) return null;
  
  if (Date.now() - memoryCache.timestamp > CACHE_DURATION) {
    memoryCache = { data: null, timestamp: 0, isLoading: false };
    return null;
  }
  return memoryCache.data;
};

const setToMemoryCache = (data) => {
  memoryCache = {
    data,
    timestamp: Date.now(),
    isLoading: false
  };
};

const setCacheLoading = (loading) => {
  memoryCache.isLoading = loading;
};

const isCacheLoading = () => {
  return memoryCache.isLoading;
};

// Price formatting function - memoized
const formatNumber = (number) => {
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return number.toFixed(1);
};

// Name shortening function - memoized
const shortenName = (name) => {
  if (!name) return '';
  if (name.length <= 8) return name;
  const words = name.split(' ');
  if (words.length > 1) {
    return words.map(w => w[0]).join('').toUpperCase();
  }
  return `${name.slice(0, 6)}..`;
};

// New icon functions
const getPriceChangeIcon = (change) => {
  const changeValue = parseFloat(change);
  return changeValue >= 0 ? "▲" : "▼";
};

// Calculate percentage change
const calculatePercentChange = (marketCap, marketCapDelta) => {
  const currentMarketCap = parseFloat(marketCap || 0);
  const deltaValue = parseFloat(marketCapDelta || 0);
  
  // Value 24 hours ago
  const previousMarketCap = deltaValue < 0 
    ? currentMarketCap - deltaValue  // Addition for negative delta
    : currentMarketCap - deltaValue; // Subtraction for positive delta
  
  // Cannot calculate percentage if previous value is 0
  if (previousMarketCap <= 0) return 0;
  
  // Calculate percentage change
  return (deltaValue / previousMarketCap) * 100;
};

// Color selection function
const getPriceChangeColor = (change) => {
  const changeValue = parseFloat(change);
  return changeValue >= 0 ? "text-green-400" : "text-red-400";
};

// Separate coin card component - reusable
const CoinCard = memo(({ coin, onClick }) => {
  // Prop destructuring and value calculations
  const { name, address, marketCap, uniqueHolders, volume24h, marketCapDelta24h, mediaContent } = coin;
  const shortName = shortenName(name);
  const { types } = useWatchlist();

  // WatchlistButton'ı coin adı ve fiyat değişim satırının sağına hizala
  return (
    <Link
      href={`/coin/${address}`}
      className="bg-white/5 z-10 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition-all rounded-lg px-3 py-1.5 cursor-pointer flex-shrink-0 shadow-sm flex flex-col min-w-[230px] relative"
      prefetch={false} // Only prefetch on mouse hover
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {mediaContent?.previewImage?.small ? (
            <div className="w-5 h-5 relative rounded-lg ring-1 ring-white/20 dark:ring-white/20 overflow-hidden" loading="lazy">
              <Image
                src={mediaContent.previewImage.small}
                alt={shortName}
                fill
                sizes="20px"
                className="object-cover"
                priority={false}
              />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-gray-700 dark:text-white">
                {shortName.substring(0, 2)}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]" title={name}>
            {shortName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${getPriceChangeColor(marketCapDelta24h)}`}>
            {getPriceChangeIcon(marketCapDelta24h)} {Math.abs(calculatePercentChange(marketCap, marketCapDelta24h)).toFixed(1)}%
          </span>
          {/* Watchlist button - coin satırının en sağında, dikey ortalanmış */}
          <WatchlistButton 
            item={coin} 
            type={types.COIN} 
            size="xs" 
            className="bg-white/10 backdrop-blur-sm"
          />
        </div>
      </div>
      
      <div className="mt-1 flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
        <span>MC: ${formatNumber(parseFloat(marketCap || 0))}</span>
        <span> <img src="/holders.svg" alt="Holders" color="gray" className="w-4 h-4 inline-block mr-1" /> {uniqueHolders}</span>
        <span>Vol: ${formatNumber(parseFloat(volume24h || 0))}</span>
      </div>
    </Link>
  );
});

CoinCard.displayName = 'CoinCard';

// Scrollable widget showing most valuable coins
const MostValuableCoins = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const scrollPosRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const router = useRouter();

  // Coins loading function - optimized with useCallback
  const loadMostValuableCoins = useCallback(async (retryCount = 0) => {
    // If already loading, don't start another request
    if (isCacheLoading()) return;
    
    try {
      // Check memory cache first
      const cachedData = getFromMemoryCache();
      if (cachedData) {
        setCoins(cachedData);
        setError(null);
        setLoading(false);
        return;
      }

      // Set loading state in cache to prevent duplicate requests
      setCacheLoading(true);

      const response = await getCoinsTopGainers({
        count: 100,
        chainId: 8453 // Base chain
      });

      if (!response?.data?.exploreList?.edges) {
        throw new Error('API response is invalid');
      }

      setCoins(response.data.exploreList.edges);
      setToMemoryCache(response.data.exploreList.edges);
      setError(null);
    } catch (error) {
      console.error("ERROR", error);
      setError("Error loading data");
      setCacheLoading(false); // Reset cache loading state on error
      
      // Retry up to 3 times, increasing delay each time
      if (retryCount < 3) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        retryTimeoutRef.current = setTimeout(() => {
          loadMostValuableCoins(retryCount + 1);
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMostValuableCoins();
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [loadMostValuableCoins]);

  // Auto-scroll effect - optimized with useCallback
  const startScrollAnimation = useCallback(() => {
    if (!containerRef.current || loading || error) return;

    const container = containerRef.current;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    // Animation function for scrolling
    const scroll = () => {
      if (!isHovered) {
        if (scrollPosRef.current >= scrollWidth - clientWidth) {
          scrollPosRef.current = 0;
        } else {
          scrollPosRef.current += 0.5;
        }
        container.scrollLeft = scrollPosRef.current;
      }
      animationFrameIdRef.current = requestAnimationFrame(scroll);
    };

    // Start animation
    scrollPosRef.current = container.scrollLeft;
    animationFrameIdRef.current = requestAnimationFrame(scroll);

    // Cleanup function
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isHovered, loading, error]);

  // Start scroll animation
  useEffect(() => {
    const cleanup = startScrollAnimation();
    return cleanup;
  }, [coins, isHovered, startScrollAnimation]);

  // Memoize event handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    // Save current scroll position
    if (containerRef.current) {
      scrollPosRef.current = containerRef.current.scrollLeft;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  if (loading) {
    return (
      <div className="w-full py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-2">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-1 overscroll-contain">
      <div className="mx-auto">
        <div
          ref={containerRef}
          className="flex overflow-hidden space-x-2 px-2 will-change-scroll"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {coins.map((edge) => {
            const coin = edge.node;
            if (!coin) return null;
            return <CoinCard key={coin.address} coin={coin} />;
          })}
        </div>
      </div>
    </div>
  );
};

// Wrap our component with React.memo
export default memo(MostValuableCoins);
