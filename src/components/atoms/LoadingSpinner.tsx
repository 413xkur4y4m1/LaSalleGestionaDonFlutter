// Spinner animation for button loading state
// Framer Motion: rotate infinite
// Size: 20px (xs) → 24px (xl)
// Color: white

import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <motion.div
      className="inline-block w-5 h-5 border-2 border-solid border-white border-t-transparent rounded-full animate-spin"
      style={{
        borderColor: 'white',
        borderTopColor: 'transparent',
      }}
      animate={{ rotate: 360 }}
      transition={{ loop: Infinity, duration: 0.75 }}
    />
  );
};

export default LoadingSpinner;