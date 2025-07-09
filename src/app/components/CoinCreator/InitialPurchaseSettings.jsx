import React from 'react';

/**
 * Component for handling the initial purchase settings
 * @param {Object} props
 * @param {Object} props.formData - Form data object
 * @param {Function} props.handleInputChange - Function to handle input changes
 * @param {Function} props.handleToggleChange - Function to handle toggle changes
 * @returns {JSX.Element}
 */
const InitialPurchaseSettings = ({ formData, handleInputChange, handleToggleChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white">Initial Purchase Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure the initial token purchase when the token is created
          </p>
        </div>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              name="enableInitialPurchase"
              checked={formData.enableInitialPurchase}
              onChange={handleToggleChange}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
              Enable Initial Purchase
            </span>
          </label>
        </div>
      </div>

      {formData.enableInitialPurchase && (
        <>
          <div className="mb-4">
            <label htmlFor="initialPurchaseAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Purchase Amount (ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                id="initialPurchaseAmount"
                name="initialPurchaseAmount"
                value={formData.initialPurchaseAmount}
                onChange={handleInputChange}
                placeholder="E.g., 0.1"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500 bg-transparent backdrop-blur-sm outline-none text-gray-900 dark:text-white"
                required
                min="0.001"
                step="0.001"
              />
              <span className="absolute right-3 top-2 text-gray-500">ETH</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Amount of ETH to use for the initial purchase.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="initialTokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Tokens to Receive
            </label>
            <input
              type="number"
              id="initialTokens"
              name="initialTokens"
              value={formData.initialTokens}
              onChange={handleInputChange}
              placeholder="E.g., 1000"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500 bg-transparent backdrop-blur-sm outline-none text-gray-900 dark:text-white"
              required
              min="1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Number of tokens you'll receive from the initial purchase.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default InitialPurchaseSettings; 