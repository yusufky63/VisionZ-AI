'use client';

import { useState, useEffect } from 'react';
import { useWatchlist } from '../context/WatchlistContext';
import Link from 'next/link';
import Image from 'next/image';
import WatchlistButton from '../components/WatchlistButton';

export default function WatchlistPage() {
  const { watchlist, types, clearWatchlist } = useWatchlist();
  const [activeTab, setActiveTab] = useState('all');
  const [filteredList, setFilteredList] = useState([]);
  
  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Filter watchlist based on active tab
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredList(watchlist);
    } else if (activeTab === 'coins') {
      setFilteredList(watchlist.filter(item => item.type === types.COIN));
    } else if (activeTab === 'profiles') {
      setFilteredList(watchlist.filter(item => item.type === types.PROFILE));
    }
  }, [activeTab, watchlist, types]);
  
  // Sort items by date added (most recent first)
  const sortedList = [...filteredList].sort((a, b) => 
    new Date(b.dateAdded) - new Date(a.dateAdded)
  );
  
  return (
    <div className="container max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Watchlist</h1>
        {watchlist.length > 0 && (
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to clear your entire watchlist?')) {
                clearWatchlist();
              }
            }}
            className="text-red-500 hover:text-red-600 text-sm"
          >
            Clear Watchlist
          </button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'all' 
              ? 'text-indigo-500 border-b-2 border-indigo-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({watchlist.length})
        </button>
        <button 
          onClick={() => setActiveTab('coins')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'coins' 
              ? 'text-indigo-500 border-b-2 border-indigo-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Coins ({watchlist.filter(item => item.type === types.COIN).length})
        </button>
        <button 
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'profiles' 
              ? 'text-indigo-500 border-b-2 border-indigo-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Profiles ({watchlist.filter(item => item.type === types.PROFILE).length})
        </button>
      </div>
      
      {/* Empty state */}
      {sortedList.length === 0 && (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Your watchlist is empty</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add coins or profiles to your watchlist to track them here.
          </p>
          <div className="mt-6">
            <Link href="/" className="text-indigo-500 hover:text-indigo-600 font-medium">
              Explore Coins
            </Link>
          </div>
        </div>
      )}
      
      {/* List of watched items */}
      <div className="grid grid-cols-1 gap-4">
        {sortedList.map((item) => (
          <Link 
          href={item.type === types.COIN ? `/coin/${item.address}` : `/profile/${item.address}`}
          key={`${item.type}-${item.address}`}
            className="relative flex items-center justify-between p-4  rounded-lg shadow border dark:border-gray-800 border-gray-200 cursor-pointer"
          >
            {/* Left side: Icon and name */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {item.mediaContent?.previewImage?.small ? (
                  <Image
                    src={item.mediaContent.previewImage.small}
                    alt={item.name || 'Item image'}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center ">
                    <span className="text-sm font-semibold">
                      {(item.name?.substring(0, 2) || '??').toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-bold">
                    {item.type === types.COIN ? '₿' : '👤'}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {item.name || 'Unknown Item'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Added on {formatDate(item.dateAdded)}
                </p>
              </div>
            </div>
            
            {/* Right side: Actions */}
            <div className="flex items-center space-x-2">
              <Link
                href={item.type === types.COIN ? `/coin/${item.address}` : `/profile/${item.address}`}
                className="px-3 py-1 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-md"
              >
                View
              </Link>
              <WatchlistButton item={item} type={item.type} size="sm" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 