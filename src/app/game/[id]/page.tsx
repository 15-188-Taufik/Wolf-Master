"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Moon, Sun, Skull, Info, 
  CheckCircle2, RefreshCcw, 
  Plus, Minus, History, LogOut, Ghost
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NightPhaseModeration from '@/components/game/NightPhaseModeration';
import GameOverModal from '@/components/game/GameOverModal';
import KillAnnouncement from '@/components/game/KillAnnouncement'; // [BARU] Import ini

export default function ModeratorDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // --- States ---
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [activeTab, setActiveTab] = useState<'siang' | 'malam'>('siang');
  
  // State untuk Konfirmasi Bunuh (Tombol Merah)
  const [selectedVictim, setSelectedVictim] = useState<string | null>(null);
  
  // State untuk Notifikasi Alert Bunuh [BARU]
  const [justKilledName, setJustKilledName] = useState<string | null>(null);

  const [morningReport, setMorningReport] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const [gameOverWinner, setGameOverWinner] = useState<'GOODSIDE' | 'BADSIDE' | null>(null);
  const [ghostHintLetter, setGhostHintLetter] = useState('');
  const [ghostHintSending, setGhostHintSending] = useState(false);

  // --- Timer Logic ---
  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // --- Fetch Data ---
  const fetchGame = useCallback(async () => {
    if (!id) {
      console.warn('[GameDashboard] No game ID provided');
      setError('Game ID tidak ditemukan');
      setLoading(false);
      return;
    }

    try {
      console.log(`[GameDashboard] Fetching game ${id}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch(`/api/game/${id}`, { signal: controller.signal });
      clearTimeout(timeout);
      
      console.log(`[GameDashboard] Response status: ${res.status}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('[GameDashboard] Game data:', data);
      
      if (data && data.error) {
        console.error('[GameDashboard] Game error:', data.error);
        setError(`Game tidak ditemukan: ${data.error}`);
      } else if (data && data.id) {
        setGame(data);
        setError(null);
      } else {
        console.error('[GameDashboard] Invalid data structure');
        setError('Data game tidak valid');
      }
    } catch (err: any) {
      console.error('[GameDashboard] Fetch error:', err);
      if (err.name === 'AbortError') {
        setError('Request timeout - server tidak merespons');
      } else {
        setError(err.message || 'Gagal memuat game');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchGame(); }, [fetchGame]);

  // --- Handler Bunuh Pemain ---
  const handleKillPlayer = async (playerId: string, nickname: string) => {
    try {
      const res = await fetch(`/api/game/${id}/kill-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      const result = await res.json();
      
      // Reset Tombol Konfirmasi
      setSelectedVictim(null);

      // 3. Tampilkan Alert Keren [BARU]
      setJustKilledName(nickname); 
      
      // 4. Cek Game Over
      if (result.gameFinished && result.winner) {
        // Delay sedikit biar alert kill muncul dulu baru modal menang
        setTimeout(() => setGameOverWinner(result.winner), 1500);
      } else {
        fetchGame();
      }
    } catch (err) {
      alert('Error membunuh pemain');
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4 font-bold text-wolf-gold">
    <div className="animate-pulse">MEMUAT SESI...</div>
    <div className="text-xs text-gray-400">ID: {id || 'tidak ada'}</div>
  </div>;

  if (error) return <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4 font-bold text-red-500 p-4">
    <div className="text-2xl">⚠️ ERROR</div>
    <div className="text-lg text-center">{error}</div>
    <button onClick={() => { setError(null); setLoading(true); fetchGame(); }} className="mt-4 px-6 py-2 bg-red-500/20 border border-red-500 rounded-lg hover:bg-red-500/30">
      Coba Lagi
    </button>
    <button onClick={() => router.push('/')} className="mt-2 px-6 py-2 bg-gray-500/20 border border-gray-500 rounded-lg hover:bg-gray-500/30">
      Kembali ke Menu
    </button>
  </div>;

  if (!game) return <div className="min-h-screen bg-black flex items-center justify-center font-bold text-yellow-500">
    Data game tidak tersedia. ID: {id}
  </div>;

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-10 bg-night-gradient text-white relative">
      
      {/* --- KOMPONEN ALERT KILL --- */}
      <KillAnnouncement 
        victimName={justKilledName} 
        onClose={() => setJustKilledName(null)} 
      />

      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter italic break-words">Wolf<span className="text-wolf-blood">Master</span></h1>
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
            <button
              onClick={() => {
                window.scrollTo(0, 0);
                setActiveTab(activeTab === 'siang' ? 'malam' : 'siang');
              }}
              className={`px-3 sm:px-6 md:px-8 py-2 md:py-3 rounded-lg sm:rounded-xl md:rounded-[16px] text-xs sm:text-sm md:text-base font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'siang'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              }`}
            >
              {activeTab === 'siang' ? <><Sun size={16} /> SIANG</> : <><Moon size={16} /> MALAM</>}
            </button>
            <button onClick={() => router.push('/')} className="p-2 sm:p-3 md:p-4 bg-red-500/10 text-red-500 rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-red-600 hover:text-white transition-all flex-shrink-0"><LogOut size={18}/></button>
          </div>
        </header>

        {/* MORNING REPORT */}
        <AnimatePresence>
          {morningReport.length > 0 && (
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-[32px] border-2 border-wolf-gold/30 mb-6 sm:mb-8 md:mb-10 bg-wolf-gold/5 text-center">
              <div className="flex flex-col items-center justify-center mb-3 sm:mb-4 gap-2">
                <h2 className="text-wolf-gold font-black italic flex items-center gap-2 uppercase tracking-tighter text-base sm:text-lg md:text-xl text-center"><Info size={18}/> DETAIL RITUAL</h2>
                <button onClick={() => setMorningReport([])}><RefreshCcw size={16} className="text-gray-500"/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                {morningReport.map((msg, i) => (
                  <div key={i} className="bg-black/40 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl md:rounded-2xl border border-white/5 text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3 text-center"><CheckCircle2 className="text-wolf-gold flex-shrink-0" size={14}/> {msg}</div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ghost Hint (siang hari, jika Ghost sudah mati) */}
        {activeTab === 'siang' && game?.players?.some((p: any) => !p.isAlive && p.roleId === 'ghost') && (
          <div className="glass-card p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 mb-4 sm:mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2 text-purple-300 mb-3">
              <Ghost size={18} /> Hint Ghost (1 huruf)
            </h3>
            <div className="flex gap-2 flex-wrap items-center">
              <input
                type="text"
                maxLength={1}
                value={ghostHintLetter}
                onChange={(e) => setGhostHintLetter(e.target.value.toUpperCase().replace(/[^A-Za-z]/g, ''))}
                placeholder="A–Z"
                className="w-14 h-10 text-center text-xl font-black bg-black/50 border border-white/20 rounded-lg text-white uppercase"
              />
              <button
                type="button"
                disabled={!ghostHintLetter || ghostHintSending}
                onClick={async () => {
                  if (!ghostHintLetter) return;
                  setGhostHintSending(true);
                  try {
                    const res = await fetch(`/api/game/${id}/ghost-hint`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ letter: ghostHintLetter })
                    });
                    if (res.ok) {
                      setGhostHintLetter('');
                      fetchGame();
                    } else {
                      const err = await res.json();
                      alert(err.error || 'Gagal mengirim hint');
                    }
                  } finally {
                    setGhostHintSending(false);
                  }
                }}
                className="px-4 py-2 rounded-lg font-bold bg-purple-500/30 border border-purple-500/50 hover:bg-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ghostHintSending ? '...' : 'Kirim Hint'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-6 lg:gap-10">
          
          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'siang' ? (
                /* --- TAB SIANG: PLAYER CARDS --- */
                <motion.div 
                   key="siang" 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
                >
                  {game?.players?.map((p: any) => (
                    <div 
                      key={p.id} 
                      className={`glass-card p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl md:rounded-2xl border-t border-white/10 transition-all text-center flex flex-col justify-between min-h-[90px] sm:min-h-[110px] ${p.isAlive ? 'shadow-lg' : 'opacity-30 grayscale bg-black/40'}`}
                    >
                      <div className="flex flex-col items-center gap-1 sm:gap-3 flex-1 justify-center">
                        <div className="flex-1 min-w-0 w-full flex flex-col justify-center">
                          <h3 className="text-sm sm:text-lg md:text-2xl font-bold break-words text-center leading-tight">
                            {p.nickname}
                          </h3>
                          <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase text-wolf-gold mt-1 block text-center truncate px-1">
                            {p.role.name}
                          </span>
                        </div>
                        
                        {p.isAlive && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (selectedVictim === p.id) {
                                // Logic Konfirmasi kedua (Optional: Pakai Window Confirm atau langsung tombol)
                                // Di sini saya biarkan window.confirm tapi panggil handleKillPlayer baru
                                const confirmed = window.confirm(`Yakin ingin eliminasi "${p.nickname}"?`);
                                if (confirmed) {
                                  handleKillPlayer(p.id, p.nickname); // Kirim nama juga untuk alert
                                } else {
                                  setSelectedVictim(null);
                                }
                              } else {
                                setSelectedVictim(p.id);
                              }
                            }}
                            className={`flex-shrink-0 p-1.5 sm:p-2.5 md:p-3 rounded-lg sm:rounded-lg md:rounded-xl lg:rounded-2xl transition-all mt-1 sm:mt-0 ${
                              selectedVictim === p.id
                                ? 'bg-red-600 text-white w-full shadow-[0_0_15px_rgba(220,38,38,0.6)]'
                                : 'bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white'
                            }`}
                          >
                            {selectedVictim === p.id ? (
                               <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">KONFIRMASI</span>
                            ) : (
                               <Skull size={16} className="mx-auto"/>
                            )}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                /* --- TAB MALAM --- */
                <NightPhaseModeration
                  game={game}
                  players={game?.players || []}
                  onComplete={async (payload) => {
                    const { actions: roleActions, great_shaman_mode } = payload || {};
                    setResolving(true);
                    try {
                      const res = await fetch(`/api/game/${id}/resolve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ actions: roleActions, great_shaman_mode })
                      });
                      const result = await res.json();
                      setMorningReport(result.reports);

                      if (result.isGameOver && result.winner) {
                        setGameOverWinner(result.winner);
                      } else {
                        setActiveTab('siang');
                        fetchGame();
                      }
                    } catch (err) { 
                      alert("Error memproses malam");
                    } finally { 
                      setResolving(false); 
                    }
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* SIDEBAR (Timer & History) */}
          <aside className="space-y-4 sm:space-y-6">
             {/* TIMER */}
             <div className="glass-card p-4 sm:p-8 rounded-2xl sm:rounded-[36px] border border-white/10 bg-white/5 text-center">
                <h2 className="text-xs sm:text-sm font-black mb-2 sm:mb-4 uppercase tracking-widest text-gray-500 text-center">Timer</h2>
                <div className={`text-4xl sm:text-6xl font-black mb-4 sm:mb-6 tracking-tighter text-center ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
                </div>
                <div className="flex gap-2 justify-center mb-4 sm:mb-6">
                  <button onClick={() => setTimeLeft(prev => Math.max(0, prev - 30))} className="p-2 sm:p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all"><Minus size={16} className="sm:w-5 sm:h-5"/></button>
                  <button onClick={() => setTimeLeft(prev => prev + 30)} className="p-2 sm:p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all"><Plus size={16} className="sm:w-5 sm:h-5"/></button>
                </div>
                <button onClick={() => setTimerActive(!timerActive)} className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-base transition-all text-center ${timerActive ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'}`}>
                  {timerActive ? 'PAUSE' : 'START'}
                </button>
             </div>

             {/* LOG */}
             <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-[32px] border border-white/10 max-h-[250px] sm:max-h-[300px] overflow-y-auto custom-scrollbar text-center">
                <h2 className="text-xs sm:text-sm font-black mb-3 sm:mb-4 uppercase tracking-widest text-gray-400 flex items-center justify-center gap-2 text-center"><History size={16}/> Log</h2>
                <div className="space-y-2 sm:space-y-3">
                  {game?.logs && game.logs.length > 0 ? (
                    game.logs.slice().reverse().map((log: any) => (
                      <div key={log.id} className="text-[10px] sm:text-sm border-l-2 border-wolf-gold pl-2 sm:pl-3 py-1 text-gray-400 leading-relaxed text-center">{log.message}</div>
                    ))
                  ) : (
                    <div className="text-xs sm:text-sm text-gray-500 text-center">Belum ada log</div>
                  )}
                </div>
             </div>
          </aside>

        </div>
      </div>

      {/* Game Over Modal */}
      <GameOverModal winner={gameOverWinner} isOpen={!!gameOverWinner} />
    </div>
  );
}