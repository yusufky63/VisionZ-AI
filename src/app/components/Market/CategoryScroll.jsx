"use client";

import React, { useRef, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import Image from "next/image";
import GridView from "./GridView";

const CategoryScroll = ({
  listType,
  index,
  categoryCoins,
  navigateToCoinDetails,
  calculatePercentageChange,
}) => {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef(null);

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isVisible || isHovered) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const container = containerRef.current;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    const scroll = () => {
      if (!isHovered && isVisible) {
        let newPos;
        if (index % 2 === 0) {
          newPos = scrollPos + 0.3;
          if (newPos >= maxScroll) newPos = 0;
        } else {
          newPos = scrollPos - 0.3;
          if (newPos <= 0) newPos = maxScroll;
        }

        setScrollPos(newPos);
        container.scrollLeft = newPos;
      }
      animationRef.current = requestAnimationFrame(scroll);
    };

    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered, scrollPos, index, isVisible]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (containerRef.current) {
      setScrollPos(containerRef.current.scrollLeft);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <span className={`p-1 md:p-2 rounded bg-white/0`}>
            <svg
              className="w-4 h-4 md:w-5 md:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
          </span>
          <span className="text-xs md:text-base font-semibold">
            {listType.name}
          </span>
        </h2>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
      </div>

      <div
        ref={containerRef}
        className="overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex gap-2 pb-2">
          {[...(categoryCoins[listType.id] || [])].map((edge, coinIndex) => {
            const coin = edge?.node;
            if (!coin || !coin.address) return null;

            // GridView'daki yardımcı fonksiyonlar:
            const getPriceChangeColor = (change) => {
              const changeValue = parseFloat(change);
              return changeValue >= 0 ? "text-green-400" : "text-red-400";
            };
            const getPriceChangeIcon = (change) => {
              const changeValue = parseFloat(change);
              return changeValue >= 0 ? "▲" : "▼";
            };
            const calculatePercentChange = (marketCap, marketCapDelta) => {
              const currentMarketCap = parseFloat(marketCap || 0);
              const deltaValue = parseFloat(marketCapDelta || 0);
              const previousMarketCap = deltaValue < 0 
                ? currentMarketCap - deltaValue
                : currentMarketCap - deltaValue;
              if (previousMarketCap <= 0) return 0;
              return (deltaValue / previousMarketCap) * 100;
            };

            return (
              <div
                key={`${coin.address}-${coinIndex}`}
                onClick={() => navigateToCoinDetails(coin.address)}
                className="w-full bg-white dark:bg-gray-900/40 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group p-2 md:p-3 min-w-[260px] max-w-[280px] flex-shrink-0"
              >
                {/* Üst Bilgi: Sol - Oluşturucu, Sağ - Zaman */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                      {coin.creatorProfile?.avatar?.previewImage?.small ? (
                        <img
                          src={coin.creatorProfile.avatar.previewImage.small}
                          alt={coin.creatorProfile.handle || 'Creator'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-pink-500/10">
                          <span className="text-xs font-medium text-indigo-600/40">
                            {coin.creatorProfile?.handle?.substring(0, 2).toUpperCase() || '??'}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                      {coin.creatorProfile?.handle || 'Anonymous'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(coin.createdAt), { addSuffix: true, locale: enUS })}
                  </span>
                </div>

                {/* Coin görseli */}
                <div className="aspect-[4/3] relative overflow-hidden rounded-xl mb-2">
                  {coin.mediaContent?.previewImage?.medium ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={coin.mediaContent.previewImage.medium}
                        alt={coin.name}
                        fill
                        sizes="(max-width: 768px) 280px, 280px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority={false}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/5 to-pink-500/5">
                      <span className="text-3xl md:text-5xl font-medium text-indigo-600/20">{coin.symbol?.substring(0, 2).toUpperCase() || "??"}</span>
                    </div>
                  )}
                </div>

                {/* Orta Bilgi: Coin adı, sembol, market cap, 24h volume, 24h değişim */}
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate text-sm md:text-base text-gray-900 dark:text-white">{coin.name}</h3>
                    <span className="text-xs md:text-sm opacity-70">{coin.symbol}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Market Cap:</span>
                    <span className="font-medium text-xs md:text-sm">${formatNumber(parseFloat(coin.marketCap || 0))}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">24h Vol:</span>
                    <span className="font-medium text-xs md:text-sm">${formatNumber(parseFloat(coin.volume24h || 0))}</span>
                  </div>
                  {coin.marketCapDelta24h && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">24h Change:</span>
                      <span className={`${getPriceChangeColor(coin.marketCapDelta24h)} text-xs md:text-sm font-medium`}>
                        {getPriceChangeIcon(coin.marketCapDelta24h)}
                        {Math.abs(calculatePercentChange(coin.marketCap, coin.marketCapDelta24h)).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Alt Bilgi: Holders */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="text-base"><img src="/holders.svg" alt="Holders" color="gray" className="w-4 h-4 inline-block mr-1" /></span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{coin.uniqueHolders?.toLocaleString() || "0"}</span>
                    <span>Holders</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryScroll;
