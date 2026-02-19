"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export default function ToastNotification({ message, type, isVisible, onClose }: ToastProps) {
  // Auto-close dalam 3 detik
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  // Style config
  const styles = {
    success: { 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/50', 
      text: 'text-emerald-200',
      icon: <CheckCircle2 className="text-emerald-400" size={20} /> 
    },
    error: { 
      bg: 'bg-red-500/10', 
      border: 'border-red-500/50', 
      text: 'text-red-200',
      icon: <AlertCircle className="text-red-400" size={20} /> 
    },
    info: { 
      bg: 'bg-blue-500/10', 
      border: 'border-blue-500/50', 
      text: 'text-blue-200',
      icon: <Info className="text-blue-400" size={20} /> 
    }
  };

  const style = styles[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-xl shadow-2xl border ${style.bg} ${style.border} min-w-[300px] max-w-[90vw]`}
        >
          <div className="shrink-0">{style.icon}</div>
          <p className={`font-semibold text-sm md:text-base tracking-wide ${style.text}`}>
            {message}
          </p>
          <button onClick={onClose} className="ml-auto p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={16} className="text-white/50 hover:text-white" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}