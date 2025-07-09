import React, { useState } from 'react';
import TokenFormFields from './TokenFormFields';
import InitialPurchaseSettings from './InitialPurchaseSettings';
import MultipleOwnerSettings from './MultipleOwnerSettings';

/**
 * Main form component for creating a new token
 * @returns {JSX.Element}
 */
const CoinCreatorForm = () => {
  const [formData, setFormData] = useState({
    // Token basic info
    tokenName: '',
    tokenSymbol: '',
    tokenDescription: '',
    maxSupply: 1000000,
    networkFeePercentage: 2,
    creatorFeePercentage: 5,
    
    // Initial purchase settings
    enableInitialPurchase: true,
    initialPurchaseAmount: 0.1,
    initialTokens: 1000,
    
    // Multiple owners settings
    enableMultipleOwners: false,
    owners: [],
    
    // Form state
    isSubmitting: false,
    error: null,
    success: false
  });

  // Generic handler for input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle toggle changes for checkbox inputs
  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle multiple owners change
  const handleOwnershipChange = (owners) => {
    setFormData(prev => ({
      ...prev,
      owners
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Set form to submitting state
    setFormData(prev => ({
      ...prev,
      isSubmitting: true,
      error: null
    }));
    
    try {
      // Here you would make your API call to create the token
      console.log('Submitting form data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set success state
      setFormData(prev => ({
        ...prev,
        isSubmitting: false,
        success: true
      }));
    } catch (error) {
      console.error('Error creating token:', error);
      setFormData(prev => ({
        ...prev,
        isSubmitting: false,
        error: error.message || 'Failed to create token. Please try again.'
      }));
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <div className="space-y-6 bg-white dark:bg-gray-900/50 rounded-xl shadow-sm p-6 backdrop-blur-sm border border-gray-100 dark:border-gray-800">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Create Your Token</h2>
          <p className="text-gray-600 dark:text-gray-400">Fill in the details below to launch your own token.</p>
        </div>
        
        {/* Token information fields */}
        <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/30">
          <TokenFormFields 
            formData={formData} 
            handleInputChange={handleInputChange} 
          />
        </div>
        
        {/* Initial purchase settings */}
        <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/30">
          <InitialPurchaseSettings 
            formData={formData} 
            handleInputChange={handleInputChange}
            handleToggleChange={handleToggleChange}
          />
        </div>
        
        {/* Multiple owners settings */}
        <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/30">
          <MultipleOwnerSettings 
            formData={formData}
            handleOwnershipChange={handleOwnershipChange}
            handleToggleChange={handleToggleChange}
          />
        </div>
        
        {/* Error message */}
        {formData.error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/50 dark:text-red-300">
            {formData.error}
          </div>
        )}
        
        {/* Success message */}
        {formData.success && (
          <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/50 dark:text-green-300">
            Token created successfully! You can view it in your dashboard.
          </div>
        )}
        
        {/* Submit button */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={formData.isSubmitting}
            className={`w-full py-3 px-4 rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "dark"
              ? "border-indigo-600/50 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400"
              : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
            } border`}
          >
            {formData.isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Token...
              </span>
            ) : (
              'Create Token'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CoinCreatorForm; 