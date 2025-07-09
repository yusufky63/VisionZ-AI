"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getZoraProfile, getProfileBalance } from "../../services/sdk/getProfiles";
import { useRouter } from "next/navigation";
import { useTheme } from "../../contexts/ThemeContext";
import ProfileHeader from "./ProfileHeader";
import TokenTable from "./TokenTable";
import { ConnectKitButton } from "connectkit";

function ProfilePage({ walletAddress: externalWalletAddress }) {
  const { address } = useAccount();
  const router = useRouter();

  const [walletAddress, setWalletAddress] = useState(
    externalWalletAddress || address
  );
  const [profile, setProfile] = useState(null);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balanceError, setBalanceError] = useState(null);
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'created'
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [loadedAllPages, setLoadedAllPages] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (externalWalletAddress) {
      // Use address from URL if available
      setWalletAddress(externalWalletAddress);
      loadProfile(externalWalletAddress);
    } else if (address) {
      // Use connected wallet address
      setWalletAddress(address);
      loadProfile(address);
    }
  }, [address, externalWalletAddress]);

  // Load profile information
  const loadProfile = async (addressToLoad) => {
    if (!addressToLoad) return;

    setLoading(true);
    setBalanceLoading(true);
    setError(null);
    setBalanceError(null);
    setBalances(null);
    setLoadedAllPages(false);
    setLoadingProgress(0);

    let retryCount = 0;
    const maxRetries = 10;
    const retryDelay = 3000;

    const fetchProfileWithRetry = async () => {
      try {
        // Get profile data
        const profileData = await getZoraProfile(addressToLoad);

        if (!profileData) {
          setProfile({
            displayName: "Profile",
            handle: addressToLoad.slice(0, 6) + "..." + addressToLoad.slice(-4),
          });
          console.log("No profile data found, using default display");
        } else {
          setProfile(profileData);
        }

        // After profile is loaded, start loading balances in background
        setLoading(false);
        
        // Get all balance information at once
        try {
          loadBalances(addressToLoad);
        } catch (balancesError) {
          console.error("Error loading balances:", balancesError);
          setBalanceError("Token balances loading error. Please try again later.");
          setBalanceLoading(false);
        }
      } catch (err) {
        const isRateLimitError = err.status === 429;
        const isGraphQLError = err.message?.includes("An unknown error occurred") || 
                              (err.errors && Array.isArray(err.errors)) || 
                              err.message?.includes("rate limit");
        const isServerError = err.status === 500 || err.message?.includes("Internal Server Error");

        // Retry logic for rate limits, server errors or GraphQL errors
        if ((isRateLimitError || isGraphQLError || isServerError) && retryCount < maxRetries) {
          retryCount++;
          console.log(
            `Profile fetch error. Retrying in ${
              retryDelay / 1000
            } seconds... (Attempt ${retryCount}/${maxRetries})`
          );
          
          // Show retry message to user
          const errorType = isRateLimitError ? "Rate limit exceeded" : isServerError ? "Server error" : "API Error";
          setError(`${errorType}. Retrying in ${Math.round(retryDelay / 1000)} seconds... (Attempt ${retryCount}/${maxRetries})`);
          
          // Wait and retry with fixed delay
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return fetchProfileWithRetry(); // Recursive retry
        }
        
        // If we've exceeded retries or it's not a retriable error, show the error
        console.error("Error loading profile:", err);
        setProfile({
          displayName: "Unknown",
          handle: addressToLoad.slice(0, 6) + "..." + addressToLoad.slice(-4),
        });
        setError(`Profile loading error: ${err.message}`);
        setLoading(false);
      }
    };

    // Start the fetch process with retry capability
    await fetchProfileWithRetry();
  };

  // Separate function to load balances, can be used for refresh
  const loadBalances = async (addressToLoad) => {
    setBalanceLoading(true);
    setBalanceError(null); // Başlangıçta hata mesajını temizleyelim
    setLoadedAllPages(false);
    setLoadingProgress(0);

    let allBalances = [];
    let hasNextPage = true;
    let cursor = null;
    let retryCount = 0;
    const maxRetries = 15;
    let pageCount = 0;
    let totalPages = 0;

    try {
      while (hasNextPage && retryCount < maxRetries) {
        try {
          // Yükleme durumunu gösterelim (hata değil, bilgi)
          setBalanceError(null); // Önceki hata mesajını temizle
          
          // API çağrısı
          const balancesData = await getProfileBalance(
            addressToLoad,
            100,
            cursor
          );

          if (balancesData?.data?.profile?.coinBalances?.edges) {
            const newEdges = balancesData.data.profile.coinBalances.edges;
            
            if (newEdges.length > 0) {
              // Yeni token'ları ekle
              allBalances = [...allBalances, ...newEdges];
              pageCount++;
              
              // PageInfo kontrolleri
              const pageInfo = balancesData.data.profile.coinBalances.pageInfo || {};
              hasNextPage = pageInfo.hasNextPage === true;
              cursor = pageInfo.endCursor || null;
              
              console.log(`Loaded page ${pageCount}, hasNextPage: ${hasNextPage}, cursor: ${cursor}, tokens: ${allBalances.length}`);
              
              // Cursor varsa ama hasNextPage false ise yine de devam et
              if (!hasNextPage && cursor) {
                console.log("hasNextPage false but cursor exists, continuing anyway...");
                hasNextPage = true;
              }
              
              // İlk sayfayı hemen göster, diğerlerini arkaplanda yüklemeye devam et
              if (pageCount === 1) {
                setBalances({
                  coinBalances: {
                    edges: allBalances,
                    pageInfo: { hasNextPage: true },
                  },
                });
                setBalanceLoading(false);
              } else {
                // Her sayfada state'i güncelle
                setBalances({
                  coinBalances: {
                    edges: allBalances,
                    pageInfo: { hasNextPage: hasNextPage },
                  },
                });

                // İlerleme hesapla
                if (totalPages === 0 && allBalances.length > 0) {
                  const avgPerPage = allBalances.length / pageCount;
                  totalPages = Math.ceil(allBalances.length / avgPerPage) + 2;
                }
                
                const progress = Math.min(95, Math.round((pageCount / totalPages) * 100));
                setLoadingProgress(progress);
                // Bilgi mesajı olarak ilerlemeyi göster, hata değil
              
              }
            } else {
              // Boş sayfa geldi, son sayfa
              hasNextPage = false;
            }
          } else {
            // API yanıtında coinBalances yok
            hasNextPage = false;
          }

          // Rate limit için her sayfa arasında kısa bekleme
          if (hasNextPage) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          
          // Başarılı API çağrısı sonrası retry sayacını sıfırla
          retryCount = 0;
          
        } catch (error) {
          console.error(`Balance load error:`, error);
          
          // 429 (rate limit) hatası özel olarak işlensin
          const is429 = error.status === 429 || 
                       (error.message && error.message.toLowerCase().includes("rate limit"));
          
          // 429 varsa ve ilk sayfa yüklendiyse devam et, tokenleri göster
          if (is429 && pageCount > 0) {
            
            // Uyarı mesajı göster ama işlemi sonlandırma
            setBalanceError(`Rate limit error, showing ${allBalances.length} tokens.`);
            
            // Mevcut tokenleri göster ama durma
            setBalances({
              coinBalances: {
                edges: allBalances,
                pageInfo: { hasNextPage: false },
              }
            });
            
            // İşaretleri güncelle
            setLoadedAllPages(true);
            setLoadingProgress(100);
            setBalanceLoading(false);
            
            // Döngüden çık ama hata fırlatma
            hasNextPage = false;
            break;
          }
          
          // Sadece 429 (rate limit) ve 500 (server error) hatalarında yeniden dene
          const is500 = error.status === 500 || 
                      (error.message && error.message.includes("500")) ||
                      (error.message && error.message.includes("Internal Server Error"));
          
          // Özel "direct queries" hata kontrolü
          const isDirectQueries = error.message && error.message.includes("direct queries");
          
          if (is429 || is500 || isDirectQueries) {
            retryCount++;
            
            // Bekleme süresini belirle
            let waitTime = 3000; // Varsayılan 3 saniye
            
            // "Try again in X seconds" mesajını kontrol et
            if (error.message) {
              const waitMatch = error.message.match(/try again in (\d+) seconds/i);
              const waitSeconds = waitMatch && waitMatch[1] ? parseInt(waitMatch[1], 10) : 0;
              
              if (waitSeconds > 0) {
                waitTime = (waitSeconds + 1) * 1000;
              } else if (isDirectQueries) {
                // "Direct queries" hatası için özel işlem - özellikle "try again in 0 seconds" durumu
                waitTime = 10000; // 10 saniye
              } else if (is500) {
                // 500 hataları için daha uzun bekleme
                waitTime = 6000; // 6 saniye
              }
            }
            
            // Hata durumunu göster
            const errorType = is429 || isDirectQueries ? 'Rate Limit' : 'Server Error (500)';
            // Önüne _ERROR_ ekleyerek hata olduğunu belirt, UI'da farklı gösterilecek
            setBalanceError(`_ERROR_: ${errorType} err. Retrying in ${Math.round(waitTime/1000)} seconds... (${retryCount}/${maxRetries})`);
            
            console.log(`API Error (${errorType}). Retrying in ${waitTime/1000}s... (Attempt ${retryCount}/${maxRetries})`);
            
            // Bekle ve tekrar dene
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
          
          // 429 veya 500 değilse ve sayfa yüklenemiyorsa hata fırlat
          if (pageCount === 0) {
            throw error;
          }
          
          // Eğer en az bir sayfa yüklendiyse, o sayfaları göstermeye devam et
          setBalanceError(`Some pages failed to load, showing ${allBalances.length} tokens.`);
          hasNextPage = false;
        }
      }

      // Tüm veriler yüklendi
      setLoadedAllPages(true);
      setLoadingProgress(100);
      setBalanceError(null); // Başarılı olduğunda hata mesajını temizle

      // Son durumu güncelle
      setBalances({
        coinBalances: {
          edges: allBalances,
          pageInfo: { hasNextPage: false },
        },
      });
    } catch (error) {
      setBalanceError(`_ERROR_: Token data loading error: ${error.message}`);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Refresh functionality with improved error handling
  const refreshData = async () => {
    if (refreshLoading) return; // Prevent duplicate refreshes
    
    setRefreshLoading(true);
    setBalanceError(null);
    setLoadedAllPages(false);
    setLoadingProgress(0);
    
    console.log("Manually refreshing data...");

    try {
      if (!walletAddress) {
        throw new Error("No wallet address available");
      }
      
      // Initially keep existing balances during refresh
      // but signal that refresh is in progress
      if (balances?.coinBalances?.edges?.length > 0) {
        setBalances({
          ...balances,
          coinBalances: {
            ...balances.coinBalances,
            pageInfo: { 
              ...balances.coinBalances.pageInfo,
              refreshing: true
            }
          }
        });
      }
      
      // Load fresh profile data first (light refresh)
      try {
        const profileData = await getZoraProfile(walletAddress);
        if (profileData) {
          setProfile(profileData);
        }
      } catch (profileError) {
        console.error("Error refreshing profile:", profileError);
        // Don't block balance refresh if profile refresh fails
      }
      
      // Then load complete balance data with the enhanced retry logic
      await loadBalances(walletAddress);
      
      console.log("Manual data refresh completed successfully");
    } catch (error) {
      console.error("Error during manual refresh:", error);
      setBalanceError(`Refresh error: ${error.message}`);
    } finally {
      setRefreshLoading(false);
      // Ensure we have a clean state even with errors
      setLoadingProgress(100);
      setLoadedAllPages(true);
    }
  };

  // Show no-wallet UI if no address connected or entered
  if (!walletAddress) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="relative bg-white/30 dark:bg-gray-900/40 overflow-hidden rounded-2xl shadow-xl border border-gray-200/20 dark:border-gray-700/20 p-8 mx-auto max-w-7xl text-center">
          {/* Content - Using relative to stay above the decorative elements */}
          <div className="relative z-10 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Wallet Not Connected
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
              Connect your wallet to view your profile or search for any Ethereum address, ENS name or profile handle.
            </p>
            
            {/* Connect Wallet Button - Centered */}
            <div className="mb-6 mx-auto transition-transform hover:scale-[1.02] active:scale-[0.98] duration-200 flex justify-center">
              <ConnectKitButton 
                theme="rounded"
                mode={theme === "dark" ? "dark" : "light"}
                customTheme={{
                  "--ck-connectbutton-background": theme === "dark" ? "rgba(99, 102, 241, 0.9)" : "rgba(99, 102, 241, 0.9)",
                  "--ck-connectbutton-hover-background": theme === "dark" ? "rgba(79, 70, 229, 0.9)" : "rgba(79, 70, 229, 0.9)",
                  "--ck-connectbutton-active-background": theme === "dark" ? "rgba(67, 56, 202, 0.95)" : "rgba(67, 56, 202, 0.95)",
                  "--ck-connectbutton-color": "white",
                  "--ck-connectbutton-border-radius": "1rem",
                  "--ck-connectbutton-font-size": "1.25rem", /* Bigger font */
                  "--ck-connectbutton-font-weight": "600",
                  "--ck-connectbutton-box-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
              />
            </div>
            
            {/* Search Input */}
            <div className="relative max-w-lg mx-auto group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg 
                  className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              
              <input 
                type="text" 
                placeholder="Search address or handle..."
                className="w-full pl-10 pr-12 py-3 bg-transparent border border-gray-200/30 dark:border-gray-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 dark:text-white transition-all duration-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    const value = e.currentTarget.value.trim();
                    
                    // Direct navigation to profile page
                    const isEthAddress = /^(0x)?[0-9a-fA-F]{40}$/.test(value);
                    
                    if (isEthAddress || value.includes('.eth') || !value.includes('.')) {
                      router.push(`/profile/${value}`);
                    } else {
                      alert('Please enter a valid Ethereum address, ENS name or handle');
                    }
                  }
                }}
              />
              
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/60 transition-colors duration-200"
                onClick={() => {
                  const searchInput = document.querySelector('input[placeholder="Search address or handle..."]');
                  if (searchInput && searchInput.value.trim()) {
                    const value = searchInput.value.trim();
                    
                    // Direct navigation to profile page
                    const isEthAddress = /^(0x)?[0-9a-fA-F]{40}$/.test(value);
                    
                    if (isEthAddress || value.includes('.eth') || !value.includes('.')) {
                      router.push(`/profile/${value}`);
                    } else {
                      alert('Please enter a valid Ethereum address, ENS name or handle');
                    }
                  }
                }}
              >
                <span className="sr-only">Search</span>
                <svg 
                  className="w-4 h-4" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M14 5l7 7m0 0l-7 7m7-7H3" 
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-2 space-y-4">
      {/* Profile Header Component */}
      <div className="relative z-[50]">
        <ProfileHeader
          profile={profile}
          loading={loading}
          error={error}
          walletAddress={walletAddress}
          loadProfile={loadProfile}
        />
      </div>

      {/* Token Table Component - Show as soon as profile is loaded */}
      {!loading && !error && profile && (
        <div className="relative z-[5]">
          <TokenTable
            balances={balances}
            activeTab={activeTab}
            walletAddress={walletAddress}
            setActiveTab={setActiveTab}
            refreshData={refreshData}
            isLoading={balanceLoading}
            loadError={balanceError}
            loadingProgress={loadingProgress}
            loadedAllPages={loadedAllPages}
            profile={profile}
          />
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
