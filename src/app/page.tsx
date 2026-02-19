"use client";
import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, UserCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GameListManager from '@/components/game/GameListManager';
import ToastNotification from '@/components/game/ToastNotification';

export default function Home() {
  const router = useRouter();
  const [masterPlayers, setMasterPlayers] = useState<any[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => { fetch('/api/players').then(res => res.json()).then(setMasterPlayers); }, []);

  const addPlayer = (name: string): boolean => {
    const clean = name.trim();
    if (!clean) return false;
    if (players.includes(clean)) return false;
    setPlayers([...players, clean]);
    setNameInput("");
    fetch('/api/players', { method: 'POST', body: JSON.stringify({ nickname: clean }) });
    return true;
  };

  const addPlayerFromQuickAdd = (nickname: string) => {
    const added = addPlayer(nickname);
    setToast(added ? { message: 'Pemain ditambahkan', type: 'success' } : { message: 'Pemain sudah ditambahkan', type: 'info' });
    setToastKey((k) => k + 1);
    setToastVisible(true);
  };

  const createGame = async () => {
    if (players.length < 5) return alert("Minimal 5 pemain!");
    setCreating(true);
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          players: players.map(p => ({ nickname: p, roleId: 'villager' }))
        })
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
      
      if (data.id) {
        // Redirect ke halaman pemilihan role terlebih dahulu
        window.scrollTo(0, 0);
        router.push(`/game/${data.id}/roles`);
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
        {/* Sticky header: tombol Mulai Game Baru tetap terlihat saat scroll */}
        <header className="sticky top-0 z-50 -mx-3 -mt-3 px-3 pt-3 sm:-mx-4 sm:-mt-4 sm:px-4 sm:pt-4 md:-mx-8 md:-mt-8 md:px-8 md:pt-8 lg:-mx-12 lg:-mt-12 lg:px-12 lg:pt-12 pb-2 sm:pb-3 bg-night-gradient/95 backdrop-blur-sm mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic break-words">Wolf<span className="text-wolf-blood">Master</span></h1>
          <button onClick={createGame} disabled={creating || players.length < 5} className="glass-card px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 font-black hover:bg-white/10 transition-all text-xs sm:text-sm md:text-base w-full sm:w-auto disabled:opacity-50 shrink-0 flex items-center justify-center gap-2">
            {creating ? <><Loader2 className="animate-spin" size={18} /> MEMPROSES...</> : "MULAI GAME BARU"}
          </button>
        </header>

        {/* Baris 1: Tambah Peserta + Quick Add bersebelahan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-6">
          <div className="glass-card p-4 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[36px] border border-white/10">
            <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 md:mb-6 flex gap-2"><Plus className="text-yellow-500" size={20}/> Tambah Peserta</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPlayer(nameInput)} placeholder="Nama..." className="flex-1 bg-black/50 border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm md:text-base text-white"/>
              <button onClick={() => addPlayer(nameInput)} className="bg-white text-black px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-sm md:text-base w-full sm:w-auto">TAMBAH</button>
            </div>
          </div>
          <div className="glass-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-white/10">
            <h2 className="text-sm sm:text-base font-black mb-3 sm:mb-4 flex items-center gap-2 uppercase tracking-widest text-gray-400"><UserCheck size={16}/> Quick Add</h2>
            <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-5">{masterPlayers.map(mp => <button key={mp.id} onClick={() => addPlayerFromQuickAdd(mp.nickname)} className="px-5 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 text-base sm:text-lg md:text-2xl bg-white/5 rounded-full hover:bg-white/20 min-h-[60px] sm:min-h-[70px] flex items-center justify-center font-semibold">+ {mp.nickname}</button>)}</div>
          </div>
        </div>

        {/* Daftar peserta saat ini */}
        <div className="glass-card p-4 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[40px] border border-white/10 min-h-[120px] sm:min-h-[180px] mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {players.map((p, i) => (
              <div key={i} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/5 rounded-full border border-white/10 flex gap-2 sm:gap-3 items-center">
                <span className="font-bold">{p}</span>
                <button onClick={() => setPlayers(players.filter(n => n !== p))} className="text-red-500 hover:text-white">x</button>
              </div>
            ))}
          </div>
        </div>

        {/* Baris 2: Riwayat Sesi di bawah */}
        <div className="glass-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-white/10">
          <h2 className="text-sm sm:text-base font-black mb-3 sm:mb-4 flex items-center gap-2 uppercase tracking-widest text-gray-400"><LayoutGrid size={16}/> Riwayat Sesi</h2>
          <GameListManager />
        </div>
      </div>

      {toast && (
        <ToastNotification
          key={toastKey}
          message={toast.message}
          type={toast.type}
          isVisible={toastVisible}
          onClose={() => { setToastVisible(false); setToast(null); }}
        />
      )}
    </div>
  );
}