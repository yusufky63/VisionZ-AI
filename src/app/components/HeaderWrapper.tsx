"use client";

import React, { useEffect, useState } from "react";
import Header from "./Header";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { Toaster } from "react-hot-toast";
import GridBackground from "../UI/Grid-Background";
import Widget from "./Widget";

interface HeaderWrapperProps {
  children: React.ReactNode;
}

const HeaderContent: React.FC<HeaderWrapperProps> = ({ children }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Client-side only mounting için flag
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background - sadece mount olduktan sonra render et */}
      <div className="fixed inset-0 z-0">
        {mounted ? (
          <GridBackground theme={theme as "dark" | "light"} />
        ) : (
          <div className="fixed inset-0 w-full h-full -z-10 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black"></div>
        )}
      </div>
      
      {/* Toast notifications */}
      <Toaster />
      
      {/* Widget - sadece mount olduktan sonra render et */}
      {mounted && <Widget />}
      
      {/* Header - her zaman render et */}
      <Header />
      
      <main
        className={`flex-grow relative z-10 transition-opacity duration-300 text-gray-900 dark:text-gray-100 `}
      >
        {children}
      </main>
    </div>
  );
};

const HeaderWrapper: React.FC<HeaderWrapperProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderContent>{children}</HeaderContent>
    </ThemeProvider>
  );
};

export default HeaderWrapper;
