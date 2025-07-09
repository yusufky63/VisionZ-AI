"use client";

import { useState, useEffect, useRef } from "react";
// import { useParams, Link } from "react-router-dom";
import Link from "next/link";
import { getETHPrice } from "../../services/ethPrice";
import { getCoinDetails, fetchCoinComments } from "../../services/sdk/getCoins";
import {
  analyzeTokenWithAI,
  calculateTokenScore,
  getScoreLabel,
  getScoreColor,
} from "../../services/aiService";
import { getOnchainTokenDetails } from "../../services/sdk/getOnchain";
import {
  updateCoinMetadataURI,
  updateCoinPayoutRecipient,
  isUserCoinOwner,
  isValidEthereumAddress,
  validateMetadataURI,
} from "../../services/sdk/updateCoin";
import CoinTrader from "./CoinTrader";
import CoinComments from "../comments/CoinComments";
import Image from "next/image";
import { formatEther } from "viem";
import { useTheme } from "../../contexts/ThemeContext";
import { toast } from "react-hot-toast";
import WatchlistButton from "../WatchlistButton";
import { useWatchlist } from "../../context/WatchlistContext";
import { useAccount, useWalletClient } from "wagmi";

// Helper function to safely display BigInt values
const formatBigIntValue = (value) => {
  if (value === undefined || value === null) return "0";
  if (typeof value === "bigint") return value.toString();
  return value;
};

// Percentage change calculation
const calculatePercentChange = (marketCap, marketCapDelta) => {
  const currentMarketCap = parseFloat(marketCap || 0);
  const deltaValue = parseFloat(marketCapDelta || 0);

  // 24 hours ago value
  const previousMarketCap =
    deltaValue < 0
      ? currentMarketCap - deltaValue // For negative delta, add
      : currentMarketCap - deltaValue; // For positive delta, subtract

  // If previous value is 0, percentage cannot be calculated
  if (previousMarketCap <= 0) return 0;

  // Percentage change calculation
  return (deltaValue / previousMarketCap) * 100;
};

