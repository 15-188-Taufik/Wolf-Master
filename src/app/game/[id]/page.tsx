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

export default function ModeratorDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // --- States ---
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [activeTab, setActiveTab] = useState<'siang' | 'malam'>('siang');
  
  // DYNAMIC ACTIONS: { [actorId]: targetId }
  const [actions, setActions] = useState<Record<string, string>>({});
  const [morningReport, setMorningReport] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);

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
      const res = await fetch(`/api/game/${id}`);
      const data = await res.json();
      if (!data.error) setGame(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchGame(); }, [fetchGame]);

  const resolveNight = async () => {
    setResolving(true);
    try {
      const res = await fetch(`/api/game/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions })
      });
      const result = await res.json();
      setMorningReport(result.reports);
      playSound('morning');
      setActiveTab('siang');
      setActions({}); // Reset actions
      fetchGame();
    } catch (err) { alert("Error memproses malam"); } finally { setResolving(false); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-bold text-wolf-gold">RESTORING SESSION...</div>;

  // Filter pemain yang punya aksi malam (Priority < 99)
  const nightActors = game?.players
    ?.filter((p: any) => p.isAlive && p.role.nightPriority < 99)
    .sort((a: any, b: any) => a.role.nightPriority - b.role.nightPriority);

  return (
    <div className="min-h-screen p-4 md:p-10 bg-night-gradient text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black tracking-tighter italic">Wolf<span className="text-wolf-blood">Master</span></h1>
          <div className="flex gap-4">
            <div className="flex p-1 bg-white/5 rounded-[22px] border border-white/10">
              <button onClick={() => setActiveTab('siang')} className={`px-8 py-3 rounded-[16px] text-xs font-black transition-all ${activeTab === 'siang' ? 'bg-white text-black' : 'text-gray-500'}`}>SIANG</button>
              <button onClick={() => setActiveTab('malam')} className={`px-8 py-3 rounded-[16px] text-xs font-black transition-all ${activeTab === 'malam' ? 'bg-wolf-purple text-white' : 'text-gray-500'}`}>MALAM</button>
            </div>
            <button onClick={() => router.push('/')} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><LogOut size={20}/></button>
          </div>
        </header>

        {/* --- MORNING REPORT --- */}
        <AnimatePresence>
          {morningReport.length > 0 && (
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-6 rounded-[32px] border-2 border-wolf-gold/30 mb-10 bg-wolf-gold/5">
              <div className="flex justify-between mb-4">
                <h2 className="text-wolf-gold font-black italic flex items-center gap-2 uppercase tracking-tighter text-xl"><Info size={24}/> RINGKASAN RITUAL</h2>
                <button onClick={() => setMorningReport([])}><RefreshCcw size={18} className="text-gray-500"/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {morningReport.map((msg, i) => (
                  <div key={i} className="bg-black/40 p-4 rounded-2xl border border-white/5 text-sm flex items-center gap-3"><CheckCircle2 className="text-wolf-gold" size={16}/> {msg}</div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'siang' ? (
                /* --- TAB SIANG: PLAYER CARDS --- */
                <motion.div key="siang" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {game?.players?.map((p: any) => (
                    <div key={p.id} className={`glass-card p-6 rounded-[32px] border-t border-white/10 transition-all ${p.isAlive ? 'shadow-lg' : 'opacity-20 grayscale'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-bold">{p.nickname}</h3>
                          <span className="text-[9px] font-black uppercase text-wolf-gold">{p.role.name}</span>
                        </div>
                        {p.isAlive && <button className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Skull size={20}/></button>}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                /* --- TAB MALAM: DYNAMIC ACTION LIST --- */
                <motion.div key="malam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h2 className="text-2xl font-black italic flex items-center gap-3 mb-4 uppercase"><Zap className="text-wolf-gold"/> Urutan Ritual Malam</h2>
                  
                  <div className="grid gap-4">
                    {nightActors?.map((actor: any, idx: number) => (
                      <div key={actor.id} className="glass-card p-6 rounded-[28px] border border-white/10 flex flex-col md:flex-row md:items-center gap-6 group hover:border-wolf-gold/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-wolf-gold text-xl shadow-inner">{idx + 1}</div>
                        <div className="flex-1">
                          <p className="font-black text-wolf-gold text-[10px] uppercase tracking-widest mb-1">{actor.role.name}</p>
                          <p className="text-lg font-bold text-white/90">Panggil Pemain: <span className="text-white italic underline">{actor.nickname}</span></p>
                        </div>
                        <div className="w-full md:w-64">
                          <select 
                            className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-xs font-bold focus:ring-1 focus:ring-wolf-gold outline-none"
                            value={actions[actor.id] || ""}
                            onChange={(e) => setActions({...actions, [actor.id]: e.target.value})}
                          >
                            <option value="">-- PILIH TARGET --</option>
                            {game?.players?.filter((p: any) => p.isAlive).map((target: any) => (
                              <option key={target.id} value={target.id} className="bg-neutral-900">{target.nickname}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={resolveNight}
                    disabled={resolving || Object.keys(actions).length === 0}
                    className="w-full py-6 rounded-3xl bg-wolf-blood font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-3xl flex items-center justify-center gap-3"
                  >
                    {resolving ? <Loader2 className="animate-spin"/> : <Sun size={24}/>}
                    BANGUNKAN SELURUH WARGA
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --- SIDEBAR --- */}
          <aside className="space-y-6">
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
                  {game?.logs?.slice().reverse().map((log: any) => (
                    <div key={log.id} className="text-[10px] border-l-2 border-wolf-gold pl-3 py-1 text-gray-400 leading-relaxed">{log.message}</div>
                  ))}
                </div>
             </div>
          </aside>

        </div>
      </div>
    </div>
  );
}