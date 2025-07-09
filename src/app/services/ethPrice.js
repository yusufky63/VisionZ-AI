
// Cache için basit bir in-memory store
const priceCache = {
    eth: {
      price: null,
      lastUpdated: null,
      ttl: 60000, // 1 dakika cache süresi
    },
  };
  
  /**
   * Check if cache is valid
   * @param {string} key - Cache key
   * @returns {boolean} Is cache valid?
   */
  const isCacheValid = (key) => {
    const cache = priceCache[key];
    if (!cache.lastUpdated) return false;
    
    const now = Date.now();
    return now - cache.lastUpdated < cache.ttl;
  };
  
  /**
   * Get ETH price from CoinGecko
   * @returns {Promise<number>} ETH price
   */
  const getETHPriceFromCoinGecko = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      
      if (!response.ok) {
        throw new Error("CoinGecko API ERROR");
      }
      
      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.error("CoinGecko PRICE ERROR:", error);
      throw error;
    }
  };
  
  /**
   * Get ETH price from Coinbase
   * @returns {Promise<number>} ETH price (USD)
   */
  const getETHPriceFromCoinbase = async () => {
    try {
      const response = await fetch(
        "https://api.coinbase.com/v2/prices/ETH-USD/spot"
      );
      
      if (!response.ok) {
        throw new Error("Coinbase API ERROR");
      }

      const data = await response.json();
      return parseFloat(data.data.amount);
    } catch (error) {
      console.error("Coinbase PRICE ERROR:", error);
      throw error;
    }
  };
  
  /**
   * Get ETH price (first from cache, then from APIs)
   * @returns {Promise<number>} ETH price (USD)
   */
  export const getETHPrice = async () => {
    try {
      // Check cache
      if (isCacheValid("eth")) {
        return priceCache.eth.price;
      }
      
      // Get price from both APIs in parallel
      const [coinGeckoPrice, coinbasePrice] = await Promise.allSettled([
        getETHPriceFromCoinGecko(),
        getETHPriceFromCoinbase(),
      ]);
      
      let price = null;
      
      // If CoinGecko is successful, use it
      if (coinGeckoPrice.status === "fulfilled") {
        price = coinGeckoPrice.value;
      }
      // If CoinGecko fails but Coinbase is successful, use it
      else if (coinbasePrice.status === "fulfilled") {
        price = coinbasePrice.value;
      }
      // If both APIs fail, throw an error
      else {
        throw new Error("PRICE INFO NOT FOUND");
      }
      
      // Update cache
      priceCache.eth = {
        price,
        lastUpdated: Date.now(),
        ttl: 60000,
      };
      
      return price;
  } catch (error) {
    console.error("ETH PRICE GET ERROR:", error);
    throw error;
  }
};
  