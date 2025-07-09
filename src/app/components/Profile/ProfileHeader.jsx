import React, { Fragment, useEffect } from "react";
import { Menu, Transition } from "@headlessui/react";
import WatchlistButton from "../WatchlistButton";
import { useWatchlist } from "../../context/WatchlistContext";

function ProfileHeader({ profile, loading, error, walletAddress, loadProfile }) {
  const { types } = useWatchlist();

  // Helper function for avatar display
  const getAvatarUrl = (profile) => {
    if (!profile || !profile.avatar) return null;

    return (
      profile.avatar.medium ||
      profile.avatar.small ||
      (profile.avatar.previewImage ? profile.avatar.previewImage.medium : null)
    );
  };

  // Format wallet type
  const formatWalletType = (type) => {
    switch (type) {
      case "EXTERNAL":
        return "External Wallet";
      case "PRIVY":
        return "Privy Wallet";
      case "SMART_WALLET":
        return "Smart Wallet";
      default:
        return type;
    }
  };

  // Shorten wallet address
  const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Name truncation function
  const truncateName = (name, limit = 20) => {
    if (!name) return "";
    return name.length > limit ? `${name.substring(0, limit)}...` : name;
  };

  // Debug linkedWallets data and structure
  useEffect(() => {
    if (profile?.linkedWallets?.edges) {
      console.log("LinkedWallets data:", profile.linkedWallets.edges);
    }
  }, [profile]);

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Profile loading...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-lg my-6">
        <p>{error}</p>
        <button
          onClick={() => loadProfile(walletAddress)}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show warning if no address connected and no manual address entered
  if (!walletAddress) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-6 rounded-lg text-center">
        <p>
            Please connect your wallet or enter a wallet address to view profile information.
        </p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="backdrop-blur-lg dark:bg-gray-900/20 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/30 p-4 relative z-0">
      {/* Profile top section */}
      <div className="flex items-start gap-3 md:gap-6">
        {/* Avatar - smaller on mobile */}
        <div className="w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden flex-shrink-0 relative bg-gray-100 dark:bg-gray-900/20">
          {profile.avatar?.blurhash && (
            <div
              className="absolute inset-0 z-0"
              style={{
                filter: "blur(10px)",
                transform: "scale(1.1)",
                backgroundImage: `url(data:image/jpeg;base64,${profile.avatar.blurhash})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
          {getAvatarUrl(profile) ? (
            <img
              src={getAvatarUrl(profile)}
              alt={profile.displayName || profile.handle || "Profil"}
              className="w-full h-full object-cover relative z-10"
              loading="lazy"
              onError={(e) => {
                e.target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTEyIDIyYzUuNTIzIDAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTB6IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48L3N2Zz4=";
                e.target.onerror = null;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-6 h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Profile information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold truncate">
              {truncateName(
                profile.displayName || profile.handle || "Profile",
                25
              )}
            </h1>
            
            {/* Add watchlist button */}
            <WatchlistButton 
              item={{
                address: walletAddress,
                name: profile.displayName || profile.handle || "Profile",
                mediaContent: profile.avatar ? {
                  previewImage: {
                    small: getAvatarUrl(profile)
                  }
                } : null
              }} 
              type={types.PROFILE} 
              size="md"
            />
          </div>

          {profile.handle && (
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-0.5 md:mt-1">
              @{truncateName(profile.handle, 15)}
            </p>
          )}

          {profile.bio && (
            <p className="mt-2 md:mt-4 text-sm md:text-base text-gray-700 dark:text-gray-300 line-clamp-2 md:line-clamp-none">
              {truncateName(profile.bio, 100)}
            </p>
          )}

          <div className="mt-2 md:mt-4 flex flex-wrap gap-2 md:gap-4">
            {profile.website && (
              <a
                href={
                  profile.website.startsWith("http")
                    ? profile.website
                    : `https://${profile.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs md:text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <svg
                  className="w-3 h-3 md:w-4 md:h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <span className="truncate max-w-[150px]">
                  {profile.website}
                </span>
              </a>
            )}
            
            {profile.handle && (
              <a
                href={`https://zora.co/${profile.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs md:text-sm text-indigo-600 hover:underline flex items-center gap-1"
              >
                <img 
                  src="/images/zora.png" 
                  alt="Zora Logo" 
                  className="w-3 h-3 md:w-4 md:h-4" 
                />
                <span className="truncate max-w-[150px]">
                  View on Zora
                </span>
              </a>
            )}
          </div>

          
        </div>
      </div>

      {/* Linked Wallets - More compact on mobile */}
      {profile.linkedWallets?.edges &&
        profile.linkedWallets.edges.length > 0 && (
          <div className="mt-4 md:mt-6 relative isolation-auto">
            <h3 className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Linked Wallets ({profile.linkedWallets.edges.length})
            </h3>
            <Menu
              as="div"
              className="relative inline-block text-left w-full md:w-auto"
            >
              <div>
                <Menu.Button className="w-full md:w-auto inline-flex justify-between items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium bg-white dark:bg-gray-900/20 border border-gray-300 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all">
                  <svg
                    className="w-3 h-3 md:w-4 md:h-4 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                    <span>Select Wallet</span>
                  <svg
                    className="w-3 h-3 md:w-4 md:h-4 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="fixed left-0 right-0 md:absolute md:left-auto md:right-auto z-[9999] mt-2 w-[95%] mx-auto md:mx-0 md:w-60 origin-top-left bg-white dark:bg-gray-800 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="p-1">
                    {profile.linkedWallets.edges.map((edge, index) => {
                      // Get the wallet address - handle different data structures
                      const walletAddr = edge.node?.address || edge.node?.walletAddress;
                      const walletType = edge.node?.walletType || "EXTERNAL";
                      
                      return (
                        <Menu.Item key={`wallet-${walletAddr || index}`}>
                          {({ active }) => (
                            <button
                              className={`${
                                active
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                  : "text-gray-700 dark:text-gray-200"
                              } flex justify-between items-center w-full text-left px-4 py-2 text-sm rounded-md`}
                              onClick={() => {
                                if (
                                  walletAddr &&
                                  walletAddr.toLowerCase() !==
                                  walletAddress?.toLowerCase()
                                ) {
                                  loadProfile(walletAddr);
                                }
                              }}
                            >
                              <div className="flex flex-col items-start">
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                  </svg>
                                  <span className="font-medium">{shortenAddress(walletAddr || "")}</span>
                                </div>
                                
                                <div className="mt-1 ml-6">
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    {formatWalletType(walletType)}
                                  </span>
                                </div>
                              </div>
                              
                              {walletAddr && walletAddress && 
                                walletAddr.toLowerCase() === walletAddress.toLowerCase() && (
                                <svg
                                  className="w-5 h-5 text-green-500 ml-2"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          )}
                        </Menu.Item>
                      );
                    })}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        )}
    </div>
  );
}

export default ProfileHeader;