"use client";
import React, { useState, useEffect } from 'react';
import { Users, Plus, LayoutGrid, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GameListManager from '@/components/game/GameListManager'; // [PENTING] Import ini

export default function Home() {
  const router = useRouter();
  const [masterPlayers, setMasterPlayers] = useState<any[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetch('/api/players').then(res => res.json()).then(setMasterPlayers); }, []);

  const addPlayer = (name: string) => {
    const clean = name.trim();
    if (clean && !players.includes(clean)) {
      setPlayers([...players, clean]);
      setNameInput("");
      fetch('/api/players', { method: 'POST', body: JSON.stringify({ nickname: clean }) });
    }
  };

  const createGame = async () => {
    if (players.length < 5) return alert("Minimal 5 pemain!");
    setCreating(true);
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players, name: `Sesi ${new Date().toLocaleTimeString('id-ID')}` })
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error('Gagal membuat game:', error);
        alert(`Error: ${error.error || 'Gagal membuat game'}`);
        setCreating(false);
        return;
      }

      const data = await res.json();
      console.log('Game dibuat:', data);
      
      if (data.success) {
        // Redirect ke halaman role selection
        window.scrollTo(0, 0);
        router.push(`/game/${data.game.id}/roles`);
      } else {
        alert('Gagal membuat game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Terjadi kesalahan saat membuat game');
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8 lg:p-12 text-white bg-night-gradient">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-8 md:mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic break-words">Wolf<span className="text-wolf-blood">Master</span></h1>
          <button onClick={createGame} disabled={creating} className="glass-card px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 font-black hover:bg-white/10 transition-all text-xs sm:text-sm md:text-base w-full sm:w-auto">
            {creating ? "MEMPROSES..." : "MULAI GAME BARU"}
          </button>
        </header>

        <div className="space-y-4 sm:space-y-5 md:space-y-6 mb-6 block md:hidden">
          {/* MOBILE: Quick Add at top */}
          <div className="glass-card p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-white/10">
            <h2 className="text-xs sm:text-sm font-black mb-3 sm:mb-4 flex items-center gap-2 uppercase tracking-widest text-gray-400"><UserCheck size={14}/> Quick Add</h2>
            <div className="flex flex-wrap gap-2">{masterPlayers.map(mp => <button key={mp.id} onClick={() => addPlayer(mp.nickname)} className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-white/5 rounded-full hover:bg-white/20">+ {mp.nickname}</button>)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-10">
          <div className="md:col-span-3 lg:col-span-1 space-y-4 sm:space-y-6 md:space-y-8 order-2 md:order-1">
            {/* KOMPONEN BARU DIPANGGIL DISINI */}
            <div className="glass-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-white/10 hidden md:block">
              <h2 className="text-xs sm:text-sm font-black mb-3 sm:mb-4 flex items-center gap-2 uppercase tracking-widest text-gray-400"><LayoutGrid size={14}/> Riwayat Sesi</h2>
              <GameListManager /> 
            </div>
            
            <div className="glass-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-white/10 hidden md:block">
              <h2 className="text-xs sm:text-sm font-black mb-3 sm:mb-4 flex items-center gap-2 uppercase tracking-widest text-gray-400"><UserCheck size={14}/> Quick Add</h2>
              <div className="flex flex-wrap gap-2">{masterPlayers.map(mp => <button key={mp.id} onClick={() => addPlayer(mp.nickname)} className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-white/5 rounded-full hover:bg-white/20">+ {mp.nickname}</button>)}</div>
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-3 space-y-4 sm:space-y-5 md:space-y-6 order-1 md:order-2">
            <div className="glass-card p-4 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[36px] border border-white/10">
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 md:mb-6 flex gap-2"><Plus className="text-yellow-500" size={20}/> Tambah Peserta</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPlayer(nameInput)} placeholder="Nama..." className="flex-1 bg-black/50 border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm md:text-base text-white"/>
                <button onClick={() => addPlayer(nameInput)} className="bg-white text-black px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-sm md:text-base w-full sm:w-auto">TAMBAH</button>
              </div>
            </div>
            
            <div className="glass-card p-4 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[40px] border border-white/10 min-h-[250px] sm:min-h-[300px]">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {players.map((p, i) => (
                  <div key={i} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/5 rounded-full border border-white/10 flex gap-2 sm:gap-3 items-center">
                    <span className="font-bold">{p}</span>
                    <button onClick={() => setPlayers(players.filter(n => n !== p))} className="text-red-500 hover:text-white">x</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}