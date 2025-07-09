import React from 'react';

/**
 * Component for handling the main token form fields
 * @param {Object} props
 * @param {Object} props.formData - Form data object
 * @param {Function} props.handleInputChange - Function to handle input changes
 * @param {string} props.selectedNetwork - Currently selected network
 * @returns {JSX.Element}
 */
const TokenFormFields = ({ formData, handleInputChange, selectedNetwork }) => {
  return (
    <div className="space-y-4">
      {/* Token Name */}
      <div className="mb-4">
        <label htmlFor="tokenName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Token Name
        </label>
        <input
          type="text"
          id="tokenName"
          name="tokenName"
          value={formData.tokenName}
          onChange={handleInputChange}
          placeholder="E.g., My Awesome Token"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500 bg-transparent backdrop-blur-sm outline-none text-gray-900 dark:text-white"
          required
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Choose a name for your token that reflects its purpose or community.
        </p>
      </div>

      {/* Token Symbol */}
      <div className="mb-4">
        <label htmlFor="tokenSymbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Token Symbol
        </label>
        <input
          type="text"
          id="tokenSymbol"
          name="tokenSymbol"
          value={formData.tokenSymbol}
          onChange={handleInputChange}
          placeholder="E.g., MYT"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500 bg-transparent backdrop-blur-sm outline-none text-gray-900 dark:text-white"
          required
          maxLength={5}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          A short 3-5 character symbol for your token (e.g., BTC, ETH).
        </p>
      </div>

      {/* Token Description */}
      <div className="mb-4">
        <label htmlFor="tokenDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Token Description
        </label>
        <textarea
          id="tokenDescription"
          name="tokenDescription"
          value={formData.tokenDescription}
          onChange={handleInputChange}
          placeholder="Describe your token's purpose and vision..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500 bg-transparent backdrop-blur-sm outline-none text-gray-900 dark:text-white resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Provide a brief description explaining what your token represents.
        </p>
      </div>

      {/* Max Supply */}
      <div className="mb-4">
        <label htmlFor="maxSupply" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Maximum Supply
        </label>
        <input
          type="number"
          id="maxSupply"
          name="maxSupply"
          value={formData.maxSupply}
          onChange={handleInputChange}
          placeholder="E.g., 1000000"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500 bg-transparent backdrop-blur-sm outline-none text-gray-900 dark:text-white"
          required
          min="1"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          The total number of tokens that will ever exist. This cannot be changed later.
        </p>
      </div>

      {/* Network Fee Percentage */}
      <div className="mb-4">
        <label htmlFor="networkFeePercent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Network Fee Percentage (%)
        </label>
        <div className="relative">
          <input
            type="number"
            id="networkFeePercent"
            name="networkFeePercent"
            value={formData.networkFeePercent}
            onChange={handleInputChange}
            placeholder="E.g., 2.5"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500 bg-transparent backdrop-blur-sm outline-none text-gray-900 dark:text-white"
            required
            min="0"
            max="10"
            step="0.1"
          />
          <span className="absolute right-3 top-2 text-gray-500">%</span>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Fee percentage for {selectedNetwork} network (0-10%).
        </p>
      </div>

      {/* Creator Fee Percentage */}
      <div className="mb-4">
        <label htmlFor="creatorFeePercent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Creator Fee Percentage (%)
        </label>
        <div className="relative">
          <input
            type="number"
            id="creatorFeePercent"
            name="creatorFeePercent"
            value={formData.creatorFeePercent}
            onChange={handleInputChange}
            placeholder="E.g., 5"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500 bg-transparent backdrop-blur-sm outline-none text-gray-900 dark:text-white"
            required
            min="0"
            max="10"
            step="0.1"
          />
          <span className="absolute right-3 top-2 text-gray-500">%</span>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Percentage of each trade you'll receive as the creator (0-10%).
        </p>
      </div>
    </div>
  );
};

export default TokenFormFields; 