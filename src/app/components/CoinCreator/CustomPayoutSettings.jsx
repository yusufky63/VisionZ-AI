import React from 'react';

/**
 * Component for handling custom payout recipient settings
 * @param {Object} props
 * @param {boolean} props.customPayoutEnabled - Whether custom payout is enabled
 * @param {Function} props.setCustomPayoutEnabled - Setter for custom payout enabled state
 * @param {string} props.customPayoutAddress - Custom payout address
 * @param {Function} props.setCustomPayoutAddress - Setter for custom payout address
 * @param {boolean} props.isValidCustomAddress - Whether the custom address is valid
 * @returns {JSX.Element}
 */
const CustomPayoutSettings = ({
  customPayoutEnabled,
  setCustomPayoutEnabled,
  customPayoutAddress,
  setCustomPayoutAddress,
  isValidCustomAddress
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setCustomPayoutEnabled(!customPayoutEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              customPayoutEnabled ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`${
                customPayoutEnabled ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
          <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
            Custom Payout Recipient
          </span>
        </div>
      </div>
      
      {customPayoutEnabled && (
        <div className="mt-3">
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Payout Address
          </label>
          <input
            type="text"
            value={customPayoutAddress}
            onChange={(e) => setCustomPayoutAddress(e.target.value)}
            placeholder="0x..."
            className={`w-full px-3 py-2 rounded-lg border ${
              customPayoutAddress && !isValidCustomAddress
                ? "border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500"
            } bg-transparent backdrop-blur-sm outline-none text-gray-900 dark:text-white`}
          />
          {customPayoutAddress && !isValidCustomAddress && (
            <p className="mt-1 text-sm text-red-500">
              Invalid address format. Must start with 0x and be 42 characters long.
            </p>
          )}
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Enter the Ethereum address that will receive payouts from token sales.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomPayoutSettings; 