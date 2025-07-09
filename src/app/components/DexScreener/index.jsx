'use client';

import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const DexScreener = ({ 
  tokenAddress, 
  containerClassName = '',
  aspectRatio = 'default', // 'default', 'compact', 'full'
  showControls = true 
}) => {
  const { theme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);

  // Get aspect ratio settings based on the prop
  const getAspectRatioSettings = () => {
    const ratios = {
      default: {
        mobile: '125%',
        tablet: '90%',
        desktop: '65%',
        xl: '55%'
      },
      compact: {
        mobile: '100%',
        tablet: '75%',
        desktop: '50%',
        xl: '45%'
      },
      full: {
        mobile: '150%',
        tablet: '100%',
        desktop: '80%',
        xl: '70%'
      }
    };

    return ratios[aspectRatio] || ratios.default;
  };

  const aspectRatios = getAspectRatioSettings();

  return (
    <div className={`w-full rounded-xl overflow-hidden border ${
      theme === "light" 
        ? "bg-white border-gray-200" 
        : "bg-gray-900/30 border-gray-800"
      } ${containerClassName}`}
    >
      <div className="w-full relative">
        {/* Loading State */}
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 z-10 rounded-xl">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent mb-3"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {tokenAddress ? 'Loading DexScreener data...' : 'Select a token to view chart'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              This might take a few seconds
            </p>
          </div>
        )}

        {/* Chart Container */}
        <div className="dexscreener-container">
          <iframe
            src={`https://dexscreener.com/base/${
              tokenAddress || ''
            }?embed=1&loadChartSettings=0&chartLeftToolbar=0&chartTheme=${
              theme === "dark" ? "dark" : "light"
            }&theme=${
              theme === "dark" ? "dark" : "light"
            }&chartStyle=1&chartType=usd&interval=15${
              !showControls ? '&controls=0' : ''
            }`}
            className={`dexscreener-iframe ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsLoaded(true)}
            allow="fullscreen"
          ></iframe>
        </div>

        {/* Styles */}
        <style jsx>{`
          .dexscreener-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: ${aspectRatios.mobile}; /* Mobile aspect ratio */
            overflow: hidden;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }

          .dexscreener-iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 0;
            transition: opacity 0.3s ease-in-out;
          }

          /* Improved desktop view */
          @media (min-width: 768px) {
            .dexscreener-container {
              padding-bottom: ${aspectRatios.tablet}; /* Tablet aspect ratio */
            }
          }

          /* Large screen optimization */
          @media (min-width: 1200px) {
            .dexscreener-container {
              padding-bottom: ${aspectRatios.desktop}; /* Desktop aspect ratio */
            }
          }

          /* Full screen on XL displays */
          @media (min-width: 1536px) {
            .dexscreener-container {
              padding-bottom: ${aspectRatios.xl}; /* XL desktop aspect ratio */
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default DexScreener; 