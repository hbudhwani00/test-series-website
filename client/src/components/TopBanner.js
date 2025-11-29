import React, { useState } from 'react';

const TopBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      background: '#1a1a1a',
      color: 'white',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      zIndex: 9999,
      fontSize: '14px',
      fontWeight: 500
    }}>
      <div style={{ 
        flex: 1, 
        textAlign: 'center',
        position: 'relative'
      }}>
        Hey, you're new here!<br />
        Get 15% off everything when you spend ₹20 with code: <strong>ASOSNEWHERE</strong>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
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