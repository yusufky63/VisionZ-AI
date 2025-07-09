'use client';

import React from 'react';
import { Bot, Smartphone, Check, Info, ArrowLeft, ArrowRight } from 'lucide-react';

const CreationMethodStep = ({ 
  creationMethod, 
  setCreationMethod, 
  goToNextStep, 
  goToPreviousStep,
  theme 
}) => {
  const methods = [
    {
      id: 'ai',
      title: 'AI-Powered Creation',
      description: 'Use artificial intelligence to generate token details, images, and descriptions from your ideas',
      icon: Bot,
      features: [
        'AI-generated token names and symbols',
        'Custom image creation with AI',
        'Smart description writing',
        'Category suggestions'
      ],
      gradient: 'from-indigo-500/10 to-purple-500/10',
      border: 'border-indigo-200 dark:border-indigo-800',
      selectedBorder: 'border-indigo-500',
      selectedBg: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      id: 'social',
      title: 'Social Media Import (BETA)',
      description: 'Create tokens from social media posts - extract content, images, and metadata from major platforms',
      icon: Smartphone,
      features: [
        'Import from Twitter/X, Instagram, TikTok',
        'Support for YouTube, Reddit, Farcaster',
        'Extract content and images automatically',
        'Generate token details from posts'
      ],
      gradient: 'from-pink-500/10 to-orange-500/10',
      border: 'border-pink-200 dark:border-pink-800',
      selectedBorder: 'border-pink-500',
      selectedBg: 'bg-pink-50 dark:bg-pink-900/20'
    }
  ];

  const handleMethodSelect = (methodId) => {
    setCreationMethod(methodId);
  };

  const canProceed = creationMethod;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Creation Method
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Select how you'd like to create your token
        </p>
      </div>

      {/* Method Selection Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {methods.map((method) => {
          const IconComponent = method.icon;
          const isSelected = creationMethod === method.id;
          
          return (
            <div
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? `${method.selectedBorder} ${method.selectedBg}`
                  : `${method.border}`
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className={`w-6 h-6 ${isSelected ? 'bg-indigo-600' : 'bg-gray-400'} rounded-full flex items-center justify-center`}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`w-16 h-16 rounded-lg ${method.gradient} border ${method.border} flex items-center justify-center mb-4`}>
                <IconComponent className={`w-8 h-8 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                  {method.title}
                </h4>
                
                <p className="text-gray-600 dark:text-gray-400">
                  {method.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  {method.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Not sure which method to choose?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              • Choose <strong>AI-Powered</strong> if you want to describe your token idea and let AI create everything for you
              <br />
              • Choose <strong>Social Media Import (BETA)</strong> if you have a specific post or content you want to turn into a token
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={goToPreviousStep}
          className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300 font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <button
          onClick={goToNextStep}
          disabled={!canProceed}
          className={`px-6 py-2 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 ${
            !canProceed
              ? "border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "border border-indigo-300 dark:border-indigo-600/50 bg-indigo-50 dark:bg-indigo-600/10 hover:bg-indigo-100 dark:hover:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400"
          }`}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CreationMethodStep; 