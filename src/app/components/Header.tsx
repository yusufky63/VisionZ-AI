'use client';

import React, { useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useTheme } from "../contexts/ThemeContext";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Search from "./Search";
import { useWatchlist } from "../context/WatchlistContext";
import Image from "next/image";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { watchlist } = useWatchlist();
  
  const menuItems = [
    { path: "/creator", label: "Token Creator" },
    { path: "/market", label: "Market" },
    { path: "/trade", label: "Trade" },
    { path: "/watchlist", label: "Watchlist", badge: watchlist.length > 0 ? watchlist.length : null },
    { path: "/profile", label: "Profile" },
  ];

  const isActive = (path: string) => pathname === path;
  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${
        theme === "light"
          ? "bg-white/80 border-gray-200/30 text-gray-900"
          : "bg-gray-900/20 border-gray-800/30 text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-3 group"
            >
              <div className="w-9 h-9 relative">
                {/* <svg
                  viewBox="0 0 48 48"
                  className="w-full h-full filter drop-shadow-md"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M32 4L4 32L32 60L60 32L32 4Z"
                    fill="currentColor"
                    className="text-indigo-500 dark:text-indigo-400"
                  />
                  <path
                    d="M32 12L12 32L32 52L52 32L32 12Z"
                    fill="currentColor" 
                    className="text-indigo-600 dark:text-indigo-500"
                  />
                  <path
                    d="M32 20L20 32L32 44L44 32L32 20Z"
                    fill="currentColor"
                    className="text-indigo-700 dark:text-indigo-600" 
                  />
                </svg> */}
                <Image src="/logo.png" alt="VisionZ" width={46} height={46} />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-lg font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500">
                  VisionZ
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  AI Token Creator
                </span>
              </div>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <Search theme={theme} className="w-full" />
          </div>

          {/* Masaüstü Menü */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-xl text-sm font-medium relative ${
                  isActive(item.path)
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 shadow-sm dark:shadow-none"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Sağ Taraf */}
          <div className="hidden md:flex items-center">
            <ConnectKitButton 
              theme="retro"
              mode={theme === "dark" ? "dark" : "light"}
              customTheme={{
                "--ck-connectbutton-background": theme === "dark" ? "rgba(99, 102, 241, 0.9)" : "rgba(99, 102, 241, 0.9)",
                "--ck-connectbutton-hover-background": theme === "dark" ? "rgba(79, 70, 229, 0.9)" : "rgba(79, 70, 229, 0.9)",
                "--ck-connectbutton-color": "white"
              }}
              showBalance={false}
            />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50"
              aria-label={`${theme === "dark" ? "Light" : "Dark"} moda geç`}
            >
              {theme === "dark" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-yellow-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobil Menü Butonu */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobil Menü */}
        {isMenuOpen && (
          <div className="md:hidden py-2">
            {/* Mobil Arama */}
            <div className="px-4 pb-3 mb-2 border-b border-gray-200 dark:border-gray-800">
              <Search theme={theme} />
            </div>
            
            <div className="flex flex-col space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-4 py-2 rounded-lg text-base font-medium relative ${
                    isActive(item.path)
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                  {item.badge && (
                    <span className="absolute top-2 -right-1 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              <div className="px-4 py-2">
                <ConnectKitButton 
                  theme="retro"
                  mode={theme === "dark" ? "dark" : "light"}
                  customTheme={{
                    "--ck-connectbutton-background": theme === "dark" ? "rgba(99, 102, 241, 0.9)" : "rgba(99, 102, 241, 0.9)",
                    "--ck-connectbutton-hover-background": theme === "dark" ? "rgba(79, 70, 229, 0.9)" : "rgba(79, 70, 229, 0.9)",
                    "--ck-connectbutton-color": "white",
                    "--ck-connectbutton-border-radius": "0.75rem",
                    "--ck-connectbutton-font-size": "0.875rem",
                    "--ck-connectbutton-font-weight": "500"
                  }}
                  showBalance={false}
                />
              </div>
              <div className="px-4 py-2 flex justify-end">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  aria-label={`${theme === "dark" ? "Light" : "Dark"} moda geç`}
                >
                  {theme === "dark" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-yellow-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-700"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
