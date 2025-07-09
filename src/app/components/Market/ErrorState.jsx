import React from 'react';

function ErrorState({ error, onRetry, isSearchResults }) {
  return (
    <div className={`w-full text-center p-4 my-4 rounded-lg shadow ${
      error.type === "warning"
        ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
    }`}>
      <p className="font-medium mb-2">{error.message}</p>
      <button
        onClick={onRetry}
        className={`px-4 py-2 mt-2 rounded-md ${
          error.type === "warning"
            ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        Try Again
      </button>
    </div>
  );
}

export default ErrorState; 