'use client';

import React, { memo, useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Image from 'next/image';

const MasonryView = memo(function MasonryView({ coins, navigateToCoinDetails }) {
  const [isClient, setIsClient] = useState(false);
  
  // Client-side rendering kontrolü
  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  // Yükseliş düşüş ikonu
  const getPriceChangeIcon = (change) => {
    const changeValue = parseFloat(change);
    return changeValue >= 0 ? "▲" : "▼";
  };

  // Renk değişimi
  const getPriceChangeColor = (change) => {
    const changeValue = parseFloat(change);
    return changeValue >= 0 ? "text-green-400" : "text-red-400";
  };

  // Yüzdelik değişim hesaplama
  const calculatePercentChange = (marketCap, marketCapDelta) => {
    const currentMarketCap = parseFloat(marketCap || 0);
    const deltaValue = parseFloat(marketCapDelta || 0);
    
    // 24 saat önceki değer
    const previousMarketCap = deltaValue < 0 
      ? currentMarketCap - deltaValue  // Negatif delta için toplama
      : currentMarketCap - deltaValue; // Pozitif delta için çıkarma
    
    // Önceki değer 0 ise, yüzde hesaplanamaz
    if (previousMarketCap <= 0) return 0;
    
    // Yüzdelik değişim hesaplama
    return (deltaValue / previousMarketCap) * 100;
  };

  // Deterministik yükseklik seçimi için helper fonksiyon
  const getHeightClass = (address, index) => {
    const heightClasses = [
      'aspect-[3/5]',  // Daha uzun
      'aspect-[2/3]',  // Uzun
      'aspect-[3/4]',  // Orta uzunlukta
    ];
    
    // Adres ve indeksten deterministik bir değer üretme
    const hash = address.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Hash değeri ve indeksi kullanarak deterministik indeks seçimi
    const classIndex = Math.abs((hash + index) % heightClasses.length);
    return heightClasses[classIndex];
  };

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-4 [column-fill:_balance] space-y-4">
      {coins.map((edge, index) => {
        const coin = edge.node;
        if (!coin || !coin.address) return null;

        const holders = coin.uniqueHolders || 0;
        const heightClass = getHeightClass(coin.address, index);

        return (
          <div
            key={coin.address}
            onClick={() => navigateToCoinDetails(coin.address)}
            className="break-inside-avoid block w-full group cursor-pointer transform transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900/30 border border-gray-200/50 dark:border-gray-800/50 hover:border-indigo-400/50 dark:hover:border-indigo-600/50 transition-all shadow-sm hover:shadow-lg ${heightClass}`}> 
              {/* Sadece görsel veya sembol */}
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
                  <span className="text-4xl md:text-5xl font-medium text-indigo-600/20">{coin.symbol?.substring(0, 2).toUpperCase() || "??"}</span>
                </div>
              )}
              {/* Hover'da overlay ile bilgiler */}
              <div className="absolute inset-0 bg-black/80 bg-opacity-80 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 z-10">
                <div className="flex flex-col justify-between h-full w-full max-w-xs gap-4">
                  {/* Coin adı ve sembolü */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white truncate">{coin.name}</h3>
                      <span className="text-sm opacity-70 text-white">{coin.symbol}</span>
                    </div>
                  </div>
                  {/* Market Cap, 24h Vol, 24h Change, Holders */}
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">Market Cap:</span>
                      <span className="font-medium text-xs text-white">${formatNumber(parseFloat(coin.marketCap || 0))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">24h Vol:</span>
                      <span className="font-medium text-xs text-white">${formatNumber(parseFloat(coin.volume24h || 0))}</span>
                    </div>
                    {coin.marketCapDelta24h && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-300">24h Change:</span>
                        <span className={`${getPriceChangeColor(coin.marketCapDelta24h)} text-xs font-medium`}>
                          {getPriceChangeIcon(coin.marketCapDelta24h)}
                          {Math.abs(calculatePercentChange(coin.marketCap, coin.marketCapDelta24h)).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300"><img src="/holders.svg" alt="Holders" color="gray" className="w-4 h-4 inline-block mr-1" /></span>
                      <span className="font-semibold text-xs text-white">{holders.toLocaleString()}</span>
                      <span className="text-xs text-gray-300">Holders</span>
                    </div>
                  </div>
                  {/* Oluşturucu avatarı ve ismi */}
                  <div className="flex items-center gap-2 mt-2">
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
                    <span className="text-xs text-white font-medium">
                      {coin.creatorProfile?.handle || 
                       (coin.creatorAddress ? `${coin.creatorAddress.substring(0, 6)}...${coin.creatorAddress.slice(-4)}` : 'Anonymous')}
                    </span>
                  </div>
                  {/* Zaman */}
                  <span className="text-xs text-gray-300 mt-2 text-center">
                    {formatDistanceToNow(new Date(coin.createdAt), { addSuffix: true, locale: enUS })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default MasonryView; 