function CoinDetailPage({ coinAddress }) {
  // const { coinAddress } = useParams();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // 'info', 'comments', 'activity'
  const [dexScreenerTab, setDexScreenerTab] = useState("image"); // 'image', 'chart'
  const [dexScreenerLoaded, setDexScreenerLoaded] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [commentsCount, setCommentsCount] = useState(0);

  // AI Analiz için yeni state'ler
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [onchainData, setOnchainData] = useState(null);
  const [loadingOnchain, setLoadingOnchain] = useState(false);

  // Update functionality states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [activeUpdateTab, setActiveUpdateTab] = useState("uri"); // 'uri' or 'payout'
  const [newURI, setNewURI] = useState("");
  const [newPayoutRecipient, setNewPayoutRecipient] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Add refs to track the latest state values without retriggering the effect
  const loadingRef = useRef(loading);
  const errorRef = useRef(error);
  const refreshingRef = useRef(refreshing);
  const coinAddressRef = useRef(coinAddress);

  // Update refs when states change
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    coinAddressRef.current = coinAddress;
  }, [coinAddress]);

  const { theme } = useTheme();
  const [ethPrice, setEthPrice] = useState(null);
  const { types } = useWatchlist();

  // WAGMI hooks for wallet interaction
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Load ETH price
  useEffect(() => {
    async function loadEthPrice() {
      try {
        const price = await getETHPrice();
        setEthPrice(price);
      } catch (err) {
        console.error("ETH Price loading error:", err);
      }
    }

    loadEthPrice();
    // Update price every 60 seconds
    const interval = setInterval(loadEthPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load coin details
  useEffect(() => {
    // Initial load
    loadCoinDetails();

    // Set up auto-refresh interval that uses ref values
    const refreshInterval = setInterval(() => {
      // Use ref values instead of state values to avoid loop
      if (
        !loadingRef.current &&
        !errorRef.current &&
        !refreshingRef.current &&
        coinAddressRef.current
      ) {
        console.log(
          `Auto-refreshing coin details for ${coinAddressRef.current}...`
        );
        loadCoinDetails(true);
      }
    }, 15000); // 15 seconds interval

    // Clean up the interval when component unmounts
    return () => {
      console.log("Clearing refresh interval");
      clearInterval(refreshInterval);
    };
  }, [coinAddress]); // Only depend on coinAddress, not loading/error/refreshing

  // Load comments
  useEffect(() => {
    async function loadComments() {
      if (activeTab === "comments" && coinAddress) {
        try {
          setCommentsLoading(true);
          setCommentsError(null);
          const data = await fetchCoinComments(coinAddress);
          setComments(data.comments);
          setCommentsCount(data.totalCount);
        } catch (err) {
          console.error("Comments loading error:", err);
          setCommentsError("Comments loading error. Please try again.");
        } finally {
          setCommentsLoading(false);
        }
      }
    }

    loadComments();
  }, [coinAddress, activeTab]);

  // Get coin details
  const loadCoinDetails = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        console.log("Starting REFRESH load...");
        setRefreshing(true);
      } else {
        console.log("Starting INITIAL load...");
        setLoading(true);
      }

      setError(null);
      if (!isRefresh) setCoin(null);

      console.log(`${coinAddress} token details loading...`);
      const coinData = await getCoinDetails(coinAddress);

      if (!coinData) {
        throw new Error("Token details not found");
      }

      // Update the coin data
      setCoin(coinData);

      // Record when we last updated
      const now = new Date();
      setLastUpdated(now);

      document.title = `${coinData.name} ($${coinData.symbol}) | Zora Token Details`;
      console.log("Token details loaded successfully:", {
        name: coinData.name,
        symbol: coinData.symbol,
        time: now.toLocaleTimeString(),
      });
    } catch (err) {
      console.error("Token details loading error:", err);
      setError("Token details loading error. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Shorten address
  const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Onchain verileri yükle
  const loadOnchainData = async () => {
    if (!coinAddress) return;

    try {
      setLoadingOnchain(true);

      // onchainAnalyze servisini kullanarak blockchain'den token verilerini çek
      const onchainDetails = await getOnchainTokenDetails(coinAddress);

      setOnchainData(onchainDetails);
      console.log("Loaded onchain data:", onchainDetails);
    } catch (error) {
      console.error("Onchain data loading error:", error);
    } finally {
      setLoadingOnchain(false);
    }
  };

  // AI analizi yapmak için fonksiyon
  const handleGetAiAnalysis = async () => {
    if (!coin) return;

    try {
      setAiLoading(true);
      setAiError(null);

      // Eğer onchain veriler yüklenmemişse yükle
      if (!onchainData && !loadingOnchain) {
        await loadOnchainData();
      }

      const result = await analyzeTokenWithAI(coin, userQuestion, onchainData);
      setAiAnalysis(result.analysis);
    } catch (error) {
      console.error("AI analysis error:", error);
      setAiError("AI analysis error. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  };

  // Update functions
  const handleUpdate = async () => {
    if (!walletClient) {
      toast.error("Please connect your wallet");
      return;
    }

    if (activeUpdateTab === "uri") {
      const validation = validateMetadataURI(newURI);
      if (!validation.isValid) {
        toast.error(validation.message);
        return;
      }
    } else if (activeUpdateTab === "payout") {
      if (!isValidEthereumAddress(newPayoutRecipient)) {
        toast.error("Please enter a valid Ethereum address");
        return;
      }
    }

    try {
      setIsUpdating(true);

      let result;
      if (activeUpdateTab === "uri") {
        toast.loading("Updating coin metadata URI...", { id: "update" });
        result = await updateCoinMetadataURI(coinAddress, newURI, walletClient);
        toast.success("Coin metadata URI updated successfully!", {
          id: "update",
        });
      } else {
        toast.loading("Updating payout recipient...", { id: "update" });
        result = await updateCoinPayoutRecipient(
          coinAddress,
          newPayoutRecipient,
          walletClient
        );
        toast.success("Payout recipient updated successfully!", {
          id: "update",
        });
      }

      console.log(`${activeUpdateTab} update result:`, result);

      // Refresh coin data to show updated info
      loadCoinDetails(true);
      loadOnchainData();

      // Close modal and reset form
      setShowUpdateModal(false);
      setNewURI("");
      setNewPayoutRecipient("");
    } catch (error) {
      console.error(`Error updating ${activeUpdateTab}:`, error);

      if (error.message.includes("OnlyOwner")) {
        toast.error("Only coin owners can make updates", { id: "update" });
      } else {
        toast.error(`Failed to update: ${error.message}`, { id: "update" });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if current user is an owner of the coin
  const isOwner = () => {
    return isUserCoinOwner(address, onchainData?.owners);
  };

  // Update debug function
  const debugOnchainData = () => {
    if (!coinAddress) return;

    if (!onchainData) {
      loadOnchainData();
      return;
    }

    // BigInt değerlerini string'e dönüştürerek güvenli JSON dönüşümü
    console.log(
      "Onchain data details:",
      JSON.stringify(
        onchainData,
        (key, value) => (typeof value === "bigint" ? value.toString() : value),
        2
      )
    );
  };

  // useEffect ile onchain verileri yükle
  useEffect(() => {
    if (activeTab === "info" && !onchainData && !loadingOnchain) {
      loadOnchainData();
    }
  }, [activeTab, onchainData, loadingOnchain]);

  // showAiAnalysis değiştiğinde onchain verileri yükle
  useEffect(() => {
    if (showAiAnalysis && !onchainData && !loadingOnchain) {
      loadOnchainData();
    }
  }, [showAiAnalysis, onchainData, loadingOnchain]);

  // Add this new state right after other state declarations
  const [videoPlayed, setVideoPlayed] = useState(false);
  const [tokenScoreExpanded, setTokenScoreExpanded] = useState(false);

  // Add this function after other handler functions
  const handleVideoPlay = () => {
    console.log("Video playback started");
    setVideoPlayed(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-2">
      {!loading && !error && coin && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setShowAiAnalysis(!showAiAnalysis)}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Ask AI about this token
              </button>
            </div>

            {/* Last Updated Indicator - visible when we have data */}
            {lastUpdated && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <span className="mr-1">Last updated:</span>
                <span className="font-medium">
                  {lastUpdated.toLocaleTimeString()}
                </span>
                {refreshing && (
                  <svg
                    className="animate-spin ml-2 h-3 w-3 text-indigo-500"
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
                )}
                <button
                  onClick={() => loadCoinDetails(true)}
                  className="ml-2 text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  title="Refresh now"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    ></path>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {showAiAnalysis && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-900/20 backdrop-blur-md rounded-xl border border-gray-100 dark:border-gray-800/40">
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                Token Analysis and Questions
              </h3>

              <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  For best results, ask a specific question about the token. For
                  example:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() =>
                      setUserQuestion("What is the purpose of this token?")
                    }
                    className="text-left px-3 py-2 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-sm transition-colors"
                  >
                    What is the purpose of this token?
                  </button>
                  <button
                    onClick={() =>
                      setUserQuestion("How is the community engagement?")
                    }
                    className="text-left px-3 py-2 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-sm transition-colors"
                  >
                    How is the community engagement?
                  </button>
                  <button
                    onClick={() =>
                      setUserQuestion(
                        "What are the strengths and weaknesses of this token?"
                      )
                    }
                    className="text-left px-3 py-2 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-sm transition-colors"
                  >
                    What are the strengths and weaknesses?
                  </button>
                  <button
                    onClick={() =>
                      setUserQuestion(
                        "Is this token a potential good investment?"
                      )
                    }
                    className="text-left px-3 py-2 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-sm transition-colors"
                  >
                    Is this a potential good investment?
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Ask a clear question about the token"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleGetAiAnalysis}
                  disabled={aiLoading || userQuestion.length < 5}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {aiLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
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
                      Analyzing...
                    </span>
                  ) : (
                    "Analyze"
                  )}
                </button>
              </div>

              {aiError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                  {aiError}
                </div>
              )}

              {aiAnalysis && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
                    AI Analysis:
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {aiAnalysis}
                  </div>
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Note: This analysis is generated by AI and should not be
                    considered as definitive information. Always do your own
                    research before making investment decisions.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading durumu */}
      {loading && (
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Token details loading...
          </p>
        </div>
      )}

      {/* Hata durumu */}
      {error && (
        <div className="p-8 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-xl max-w-7xl mx-auto">
            <p className="mb-4">{error}</p>
            <button
              onClick={loadCoinDetails}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Coin detayları */}
      {!loading && !error && coin && (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Sol taraf - Büyük resim alanı */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="rounded-xl overflow-hidden relative group">
                {dexScreenerTab === "image" ? (
                  // Image tab content
                  coin.mediaContent?.previewImage?.medium ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-blue-500/0 group-hover:opacity-70 opacity-0 transition-opacity duration-300 z-10 pointer-events-none"></div>

                      {/* Media type detection and conditional rendering */}
                      {coin.mediaContent?.mimeType?.startsWith("video/") ? (
                        // Video content
                        <div className="relative w-full aspect-square bg-black">
                          <video
                            id="tokenVideo"
                            src={
                              coin.mediaContent.originalUri?.startsWith(
                                "ipfs://"
                              )
                                ? `https://gateway.pinata.cloud/ipfs/${coin.mediaContent.originalUri.replace(
                                    "ipfs://",
                                    ""
                                  )}`
                                : coin.mediaContent.originalUri
                            }
                            poster={coin.mediaContent.previewImage.medium}
                            controls
                            autoPlay={false}
                            loop
                            muted={!videoPlayed}
                            playsInline
                            className="w-full h-full object-contain"
                            style={{ aspectRatio: "1/1", background: "#000" }}
                            onPlay={handleVideoPlay}
                          >
                            Your browser does not support video playback.
                          </video>

                          {/* Custom play button overlay - only shows when video is not playing */}
                          {!videoPlayed && (
                            <div
                              className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-20"
                              onClick={() => {
                                const videoElement =
                                  document.getElementById("tokenVideo");
                                if (videoElement) {
                                  videoElement.play();
                                  // Video onPlay event will trigger handleVideoPlay
                                }
                              }}
                            >
                              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <svg
                                  className="w-8 h-8 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          )}

                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            Video
                          </div>
                        </div>
                      ) : coin.mediaContent?.mimeType?.startsWith(
                          "image/gif"
                        ) ? (
                        // GIF content
                        <div className="relative w-full aspect-square">
                          <img
                            src={
                              coin.mediaContent.originalUri?.startsWith(
                                "ipfs://"
                              )
                                ? `https://gateway.pinata.cloud/ipfs/${coin.mediaContent.originalUri.replace(
                                    "ipfs://",
                                    ""
                                  )}`
                                : coin.mediaContent.originalUri ||
                                  coin.mediaContent.previewImage.medium
                            }
                            alt={coin.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                            style={{ aspectRatio: "1/1" }}
                            onClick={() => {
                              if (coin.mediaContent?.originalUri) {
                                window.open(
                                  coin.mediaContent.originalUri.startsWith(
                                    "ipfs://"
                                  )
                                    ? `https://gateway.pinata.cloud/ipfs/${coin.mediaContent.originalUri.replace(
                                        "ipfs://",
                                        ""
                                      )}`
                                    : coin.mediaContent.originalUri,
                                  "_blank"
                                );
                              }
                            }}
                          />
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            GIF
                          </div>
                        </div>
                      ) : (
                        // Standard image content (default)
                        <img
                          src={coin.mediaContent.previewImage.medium}
                          alt={coin.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                          style={{ aspectRatio: "1/1" }}
                          onClick={() => {
                            if (coin.mediaContent?.previewImage?.large) {
                              window.open(
                                coin.mediaContent.previewImage.large,
                                "_blank"
                              );
                            } else if (coin.mediaContent?.originalUri) {
                              window.open(
                                coin.mediaContent.originalUri.startsWith(
                                  "ipfs://"
                                )
                                  ? `https://gateway.pinata.cloud/ipfs/${coin.mediaContent.originalUri.replace(
                                      "ipfs://",
                                      ""
                                    )}`
                                  : coin.mediaContent.originalUri,
                                "_blank"
                              );
                            }
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-500">
                      <span className="text-4xl font-bold opacity-30">
                        {coin.symbol}
                      </span>
                    </div>
                  )
                ) : (
                  // Chart tab content - Enhanced DexScreener integration
                  <div className="w-full relative">
                    {!dexScreenerLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 z-10 rounded-xl">
                        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent mb-3"></div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                          Loading DexScreener data...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          This might take a few seconds
                        </p>
                      </div>
                    )}

                    {/* Full height chart container */}
                    <div className="dexscreener-container">
                      <iframe
                        src={`https://dexscreener.com/base/${
                          coin.address
                        }?embed=1&loadChartSettings=0&chartLeftToolbar=0&chartTheme=${
                          theme === "dark" ? "dark" : "light"
                        }&theme=${
                          theme === "dark" ? "dark" : "light"
                        }&chartStyle=0&chartType=usd&interval=15`}
                        className={`dexscreener-iframe ${
                          dexScreenerLoaded ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setDexScreenerLoaded(true)}
                        allow="fullscreen"
                      ></iframe>
                    </div>

                    {/* Expanded styles for better chart display */}
                    <style jsx>{`
                      .dexscreener-container {
                        position: relative;
                        width: 100%;
                        height: 0;
                        padding-bottom: 125%; /* Mobile aspect ratio */
                        overflow: hidden;
                        border-radius: 0.75rem;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                          0 2px 4px -1px rgba(0, 0, 0, 0.06);
                      }

                      .dexscreener-iframe {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        border: 0;
                        transition: opacity 0.3s ease-in-out;
                      }

                      /* Improved desktop view */
                      @media (min-width: 768px) {
                        .dexscreener-container {
                          padding-bottom: 90%; /* Tablet aspect ratio */
                        }
                      }

                      /* Large screen optimization */
                      @media (min-width: 1200px) {
                        .dexscreener-container {
                          padding-bottom: 65%; /* Desktop aspect ratio */
                        }
                      }

                      /* Full screen on XL displays */
                      @media (min-width: 1536px) {
                        .dexscreener-container {
                          padding-bottom: 55%; /* XL desktop aspect ratio */
                        }
                      }
                    `}</style>
                  </div>
                )}
              </div>
              {/* DexScreener Tab Control */}
              <div className="mt-2 flex items-center justify-center border-t border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/20 backdrop-blur-md rounded-lg overflow-hidden">
                <button
                  onClick={() => setDexScreenerTab("image")}
                  className={`flex-1 py-2 text-center transition-colors ${
                    dexScreenerTab === "image"
                      ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                    {coin?.mediaContent?.mimeType?.startsWith("video/")
                      ? "Video"
                      : coin?.mediaContent?.mimeType?.startsWith("image/gif")
                      ? "GIF"
                      : "Media"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setDexScreenerTab("chart");
                    setDexScreenerLoaded(false);
                  }}
                  className={`flex-1 py-2 text-center transition-colors ${
                    dexScreenerTab === "chart"
                      ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      ></path>
                    </svg>
                    Chart
                  </span>
                </button>
              </div>

              {/* Token Score Section */}
              {(() => {
                const scores = calculateTokenScore(
                  coin,
                  onchainData,
                  commentsCount
                );
                return (
                  <div className="mt-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/40">
                    {/* Main Score Header - Always Visible */}
                    <div
                      className="p-4 cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors"
                      onClick={() => setTokenScoreExpanded(!tokenScoreExpanded)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Token Score
                          </h3>
                          <div className="flex items-center gap-2">
                            <div
                              className={`text-2xl font-bold ${getScoreColor(
                                scores.overall
                              )}`}
                            >
                              {scores.overall}
                            </div>
                            <div className="text-xs">
                              <div
                                className={`font-medium ${getScoreColor(
                                  scores.overall
                                )}`}
                              >
                                {getScoreLabel(scores.overall)}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                /100
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {tokenScoreExpanded
                              ? "Hide Details"
                              : "Show Details"}
                          </span>
                          <svg
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                              tokenScoreExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Content */}
                    {tokenScoreExpanded && (
                      <div className="px-4 pb-4 border-t border-indigo-200 dark:border-indigo-800">
                        {/* Quick Score Overview */}
                        <div className="mt-4 grid grid-cols-5 gap-2">
                          <div className="p-2 bg-white dark:bg-gray-800/50 rounded-lg text-center">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Liquidity
                            </div>
                            <div
                              className={`text-sm font-bold ${getScoreColor(
                                scores.liquidity
                              )}`}
                            >
                              {scores.liquidity}
                            </div>
                          </div>

                          <div className="p-2 bg-white dark:bg-gray-800/50 rounded-lg text-center">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Volume
                            </div>
                            <div
                              className={`text-sm font-bold ${getScoreColor(
                                scores.volume
                              )}`}
                            >
                              {scores.volume}
                            </div>
                          </div>

                          <div className="p-2 bg-white dark:bg-gray-800/50 rounded-lg text-center">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Community
                            </div>
                            <div
                              className={`text-sm font-bold ${getScoreColor(
                                scores.community
                              )}`}
                            >
                              {scores.community}
                            </div>
                          </div>

                          <div className="p-2 bg-white dark:bg-gray-800/50 rounded-lg text-center">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Risk
                            </div>
                            <div
                              className={`text-sm font-bold ${getScoreColor(
                                scores.risk
                              )}`}
                            >
                              {scores.risk}
                            </div>
                          </div>

                          <div className="p-2 bg-white dark:bg-gray-800/50 rounded-lg text-center">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Growth
                            </div>
                            <div
                              className={`text-sm font-bold ${getScoreColor(
                                scores.growth
                              )}`}
                            >
                              {scores.growth}
                            </div>
                          </div>
                        </div>

                        {/* How It Works Section */}
                        <div className="mt-6">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            How Token Score Works
                          </h4>

                          <div className="space-y-4 text-sm">
                            {/* Overall Formula */}
                            <div className="p-3 bg-white dark:bg-gray-800/30 rounded-lg">
                              <div className="font-medium text-gray-900 dark:text-white mb-2">
                                📊 Overall Score Formula:
                              </div>
                              <div className="text-gray-700 dark:text-gray-300 font-mono text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                                Score = (Liquidity × 25%) + (Volume × 20%) +
                                (Community × 20%) + (Risk × 20%) + (Growth ×
                                15%)
                              </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="grid grid-cols-1 gap-3">
                              {/* Liquidity */}
                              <div className="p-3 bg-white dark:bg-gray-800/30 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className={`font-medium ${getScoreColor(
                                      scores.liquidity
                                    )}`}
                                  >
                                    💧 Liquidity Score: {scores.liquidity}/100
                                    (25% weight)
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  <div>• Market Cap &gt; $100K: 90 points</div>
                                  <div>• Market Cap &gt; $50K: 80 points</div>
                                  <div>• Market Cap &gt; $10K: 60 points</div>
                                  <div>• Market Cap &gt; $1K: 40 points</div>
                                  <div>• Market Cap &lt; $1K: 20 points</div>
                                  <div className="pt-1 text-gray-500">
                                    Current: $
                                    {parseFloat(
                                      coin.marketCap || 0
                                    ).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              {/* Volume */}
                              <div className="p-3 bg-white dark:bg-gray-800/30 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className={`font-medium ${getScoreColor(
                                      scores.volume
                                    )}`}
                                  >
                                    📈 Volume Score: {scores.volume}/100 (20%
                                    weight)
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  <div>• 24h Volume &gt; $10K: 95 points</div>
                                  <div>• 24h Volume &gt; $1K: 80 points</div>
                                  <div>• 24h Volume &gt; $100: 60 points</div>
                                  <div>• 24h Volume &gt; $10: 40 points</div>
                                  <div>• 24h Volume &lt; $10: 10 points</div>
                                  <div className="pt-1 text-gray-500">
                                    Current: $
                                    {parseFloat(
                                      coin.volume24h || 0
                                    ).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              {/* Community */}
                              <div className="p-3 bg-white dark:bg-gray-800/30 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className={`font-medium ${getScoreColor(
                                      scores.community
                                    )}`}
                                  >
                                    👥 Community Score: {scores.community}/100
                                    (20% weight)
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  <div>
                                    • Holders: {coin.uniqueHolders || 0} (max 40
                                    points)
                                  </div>
                                  <div>
                                    • Comments: {commentsCount} (max 25 points)
                                  </div>
                                  <div>
                                    • Transfers: {coin.transfers?.count || 0}{" "}
                                    (max 35 points)
                                  </div>
                                  <div className="pt-1 text-gray-500">
                                    Combined activity and engagement metrics
                                  </div>
                                </div>
                              </div>

                              {/* Risk */}
                              <div className="p-3 bg-white dark:bg-gray-800/30 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className={`font-medium ${getScoreColor(
                                      scores.risk
                                    )}`}
                                  >
                                    ⚠️ Risk Score: {scores.risk}/100 (20%
                                    weight)
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  <div>
                                    • Age:{" "}
                                    {coin.createdAt
                                      ? Math.floor(
                                          (new Date() -
                                            new Date(coin.createdAt)) /
                                            (1000 * 60 * 60 * 24)
                                        ) + " days"
                                      : "Unknown"}
                                  </div>
                                  <div>• Holder concentration risk</div>
                                  <div>• Market cap stability</div>
                                  <div>• Volume consistency</div>
                                  <div className="pt-1 text-gray-500">
                                    Lower risk factors = higher score
                                  </div>
                                </div>
                              </div>

                              {/* Growth */}
                              <div className="p-3 bg-white dark:bg-gray-800/30 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className={`font-medium ${getScoreColor(
                                      scores.growth
                                    )}`}
                                  >
                                    🚀 Growth Score: {scores.growth}/100 (15%
                                    weight)
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  <div>• 24h Change &gt; +50%: 95 points</div>
                                  <div>• 24h Change &gt; +20%: 80 points</div>
                                  <div>• 24h Change &gt; +10%: 70 points</div>
                                  <div>• 24h Change &gt; 0%: 60 points</div>
                                  <div>• Negative changes: lower points</div>
                                  <div className="pt-1 text-gray-500">
                                    Current:{" "}
                                    {coin.marketCapDelta24h
                                      ? (parseFloat(coin.marketCapDelta24h) > 0
                                          ? "+"
                                          : "") +
                                        parseFloat(
                                          coin.marketCapDelta24h
                                        ).toFixed(2) +
                                        "%"
                                      : "No data"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Score Interpretation */}
                            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                              <div className="font-medium text-gray-900 dark:text-white mb-2">
                                🎯 Score Interpretation:
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2">
                                <div>
                                  • 90-100:{" "}
                                  <span className="text-green-500 font-medium">
                                    EXCELLENT
                                  </span>
                                </div>
                                <div>
                                  • 80-89:{" "}
                                  <span className="text-green-400 font-medium">
                                    VERY GOOD
                                  </span>
                                </div>
                                <div>
                                  • 70-79:{" "}
                                  <span className="text-yellow-500 font-medium">
                                    GOOD
                                  </span>
                                </div>
                                <div>
                                  • 60-69:{" "}
                                  <span className="text-yellow-600 font-medium">
                                    FAIR
                                  </span>
                                </div>
                                <div>
                                  • 40-59:{" "}
                                  <span className="text-orange-500 font-medium">
                                    POOR
                                  </span>
                                </div>
                                <div>
                                  • 0-39:{" "}
                                  <span className="text-red-500 font-medium">
                                    VERY POOR
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Disclaimer */}
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/40">
                              <div className="text-xs text-yellow-800 dark:text-yellow-300">
                                ⚠️ <strong>Disclaimer:</strong> This score is
                                for informational purposes only and should not
                                be considered as investment advice. Always do
                                your own research before making any investment
                                decisions.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Sağ taraf - Bilgi ve işlem alanı */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-3">
              {/* Coin Bilgileri */}
              <div className="bg-white dark:bg-gray-900/20 backdrop-blur-md rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800/40">
                {/* Başlık ve basic detaylar */}
                <div className="p-3 border-b dark:border-gray-800/40 border-gray-100">
                  {/* Yaratıcı bilgisi ve share butonu */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Image
                        src={
                          coin.creatorProfile?.avatar?.previewImage?.small ||
                          "/placeholder-avatar.png"
                        }
                        alt={coin.creatorProfile?.handle || "Creator avatar"}
                        width={30}
                        height={30}
                        className="rounded-full mr-2 border border-gray-100 dark:border-gray-800"
                      />

                      <Link
                        href={`/profile/${coin.creatorAddress}`}
                        className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                      >
                        {coin.creatorProfile?.handle ||
                          shortenAddress(coin.creatorAddress)}
                      </Link>
                    </div>

                    {/* Share Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          // Create share URL
                          const shareUrl = `${window.location.origin}/token/${coin.address}`;
                          // Try native share API first
                          if (navigator.share) {
                            navigator
                              .share({
                                title: `${coin.name} ($${coin.symbol})`,
                                text: `Check out ${coin.name} ($${coin.symbol}) on Zora`,
                                url: shareUrl,
                              })
                              .catch((err) => {
                                // Fallback to clipboard
                                navigator.clipboard.writeText(shareUrl);
                                toast.success("Link copied to clipboard!");
                              });
                          } else {
                            // Fallback to clipboard
                            navigator.clipboard.writeText(shareUrl);
                            toast.success("Link copied to clipboard!");
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                        Share
                      </button>
                      {isConnected && isOwner() && (
                        <button
                          onClick={() => {
                            // Initialize form with current values
                            setNewURI(coin.metadata?.tokenURI || "");
                            setNewPayoutRecipient(
                              onchainData?.payoutRecipient || ""
                            );
                            setShowUpdateModal(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Update
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Coin ismi ve sembolü */}
                  <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {coin.name}
                    </h1>
                    <WatchlistButton item={coin} type={types.COIN} size="md" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    ${coin.symbol}
                  </div>

                  {/* Açıklama */}
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 overflow-hidden">
                    {coin.description || "No description available"}
                  </p>

                  {/* Metrikler */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Market Cap
                      </span>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        ${parseFloat(coin.marketCap || 0).toLocaleString()}
                      </div>

                      {/* {coin.marketCapDelta24h && (
                        <span className={`text-xs ${parseFloat(coin.marketCapDelta24h) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {parseFloat(coin.marketCapDelta24h) > 0 && '+'}{calculatePercentChange(coin.marketCap, coin.marketCapDelta24h).toFixed(1)}%
                        </span>
                      )} */}
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        24h Volume
                      </span>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        ${parseFloat(coin.volume24h || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Holders
                      </span>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {parseFloat(coin.uniqueHolders || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alım/Satım bölümü */}
                <div className="p-2">
                  <div>
                    <CoinTrader
                      coinAddress={coinAddress}
                      coinSymbol={coin.symbol}
                      ethPrice={ethPrice}
                      coin={coin}
                    />
                  </div>
                </div>
              </div>

              {/* Tab menüsü */}
              <div className="bg-white dark:bg-gray-900/20 backdrop-blur-md rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800/40">
                <div className="flex border-b dark:border-gray-800 border-gray-200">
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`flex-1 py-3 text-center ${
                      activeTab === "comments"
                        ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Comments
                  </button>
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`flex-1 py-3 text-center ${
                      activeTab === "info"
                        ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Details
                  </button>
                </div>

                {/* Tab içerikleri */}
                <div className="p-4">
                  {activeTab === "info" && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Token Address:
                          </div>
                          <div className="text-sm text-right text-gray-900 dark:text-gray-300 font-mono">
                            {shortenAddress(coin.address)}
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(coin.address)
                              }
                              className="ml-1 text-blue-500 dark:text-blue-400"
                            >
                              <svg
                                className="w-4 h-4 inline"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Created:
                          </div>
                          <div className="text-sm text-right text-gray-900 dark:text-gray-300">
                            {formatDate(coin.createdAt)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Total Transactions:
                          </div>
                          <div className="text-sm text-right text-gray-900 dark:text-gray-300">
                            {coin.transfers?.count?.toLocaleString() || "0"}
                          </div>
                        </div>
                      </div>

                      {/* Onchain Veri Bölümü */}
                      {loadingOnchain ? (
                        <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-4 flex items-center justify-center py-6">
                          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-blue-500 dark:border-blue-400 border-r-transparent mr-2"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Loading blockchain data...
                          </span>
                        </div>
                      ) : onchainData ? (
                        <div className="grid grid-cols-2 gap-3">
                          {/* Market Cap - Onchain */}

                          {/* Liquidity */}
                          {onchainData.liquidity && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Liquidity (USD)
                              </span>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                $
                                {onchainData.liquidity?.usdcDecimal
                                  ?.toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                  })
                                  .replace(".", ",") || "0,00"}
                              </div>
                            </div>
                          )}

                          {/* Pool & Other Details */}
                          <div className="col-span-2 bg-gray-50 dark:bg-gray-900/20 rounded-xl p-3 mt-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {/* Pool */}
                              {onchainData.pool && (
                                <>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Pool:
                                  </div>
                                  <div className="text-right text-gray-900 dark:text-gray-300 font-mono truncate">
                                    {shortenAddress(onchainData.pool)}
                                    <button
                                      onClick={() =>
                                        navigator.clipboard.writeText(
                                          onchainData.pool
                                        )
                                      }
                                      className="ml-1 text-blue-500 dark:text-blue-400"
                                    >
                                      <svg
                                        className="w-3 h-3 inline"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        ></path>
                                      </svg>
                                    </button>
                                  </div>
                                </>
                              )}
                              {/* Payout Recipient */}
                              {onchainData.payoutRecipient && (
                                <>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Payout Address:
                                  </div>
                                  <div className="text-right text-gray-900 dark:text-gray-300 font-mono truncate">
                                    {shortenAddress(
                                      onchainData.payoutRecipient
                                    )}
                                    <button
                                      onClick={() =>
                                        navigator.clipboard.writeText(
                                          onchainData.payoutRecipient
                                        )
                                      }
                                      className="ml-1 text-blue-500 dark:text-blue-400"
                                    >
                                      <svg
                                        className="w-3 h-3 inline"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        ></path>
                                      </svg>
                                    </button>
                                  </div>
                                </>
                              )}

                              {/* Owners */}
                              {onchainData.owners &&
                                onchainData.owners.length > 0 && (
                                  <>
                                    <div className="text-gray-500 dark:text-gray-400">
                                      Owners:
                                    </div>
                                    <div className="text-right text-gray-900 dark:text-gray-300">
                                      {onchainData.owners.length} addresses
                                      {isConnected && isOwner() && (
                                        <span className="ml-2 text-xs text-green-500 dark:text-green-400">
                                          (You are an owner)
                                        </span>
                                      )}
                                    </div>
                                  </>
                                )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-4 text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Failed to load blockchain data.
                          </p>
                          <button
                            onClick={loadOnchainData}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs rounded-lg"
                          >
                            Load Data
                          </button>
                        </div>
                      )}

                      {/* External Links - Smaller */}
                      <div className="flex gap-2 mt-3">
                        <a
                          href={`https://zora.co/coin/base:${coin.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-800"
                        >
                          Zora
                        </a>
                        <a
                          href={`https://dexscreener.com/base/${coin.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-800"
                        >
                          DexScreener
                        </a>
                      </div>
                    </div>
                  )}

                  {activeTab === "comments" && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Comments
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Total: {commentsCount}
                          </span>
                        </div>

                        {commentsLoading ? (
                          <div className="text-center py-8">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-r-transparent"></div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              Comments are loading...
                            </p>
                          </div>
                        ) : commentsError ? (
                          <div className="text-center py-6">
                            <p className="text-sm text-red-500">
                              {commentsError}
                            </p>
                            <button
                              onClick={() => setActiveTab("comments")}
                              className="mt-2 text-sm text-indigo-500 hover:text-indigo-600"
                            >
                              Try Again
                            </button>
                          </div>
                        ) : comments.length > 0 ? (
                          <div className="space-y-4">
                            {comments.map((comment, index) => (
                              <div
                                key={comment.node.id || index}
                                className="bg-white dark:bg-gray-900/20 backdrop-blur-md rounded-xl p-4 border border-gray-100 dark:border-gray-800/40"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Avatar */}
                                  <div className="flex-shrink-0">
                                    {comment.node?.userProfile?.avatar
                                      ?.previewImage?.small ? (
                                      <img
                                        src={
                                          comment.node.userProfile.avatar
                                            .previewImage.small
                                        }
                                        alt={
                                          comment.node.userProfile?.handle ||
                                          "User"
                                        }
                                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 dark:border-gray-800"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center">
                                        <span className="text-sm font-medium text-indigo-500 dark:text-indigo-400">
                                          {(comment.node?.userProfile?.handle ||
                                            shortenAddress(
                                              comment.node?.userAddress || ""
                                            ))?.[0]?.toUpperCase() || "?"}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Yorum İçeriği */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Link
                                        href={`/profile/${
                                          comment.node?.userAddress || ""
                                        }`}
                                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-500 truncate"
                                      >
                                        {comment.node?.userProfile?.handle ||
                                          shortenAddress(
                                            comment.node?.userAddress || ""
                                          )}
                                      </Link>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(
                                          new Date(
                                            comment.node?.timestamp * 1000
                                          )
                                        )}
                                      </span>
                                    </div>

                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                      {comment.node?.comment || ""}
                                    </p>

                                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                      {comment.node?.replies?.count > 0 && (
                                        <span className="flex items-center gap-1">
                                          <span>
                                            {comment.node.replies.count}
                                          </span>
                                          <span>
                                            {comment.node.replies.count.replies}{" "}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              No comments yet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal with Tabs */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Coin Settings
              </h3>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setNewURI("");
                  setNewPayoutRecipient("");
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveUpdateTab("uri")}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeUpdateTab === "uri"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Metadata URI
                </div>
              </button>
              <button
                onClick={() => setActiveUpdateTab("payout")}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeUpdateTab === "payout"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2"
                    />
                  </svg>
                  Payout Address
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
              {activeUpdateTab === "uri" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metadata URI
                  </label>
                  <input
                    type="text"
                    value={newURI}
                    onChange={(e) => setNewURI(e.target.value)}
                    placeholder="ipfs://... or https://..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <strong>Recommended:</strong> Use IPFS URI (ipfs://...)
                      for decentralized storage.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      HTTPS URLs are also supported but not recommended for
                      permanence.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        <strong>Note:</strong> Only coin owners can update the
                        metadata URI.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payout Recipient Address
                  </label>
                  <input
                    type="text"
                    value={newPayoutRecipient}
                    onChange={(e) => setNewPayoutRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enter the Ethereum address that will receive creator
                      rewards from this coin.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <strong>Current:</strong>{" "}
                      <span className="font-mono">
                        {shortenAddress(onchainData?.payoutRecipient || "")}
                      </span>
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        <strong>Warning:</strong> This change affects where
                        future creator rewards will be sent.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setNewURI("");
                  setNewPayoutRecipient("");
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUpdating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Updating...
                  </>
                ) : activeUpdateTab === "uri" ? (
                  "Update URI"
                ) : (
                  "Update Payout"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoinDetailPage;
