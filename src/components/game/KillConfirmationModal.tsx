"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, AlertTriangle, X } from 'lucide-react';

interface KillConfirmationModalProps {
  isOpen: boolean;
  victimName: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function KillConfirmationModal({ 
  isOpen, 
  victimName, 
  onConfirm, 
  onCancel 
}: KillConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm bg-[#1a0505] border border-red-500/30 rounded-3xl p-6 shadow-[0_0_40px_rgba(220,38,38,0.2)] overflow-hidden"
          >
            {/* Background Texture Effect */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Skull size={120} className="text-red-500 transform rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Icon Warning */}
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/30 animate-pulse">
                <AlertTriangle size={32} className="text-red-500" />
              </div>

              <h2 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">
                Konfirmasi Eliminasi
              </h2>
              
              <p className="text-sm text-gray-400 mb-6">
                Apakah Anda yakin ingin "membunuh" pemain ini?
              </p>

              {/* Victim Name Card */}
              <div className="w-full bg-red-950/30 border border-red-500/20 rounded-xl p-4 mb-8">
                <p className="text-xs text-red-400 uppercase font-bold tracking-widest mb-1">TARGET</p>
                <p className="text-2xl font-black text-white italic truncate">
                  {victimName}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={onCancel}
                  className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold hover:bg-white/10 transition-all active:scale-95"
                >
                  BATAL
                </button>
                <button
                  onClick={onConfirm}
                  className="py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] flex items-center justify-center gap-2 active:scale-95"
                >
                  <Skull size={18} />
                  BUNUH
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}