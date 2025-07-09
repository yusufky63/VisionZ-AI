import React, { useEffect } from 'react';
import { Switch } from '@headlessui/react';

// ✅ NEW: Define currency constants for V4 compatibility
// Using direct values from Zora SDK docs: ETH = 2, ZORA = 1
const DeployCurrency = {
  ETH: 2,
  ZORA: 1
};

/**
 * Second step of coin creation - Review and create token (Updated for V4)
 * @param {Object} props
 * @param {Object} props.formData - Form data
 * @param {Function} props.setFormData - Form data setter
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.theme - Current theme
 * @param {Function} props.handleGenerateImage - Function to generate image
 * @param {Function} props.handleImageUpload - Function to handle image upload
 * @param {Function} props.prepareMintCoin - Function to mint coin
 * @param {Function} props.goToPreviousStep - Navigate to previous step
 * @param {string} props.createButtonText - Text for create button
 * @param {Object} props.ethPrice - Current ETH price
 * @param {number} props.selectedCurrency - Selected currency for V4 (1=ZORA, 2=ETH)
 * @param {Function} props.safeSetSelectedCurrency - Setter for currency selection
 * @param {boolean} props.wantInitialPurchase - Whether initial purchase is enabled
 * @param {Function} props.setWantInitialPurchase - Setter for initial purchase
 * @param {string} props.initialPurchaseAmount - Initial purchase amount
 * @param {Function} props.setInitialPurchaseAmount - Setter for initial purchase amount
 * @param {string} props.payoutRecipient - Payout recipient address
 * @param {Function} props.setPayoutRecipient - Setter for payout recipient
 * @param {boolean} props.isCustomPayoutAddress - Whether custom payout is enabled
 * @param {Function} props.setIsCustomPayoutAddress - Setter for custom payout
 * @param {boolean} props.multipleOwners - Whether multiple owners is enabled
 * @param {Function} props.setMultipleOwners - Setter for multiple owners
 * @param {Array} props.ownerAddresses - List of owner addresses
 * @param {Function} props.setOwnerAddresses - Setter for owner addresses
 * @param {string} props.newOwnerAddress - New owner address
 * @param {Function} props.setNewOwnerAddress - Setter for new owner address
 * @param {Object} props.balanceData - User's ETH balance data from Wagmi
 * @returns {JSX.Element}
 */
