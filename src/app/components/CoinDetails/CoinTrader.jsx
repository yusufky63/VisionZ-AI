import { useState, useEffect } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useBalance,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getTradeContractCallParams,
  validateTradeBalance,
  checkTokenBalance,
} from "../../services/sdk/getTradeCoin";
import { toast } from "react-hot-toast";

/**
 * Component for coin trading operations
 * @param {Object} props
 * @param {string} props.coinAddress - Coin address
 * @param {string} props.coinSymbol - Coin symbol
 * @param {number} props.ethPrice - ETH price in USD
 */
function CoinTrader({ coinAddress, coinSymbol = "TOKEN", ethPrice, coin }) {
  const [amount, setAmount] = useState("0.01");
  const [tradeType, setTradeType] = useState("buy");
  const [loading, setLoading] = useState(false);
  const [ethBalance, setEthBalance] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [sliderValue, setSliderValue] = useState(0);
  const [pulseInput, setPulseInput] = useState(false);
  const [estimatedTokensToReceive, setEstimatedTokensToReceive] = useState("0");
  const [slippage, setSlippage] = useState(0.05);

  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  // Use useBalance hook from wagmi to get ETH balance
  const { data: ethBalanceData } = useBalance({
    address: address,
    watch: true,
  });

  // Load token balance and ETH balance
  useEffect(() => {
    async function loadBalances() {
      if (isConnected && address && publicClient) {
        try {
          // ETH balance
          if (ethBalanceData) {
            setEthBalance(ethBalanceData.formatted);
          }

          // Token balance (if coinAddress exists)
          if (coinAddress) {
            try {
              const balance = await checkTokenBalance(
                address,
                coinAddress,
                publicClient
              );
              setTokenBalance(formatEther(balance));
            } catch (error) {
              console.error("Token balance loading error:", error);
              setTokenBalance("0");
            }
          }
        } catch (error) {
          console.error("Balance loading error:", error);
        }
      }
    }

    loadBalances();
    
    // Set up auto-refresh balances every 15 seconds
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing balances...");
      loadBalances();
    }, 15000); // 15 seconds

    // Clean up the interval when component unmounts
    return () => clearInterval(refreshInterval);
  }, [isConnected, address, publicClient, coinAddress, ethBalanceData]);

  // Calculate amount based on slider percentage
  const calculatePercentage = (balance, percentage) => {
    if (!balance || isNaN(parseFloat(balance)) || percentage === 0) return "0";

    // Account for gas fee for ETH (approximately 0.002 ETH)
    if (tradeType === "buy") {
      const estimatedGas = 0.002; // Estimated gas fee
      const availableBalance = Math.max(0, parseFloat(balance) - estimatedGas);
      const value = (availableBalance * (percentage / 100)).toFixed(6);
      return value;
    } else {
      // For sell operations, apply 99.5% when 100% is selected (slippage)
      const adjustedPercentage = percentage === 100 ? 99.5 : percentage;
      const value = (parseFloat(balance) * (adjustedPercentage / 100)).toFixed(6);
      return value;
    }
  };

  // Calculate USD value
  const calculateUSDValue = (ethAmount) => {
    if (!ethAmount || !ethPrice) return "0.00";
    return (parseFloat(ethAmount) * ethPrice).toFixed(2);
  };

  // Calculate estimated tokens to receive
  const calculateEstimatedTokens = (ethAmount) => {
    if (!ethAmount || !coin?.marketCap || !coin?.totalSupply) return "0";
    
    // Convert input to numbers
    const ethAmountFloat = parseFloat(ethAmount);
    const totalSupply = parseFloat(coin.totalSupply);
    const marketCap = parseFloat(coin.marketCap);
    
    if (ethAmountFloat <= 0 || totalSupply <= 0 || marketCap <= 0) return "0";
    
    // Constant product formula (x * y = k) used by AMMs like Uniswap
    // We need to account for:
    // 1. Price impact - larger trades have higher price impact
    // 2. Fee - typically 0.3% on Uniswap
    
    // Get pool details from coin data if available
    const liquidityEth = parseFloat(coin.liquidityInEth || marketCap / ethPrice / 2);
    const liquidityToken = parseFloat(coin.liquidityTokens || totalSupply / 2);
    
    // Price impact calculation
    const fee = 0.003; // 0.3% swap fee
    const adjustedEthAmount = ethAmountFloat * (1 - fee);
    
    // Use constant product formula: x * y = k
    // Where k is constant, x is ETH amount, y is token amount
    // For a trade: (x + Δx) * (y - Δy) = x * y
    // Solving for Δy: Δy = y * Δx / (x + Δx)
    
    // Calculate tokens to receive
    const tokensToReceive = (liquidityToken * adjustedEthAmount) / (liquidityEth + adjustedEthAmount);
    
    // Add slippage buffer (reduce by ~1.5% to match what users typically see)
    const withSlippage = tokensToReceive * 0.985;
    
    // Format with appropriate decimals
    if (withSlippage < 0.001) {
      return withSlippage.toExponential(4);
    } else if (withSlippage < 1) {
      return withSlippage.toFixed(6);
    } else if (withSlippage < 1000) {
      return withSlippage.toFixed(4);
    } else {
      return withSlippage.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
  };

  // Calculate estimated ETH to receive when selling
  const calculateEstimatedEth = (tokenAmount) => {
    if (!tokenAmount || !coin?.marketCap || !coin?.totalSupply || !ethPrice) return "0";
    
    // If volume is 0, token hasn't been traded yet, return 0
    if (!coin.totalVolume || parseFloat(coin.totalVolume) === 0) {
      return "0";
    }
    
    // Convert input to numbers
    const tokenAmountFloat = parseFloat(tokenAmount);
    const totalSupply = parseFloat(coin.totalSupply);
    const marketCap = parseFloat(coin.marketCap);
    
    if (tokenAmountFloat <= 0 || totalSupply <= 0 || marketCap <= 0) return "0";
    
    // Simple price calculation based on market cap and supply
    const tokenPrice = marketCap / totalSupply;
    const ethValue = (tokenAmountFloat * tokenPrice) / ethPrice;
    
    // Add fee/slippage (reduce by ~3% to account for fees and slippage)
    const withSlippage = ethValue * 0.97;
    
    // Format with appropriate decimals
    if (withSlippage < 0.0001) {
      return withSlippage.toExponential(4);
    } else if (withSlippage < 1) {
      return withSlippage.toFixed(6);
    } else if (withSlippage < 10) {
      return withSlippage.toFixed(4);
    } else {
      return withSlippage.toFixed(2);
    }
  };

  // Update estimated tokens when amount changes
  useEffect(() => {
    if (tradeType === "buy") {
      const estimated = calculateEstimatedTokens(amount);
      setEstimatedTokensToReceive(estimated);
    }
  }, [amount, coin, ethPrice, tradeType]);

  // Execute trade
  const handleTrade = async () => {
    if (!isConnected || !coinAddress || !amount || !address) {
      toast.error("Order details are missing or wallet is not connected");
      return;
    }

    if (loading || isPending) return;

    setLoading(true);

    try {
      const orderSizeWei = parseEther(amount);
      let minAmountOutWei = 0n;
      if (slippage > 0) {
        if (tradeType === "buy") {
          const estimatedTokens = calculateEstimatedTokens(amount);
          const minTokens = (parseFloat(estimatedTokens) * (1 - slippage)).toString();
          minAmountOutWei = parseEther(minTokens);
        } else {
          const estimatedEth = calculateEstimatedEth(amount);
          const minEth = (parseFloat(estimatedEth) * (1 - slippage)).toString();
          minAmountOutWei = parseEther(minEth);
        }
      }

      // Balance check
      const balanceCheck = await validateTradeBalance(
        address,
        coinAddress,
        tradeType,
        orderSizeWei,
        publicClient
      );

      if (!balanceCheck.isValid) {
        toast.error(balanceCheck.message);
        setLoading(false);
        return;
      }

      // Create contract call parameters
      const params = getTradeContractCallParams(
        tradeType,
        coinAddress,
        address,
        orderSizeWei,
        minAmountOutWei,
        address,
        slippage
      );

      const hash = await writeContractAsync(params);

      if (hash) {
        toast.success(
          tradeType === "buy" ? "Buy order sent" : "Sell order sent"
        );

        setAmount("0.001");
        setSliderValue(0);
      }
    } catch (error) {
      console.error("Order error:", error);

      if (error.message?.includes("User rejected") || error.code === 4001) {
        toast.info("Order cancelled");
        setAmount("0.001");
        setSliderValue(0);
      } else {
        let errorMessage = error.message || "Transaction failed";
        if (errorMessage.includes("AddressZero()")) {
          errorMessage = "Invalid address: Please connect your wallet";
        }
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // When slider value changes
  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);

    if (tradeType === "buy" && ethBalance) {
      const calculatedAmount = calculatePercentage(ethBalance, value);
      setAmount(calculatedAmount);

      // Visual pulse animation on input field
      setPulseInput(true);
      setTimeout(() => setPulseInput(false), 500);
    } else if (tradeType === "sell" && tokenBalance) {
      const calculatedAmount = calculatePercentage(tokenBalance, value);
      setAmount(calculatedAmount);

      // Visual pulse animation on input field
      setPulseInput(true);
      setTimeout(() => setPulseInput(false), 500);
    }
  };

  // Format symbol to ensure it's not too long
  const formatSymbol = (symbol) => {
    if (!symbol) return "";
    
    // Check if symbol contains unusual characters or is too long
    if (symbol.length > 10 || symbol.includes("/") || symbol.includes(" ")) {
      return symbol.slice(0, 6) + "...";
    }
    
    return symbol;
  };

  // User must be connected to trade
  if (!isConnected) {
    return (
      <div
        className={`p-6 rounded-xl border shadow-sm text-center ${
          theme === "light"
            ? "bg-white/80 text-gray-800 border-gray-200/50"
            : "bg-gray-900/40 text-gray-200 border-gray-700/30 backdrop-blur-md"
        }`}
      >
        <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-3 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
          <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-lg font-medium mb-2">Connect your wallet to trade</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Connect your wallet to buy or sell this token</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden border shadow-sm ${
        theme === "light"
          ? "bg-white/80 border-gray-200/50"
          : "bg-gray-900/40 border-gray-700/30 backdrop-blur-md"
      }`}
    >
      <style jsx>{`
        @keyframes pulse-light {
          0%, 100% { box-shadow: 0 0 0 0 ${theme === "light" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.4)"}; }
          50% { box-shadow: 0 0 0 4px ${theme === "light" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.2)"}; }
        }
        .animate-pulse-light {
          animation: pulse-light 0.5s ease-in-out;
        }

        .custom-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 5px;
          background: ${theme === "light" ? "#e5e7eb" : "#374151"};
          outline: none;
        }

        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${theme === "light" ? "#6366f1" : "#818cf8"};
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 3px ${theme === "light" ? "rgba(99, 102, 241, 0.2)" : "rgba(129, 140, 248, 0.2)"};
        }

        .custom-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${theme === "light" ? "#6366f1" : "#818cf8"};
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .custom-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 3px ${theme === "light" ? "rgba(99, 102, 241, 0.2)" : "rgba(129, 140, 248, 0.2)"};
        }
      `}</style>

      <div className="p-4">
        {/* Trade type selection */}
        <div className="grid grid-cols-2 gap-1 mb-4 rounded-xl overflow-hidden">
          <button
            className={`py-2.5 px-4 font-medium text-center transition-all rounded-lg ${
              tradeType === "buy"
                ? theme === "light"
                  ? "text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  : "text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
                : theme === "light"
                ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                : "text-gray-300 bg-gray-800 hover:bg-gray-700"
            }`}
            onClick={() => {
              setTradeType("buy");
              setSliderValue(0);
            }}
          >
            Buy
          </button>
          <button
            className={`py-2.5 px-4 font-medium text-center transition-all rounded-lg ${
              tradeType === "sell"
                ? theme === "light"
                  ? "text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  : "text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
                : theme === "light"
                ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                : "text-gray-300 bg-gray-800 hover:bg-gray-700"
            }`}
            onClick={() => {
              setTradeType("sell");
              setSliderValue(0);
            }}
          >
            Sell
          </button>
        </div>

        {/* Balance Display */}
        <div className={`mb-4 p-3 rounded-xl ${
          theme === "light" ? "bg-gray-50 border border-gray-100" : "bg-gray-800/30 border border-gray-700/30"
        }`}>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Available Balance</p>
            {tradeType === "buy" ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                ETH
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                {formatSymbol(coinSymbol)}
              </span>
            )}
          </div>
          <div className="font-medium mt-1">
            {tradeType === "buy" ? (
              <div className="flex items-center justify-between">
                <span className={`text-base ${theme === "light" ? "text-gray-800" : "text-gray-200"}`}>
                  {parseFloat(ethBalance).toFixed(4)}
                </span>
                {ethPrice && (
                  <span className="text-xs text-gray-500">
                    ≈${(parseFloat(ethBalance) * ethPrice).toFixed(2)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className={`text-base ${theme === "light" ? "text-gray-800" : "text-gray-200"}`}>
                  {parseFloat(tokenBalance).toFixed(6)}
                </span>
                {coin?.marketCap && coin?.totalSupply && (
                  <span className="text-xs text-gray-500">
                    ≈${((parseFloat(tokenBalance) * parseFloat(coin.marketCap)) / parseFloat(coin.totalSupply)).toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-3">
          <label className={`block mb-2 text-sm font-medium ${
            theme === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            Amount to {tradeType}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full p-3 pr-24 rounded-xl border ${
                theme === "light"
                  ? "border-gray-200 bg-white text-gray-900 focus:border-indigo-300"
                  : "border-gray-700 bg-gray-800/20 text-white focus:border-indigo-600"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                pulseInput ? "animate-pulse-light" : ""
              }`}
              placeholder="0.00"
              disabled={loading || isPending}
            />
            <div className="absolute right-3 top-0 h-full flex items-center">
              <div className="flex items-center">
                <span className={`text-sm font-medium ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}>
                  {tradeType === "buy" ? "ETH" : formatSymbol(coinSymbol)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-1 px-1">
            <span className="text-xs text-gray-500">
              {tradeType === "buy" 
                ? "≈$" + calculateUSDValue(amount) 
                : "≈" + calculateEstimatedEth(amount) + " ETH"
              }
            </span>
          </div>
        </div>

        {/* Amount slider */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliderValue}
            onChange={handleSliderChange}
            className="custom-slider"
            disabled={loading || isPending}
          />
          <div className="flex justify-between mt-2 px-1 gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors w-full ${
                  sliderValue === percent
                    ? theme === "light"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-indigo-900/40 text-indigo-400"
                    : theme === "light"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-800/40 text-gray-300 hover:bg-gray-700/60"
                }`}
                onClick={() => handleSliderChange({ target: { value: percent } })}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        {/* Slippage Tolerance Input */}
        <div className="mb-4">
          <label className={`block mb-2 text-sm font-medium ${
            theme === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            Slippage Tolerance
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="0.99"
              value={slippage}
              onChange={(e) => setSlippage(Number(e.target.value))}
              className={`w-full p-3 pr-12 rounded-xl border ${
                theme === "light"
                  ? "border-gray-200 bg-white text-gray-900 focus:border-indigo-300"
                  : "border-gray-700 bg-gray-800/20 text-white focus:border-indigo-600"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all`}
              placeholder="0.05"
              disabled={loading || isPending}
            />
            <span className="absolute right-3 top-0 h-full flex items-center text-sm text-gray-500">
              %
            </span>
          </div>
        </div>

        {/* You receive section */}
        {tradeType === "buy" ? (
          <div className={`mb-4 p-3 rounded-xl ${
            theme === "light" ? "bg-indigo-50 border border-indigo-100" : "bg-indigo-900/20 border border-indigo-800/30"
          }`}>
            <div className="flex justify-between items-center">
              <p className="text-xs text-indigo-600 dark:text-indigo-400">You Receive (Estimated)</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400">
                {formatSymbol(coinSymbol)}
              </span>
            </div>
            <p className={`text-base font-medium mt-1 ${theme === "light" ? "text-indigo-700" : "text-indigo-300"}`}>
              {estimatedTokensToReceive}
            </p>
          </div>
        ) : (
          <div className={`mb-4 p-3 rounded-xl ${
            theme === "light" ? "bg-indigo-50 border border-indigo-100" : "bg-indigo-900/20 border border-indigo-800/30"
          }`}>
            <div className="flex justify-between items-center">
              <p className="text-xs text-indigo-600 dark:text-indigo-400">You Receive (Estimated)</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400">
                ETH
              </span>
            </div>
            <div className="mt-1">
              <p className={`text-base font-medium ${theme === "light" ? "text-indigo-700" : "text-indigo-300"}`}>
                {calculateEstimatedEth(amount)} ETH
              </p>
              <p className="text-xs text-indigo-500/70 dark:text-indigo-400/70 mt-0.5">
                ≈${(parseFloat(calculateEstimatedEth(amount)) * ethPrice).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Trade button */}
        <button
          onClick={handleTrade}
          disabled={loading || isPending || parseFloat(amount) <= 0}
          className={`w-full py-3 px-4 rounded-xl text-center font-medium transition-all ${
            loading || isPending || parseFloat(amount) <= 0
              ? theme === "light"
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
              : tradeType === "buy"
              ? theme === "light"
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              : theme === "light"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          }`}
        >
          {loading || isPending ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              <span>Processing...</span>
            </div>
          ) : (
            `${tradeType === "buy" ? "Buy" : "Sell"} ${formatSymbol(coinSymbol)}`
          )}
        </button>
      </div>
    </div>
  );
}

export default CoinTrader;
