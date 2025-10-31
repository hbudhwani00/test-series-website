import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue,
  variant = 'default',
  className = '',
  ...props 
}) => {
  const variants = {
    default: 'from-blue-500 to-blue-600',
    success: 'from-green-500 to-green-600',
    warning: 'from-yellow-500 to-yellow-600',
    danger: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    cyan: 'from-cyan-500 to-cyan-600',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br ${variants[variant]} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold mb-2">{value}</p>
          {trend && trendValue && (
            <div className="flex items-center gap-1 text-sm">
              <span className={trend === 'up' ? 'text-green-200' : 'text-red-200'}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
              <span className="text-white/70">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="bg-white/20 rounded-lg p-3">
            <span className="text-2xl">{icon}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
