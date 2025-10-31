import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };
  
  return (
    <div className="flex items-center justify-center py-10">
      <div
        className={`animate-spin rounded-full border-4 border-gray-200 border-t-primary ${sizes[size]} ${className}`}
      />
    </div>
  );
};

export default LoadingSpinner;
