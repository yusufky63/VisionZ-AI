'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactConfetti from 'react-confetti';
import { toast } from 'react-hot-toast';

/**
 * Token Success Modal - Modal to be shown after token creation
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to close the modal
 * @param {string} props.tokenAddress - Created token address
 * @param {string} props.tokenName - Token name
 * @param {string} props.tokenSymbol - Token symbol
 * @param {string} props.tokenImage - Token image URL
 */
const TokenSuccessModal = ({ 
  isOpen, 
  onClose, 
  tokenAddress, 
  tokenName, 
  tokenSymbol, 
  tokenImage 
}) => {
  const router = useRouter();
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  const [showConfetti, setShowConfetti] = useState(false);

  // Show confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000); // Close confetti after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Create URLs
  const zoraUrl = `https://zora.co/coin/base:${tokenAddress}`;
  const dexscreenerUrl = `https://dexscreener.com/base/${tokenAddress}`;
  const twitterShareText = encodeURIComponent(`🎉 New AI token created: ${tokenName} (${tokenSymbol}) on @zora\n\nCheck it out and collect: ${zoraUrl}`);
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${twitterShareText}`;
  
  // Function to navigate to coin page
  const goToCoinPage = () => {
    onClose();
    router.push(`/coin/${tokenAddress}`);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm dark:bg-black/70">
      {/* Background overlay */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Confetti */}
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.15}
        />
      )}
      
      {/* Modal content */}
      <div className="relative bg-white dark:bg-gray-900/20 backdrop-blur-md rounded-xl overflow-hidden shadow-xl w-full max-w-md transform transition-all border border-gray-200 dark:border-white/20">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Title */}
        <div className="text-center p-6 border-b border-gray-200 dark:border-white/10">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Token Created</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Your AI token has been created successfully.</p>
        </div>
        
        {/* Token Information */}
        <div className="p-6">
          <div className="flex items-center mb-5 bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
            {tokenImage && (
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-3 flex-shrink-0">
                <img 
                  src={tokenImage.startsWith('ipfs://') 
                    ? `https://gateway.pinata.cloud/ipfs/${tokenImage.replace('ipfs://', '')}` 
                    : tokenImage} 
                  alt={tokenName} 
                  className="w-full h-full object-cover"
                 
                />
              </div>
            )}
            <div>
              <h3 className="text-md font-bold text-gray-900 dark:text-white">{tokenName}</h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">${tokenSymbol}</p>
                <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-full">Base</span>
              </div>
            </div>
          </div>
          
          {/* Address */}
          <div className="mb-5">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Token Address:</p>
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-white/5 p-2 rounded">
              <code className="text-xs text-gray-600 dark:text-gray-300 font-mono flex-1 truncate">
                {tokenAddress}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(tokenAddress);
                  toast.success('Address copied!');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"
              >
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Buttons and Links */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <a 
                href={zoraUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="py-2 px-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-white rounded-lg font-medium text-sm text-center flex items-center justify-center gap-2 transition-colors"
              >
                View on Zora
              </a>
              
              <a 
                href={dexscreenerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="py-2 px-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-white rounded-lg font-medium text-sm text-center flex items-center justify-center gap-2 transition-colors"
              >
                View on Dexscreener
              </a>
            </div>
            
            <a 
              href={twitterShareUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="py-2 px-3 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-200 rounded-lg font-medium text-sm text-center flex items-center justify-center gap-2 transition-colors w-full"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
              Share on Twitter
            </a>
            
            <button 
              onClick={goToCoinPage}
              className="py-2.5 px-4 bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 rounded-lg font-medium text-sm text-center flex items-center justify-center gap-2 transition-colors w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Go to Token Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenSuccessModal;