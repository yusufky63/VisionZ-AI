'use client';

import React, { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Image from 'next/image';

const GridView = memo(function GridView({ coins, navigateToCoinDetails }) {
  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const calculatePercentChange = (marketCap, marketCapDelta) => {
    const currentMarketCap = parseFloat(marketCap || 0);
    const deltaValue = parseFloat(marketCapDelta || 0);
    
    const previousMarketCap = deltaValue < 0 
      ? currentMarketCap - deltaValue  // Negative delta for addition
      : currentMarketCap - deltaValue; // Positive delta for subtraction
    
    if (previousMarketCap <= 0) return 0;
    
    return (deltaValue / previousMarketCap) * 100;
  };

  const getPriceChangeIcon = (change) => {
    const changeValue = parseFloat(change);
    return changeValue >= 0 ? "▲" : "▼";
  };

  const getPriceChangeColor = (change) => {
    const changeValue = parseFloat(change);
    return changeValue >= 0 ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 backdrop-blur-lg">
      {coins.map((edge, index) => {
        const coin = edge.node;
        return (
          <div 
            key={coin.address || index}
            className="bg-white dark:bg-gray-900/40 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group p-2 md:p-3"
            onClick={() => navigateToCoinDetails(coin.address)}
          >
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {coin.creatorProfile?.handle?.substring(0, 2).toUpperCase() || 
                         coin.creatorAddress?.substring(0, 2).toUpperCase() || '??'}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                  {coin.creatorProfile?.handle || 
                   (coin.creatorAddress ? `${coin.creatorAddress.substring(0, 6)}...${coin.creatorAddress.slice(-4)}` : 'Anonymous')}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(coin.createdAt), { addSuffix: true, locale: enUS })}
              </span>
            </div>

            <div className="aspect-[4/3] relative overflow-hidden rounded-xl mb-2">
              {coin.mediaContent?.previewImage?.medium ? (
                <div className="relative w-full h-full">
                  <Image
                    src={coin.mediaContent.previewImage.medium}
                    alt={coin.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
  );
});

export default GridView; 