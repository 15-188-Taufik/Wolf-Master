"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface NightReportProps {
  reports: string[];
  onContinue: () => void;
}

const NightResolutionReport: React.FC<NightReportProps> = ({ reports, onContinue }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0d0d12]/60 backdrop-blur-2xl shadow-2xl"
      >
        {/* Glow Effect Top */}
        <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 bg-crimson-600/20 blur-[80px]" />

        <div className="relative p-8 md:p-12">
          <header className="mb-8 text-center">
            <h2 className="text-sm font-medium tracking-[0.2em] text-crimson-500 uppercase mb-2">
              Berita Fajar
            </h2>
            <h1 className="text-3xl font-light tracking-tight text-white">
              Kejadian Semalam
            </h1>
          </header>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {reports.length > 0 ? (
              reports.map((report, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={index}
                  className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-md"
                >
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson-500 shadow-[0_0_8px_#dc2626]" />
                  <p className="text-[15px] font-light leading-relaxed text-gray-300">
                    {report}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="py-10 text-center">
                <p className="text-gray-500 font-light italic">Semua orang terbangun dengan selamat. Malam yang sangat tenang.</p>
              </div>
            )}
          </div>

          <footer className="mt-10">
            <button
              onClick={onContinue}
              className="group relative w-full overflow-hidden rounded-2xl bg-white p-4 transition-all hover:bg-gray-100 active:scale-[0.98]"
            >
              <span className="relative z-10 font-semibold text-black">Mulai Diskusi Siang</span>
            </button>
            <p className="mt-4 text-center text-xs text-gray-600 font-light tracking-wide">
              Tekan tombol untuk melanjutkan ke fase voting
            </p>
          </footer>
        </div>
      </motion.div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default NightResolutionReport;