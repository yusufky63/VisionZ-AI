import React from "react";
import { ArrowRight, Zap, Shield, Clock } from 'lucide-react';

const IntroductionStep = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-4">
        
        {/* Header */}
        <header className="py-3">
          <div className="flex items-center justify-end">
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Powered by Zora SDK
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {/* Hero */}
          <section className="py-4">
            <div className="max-w-7xl mx-auto">
              <div className="space-y-6 md:space-y-8">
                <div className="space-y-3 md:space-y-4">
                  <h1 className="text-3xl md:text-6xl lg:text-7xl font-medium tracking-tight text-gray-900 dark:text-white">
                    Create your own
                    <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">dream token</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                    Deploy professional tokens on Base network in minutes. 
                    AI-powered generation, enterprise security, zero code required.
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onGetStarted}
                    className="group relative inline-flex items-center px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold text-sm md:text-base rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transform hover:-translate-y-0.5"
                  >
                    <span className="relative z-10">Launch Vision Z</span>
                    <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                  
                </div>
              </div>
            </div>
          </section>

          {/* Features & Process Combined */}
          <section className="py-6 md:py-12 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-12 md:space-y-16">
              <div className="max-w-2xl">
                <h2 className="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-3 md:mb-4">
                  AI-Powered Creation Flow
                </h2>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Three simple steps powered by advanced AI and enterprise-grade security. 
                  From vision to live token in under 2 minutes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                <div className="space-y-4 md:space-y-6">
                  <div className="space-y-3 md:space-y-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                    </div>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <h3 className="text-lg md:text-xl font-medium text-gray-900 dark:text-white">Describe your vision</h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                      Share your token concept with Vision Z AI. Advanced language models analyze your input and generate professional metadata, names, and themed visuals.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <div className="space-y-3 md:space-y-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                    </div>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <h3 className="text-lg md:text-xl font-medium text-gray-900 dark:text-white">Configure parameters</h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                      Set token supply, decimals, and initial purchase amount with enterprise-grade security. Audited smart contracts protect your digital assets.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <div className="space-y-3 md:space-y-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                    </div>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <h3 className="text-lg md:text-xl font-medium text-gray-900 dark:text-white">Deploy instantly</h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                      One-click deployment to Base network with automatic liquidity setup. Your token goes live and becomes tradeable within minutes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        
        </main>
      </div>
    </div>
  );
};

export default IntroductionStep;
