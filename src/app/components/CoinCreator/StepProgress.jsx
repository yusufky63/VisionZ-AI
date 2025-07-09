import React from 'react';

/**
 * Step Progress Indicator component
 * @param {Object} props
 * @param {number} props.currentStep - Current step (1, 2, 3 or 4)
 * @param {number} props.totalSteps - Total number of steps
 * @param {Array<string>} props.stepLabels - Labels for each step
 * @returns {JSX.Element}
 */
const StepProgress = ({ currentStep, totalSteps = 4, stepLabels = ["Introduction", "Creation Method", "Generate/Import", "Review & Create"] }) => {
  return (
    <div className="mb-6">
      <div className="w-full flex items-center">
        {/* Step 1 */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
          currentStep >= 1 
            ? "bg-indigo-600 border-indigo-600 text-white" 
            : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
        } font-medium text-sm transition-colors`}>
          1
        </div>
        
        {/* Line from Step 1 to Step 2 */}
        <div className={`flex-1 h-0.5 mx-2 ${
          currentStep > 1
            ? "bg-indigo-600"
            : "bg-gray-300 dark:bg-gray-600"
        } transition-colors`}></div>
        
        {/* Step 2 */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
          currentStep >= 2
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
        } font-medium text-sm transition-colors`}>
          2
        </div>
        
        {/* Line from Step 2 to Step 3 */}
        <div className={`flex-1 h-0.5 mx-2 ${
          currentStep > 2
            ? "bg-indigo-600"
            : "bg-gray-300 dark:bg-gray-600"
        } transition-colors`}></div>
        
        {/* Step 3 */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
          currentStep >= 3
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
        } font-medium text-sm transition-colors`}>
          3
        </div>
        
        {/* Line from Step 3 to Step 4 */}
        <div className={`flex-1 h-0.5 mx-2 ${
          currentStep > 3
            ? "bg-indigo-600"
            : "bg-gray-300 dark:bg-gray-600"
        } transition-colors`}></div>
        
        {/* Step 4 */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
          currentStep >= 4
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
        } font-medium text-sm transition-colors`}>
          4
        </div>
      </div>
      
      {/* Step Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className={`${currentStep >= 1 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
          {stepLabels[0]}
        </span>
        <span className={`${currentStep >= 2 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
          {stepLabels[1]}
        </span>
        <span className={`${currentStep >= 3 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
          {stepLabels[2]}
        </span>
        <span className={`${currentStep >= 4 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
          {stepLabels[3]}
        </span>
      </div>
    </div>
  );
};

export default StepProgress; 