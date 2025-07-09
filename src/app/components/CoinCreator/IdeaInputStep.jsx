import React, { useContext } from 'react';
import { ThemeContext } from "../../contexts/ThemeContext";


/**
 * First step of coin creation - Input token idea
 * @param {Object} props
 * @param {Object} props.formData - Form data
 * @param {Function} props.setFormData - Form data setter
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.userInitialDescription - User's initial description
 * @param {Function} props.setUserInitialDescription - User's initial description setter
 * @param {Array} props.categories - Available categories
 * @param {string} props.selectedCategory - Selected category
 * @param {Function} props.setSelectedCategory - Selected category setter
 * @param {Function} props.goToNextStep - Navigate to next step
 * @param {boolean} props.aiGeneratingText - AI text generation in progress
 * @param {Function} props.goToPreviousStep - Navigate to previous step
 * @returns {JSX.Element}
 */
const IdeaInputStep = ({
  isLoading,
  userInitialDescription,
  setUserInitialDescription,
  categories,
  selectedCategory,
  setSelectedCategory,
  goToNextStep,
  aiGeneratingText,
  goToPreviousStep
}) => {
  const { theme } = useContext(ThemeContext);
  return (
    <div className="animate-fade-in">
      {/* Category Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
          Category{" "}
          <span className="text-gray-600 dark:text-gray-400">
            (Optional, influences AI)
          </span>
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          disabled={isLoading} 
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent backdrop-blur-sm outline-none focus:ring-0 appearance-none disabled:opacity-50 text-gray-900 dark:text-white"
        >
          <option value="" className="bg-gray-100 dark:bg-gray-800">
            Random Category
          </option>
          {categories.map((category) => (
            <option
              key={category.name}
              value={category.name}
              className="bg-gray-100 dark:bg-gray-800"
            >
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* User Initial Description Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
          Your Token Idea{" "}
          <span className="text-gray-600 dark:text-gray-400">
            (Describe your token concept)
          </span>
        </label>
        <textarea
          value={userInitialDescription}
          onChange={(e) => setUserInitialDescription(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent backdrop-blur-sm outline-none focus:ring-1 focus:ring-indigo-500 resize-none disabled:opacity-50 text-gray-900 dark:text-white"
          rows={5}
          placeholder="Enter a brief description of your token idea (e.g., 'A meme coin based on cats that love pizza')"
        />
      </div>
      
      {/* Some example ideas */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Need inspiration? Try one of these:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            "A meme coin based on dogs wearing sunglasses",
            "A token for funding sustainable farming projects",
            "A social media token where users earn by creating content",
            "A gaming token used for in-game purchases and rewards"
          ].map((idea, index) => (
            <button
              key={index}
              onClick={() => setUserInitialDescription(idea)}
              className="text-left p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={goToPreviousStep}
          className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300 font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span>Back</span>
        </button>
        <button
          onClick={goToNextStep}
          disabled={isLoading || !userInitialDescription.trim()}
          className={`px-6 py-2 rounded-lg transition-all duration-200 font-medium ${
            isLoading || !userInitialDescription.trim()
              ? theme === "dark"
                ? "border-gray-700 bg-gray-800/50 text-gray-500 cursor-not-allowed"
                : "border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed"
              : theme === "dark"
              ? "border-indigo-600/50 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400"
              : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
          } border`}
        >
          {aiGeneratingText ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Token"
          )}
        </button>
      </div>
    </div>
  );
};

export default IdeaInputStep; 