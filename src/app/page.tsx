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
    <div className="min-h-screen p-6 md:p-12 text-white bg-night-gradient">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <h1 className="text-5xl font-black italic">Wolf<span className="text-wolf-blood">Master</span></h1>
          <button onClick={createGame} disabled={creating} className="glass-card px-8 py-4 font-black hover:bg-white/10 transition-all">
            {creating ? "MEMPROSES..." : "MULAI GAME BARU"}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1 space-y-8">
            {/* KOMPONEN BARU DIPANGGIL DISINI */}
            <div className="glass-card p-6 rounded-[32px] border border-white/10">
              <h2 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-gray-400"><LayoutGrid size={16}/> Riwayat Sesi</h2>
              <GameListManager /> 
            </div>
            
            <div className="glass-card p-6 rounded-[32px] border border-white/10">
              <h2 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-gray-400"><UserCheck size={16}/> Quick Add</h2>
              <div className="flex flex-wrap gap-2">{masterPlayers.map(mp => <button key={mp.id} onClick={() => addPlayer(mp.nickname)} className="px-3 py-1 bg-white/5 rounded-full text-xs hover:bg-white/20">+ {mp.nickname}</button>)}</div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="glass-card p-8 rounded-[36px] border border-white/10">
              <h2 className="text-xl font-bold mb-6 flex gap-2"><Plus className="text-yellow-500"/> Tambah Peserta</h2>
              <div className="flex gap-4">
                <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPlayer(nameInput)} placeholder="Nama..." className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 text-white"/>
                <button onClick={() => addPlayer(nameInput)} className="bg-white text-black px-6 rounded-2xl font-bold">TAMBAH</button>
              </div>
            </div>
            
            <div className="glass-card p-8 rounded-[40px] border border-white/10 min-h-[300px]">
              <div className="flex flex-wrap gap-3">
                {players.map((p, i) => (
                  <div key={i} className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex gap-3 items-center">
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