const ReviewCreateStep = ({
  formData,
  setFormData,
  isLoading,
  theme,
  handleGenerateImage,
  handleImageUpload,
  prepareMintCoin,
  goToPreviousStep,
  createButtonText,
  ethPrice,
  selectedCurrency,
  safeSetSelectedCurrency,
  wantInitialPurchase,
  setWantInitialPurchase,
  initialPurchaseAmount,
  setInitialPurchaseAmount,
  payoutRecipient,
  setPayoutRecipient,
  isCustomPayoutAddress,
  setIsCustomPayoutAddress,
  multipleOwners,
  setMultipleOwners,
  ownerAddresses,
  setOwnerAddresses,
  newOwnerAddress,
  setNewOwnerAddress,
  balanceData
}) => {
  
  // Format ETH price to USD if available
  const formatEthToUsd = (ethAmount) => {
    if (!ethPrice || !ethAmount) return '';
    const usdValue = parseFloat(ethAmount) * ethPrice;
    return usdValue.toFixed(2);
  };
  
  // Handle adding a new owner
  const handleAddOwner = () => {
    if (!newOwnerAddress || !newOwnerAddress.startsWith('0x') || newOwnerAddress.length !== 42) {
      console.error("Invalid address format", newOwnerAddress);
      // Burada bir toast mesajı eklenebilir
      return;
    }
    
    if (ownerAddresses.includes(newOwnerAddress)) {
      console.error("Address already in list", newOwnerAddress);
      // Burada bir toast mesajı eklenebilir
      return;
    }
    
    console.log("Adding owner address:", newOwnerAddress);
    console.log("Current owners:", ownerAddresses);
    
    const updatedAddresses = [...ownerAddresses, newOwnerAddress];
    setOwnerAddresses(updatedAddresses);
    console.log("Updated owners:", updatedAddresses);
    setNewOwnerAddress('');
  };
  
  // Handle removing an owner
  const handleRemoveOwner = (index) => {
    if (ownerAddresses.length <= 1) {
      console.error("Cannot remove the last owner address");
      return;
    }
    
    const newOwners = [...ownerAddresses];
    newOwners.splice(index, 1);
    console.log("Removing owner at index", index, "new list:", newOwners);
    setOwnerAddresses(newOwners);
  };
  
  // For slider, we'll set some reasonable min/max values
  const minEth = 0.01;
  const maxEth = 1.0;
  
  // Handle slider change
  const handleSliderChange = (e) => {
    const value = e.target.value;
    setInitialPurchaseAmount(value);
  };
  
  // Log component props for debugging
  useEffect(() => {
    console.log("ReviewCreateStep props:", {
      payoutRecipient,
      isCustomPayoutAddress,
      multipleOwners,
      ownerAddresses: ownerAddresses?.length
    });
  }, [payoutRecipient, isCustomPayoutAddress, multipleOwners, ownerAddresses?.length]);
  
  // Debug when switching multiple owners state
  useEffect(() => {
    if (multipleOwners) {
      console.log("Multiple owners is now enabled, addresses:", ownerAddresses);
    } else {
      console.log("Multiple owners is now disabled, payout recipient:", payoutRecipient);
    }
  }, [multipleOwners, ownerAddresses, payoutRecipient]);
  
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side - Image and AI Controls */}
        <div className="space-y-4 order-2 md:order-1">
          {/* Image Preview Area */}
          <div
            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden relative group bg-gray-100/20 dark:bg-gray-800/20"
            onClick={() => !isLoading && document.getElementById("imageUpload").click()}
          >
            {formData.previewImage ? (
              <>
                <img
                  src={formData.previewImage}
                  alt="Token Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Image load error, trying alternative gateway");
                    
                    // For Instagram images with CORS issues, try different approaches
                    if (formData.previewImage && formData.previewImage.includes('cdninstagram.com')) {
                      console.log("Instagram image CORS error detected, removing &amp; entities...");
                      const cleanUrl = formData.previewImage
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"');
                      
                      if (cleanUrl !== formData.previewImage) {
                        e.target.src = cleanUrl;
                        e.target.onerror = () => {
                          console.error("Instagram image still failed after cleaning");
                          // Hide image if it can't load
                          e.target.style.display = 'none';
                        };
                        return;
                      }
                    }
                    
                    // If image fails to load, try alternative gateway for IPFS
                    if (formData.image && formData.image.startsWith("ipfs://")) {
                      const hash = formData.image.replace("ipfs://", "");
                      e.target.src = `https://cloudflare-ipfs.com/ipfs/${hash}`;
                      e.target.onerror = (e2) => {
                        // If second gateway fails, try another gateway
                        e2.target.src = `https://nftstorage.link/ipfs/${hash}`;
                        e2.target.onerror = null; // Stop error catching
                      };
                    } else {
                      // For other image types, hide if can't load
                      console.error("Image failed to load, hiding preview");
                      e.target.style.display = 'none';
                    }
                  }}
                />
                {/* Hover overlay to change image */}
                {!isLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <p className="text-white text-sm text-center px-4">
                      Click to change image
                    </p>
                  </div>
                )}
              </>
            ) : (
              // Placeholder when no image
              <div className="text-center p-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {isLoading ? "Loading image..." : "Upload an image or generate with AI"}
                </p>
              </div>
            )}
            {/* Loading indicator for image generation */}
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                <svg
                  className="animate-spin h-8 w-8 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}
          </div>
          {/* Hidden file input */}
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isLoading}
          />

          {/* Image Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* AI Generate Image Button */}
            <button
              onClick={() => handleGenerateImage()}
              disabled={isLoading || !formData.description}
              className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 border ${
                isLoading || !formData.description
                  ? theme === "dark"
                    ? "border-gray-700 bg-gray-800/50 text-gray-500 cursor-not-allowed"
                    : "border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed"
                  : theme === "dark"
                  ? "border-indigo-600/50 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400"
                  : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
              } font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Regenerating Image...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Regenerate Image
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side - Form Fields */}
        <div className="space-y-4 order-1 md:order-2">
          {/* Token name */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Token Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent backdrop-blur-sm outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white"
              placeholder="Enter token name"
            />
          </div>

          {/* Token symbol */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Token Symbol (3-4 letters)
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => {
                // Enforce uppercase for symbol
                const value = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .slice(0, 4);
                setFormData((prev) => ({
                  ...prev,
                  symbol: value,
                }));
              }}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent backdrop-blur-sm outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white"
              placeholder="Enter token symbol (e.g. ZORA)"
              maxLength={4}
            />
          </div>

          {/* Token description */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Token Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent backdrop-blur-sm outline-none focus:ring-1 focus:ring-indigo-500 resize-none disabled:opacity-50 text-gray-900 dark:text-white"
              rows={6}
              placeholder="Enter token description"
            />
          </div>

                      {/* Token creation options */}
            <div className="pt-4">
              {/* ✅ NEW: Currency Selection for V4 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trading Pair Currency
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => safeSetSelectedCurrency(DeployCurrency.ETH)}
                    disabled={isLoading}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedCurrency === DeployCurrency.ETH
                        ? theme === "light"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-indigo-400 bg-indigo-900/30 text-indigo-300"
                        : theme === "light"
                        ? "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"
                    } disabled:opacity-50`}
                  >
                    <div className="font-medium">ETH</div>
                    <div className="text-xs opacity-75">Ethereum</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => safeSetSelectedCurrency(DeployCurrency.ZORA)}
                    disabled={isLoading}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedCurrency === DeployCurrency.ZORA
                        ? theme === "light"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-indigo-400 bg-indigo-900/30 text-indigo-300"
                        : theme === "light"
                        ? "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"
                    } disabled:opacity-50`}
                  >
                    <div className="font-medium">ZORA</div>
                    <div className="text-xs opacity-75">Zora Token</div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Selected: {selectedCurrency === DeployCurrency.ZORA ? "ZORA Token (1)" : "Ethereum (2)"}
                </p>
              </div>

              {/* ✅ RESTORED: Initial Purchase Section for V4 */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Switch
                    checked={wantInitialPurchase}
                    onChange={() => setWantInitialPurchase(!wantInitialPurchase)}
                    disabled={isLoading}
                    className={`${
                      wantInitialPurchase
                        ? theme === "dark"
                          ? "bg-indigo-600"
                          : "bg-indigo-600"
                        : theme === "dark"
                        ? "bg-gray-700"
                        : "bg-gray-300"
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50`}
                  >
                    <span
                      className={`${
                        wantInitialPurchase
                          ? "translate-x-6"
                          : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                  </Switch>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Buy initial tokens
                  </span>
                </div>

                {wantInitialPurchase && (
                  <div className="mt-2 mb-4">
                    <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                      Initial Purchase Amount ({selectedCurrency === DeployCurrency.ETH ? "ETH" : "for ZORA pair"})
                    </label>
                    
                    <div className="relative mb-3">
                      <input
                        type="number"
                        value={initialPurchaseAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d*\.?\d{0,18}$/.test(value)) {
                            setInitialPurchaseAmount(value);
                          }
                        }}
                        step="0.01"
                        min="0.01"
                        disabled={isLoading || !wantInitialPurchase}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent backdrop-blur-sm outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white"
                        placeholder="0.01"
                      />
                      {ethPrice && initialPurchaseAmount && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                          <span>≈ ${formatEthToUsd(initialPurchaseAmount)} USD</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="flex justify-between gap-2 mt-2">
                      {[25, 50, 75, 100].map((percentage) => (
                        <button
                          key={percentage}
                          type="button"
                          onClick={() => {
                            if (balanceData) {
                              const reservePercentage = percentage === 100 ? 5 : 5;
                              const maxUsableBalance = parseFloat(balanceData.formatted) * (1 - reservePercentage/100);
                              const newAmount = ((maxUsableBalance * percentage) / 100).toFixed(6);
                              setInitialPurchaseAmount(newAmount);
                            }
                          }}
                          disabled={isLoading || !balanceData || !wantInitialPurchase}
                          className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all ${
                            theme === "light"
                              ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                              : "bg-indigo-900/30 hover:bg-indigo-800/40 text-indigo-400 border border-indigo-800/50"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {percentage}%
                        </button>
                      ))}
                    </div>

                    {/* Balance info */}
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <div>
                        Available: {balanceData ? parseFloat(balanceData.formatted).toFixed(4) : "0"} ETH
                        {ethPrice && balanceData && (
                          <span className="ml-1">
                            (≈${(parseFloat(balanceData.formatted) * ethPrice).toFixed(2)})
                          </span>
                        )}
                      </div>
                      <div>
                        {ethPrice && initialPurchaseAmount ? (
                          `≈$${(parseFloat(initialPurchaseAmount) * ethPrice).toFixed(2)} USD`
                        ) : (
                          "Enter amount"
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Payout Recipient Address */}
              <div className="mt-4">
              <div className="flex items-center mb-2">
                <Switch
                  checked={isCustomPayoutAddress}
                  onChange={() => {
                    const newValue = !isCustomPayoutAddress;
                    setIsCustomPayoutAddress(newValue);
                    if (!newValue) {
                      // Reset to defaults
                      setPayoutRecipient("");
                      setMultipleOwners(false);
                      setOwnerAddresses([]);
                      console.log("Reset payout settings to defaults");
                    } else {
                      console.log("Custom payout address enabled");
                    }
                  }}
                  disabled={isLoading}
                  className={`${
                    isCustomPayoutAddress
                      ? theme === "dark"
                        ? "bg-indigo-600"
                        : "bg-indigo-600"
                      : theme === "dark"
                      ? "bg-gray-700"
                      : "bg-gray-300"
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50`}
                >
                  <span
                    className={`${
                      isCustomPayoutAddress
                        ? "translate-x-6"
                        : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                  />
                </Switch>
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Custom Payout Recipient
                </span>
              </div>
              
              {isCustomPayoutAddress && (
                <div className="mt-2 mb-4">
                  <div className="flex items-center mb-2">
                    <Switch
                      checked={multipleOwners}
                      onChange={() => {
                        const newValue = !multipleOwners;
                        console.log("Switching multiple owners to:", newValue);
                        setMultipleOwners(newValue);
                        
                        if (newValue) {
                          // Initialize with the current payout recipient if it exists
                          if (payoutRecipient && ownerAddresses.length === 0) {
                            console.log("Initializing owners list with payout recipient:", payoutRecipient);
                            const updatedAddresses = [payoutRecipient];
                            setOwnerAddresses(updatedAddresses);
                            console.log("Updated owners:", updatedAddresses);
                          } else if (ownerAddresses.length === 0) {
                            // İlk adres olarak bağlı cüzdan adresini ekleyelim
                            const connectedAddress = payoutRecipient || "";
                            if (connectedAddress) {
                              console.log("Adding connected wallet as first owner:", connectedAddress);
                              setOwnerAddresses([connectedAddress]);
                            } else {
                              console.warn("No wallet connected or payout recipient set");
                            }
                          }
                        } else {
                          // Multiple owners'dan single owner'a dönerken, 
                          // eğer owner adresleri varsa ilkini payout recipient olarak ayarlayalım
                          if (ownerAddresses.length > 0) {
                            console.log("Switching to single owner, setting first address as payout recipient:", ownerAddresses[0]);
                            setPayoutRecipient(ownerAddresses[0]);
                          }
                        }
                      }}
                      disabled={isLoading}
                      className={`${
                        multipleOwners
                          ? theme === "dark"
                            ? "bg-indigo-600"
                            : "bg-indigo-600"
                          : theme === "dark"
                          ? "bg-gray-700"
                          : "bg-gray-300"
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50`}
                    >
                      <span
                        className={`${
                          multipleOwners
                            ? "translate-x-6"
                            : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                    </Switch>
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Multiple Owner Addresses
                    </span>
                  </div>
                  
                  {!multipleOwners ? (
                    <>
                      <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                        Payout Recipient Address (who receives earnings)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={payoutRecipient}
                          onChange={(e) => setPayoutRecipient(e.target.value)}
                          disabled={isLoading || !isCustomPayoutAddress}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent backdrop-blur-sm outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white font-mono text-sm"
                          placeholder="0x..."
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                        Owner Addresses (multiple recipients)
                      </label>
                      
                      {/* List of current owner addresses */}
                      <div className="mb-2 max-h-40 overflow-y-auto">
                        {ownerAddresses.length === 0 ? (
                          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-xs text-yellow-700 dark:text-yellow-300">
                            No addresses added. At least one address is required.
                          </div>
                        ) : (
                          ownerAddresses.map((addr, index) => (
                            <div key={index} className="flex items-center justify-between mb-1.5 p-2 bg-gray-50 dark:bg-gray-900/60 rounded-md">
                              <div className="font-mono text-xs truncate text-gray-700 dark:text-gray-300">
                                {addr}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveOwner(index)}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                                disabled={ownerAddresses.length <= 1}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Form to add new owner address */}
                      <div className="mt-2 flex">
                        <input
                          type="text"
                          value={newOwnerAddress}
                          onChange={(e) => setNewOwnerAddress(e.target.value)}
                          placeholder="0x... (enter new address)"
                          className="flex-grow mr-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent backdrop-blur-sm outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white font-mono text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOwner();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddOwner}
                          disabled={!newOwnerAddress || newOwnerAddress.length !== 42}
                          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                      
                      {/* Status messages */}
                      {newOwnerAddress === '' && (
                        <div className="mt-1 text-xs text-gray-500">
                            Enter a valid wallet address to add
                        </div>
                      )}
                      
                      {/* Error message for invalid address */}
                      {newOwnerAddress && (!newOwnerAddress.startsWith('0x') || newOwnerAddress.length !== 42) && (
                        <div className="mt-1 text-xs text-red-500">
                          Please enter a valid Ethereum address (42 characters starting with 0x)
                        </div>
                      )}
                      
                      {/* Owner count indication */}
                    
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={goToPreviousStep}
          disabled={isLoading}
          className={`px-6 py-2 rounded-lg transition-all duration-200 ${
            isLoading
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white"
          } font-medium`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={prepareMintCoin}
          disabled={isLoading}
          className={`px-6 py-2 rounded-lg transition-all duration-200 ${
            isLoading
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          } font-medium`}
        >
          {createButtonText}
        </button>
      </div>
    </div>
  );
};

export default ReviewCreateStep; 