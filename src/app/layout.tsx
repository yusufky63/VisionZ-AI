import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WagmiConfig from "./components/WagmiConfig";
import HeaderWrapper from "./components/HeaderWrapper";
import { WatchlistProvider } from "./context/WatchlistContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "VisionZ AI",
  description: "VisionZ AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>
          {`
            .page-transition-active {
              opacity: 0.8;
              transition: opacity 300ms ease-in-out;
            }
            
            html {
              background-color: #ffffff;
            }
            
            html.dark {
              background-color: #000000;
            }
            
            .page-transition {
              opacity: 1;
              transition: opacity 300ms ease-in-out;
            }
            
            @keyframes fadeIn {
              from { opacity: 0.8; }
              to { opacity: 1; }
            }
            
            main {
              animation: fadeIn 300ms ease-in-out;
            }
          `}
        </style>
      </head>
      <body
        className={`${inter.className} transition-colors duration-300`}
        suppressHydrationWarning
      >
        <WagmiConfig>
          <WatchlistProvider>
            <HeaderWrapper>{children}</HeaderWrapper>
          </WatchlistProvider>
        </WagmiConfig>
      </body>
    </html>
  );
}
