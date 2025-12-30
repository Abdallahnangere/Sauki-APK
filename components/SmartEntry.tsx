import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SmartEntryProps {
  onComplete: () => void;
}

export const SmartEntry: React.FC<SmartEntryProps> = ({ onComplete }) => {
  useEffect(() => {
    // Shorter, premium duration
    const timer = setTimeout(onComplete, 2500); 
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="flex flex-col items-center justify-center">
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
        >
            <img src="/entry.png" className="w-24 h-24 object-contain" alt="Sauki Mart" />
        </motion.div>
        
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col items-center"
        >
             <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        </motion.div>
      </div>
    </motion.div>
  );
};