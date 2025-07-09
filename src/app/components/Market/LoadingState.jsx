import React from 'react';

function LoadingState({ isSearchResults }) {
  return (
    <div className="p-8 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {isSearchResults ? "Searching..." : "Loading coins..."}
      </p>
    </div>
  );
}

export default LoadingState; 