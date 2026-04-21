"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, X } from 'lucide-react';

interface KillAnnouncementProps {
  victimName: string | null;
  onClose: () => void;
}

export default function KillAnnouncement({ victimName, onClose }: KillAnnouncementProps) {
  
  // Auto-close setelah 2.5 detik
  useEffect(() => {
    if (victimName) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [victimName, onClose]);

  return (
    <AnimatePresence>
      {victimName && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-none">
          {/* Backdrop Gelap (Optional, matikan pointer-events agar tidak block klik total jika error) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Main Card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative bg-[#1a0505] border-2 border-red-600/50 p-8 rounded-[32px] shadow-[0_0_50px_rgba(220,38,38,0.4)] text-center max-w-sm w-full"
          >
            {/* Icon Tengkorak Berdenyut */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30"
            >
              <Skull size={48} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            </motion.div>

            <h2 className="text-red-500 font-black tracking-[0.2em] text-sm uppercase mb-2">
              PEMAIN TERELIMINASI
            </h2>
            
            <h1 className="text-3xl md:text-4xl font-black text-white italic mb-2 tracking-tighter break-words">
              {victimName}
            </h1>

            <div className="h-1 w-20 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mt-4"/>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}