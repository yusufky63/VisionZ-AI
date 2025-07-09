import React from 'react';

function ViewStyleSelector({ viewStyle, setViewStyle }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setViewStyle("table")}
        className={`p-2 rounded-lg ${
          viewStyle === "table"
            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        title="Table Style"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => setViewStyle("grid")}
        className={`p-2 rounded-lg ${
          viewStyle === "grid"
            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        title="Grid Style"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
        </svg>
      </button>
      <button
        onClick={() => setViewStyle("masonry")}
        className={`p-2 rounded-lg ${
          viewStyle === "masonry"
            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        title="Masonry Style"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
        </svg>
      </button>
    </div>
  );
}

export default ViewStyleSelector; 