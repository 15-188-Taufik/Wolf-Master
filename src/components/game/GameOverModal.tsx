"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GameOverModalProps {
  winner: 'GOODSIDE' | 'BADSIDE' | null;
  isOpen: boolean;
}

export default function GameOverModal({ winner, isOpen }: GameOverModalProps) {
  const router = useRouter();

  if (!isOpen || !winner) return null;

  const isGoodsideWin = winner === 'GOODSIDE';
  const title = isGoodsideWin ? 'VILLAGER MEMENANGKAN!' : 'WEREWOLF MEMENANGKAN!';
  const description = isGoodsideWin 
    ? 'Seluruh ancaman telah dimusnahkan. Warga desa berhasil mengusir semua werewolf!'
    : 'Werewolf kini mendominasi desa. Tim badside berhasil mengalahkan warga!';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
        className={`max-w-md w-full rounded-[40px] border-2 overflow-hidden shadow-2xl ${
          isGoodsideWin
            ? 'bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-500/50'
            : 'bg-gradient-to-br from-red-600/20 to-red-400/10 border-red-500/50'
        }`}
      >
        {/* Header */}
        <div
          className={`p-8 text-center ${
            isGoodsideWin
              ? 'bg-gradient-to-b from-blue-500/30 to-transparent'
              : 'bg-gradient-to-b from-red-500/30 to-transparent'
          }`}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-4"
          >
            <Trophy
              size={64}
              className={isGoodsideWin ? 'text-blue-400 mx-auto' : 'text-red-400 mx-auto'}
            />
          </motion.div>

          <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-4 ${
            isGoodsideWin ? 'text-blue-300' : 'text-red-300'
          }`}>
            {title}
          </h1>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <p className="text-center text-gray-200 text-lg mb-8 leading-relaxed">
            {description}
          </p>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />

          {/* Stats */}
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm mb-2">PERMAINAN SELESAI</p>
            <p className={`text-2xl font-black ${
              isGoodsideWin ? 'text-blue-300' : 'text-red-300'
            }`}>
              {isGoodsideWin ? 'PIHAK BAIK MENANG' : 'PIHAK JAHAT MENANG'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className={`flex-1 px-6 py-3 rounded-[20px] font-black text-sm transition-all flex items-center justify-center gap-2 ${
                isGoodsideWin
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300'
                  : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300'
              }`}
            >
              <Home size={18} />
              Kembali ke Menu
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
