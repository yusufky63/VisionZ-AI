"use client";

import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useBalance,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ThemeContext } from "../../contexts/ThemeContext";
import { parseEther } from "viem";
import { getETHPrice } from "../../services/ethPrice";
import TokenSuccessModal from "../TokenSuccessModal";
import { CoinService } from "../../services/coinService";

// Import sub-components
import StepProgress from "./StepProgress";
import IdeaInputStep from "./IdeaInputStep";
import ReviewCreateStep from "./ReviewCreateStep";
import IntroductionStep from "./IntroductionStep";
import SocialMediaStep from "./SocialMediaStep";
import CreationMethodStep from "./CreationMethodStep";

// Import services
import { createZoraCoin } from "../../services/sdk/getCreateCoin";
import { createAndUploadCoinMetadata } from "../../services/pinata";
import {
  checkAndSwitchNetwork,
  getOptimizedGasParams,
} from "../../services/networkUtils";
import {
  generateTextWithAI,
  generateImageWithAI,
  getCoinCategories,
} from "../../services/aiService";

// ✅ NEW: Define currency constants for V4 compatibility
// Using direct values from Zora SDK docs: ETH = 2, ZORA = 1
const DeployCurrency = {
  ETH: 2,
  ZORA: 1
};

/**
 * AI Image and Coin Creator Component - Refactored
 */
