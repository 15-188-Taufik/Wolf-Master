"use client";

import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, UserCheck, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Import komponen baru
import GameListManager from '@/components/game/GameListManager';

export default function Home() {
  const router = useRouter();
  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [masterPlayers, setMasterPlayers] = useState<any[]>([]);
  const [players, setPlayers] = useState<{name: string, roleId: string}[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/roles').then(res => res.json()).then(setDbRoles);
    fetch('/api/players').then(res => res.json()).then(setMasterPlayers);
  }, []);

  const addPlayer = async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName || players.find(p => p.name === cleanName)) return;

    // Simpan ke database MasterPlayer (background)
    fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: cleanName })
    });

    setPlayers([...players, { name: cleanName, roleId: 'villager' }]);
    setNameInput("");
    // Refresh list master
    fetch('/api/players').then(res => res.json()).then(setMasterPlayers);
  };

  const createGame = async () => {
    if (players.length < 5) return alert("Minimal 5 pemain!"); // Rule standar werewolf
    setCreating(true);
    try {
      const res = await fetch('/api/games', { // Perhatikan endpointnya plural 'games'
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          players: players.map(p => p.name), // Kirim array string nama saja, biar API yg handle role
          name: `Sesi ${new Date().toLocaleTimeString('id-ID')}`
        })
      });
      const data = await res.json();
      if (data.game?.id) router.push(`/game/${data.game.id}`);
      else alert("Gagal membuat game: " + (data.error || "Unknown error"));
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
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
            onClick={createGame} 
            disabled={players.length < 5 || creating} 
            className="glass-card px-10 py-5 rounded-[24px] font-black text-lg hover:bg-white/10 transition-all disabled:opacity-20 shadow-2xl flex items-center gap-2"
          >
            {creating ? "MEMPROSES..." : `MULAI RITUAL (${players.length})`}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* SIDEBAR KIRI: MANAGEMENT */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* 1. GAME LIST MANAGER (KOMPONEN BARU) */}
            <div className="glass-card p-6 rounded-[32px] border border-white/10 bg-black/20">
              <h2 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-gray-400">
                <LayoutGrid size={16} className="text-wolf-gold"/> Riwayat Sesi
              </h2>
              {/* Ini dia komponen baru kita */}
              <GameListManager />
            </div>

            {/* 2. PLAYER QUICK ADD */}
            <div className="glass-card p-6 rounded-[32px] border border-white/10">
              <h2 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-gray-400">
                <UserCheck size={16} className="text-green-500"/> Pemain Tersimpan
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
              </div>
            </div>
          </div>

          {/* AREA UTAMA: INPUT PEMAIN */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-card p-8 rounded-[36px] border border-white/10">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Plus size={24} className="text-wolf-gold" /> Tambah Peserta
              </h2>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={nameInput} 
                  onChange={(e) => setNameInput(e.target.value)} 
                  placeholder="Ketik Nickname..." 
                  className="glass-input flex-1 px-6 py-4 rounded-2xl text-lg font-medium bg-black/50 border border-white/10 focus:border-wolf-gold outline-none text-white" 
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer(nameInput)} 
                />
                <button onClick={() => addPlayer(nameInput)} className="bg-white text-black px-8 rounded-2xl font-black hover:bg-gray-200 transition-all flex items-center gap-2">
                  <Plus size={20}/> TAMBAH
                </button>
              </div>
            </div>

            {/* LIST PEMAIN YG AKAN MAIN */}
            <div className="glass-card p-8 rounded-[40px] border border-white/10 min-h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((p, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-wolf-gold/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wolf-gold to-orange-600 flex items-center justify-center font-bold text-black">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-lg">{p.name}</span>
                    </div>
                    <button onClick={() => setPlayers(players.filter((_, idx) => idx !== i))} className="p-2 rounded-full hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-colors">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                ))}
                {players.length === 0 && (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-600 opacity-30">
                    <Users size={64} className="mb-4" />
                    <p className="font-black italic">BELUM ADA PESERTA</p>
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