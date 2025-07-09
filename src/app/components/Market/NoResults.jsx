import React from 'react';

function NoResults({ isSearchResults, searchTerm }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 text-center text-yellow-700 dark:text-yellow-400 rounded-lg">
      {isSearchResults ? (
        <p>No results found for "{searchTerm}".</p>
      ) : (
        <p>Coin not found. Please try another category.</p>
      )}
    </div>
  );
}

export default NoResults; 