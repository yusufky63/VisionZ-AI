'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, createConfig, WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { ConnectKitProvider } from 'connectkit';
import { ThemeProvider } from '../contexts/ThemeContext';
import { injected, walletConnect } from 'wagmi/connectors';

const queryClient = new QueryClient();

// WalletConnect Projesi için bir Project ID gerekiyor
// https://cloud.walletconnect.com/ adresinden ücretsiz alabilirsiniz
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    injected(), // MetaMask gibi tarayıcı eklentileri
    walletConnect({ 
      projectId, 
      showQrModal: false,
      metadata: {
        name: 'Vision Z AI',
        description: 'AI-powered token creation platform',
        url: 'https://vision-z.ai', // web sitenizin url'i
        icons: ['https://vision-z.ai/icon.png'] // web sitenizin ikonu
      }
    }), // WalletConnect v2 (mobil cüzdanlar için)
  ]
});

export default function WagmiConfig({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <ConnectKitProvider 
          theme="auto"
          mode="light"
          options={{
            hideNoWalletCTA: false,
            hideBalance: false,
            embedGoogleFonts: true,
            walletConnectCTA: 'both',
            overlayBlur: 8,
            enforceSupportedChains: false,
            initialChainId: base.id,
            language: 'en-US'
          }}
          customTheme={{
            "--ck-overlay-backdrop-filter": "blur(10px)",
            "--ck-connectbutton-background": "rgba(99, 102, 241, 0.9)",
            "--ck-connectbutton-hover-background": "rgba(79, 70, 229, 0.9)",
            "--ck-connectbutton-active-background": "rgba(67, 56, 202, 0.95)",
            "--ck-connectbutton-color": "white",
            "--ck-connectbutton-border-radius": "1rem",
            "--ck-connectbutton-font-size": "1rem",
            "--ck-connectbutton-font-weight": "600"
          }}
        >
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ConnectKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 