function CoinCreator() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const mounted = useRef(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Introduction, 2: Creation Method, 3: AI/Social, 4: Review
  const [creationMethod, setCreationMethod] = useState('ai'); // 'ai' or 'social'
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    image: null, // Can be URL (string) or File object
    previewImage: null, // Only URL (string) for image preview
    category: "", // Category name
  });
  const [aiResponse, setAiResponse] = useState(null); // AI response details
  const [isProcessing, setIsProcessing] = useState(false); // General processing status
  const [aiGeneratingText, setAiGeneratingText] = useState(false);
  const [aiGeneratingImage, setAiGeneratingImage] = useState(false);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(""); // Selected category
  const [userInitialDescription, setUserInitialDescription] = useState(""); // User's initial description/idea
  const [ethPrice, setEthPrice] = useState(null); // Add ETH price state

  // ✅ RESTORED: Initial Purchase for V4 (per Factory docs it's still supported)
  const [wantInitialPurchase, setWantInitialPurchase] = useState(false);
  const [initialPurchaseAmount, setInitialPurchaseAmount] = useState("");
  
  // ✅ NEW: Currency selection for V4 (Default to ZORA on Base mainnet per docs)
  const [selectedCurrency, setSelectedCurrency] = useState(DeployCurrency.ZORA);

  // Payout Recipient address - defaults to connected wallet
  const [payoutRecipient, setPayoutRecipient] = useState("");
  const [isCustomPayoutAddress, setIsCustomPayoutAddress] = useState(false);

  // Multiple payout recipients
  const [multipleOwners, setMultipleOwners] = useState(false);
  const [ownerAddresses, setOwnerAddresses] = useState([]);
  const [newOwnerAddress, setNewOwnerAddress] = useState("");

  // Token success modal state
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    tokenAddress: "",
    tokenName: "",
    tokenSymbol: "",
    tokenImage: "",
  });

  const categories = getCoinCategories();

  // WAGMI hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: balanceData } = useBalance({ address });
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Fetch ETH price when component mounts
  useEffect(() => {
    async function fetchEthPrice() {
      try {
        const price = await getETHPrice();
        setEthPrice(price);
        console.log("ETH price loaded:", price);
      } catch (error) {
        console.error("Failed to fetch ETH price:", error);
      }
    }

    fetchEthPrice();

    // Refresh price every 60 seconds
    const interval = setInterval(fetchEthPrice, 60000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Set payout recipient address when user connects or changes
  useEffect(() => {
    if (address) {
      // Only set if not already manually changed by user
      if (!isCustomPayoutAddress) {
        setPayoutRecipient(address);
      }

      // Initialize owner addresses with connected wallet if empty
      if (ownerAddresses.length === 0) {
        setOwnerAddresses([address]);
      }
    }
  }, [address, isCustomPayoutAddress, ownerAddresses.length]);

  // --- Error Handling ---
  const handleError = useCallback((error, context = "General Error") => {
    setIsProcessing(false);
    setAiGeneratingText(false);
    setAiGeneratingImage(false);
    setUploadingToIPFS(false);

    console.error(`Error during ${context}:`, error);

    let errorMessage = "An unexpected error occurred.";

    if (error instanceof Error) {
      // Check for Wagmi/Viem errors
      if (
        error.message.includes("User rejected") ||
        error.message.includes("denied transaction signature") ||
        error.message.includes("user rejected") ||
        error.message.includes("user cancelled")
      ) {
        errorMessage = "Transaction rejected by user.";
        // Close all toast messages
        toast.dismiss(); // Close all existing toasts
        toast.error(errorMessage, { duration: 3000 });
        return; // Return early and don't show another toast
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction.";
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (
        error.message.includes("Invalid metadata URI") ||
        error.message.includes("IPFS")
      ) {
        errorMessage = "IPFS metadata processing failed.";
      } else if (error.message.includes("AI")) {
        errorMessage = "AI generation failed.";
      } else if (error.message.includes("switch chain")) {
        errorMessage = "Failed to switch network. Please do it manually.";
      } else {
        // Use general error message or show error.shortMessage if available
        errorMessage = error.shortMessage || error.message || errorMessage;
      }
    } else if (typeof error === "string") {
      errorMessage = error; // String errors
    }

    // Show toast message
    toast.error(errorMessage, {
      duration: 4000,
      position: "top-center",
      // Theme styling can be added
    });
  }, []);

  // --- Step Navigation ---
  const goToNextStep = useCallback(() => {
    // Step 1: Introduction -> Step 2: Creation Method
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }
    
    // Step 2: Creation Method -> Step 3: AI/Social
    if (currentStep === 2) {
      if (!creationMethod) {
        toast.error("Please select a creation method first");
        return;
      }
      setCurrentStep(3);
      return;
    }
    
    // Step 3: AI Generation -> Step 4: Review
    if (currentStep === 3 && creationMethod === 'ai') {
      if (!userInitialDescription.trim()) {
        toast.error(
          "Please provide a basic description or idea for your token first"
        );
        return;
      }
      handleGenerateTokenWithAI();
      return;
    }
    
    // Step 3: Social Media -> Step 4: Review (no AI generation needed)
    if (currentStep === 3 && creationMethod === 'social') {
      if (!formData.name || !formData.symbol || !formData.description) {
        toast.error("Please parse a social media URL and generate token details first");
        return;
      }
      setCurrentStep(4);
      return;
    }
    
    // Default navigation for other steps
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, creationMethod, userInitialDescription, formData]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // --- AI Operations ---
  // Combined function to handle token generation with AI
  const handleGenerateTokenWithAI = useCallback(async () => {
    if (aiGeneratingText) return;

    setAiGeneratingText(true);
    setAiResponse(null); // Clear previous AI response
    toast.loading("AI generating token details...", { id: "ai-text" });

    try {
      // Generate text first
      const result = await generateTextWithAI(
        selectedCategory || null,
        userInitialDescription
      );

      if (!result?.name || !result?.symbol || !result?.description) {
        throw new Error("AI failed to generate complete text data.");
      }

      console.log("AI text generation successful:", result);

      // Add "Created by AI" to description and include user's initial idea
      const enhancedDescription = result.description;

      setFormData((prev) => ({
        ...prev,
        name: result.name,
        symbol: result.symbol.toUpperCase().substring(0, 4), // Limit symbol to 4 chars and uppercase
        description: enhancedDescription,
      }));

      setAiResponse({
        // Save AI response details
        model: result.model || "default_model",
        usage: result.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      });

      toast.success("Token details generated!", { id: "ai-text" });

      // Then generate image
      await handleGenerateImage(
        enhancedDescription,
        result.name,
        result.symbol
      );

      // Automatically move to next step after generation is complete
      setCurrentStep(4);
    } catch (error) {
      handleError(error, "AI Text Generation");
    } finally {
      setAiGeneratingText(false);
    }
  }, [aiGeneratingText, selectedCategory, userInitialDescription]);

  // Image Generation (can be triggered from text generation or manually)
  const handleGenerateImage = async (
    desc = formData.description,
    name = formData.name,
    symbol = formData.symbol
  ) => {
    if (aiGeneratingImage || uploadingToIPFS) return;

    const descriptionToUse = desc || formData.description;
    if (!descriptionToUse) {
      // If no description is set yet, use the user's initial idea
      if (userInitialDescription) {
        toast.info("Using your initial description to generate an image.");
      } else {
        toast.error("Please provide a description first to generate an image.");
        return;
      }
    }

    setAiGeneratingImage(true);
    toast.loading("AI generating image...", { id: "ai-image" });

    try {
      const categoryInfo = selectedCategory
        ? categories.find((cat) => cat.name === selectedCategory)
        : null;

      // Pass either the enhanced description or user's initial idea
      const finalDescription = descriptionToUse || userInitialDescription;

      console.log("Generating image with params:", {
        name: name || "Token",
        symbol: symbol || "TKN",
        description: finalDescription.substring(0, 100) + "...",
        category: categoryInfo?.name || "None",
      });

      // Assuming generateImageWithAI returns URL directly
      const imageUrl = await generateImageWithAI(
        name || "Token",
        symbol || "TKN",
        finalDescription,
        categoryInfo
      );

      if (!imageUrl || typeof imageUrl !== "string") {
        throw new Error("AI failed to generate a valid image URL.");
      }

      console.log("AI image generation successful. Raw URL:", imageUrl);

      // If image URL is ipfs:// format, convert to gateway URL for preview
      let previewImageUrl = imageUrl;
      const originalIpfsUrl = imageUrl; // Save the original IPFS URL

      if (imageUrl.startsWith("ipfs://")) {
        const hash = imageUrl.replace("ipfs://", "");
        // Use multiple gateways for more reliable preview
        const primaryGateway = `https://gateway.pinata.cloud/ipfs/${hash}`;
        const backupGateway = `https://ipfs.io/ipfs/${hash}`;

        previewImageUrl = primaryGateway;
        console.log("IPFS URL converted to gateway URLs:", {
          primary: primaryGateway,
          backup: backupGateway,
          originalIpfs: originalIpfsUrl,
        });

        // Pre-warm the image by requesting it
        fetch(primaryGateway, { method: "HEAD" })
          .then((res) => {
            if (!res.ok)
              console.log(
                "Primary gateway response not OK, may need to use backup"
              );
          })
          .catch((err) => console.log("Error pre-warming image:", err));
      } else {
        console.log(
          "Non-IPFS URL detected, will need to upload during minting:",
          imageUrl
        );
      }

      setFormData((prev) => ({
        ...prev,
        image: originalIpfsUrl, // Store actual IPFS URL (ipfs://)
        previewImage: previewImageUrl, // Use gateway URL for preview
        originalImageUrl: imageUrl, // Store the original URL as backup
      }));

      toast.success("Image generated successfully!", { id: "ai-image" });
    } catch (error) {
      handleError(error, "AI Image Generation");
      toast.error("Image generation failed. Please try again.", {
        id: "ai-image",
      });
    } finally {
      setAiGeneratingImage(false);
    }
  };

  // --- Manual Image Upload ---
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Image file size should be less than 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      image: file, // Store File object this time
      previewImage: previewUrl, // Preview URL
    }));
    toast.success("Image uploaded successfully.");
  };

  // --- Coin Mint Preparation ---
  const prepareMintCoin = async () => {
    if (isProcessing || !isConnected || !address) {
      if (!isConnected || !address)
        toast.error("Please connect your wallet first.");
      return;
    }

    // Check required fields
    const { name, symbol, description, image, previewImage, originalImageUrl } =
      formData;
    if (!name || !symbol || !description || (!image && !previewImage)) {
      toast.error(
        "Please fill in Name, Symbol, Description and provide an image."
      );
      return;
    }

    // Validate payout recipient address if custom address is enabled
    if (isCustomPayoutAddress) {
      if (!multipleOwners) {
        // Single payout address mode
        if (
          !payoutRecipient ||
          !payoutRecipient.startsWith("0x") ||
          payoutRecipient.length !== 42
        ) {
          toast.error(
            "Please enter a valid Ethereum address as payout recipient"
          );
          return;
        }
      } else {
        // Multiple owners mode
        if (ownerAddresses.length === 0) {
          toast.error("At least one owner address is required");
          return;
        }

        // Validate all addresses
        for (const addr of ownerAddresses) {
          if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
            toast.error(`Invalid address format: ${addr}`);
            return;
          }
        }
      }
    }

    // If no custom address, default to user's address
    let finalPayoutRecipient;
    let finalOwners;

    if (isCustomPayoutAddress) {
      if (multipleOwners) {
        // Use the first address as payout recipient and all addresses as owners
        finalPayoutRecipient = ownerAddresses[0];
        finalOwners = ownerAddresses;
      } else {
        // Use single payout address
        finalPayoutRecipient = payoutRecipient;
        finalOwners = [payoutRecipient]; // Single owner
      }
    } else {
      // Default to connected wallet
      finalPayoutRecipient = address;
      finalOwners = [address];
    }

    if (!walletClient || !publicClient) {
      toast.error("Wallet client or public client not available.");
      return;
    }

    setIsProcessing(true);
    setUploadingToIPFS(false);
    toast.loading("Preparing coin creation...", { id: "mint-process" });

    try {
      // 1. Check and Switch Network
      const isNetworkCorrect = await checkAndSwitchNetwork({
        chainId,
        switchChain,
      });
      if (!isNetworkCorrect) {
        throw new Error("Please switch to the Base network.");
      }
      toast.loading("Checking network... OK", { id: "mint-process" });

      // Verify wallet chain matches the expected chain after switching
      if (walletClient) {
        const walletChainId = await walletClient.getChainId();
        if (walletChainId !== 8453) {
          // Base chain ID
          throw new Error(
            `Wrong network detected. Connected to chain ID ${walletChainId}, need Base (8453). Please switch networks manually.`
          );
        }
      }

      // 2. Upload Metadata to IPFS
      setUploadingToIPFS(true);
      toast.loading("Uploading metadata to IPFS...", { id: "mint-process" });

      let finalImageUrl;
      // Handle different types of image inputs
      if (image && typeof image === "string" && image.startsWith("ipfs://")) {
        // If image is already an IPFS URL, use it directly
        finalImageUrl = image;
        console.log("Using existing IPFS image URL:", finalImageUrl);
      } else if (image instanceof File) {
        // If image is a File object, upload it
        console.log("Uploading image file to IPFS:", image.name, image.size);
        finalImageUrl = image;
      } else if (originalImageUrl) {
        // Use original URL as fallback
        console.log("Using original image URL as fallback:", originalImageUrl);
        finalImageUrl = originalImageUrl;
      } else if (previewImage) {
        // Last resort - use preview image
        console.log("Using preview image URL:", previewImage);
        finalImageUrl = previewImage;
      } else {
        throw new Error("No valid image source available");
      }

      console.log("Final image URL for metadata:", finalImageUrl);

      // Assuming createAndUploadCoinMetadata returns URI in ipfs://... format
      const metadataURI = await createAndUploadCoinMetadata(
        symbol, // Send symbol
        description,
        finalImageUrl // Can be File, IPFS URL, or regular URL
      );

      if (!metadataURI || !metadataURI.startsWith("ipfs://")) {
        throw new Error("Failed to create valid IPFS metadata URI.");
      }

      console.log("Successfully created metadata URI:", metadataURI);
      setUploadingToIPFS(false);
      toast.loading("IPFS upload successful. Preparing transaction...", {
        id: "mint-process",
      });

      // ✅ RESTORED: Calculate initial purchase amount for V4
      let initialPurchaseWei = 0n;
      if (
        wantInitialPurchase &&
        initialPurchaseAmount &&
        parseFloat(initialPurchaseAmount) > 0
      ) {
        try {
          const cleanAmount = parseFloat(initialPurchaseAmount).toString();
          initialPurchaseWei = parseEther(cleanAmount);
          console.log("Initial purchase amount:", cleanAmount, "ETH");
          console.log("Initial purchase in Wei:", initialPurchaseWei.toString());
        } catch (error) {
          console.error("Error converting initial purchase amount to Wei:", error);
          toast.error("Invalid initial purchase amount. Please enter a valid number.");
          setIsProcessing(false);
          return;
        }
      }

      toast.loading("Creating coin with V4 SDK...", {
        id: "mint-process",
      });

      // ✅ FIXED: Use V4 SDK with all parameters including currency and initialPurchase
      const result = await createZoraCoin(
        {
          name,
          symbol,
          uri: metadataURI,
          payoutRecipient: finalPayoutRecipient,
          owners: finalOwners,
          platformReferrer: address, // Use connected wallet as platform referrer
          currency: selectedCurrency, // Use selected currency (1=ZORA, 2=ETH)
          initialPurchaseWei, // Add initial purchase back
        },
        walletClient,
        publicClient,
        {
          gasMultiplier: 120, // V4 requires more gas due to complexity
        }
      );

      if (!result || !result.address) {
        throw new Error("Failed to create coin or get coin address");
      }

      console.log("Coin created successfully:", result);

      // ✅ NEW: Save coin to Supabase database
      try {
        toast.loading("Saving to database...", { id: "save-db" });
        
        const coinData = {
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          contract_address: result.address,
          image_url: formData.previewImage || finalImageUrl,
          creator_address: address,
          creator_name: address, // You might want to get actual username later
          tx_hash: result.hash,
          chain_id: chainId || 8453,
          currency: selectedCurrency === 1 ? 'ZORA' : 'ETH',
          payout_recipient: finalPayoutRecipient,
          initial_purchase_amount: initialPurchaseWei.toString(),
          metadata_uri: metadataURI,
          created_on_platform: true,
          creation_method: creationMethod,
          social_media_data: formData.socialMediaData ? JSON.stringify(formData.socialMediaData) : null,
          original_url: formData.originalUrl || null
        };

        console.log("💾 Saving coin to database:", coinData);
        
        const savedCoin = await CoinService.saveCoin(coinData);
        
        if (savedCoin) {
          toast.dismiss("save-db");
          toast.success("Coin saved to database!", { duration: 3000 });
          console.log("✅ Coin successfully saved to database:", savedCoin);
        } else {
          toast.dismiss("save-db");
          toast.error("Failed to save coin to database", { duration: 3000 });
          console.error("❌ Failed to save coin to database");
        }
      } catch (dbError) {
        toast.dismiss("save-db");
        toast.error("Database save error: " + dbError.message, { duration: 3000 });
        console.error("❌ Database save error:", dbError);
        // Don't throw error here - coin creation was successful
      }

      toast.dismiss("mint-process");
      toast.success(
        `V4 Coin created successfully! Address: ${result.address.substring(
          0,
          6
        )}...`,
        { duration: 5000 }
      );

      // Show success modal
      setSuccessModal({
        isOpen: true,
        tokenAddress: result.address,
        tokenName: formData.name,
        tokenSymbol: formData.symbol,
        tokenImage: formData.previewImage,
      });

      // Clear form or reset to initial state after successful creation
      setFormData({
        name: "",
        symbol: "",
        description: "",
        image: null,
        previewImage: null,
        category: "",
      });
      setAiResponse(null);
    } catch (error) {
      handleError(error, "Coin Creation");
      toast.dismiss("mint-process");
      // setIsProcessing(false) is done in handleError
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Dynamic Button Text and Status ---
  const isLoading =
    isProcessing || aiGeneratingText || aiGeneratingImage || uploadingToIPFS;

  // Check if all form fields are filled
  const formFilled =
    formData.name && formData.symbol && formData.description && formData.image;

  let createButtonText = "Create Token";
  if (uploadingToIPFS) createButtonText = "Uploading to IPFS...";
  else if (isProcessing) createButtonText = "Processing..."; // General processing status

  // Modal close function
  const closeSuccessModal = () => {
    setSuccessModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Set mounted ref to true after initial render
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // ✅ NEW: Safe currency selection for V4
  const safeSetSelectedCurrency = useCallback((value) => {
    if (mounted.current) {
      console.log("Setting currency to:", value, value === DeployCurrency.ETH ? "ETH" : "ZORA");
      setSelectedCurrency(value);
    }
  }, []);

  // All shared props to pass to sub-components
  const sharedProps = {
    formData,
    setFormData,
    isLoading,
    theme,
    handleGenerateImage,
    handleImageUpload,
    prepareMintCoin,
    goToPreviousStep,
    goToNextStep,
    createButtonText,
    userInitialDescription,
    setUserInitialDescription,
    categories,
    selectedCategory,
    setSelectedCategory,
    aiGeneratingText,
    handleGenerateTokenWithAI,
    address,
    chainId,
    switchChain,
    balanceData,
    ethPrice,
    creationMethod,
    setCreationMethod,
    // ✅ RESTORED: Initial Purchase for V4 (per Factory docs it's still supported)
    wantInitialPurchase,
    setWantInitialPurchase,
    initialPurchaseAmount,
    setInitialPurchaseAmount,
    // ✅ NEW: Add currency selection props for V4
    selectedCurrency,
    safeSetSelectedCurrency,
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
  };

  // --- JSX ---
  return (
    <div className="max-w-7xl mx-auto p-2 relative">
      <div className="p-4   rounded-xl overflow-hidden relative z-10">
        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-gray-900 dark:text-white">
          AI-Powered Token Generator
        </h2>
        {/* Step Progress Indicator */}
        <StepProgress
          currentStep={currentStep}
          totalSteps={4}
          stepLabels={["Introduction", "Creation Method", 
                      creationMethod === 'ai' ? "AI Generation" : "Social Import", 
                      "Review & Create"]}
        />

        {/* Step 1: Introduction */}
        {currentStep === 1 && <IntroductionStep onGetStarted={goToNextStep} />}

        {/* Step 2: Creation Method Selection */}
        {currentStep === 2 && (
          <CreationMethodStep
            creationMethod={creationMethod}
            setCreationMethod={setCreationMethod}
            goToNextStep={goToNextStep}
            goToPreviousStep={goToPreviousStep}
            theme={theme}
          />
        )}

        {/* Step 3: AI Token Creation */}
        {currentStep === 3 && creationMethod === 'ai' && (
          <IdeaInputStep
            {...sharedProps}
            goToNextStep={goToNextStep}
            goToPreviousStep={goToPreviousStep}
          />
        )}

        {/* Step 3: Social Media Import */}
        {currentStep === 3 && creationMethod === 'social' && (
          <SocialMediaStep
            {...sharedProps}
            goToNextStep={goToNextStep}
            goToPreviousStep={goToPreviousStep}
            theme={theme}
          />
        )}

        {/* Step 4: Review and Create Token */}
        {currentStep === 4 && (
          <ReviewCreateStep
            {...sharedProps}
            goToPreviousStep={goToPreviousStep}
          />
        )}
      </div>

      {/* Add inline styles for fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      {/* Success Modal - Keep this unchanged */}
      <TokenSuccessModal
        isOpen={successModal.isOpen}
        onClose={closeSuccessModal}
        tokenAddress={successModal.tokenAddress}
        tokenName={successModal.tokenName}
        tokenSymbol={successModal.tokenSymbol}
        tokenImage={successModal.tokenImage}
      />
    </div>
  );
}

export default CoinCreator;
