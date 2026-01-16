"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Moon, Sun, Skull, Shield, Volume2, Info, 
  ChevronRight, Zap, Loader2, Heart, 
  CheckCircle2, RefreshCcw, Timer, Play, Pause, RotateCcw,
  Plus, Minus, History, Clock, LogOut, AlertCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NightPhaseModeration from '@/components/game/NightPhaseModeration';
import GameOverModal from '@/components/game/GameOverModal';

export default function ModeratorDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // --- States ---
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [activeTab, setActiveTab] = useState<'siang' | 'malam'>('siang');
  const [dayVotes, setDayVotes] = useState<Record<string, number>>({});
  const [selectedVictim, setSelectedVictim] = useState<string | null>(null);
  const [morningReport, setMorningReport] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const [gameOverWinner, setGameOverWinner] = useState<'GOODSIDE' | 'BADSIDE' | null>(null);

  // --- Audio ---
  const playSound = (type: 'night' | 'morning' | 'kill' | 'alarm') => {
    const sounds: Record<string, string> = {
      night: 'https://assets.mixkit.co/active_storage/sfx/2513/2513-preview.mp3', 
      morning: 'https://assets.mixkit.co/active_storage/sfx/1003/1003-preview.mp3',
      kill: 'https://assets.mixkit.co/active_storage/sfx/2186/2186-preview.mp3',
      alarm: 'https://assets.mixkit.co/active_storage/sfx/1014/1014-preview.mp3'
    };
    new Audio(sounds[type]).play().catch(() => {});
  };

  // --- Timer ---
  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      playSound('alarm');
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const fetchGame = useCallback(async () => {
    if (!id) return;
    try {
      console.log(`[GameDashboard] Fetching game ${id}`);
      const res = await fetch(`/api/game/${id}`);
      const data = await res.json();
      console.log('[GameDashboard] Game data:', data);
      if (data.error) {
        console.error('[GameDashboard] Game error:', data.error);
      } else {
        setGame(data);
      }
    } catch (err) { 
      console.error('[GameDashboard] Fetch error:', err); 
    } finally { 
      setLoading(false); 
    }
  }, [id]);

  useEffect(() => { fetchGame(); }, [fetchGame]);

  const handleKillPlayer = async (playerId: string) => {
    try {
      const res = await fetch(`/api/game/${id}/kill-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      const result = await res.json();
      playSound('kill');
      setSelectedVictim(null);
      setDayVotes({});
      
      // Check if game is over
      if (result.gameFinished && result.winner) {
        setGameOverWinner(result.winner);
      } else {
        fetchGame();
      }
    } catch (err) {
      alert('Error membunuh pemain');
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-bold text-wolf-gold">RESTORING SESSION...</div>;

  // Filter pemain yang punya aksi malam (Priority < 99)
  const nightActors = game?.players
    ?.filter((p: any) => p.isAlive && p.role.nightPriority < 99)
    .sort((a: any, b: any) => a.role.nightPriority - b.role.nightPriority);

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-10 bg-night-gradient text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter italic break-words">Wolf<span className="text-wolf-blood">Master</span></h1>
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab(activeTab === 'siang' ? 'malam' : 'siang')}
              className={`px-3 sm:px-6 md:px-8 py-2 md:py-3 rounded-lg sm:rounded-xl md:rounded-[16px] text-xs sm:text-sm md:text-base font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'siang'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              }`}
            >
              {activeTab === 'siang' ? (
                <>
                  <Sun size={16} />
                  Waktunya Malam
                </>
              ) : (
                <>
                  <Moon size={16} />
                  Waktunya Pagi
                </>
              )}
            </button>
            <button onClick={() => router.push('/')} className="p-2 sm:p-3 md:p-4 bg-red-500/10 text-red-500 rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-red-600 hover:text-white transition-all flex-shrink-0"><LogOut size={18}/></button>
          </div>
        </header>

        {/* --- MORNING REPORT --- */}
        <AnimatePresence>
          {morningReport.length > 0 && (
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-[32px] border-2 border-wolf-gold/30 mb-6 sm:mb-8 md:mb-10 bg-wolf-gold/5">
              <div className="flex justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                <h2 className="text-wolf-gold font-black italic flex items-center gap-2 uppercase tracking-tighter text-base sm:text-lg md:text-xl"><Info size={18}/> RINGKASAN RITUAL</h2>
                <button onClick={() => setMorningReport([])}><RefreshCcw size={16} className="text-gray-500"/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                {morningReport.map((msg, i) => (
                  <div key={i} className="bg-black/40 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl md:rounded-2xl border border-white/5 text-xs sm:text-sm flex items-center gap-2 sm:gap-3"><CheckCircle2 className="text-wolf-gold flex-shrink-0" size={14}/> {msg}</div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-6 lg:gap-10">
          
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'siang' ? (
                /* --- TAB SIANG: PLAYER CARDS --- */
                <motion.div key="siang" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {game?.players?.map((p: any) => (
                    <div key={p.id} className={`glass-card p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl md:rounded-[24px] lg:rounded-[32px] border-t border-white/10 transition-all ${p.isAlive ? 'shadow-lg' : 'opacity-20 grayscale'}`}>
                      <div className="flex justify-between items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg md:text-2xl font-bold break-words">{p.nickname}</h3>
                          <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase text-wolf-gold mt-1 block">{p.role.name}</span>
                        </div>
                        {p.isAlive && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleKillPlayer(p.id)}
                            className={`flex-shrink-0 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-lg md:rounded-xl lg:rounded-2xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${
                              selectedVictim === p.id
                                ? 'bg-red-600 text-white'
                                : 'bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white'
                            }`}
                          >
                            <Skull size={18}/>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                /* --- TAB MALAM: NIGHT PHASE MODERATION --- */
                <NightPhaseModeration
                  game={game}
                  players={game?.players || []}
                  onComplete={async (roleActions) => {
                    console.log('📤 [FRONTEND] Sending actions:', roleActions);
                    setResolving(true);
                    try {
                      const res = await fetch(`/api/game/${id}/resolve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ actions: roleActions })
                      });
                      const result = await res.json();
                      console.log('📥 [FRONTEND] Resolve result:', result);
                      setMorningReport(result.reports);
                      playSound('morning');
                      
                      // Check if game is over
                      if (result.isGameOver && result.winner) {
                        setGameOverWinner(result.winner);
                      } else {
                        setActiveTab('siang');
                        fetchGame();
                      }
                    } catch (err) { 
                      alert("Error memproses malam");
                      console.error(err);
                    } finally { 
                      setResolving(false); 
                    }
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* --- SIDEBAR --- */}
          <aside className="space-y-4 sm:space-y-6">
             {/* TIMER CONTROL */}
             <div className="glass-card p-8 rounded-[36px] border border-white/10 bg-white/5 text-center">
                <h2 className="text-[10px] font-black mb-4 uppercase tracking-widest text-gray-500">Discussion Timer</h2>
                <div className={`text-6xl font-black mb-6 tracking-tighter ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</div>
                <div className="flex gap-2 justify-center mb-6">
                  <button onClick={() => setTimeLeft(prev => Math.max(0, prev - 30))} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all"><Minus size={18}/></button>
                  <button onClick={() => setTimeLeft(prev => prev + 30)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all"><Plus size={18}/></button>
                </div>
                <button onClick={() => setTimerActive(!timerActive)} className={`w-full py-4 rounded-2xl font-black text-xs transition-all ${timerActive ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'}`}>{timerActive ? 'PAUSE' : 'START'}</button>
             </div>

             {/* HISTORY */}
             <div className="glass-card p-6 rounded-[32px] border border-white/10 max-h-[300px] overflow-y-auto custom-scrollbar">
                <h2 className="text-[10px] font-black mb-4 uppercase tracking-widest text-gray-400 flex items-center gap-2"><History size={14}/> Ritual Log</h2>
                <div className="space-y-3">
                  {game?.logs && game.logs.length > 0 ? (
                    game.logs.slice().reverse().map((log: any) => (
                      <div key={log.id} className="text-[10px] border-l-2 border-wolf-gold pl-3 py-1 text-gray-400 leading-relaxed">{log.message}</div>
                    ))
                  ) : (
                    <div className="text-[10px] text-gray-500">Belum ada log</div>
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