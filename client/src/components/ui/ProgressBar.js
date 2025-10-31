import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  showLabel = true,
  size = 'md',
  variant = 'primary',
  className = '',
  ...props 
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };
  
  const variants = {
    primary: 'bg-primary',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    danger: 'bg-red-600',
    accent: 'bg-accent',
  };
  
  return (
    <div className={`w-full ${className}`} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {value} / {max}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`${sizes[size]} ${variants[variant]} rounded-full transition-all duration-300`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
