import React, { useState, useEffect } from 'react';

const TopBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger animation immediately after mount
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      style={{
        width: '100%',
        background: '#1a1a1a',
        color: 'white',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontSize: '14px',
        fontWeight: 500,
        position: 'relative',
        animation: isAnimating ? 'slideDown 0.6s ease-out forwards' : 'none',
        transformOrigin: 'top'
      }}
    >
      <style>
        {`
          @keyframes slideDown {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={{ 
        flex: 1, 
        textAlign: 'center'
      }}>
        🎉 Hey aspirants, Pre Launch offer!<br />
        Get 100% off for First 99 Students with PromoCode: <strong>FULLFREE</strong>
      </div>
      <button 
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '0 10px',
          lineHeight: 1,
          position: 'absolute',
          right: '20px'
        }}
      >
        ×
      </button>
    </div>
  );
};

export default TopBanner;