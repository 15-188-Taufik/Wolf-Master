"use client";

import React, { useState, useEffect } from 'react';
import { Users, Play, Plus, Trash2, History, ChevronRight, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [savedGames, setSavedGames] = useState<any[]>([]);
  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [masterPlayers, setMasterPlayers] = useState<any[]>([]); // Database nama pemain
  const [players, setPlayers] = useState<{name: string, roleId: string}[]>([]);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    fetch('/api/roles').then(res => res.json()).then(setDbRoles);
    fetch('/api/games').then(res => res.json()).then(setSavedGames);
    fetch('/api/players').then(res => res.json()).then(setMasterPlayers);
  }, []);

  const addPlayer = async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName || players.find(p => p.name === cleanName)) return;

    // Simpan ke database MasterPlayer di background
    fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: cleanName })
    });

    setPlayers([...players, { name: cleanName, roleId: 'villager' }]);
    setNameInput("");
    // Refresh master list agar nama baru muncul di saran
    fetch('/api/players').then(res => res.json()).then(setMasterPlayers);
  };

  const startGame = async () => {
    if (players.length < 7) return; 
    const res = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players: players.map(p => ({ nickname: p.name, roleId: p.roleId })) })
    });
    const game = await res.json();
    if (game.id) router.push(`/game/${game.id}`);
  };

  return (
    <div className="min-h-screen p-6 md:p-12 text-white bg-night-gradient">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black tracking-tighter italic">Wolf<span className="text-wolf-blood">Master</span></h1>
            <p className="text-gray-500 font-mono text-xs mt-1 uppercase tracking-widest">ITERA KKN Edition v2.0</p>
          </div>
          <button 
            onClick={startGame} 
            disabled={players.length < 7} 
            className="glass-card px-10 py-5 rounded-[24px] font-black text-lg hover:bg-white/10 transition-all disabled:opacity-20 shadow-2xl"
          >
            MULAI RITUAL ({players.length})
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* SIDEBAR: SAVE GAMES & PLAYER DATABASE */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* 1. SAVE GAMES */}
            <div className="glass-card p-6 rounded-[32px] border border-white/10">
              <h2 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-gray-400">
                <History size={16} className="text-wolf-gold"/> Lanjutkan Game
              </h2>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {savedGames.map((g) => (
                  <button key={g.id} onClick={() => router.push(`/game/${g.id}`)} className="w-full p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-wolf-gold/30 transition-all flex justify-between items-center">
                    <span className="font-bold text-[10px] uppercase">Sess-{g.id.slice(-4)}</span>
                    <ChevronRight size={14} className="text-gray-700"/>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. PLAYER DATABASE (Quick Add) */}
            <div className="glass-card p-6 rounded-[32px] border border-white/10">
              <h2 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-gray-400">
                <UserCheck size={16} className="text-green-500"/> Pemain Terdaftar
              </h2>
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {masterPlayers.map((mp) => (
                  <button 
                    key={mp.id} 
                    onClick={() => addPlayer(mp.nickname)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/15 rounded-full text-[11px] border border-white/5 transition-all"
                  >
                    + {mp.nickname}
                  </button>
                ))}
                {masterPlayers.length === 0 && <p className="text-[10px] text-gray-600 italic">Belum ada pemain.</p>}
              </div>
            </div>
          </div>

          {/* MAIN INPUT & ASSIGNMENT */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* INPUT FIELD */}
            <div className="glass-card p-8 rounded-[36px] border border-white/10">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Plus size={24} className="text-wolf-gold" /> Tambah Peserta Ritual
              </h2>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={nameInput} 
                  onChange={(e) => setNameInput(e.target.value)} 
                  placeholder="Ketik Nickname pemain..." 
                  className="glass-input flex-1 px-6 py-4 rounded-2xl text-lg font-medium" 
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer(nameInput)} 
                />
                <button onClick={() => addPlayer(nameInput)} className="bg-white text-black px-8 rounded-2xl font-black hover:bg-gray-200 transition-all flex items-center gap-2">
                  <Plus size={20}/> TAMBAH
                </button>
              </div>
            </div>

            {/* ASSIGNMENT TABLE */}
            <div className="glass-card p-8 rounded-[40px] border border-white/10 min-h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((p, i) => (
                  <div key={i} className="p-5 bg-white/5 rounded-3xl border border-white/5 flex flex-col gap-3 group hover:border-wolf-gold/30 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">{p.name}</span>
                      <button onClick={() => setPlayers(players.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-500 transition-colors">
                        <Trash2 size={18}/>
                      </button>
                    </div>
                    <select 
                      value={p.roleId} 
                      onChange={(e) => { const n = [...players]; n[i].roleId = e.target.value; setPlayers(n); }} 
                      className="bg-black/40 text-xs p-3 rounded-xl border border-white/10 outline-none focus:ring-1 focus:ring-wolf-gold"
                    >
                      {dbRoles.map(r => <option key={r.id} value={r.id} className="bg-neutral-900">{r.name}</option>)}
                    </select>
                  </div>
                ))}
                {players.length === 0 && (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-600 opacity-30">
                    <Users size={64} className="mb-4" />
                    <p className="font-black italic">TIDAK ADA PEMAIN TERDAFTAR</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}