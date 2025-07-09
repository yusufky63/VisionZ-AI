'use client';

import React, { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Image from 'next/image';

function TableView({
  coins,
  navigateToCoinDetails
}) {
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

  // Yükseliş düşüş ikonu
  const getPriceChangeIcon = (change) => {
    const changeValue = parseFloat(change);
    return changeValue >= 0 ? "▲" : "▼";
  };


  return (
    <div className="bg-white dark:bg-gray-900/20 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-lg sticky top-0">
            <tr>
              <th
                scope="col"
                className="py-4 pl-6 pr-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Coin
              </th>
              <th
                scope="col"
                className="px-3 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Price
              </th>
              <th
                scope="col"
                className="px-3 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Market Cap
              </th>
              <th
                scope="col"
                className="px-3 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                24s Change
              </th>
              <th
                scope="col"
                className="px-3 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Volume (24s)
              </th>
              <th
                scope="col"
                className="px-3 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Holders
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-900/20">
            {coins.map((edge) => {
              const coin = edge.node;
              if (!coin || !coin.address) return null;

              const percentageChange = calculatePercentChange(
                coin.marketCap,
                coin.marketCapDelta24h
              );
              const coinPrice =
                coin.marketCap && coin.totalSupply
                  ? (
                      parseFloat(coin.marketCap) / parseFloat(coin.totalSupply)
                    ).toFixed(8)
                  : "0.00";

              return (
                <tr
                  key={coin.address}
                  onClick={() => navigateToCoinDetails(coin.address)}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer group"
                >
                  <td className="py-4 pl-6 pr-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 mr-2">
                        {coin.mediaContent?.previewImage?.small ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={coin.mediaContent.previewImage.small}
                              alt={coin.name || coin.symbol}
                              fill
                              sizes="32px"
                              className="object-cover"
                              priority={false}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              {coin.symbol?.substring(0, 2).toUpperCase() || "??"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{coin.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{coin.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="font-medium">${coinPrice}</div>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="font-medium">
                      ${parseFloat(coin.marketCap || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-right">
                    {percentageChange !== null && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          percentageChange >= 0
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {getPriceChangeIcon(percentageChange)}
                        <span className="ml-0.5">{Math.abs(percentageChange).toFixed(1)}%</span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="font-medium">
                      ${parseFloat(coin.volume24h || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="text-gray-500">
                      {coin.uniqueHolders?.toLocaleString() || "0"}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableView;
