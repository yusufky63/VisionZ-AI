import React, { useState } from 'react';

/**
 * Component for configuring multiple token owners
 * @param {Object} props
 * @param {Object} props.formData - Form data object
 * @param {Function} props.handleOwnershipChange - Function to handle ownership changes
 * @param {Function} props.handleToggleChange - Function to handle toggle changes
 * @returns {JSX.Element}
 */
const MultipleOwnerSettings = ({ formData, handleOwnershipChange, handleToggleChange }) => {
  const [ownerAddress, setOwnerAddress] = useState('');
  const [ownerPercentage, setOwnerPercentage] = useState('');
  const [error, setError] = useState('');

  const addOwner = () => {
    // Basic validation
    if (!ownerAddress || !ownerPercentage) {
      setError('Both address and percentage are required');
      return;
    }

    if (!ownerAddress.startsWith('0x') || ownerAddress.length !== 42) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    const percentage = Number(ownerPercentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      setError('Percentage must be between 0 and 100');
      return;
    }

    // Calculate total percentage including new owner
    const totalPercentage = formData.owners.reduce(
      (sum, owner) => sum + owner.percentage, 
      0
    ) + percentage;

    if (totalPercentage > 100) {
      setError('Total percentage cannot exceed 100%');
      return;
    }

    // Check for duplicate address
    if (formData.owners.some(owner => owner.address.toLowerCase() === ownerAddress.toLowerCase())) {
      setError('This address is already added as an owner');
      return;
    }

    // Add new owner
    handleOwnershipChange([
      ...formData.owners,
      { address: ownerAddress, percentage }
    ]);

    // Reset form fields
    setOwnerAddress('');
    setOwnerPercentage('');
    setError('');
  };

  const removeOwner = (index) => {
    const updatedOwners = [...formData.owners];
    updatedOwners.splice(index, 1);
    handleOwnershipChange(updatedOwners);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white">Multiple Owners</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add multiple addresses as token owners with specific percentages
          </p>
        </div>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              name="enableMultipleOwners"
              checked={formData.enableMultipleOwners}
              onChange={handleToggleChange}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
              Enable Multiple Owners
            </span>
          </label>
        </div>
      </div>

      {formData.enableMultipleOwners && (
        <>
          {error && (
            <div className="p-2 mb-2 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/50 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="md:col-span-3">
              <label htmlFor="ownerAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Owner Address
              </label>
              <input
                type="text"
                id="ownerAddress"
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500 bg-transparent backdrop-blur-sm outline-none text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="ownerPercentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="ownerPercentage"
                  value={ownerPercentage}
                  onChange={(e) => setOwnerPercentage(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500 bg-transparent backdrop-blur-sm outline-none text-gray-900 dark:text-white"
                  min="1"
                  max="100"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={addOwner}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg w-full transition duration-150 ease-in-out"
              >
                Add Owner
              </button>
            </div>
          </div>

          {formData.owners.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Owners</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-gray-200 dark:divide-gray-800">
                    {formData.owners.map((owner, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {owner.address.substring(0, 6)}...{owner.address.substring(38)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {owner.percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => removeOwner(index)}
                            className="text-red-600 hover:text-red-800 transition duration-150 ease-in-out"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Total Allocated: {formData.owners.reduce((sum, owner) => sum + owner.percentage, 0)}%
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MultipleOwnerSettings; 