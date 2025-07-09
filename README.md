# Vision Z AI – Smart Web3 Experience

VISION Z & SMART FEATURES

Vision Z AI is an AI-powered token creation platform.  
Our goal is to enable anyone to create their own crypto token in just a few clicks and get AI-based insights and analysis about the tokens they create.

- AI-Powered Token Creation:  
  Simply enter your token idea in plain text, and our AI will automatically generate a complete token package including name, symbol, description, and a themed image that matches your vision. Choose from various token categories (DeFi, GameFi, SocialFi, GreenTech, etc.) to better tailor the generation to your concept. All technical processes are automated in the background, so you can focus on creativity instead of complexity.

- AI Token Analysis:  
  Instantly get on-chain data and market information for each token, and use the "Ask AI" feature for instant analysis.

- Advanced Trading Interface:  
  A professional trading experience with real-time DexScreener charts, token list management, and an intuitive trading panel. Features include:
  - Live price charts and market data integration
  - Compact trading panel for quick trades

- Market Exploration Hub:
  Discover tokens through multiple categorized views including Top Gainers, Most Volume, Most Valuable, New Coins, and Recently Traded. The Market page offers three distinct viewing options (table, grid, masonry) to customize your browsing experience. Auto-scrolling category rows provide a dynamic way to discover trending tokens without endless scrolling.

- Comprehensive Trading Page:
  The Trade page provides a complete trading environment with advanced features:
  - Real-time token price charts from DexScreener
  - Interactive buy/sell panel with slider for amount selection
  - Collapsible token list with search functionality
  - Automatic price impact calculations and token estimates

- Profile:  
  Log in with your wallet to view your owned tokens and basic profile information. You can search and visit other profiles using a Zora username or wallet address.

- Opportunity Widgets:  
  At the top of the page, discover trending coins and opportunities with dynamic widgets so you never miss out.

- Trading & Comments:  
  Easily buy/sell tokens and interact with the community in the coin market and detail pages.

- Advanced Search Functionality:
  Quickly find tokens or profiles by searching with wallet addresses or usernames. Search results show matching tokens and profiles with relevant details, making navigation seamless across the platform.

- Token Creation with Initial Purchase:
  Create tokens with an optional initial purchase amount. Easily adjust your purchase with percentage buttons and a slider to get the perfect initial allocation.

- Real-time Data Updates:
  All token data automatically refreshes every 15 seconds to ensure you always have the latest information about token performance.

All these features combine modern Web3 and AI technologies to deliver a powerful yet intuitive user experience.

AI SERVICES USED

- Together AI (Llama-3, Mixtral): For token analysis, answering user questions, and generating token details from user ideas.
- Together AI (black-forest-labs/FLUX.1-schnell-Free): For image generation.

CORE ZORA SDK SERVICES USED IN THE PROJECT

- Token Creation: Creating new tokens (coins) using Zora SDK's create-coin functions and contract integration. Includes ability to set an initial purchase amount.
- AI-Driven Token Generator: Converts simple user ideas into complete token packages with a comprehensive AI pipeline for text and image generation. Uses specialized token categories (DeFi, GameFi, SocialFi, etc.) to generate more relevant and context-appropriate results.
- Advanced Trading System: Integrated DexScreener for professional chart analysis, real-time price tracking, and efficient trading interface. Includes token list management and value calculations.
- Coin Details & Onchain Data: Fetching on-chain data, market cap, liquidity, and holder count for each token using getCoin and getOnchainTokenDetails. Includes auto-refresh functionality with 15-second intervals.
- Rich Media Support: Support for displaying videos, GIFs, and images within the token details, with custom controls and playback functionality.
- Profile Info & Balance: Querying user profiles by Zora username or wallet address with getProfile. Listing owned tokens and balances with getProfileBalances.
- Trade Coin: Handling token trading operations with trade-coin functions and related contract calls.
- Coin Queries & Explore: Querying single or multiple tokens with getCoin and getCoins. Fetching coin comments with getCoinComments. Discovering top gainers, top volume, and most valuable coins with explore functions like getCoinsTopGainers, getCoinsTopVolume24h, getCoinsMostValuable. Users can search and visit other profiles by Zora username or wallet address.

ZORA SDK FUNCTIONS USED

PROFILE & BALANCE
- getProfile
- getProfileBalances

TOKEN DATA
- getCoin
- getCoinComments
- getOnchainCoinDetails

TOKEN CREATION
- createCoin
- createCoinCall
- validateMetadataJSON

TRADING
- tradeCoinCall
- getTradeFromLogs

MARKET & EXPLORE
- getCoinsTopGainers
- getCoinsTopVolume24h
- getCoinsMostValuable
- getCoinsNew
- getCoinsLastTraded
- getCoinsLastTradedUnique

CORE TECHNOLOGIES USED

- Next.js
- Zora SDK
- Tailwind CSS
- Wagmi
- ConnectKit
- Together AI

GETTING STARTED

1. Install dependencies:
   npm install
   # or
   yarn install
   
2. Start the development server:
   npm run dev
   # or
   yarn dev
   
3. Open the app in your browser: http://localhost:3000

---
