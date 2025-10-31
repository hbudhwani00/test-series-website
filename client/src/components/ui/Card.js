import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = true,
  padding = 'default',
  ...props 
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };
  
  const baseClasses = `bg-white rounded-xl shadow-md transition-all duration-300 ${paddings[padding]} ${className}`;
  const hoverClasses = hover ? 'hover:shadow-xl hover:-translate-y-1' : '';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${baseClasses} ${hoverClasses}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
