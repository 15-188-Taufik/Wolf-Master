"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Trash2, Edit2, Calendar, 
  Users, X, Check, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameSummary {
  id: string;
  name: string | null;
  createdAt: string;
  status: string;
  _count?: {
    players: number;
  };
}

export default function GameListManager() {
  const router = useRouter();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // States untuk Edit/Hapus
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      setGames(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGames(); }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/game/${deletingId}`, { method: 'DELETE' });
      setGames(games.filter(g => g.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      alert("Gagal menghapus game");
    }
  };

  const handleRename = async () => {
    if (!editingId || !newName.trim()) return;
    try {
      await fetch(`/api/game/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      setGames(games.map(g => g.id === editingId ? { ...g, name: newName } : g));
      setEditingId(null);
      setNewName("");
    } catch (err) {
      alert("Gagal mengubah nama");
    }
  };

  if (loading) return <div className="p-4 text-center text-xs text-white/50 animate-pulse">Memuat riwayat...</div>;

  return (
    <div className="w-full space-y-3">
      {games.length === 0 ? (
        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] text-center text-gray-500 text-xs">
          Belum ada riwayat permainan.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence>
            {games.map((game) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="group relative flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] transition-all"
              >
                {/* INFO GAME */}
                <div className="flex-1 min-w-0 pr-2">
                  {editingId === game.id ? (
                    <div className="flex items-center gap-1 animate-in fade-in">
                      <input
                        autoFocus
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-black/50 border border-blue-500/50 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                      />
                      <button onClick={handleRename} className="p-1 bg-blue-600 rounded hover:bg-blue-500"><Check size={12}/></button>
                      <button onClick={() => setEditingId(null)} className="p-1 bg-white/10 rounded hover:bg-white/20"><X size={12}/></button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-bold text-gray-200 truncate cursor-pointer" onClick={() => router.push(`/game/${game.id}`)}>
                        {game.name || `Sesi ${game.id.slice(0, 8)}...`}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 font-mono">
                        <span className="flex items-center gap-1"><Calendar size={8} /> {new Date(game.createdAt).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</span>
                        <span className="flex items-center gap-1"><Users size={8} /> {game._count?.players || 0}</span>
                        <span className={`px-1.5 rounded-[3px] ${game.status === 'FINISHED' ? 'bg-green-900/30 text-green-500' : 'bg-yellow-900/30 text-yellow-500'}`}>{game.status}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* TOMBOL AKSI */}
                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => router.push(`/game/${game.id}`)} className="p-2 rounded-lg bg-white/10 hover:bg-white hover:text-black transition-colors" title="Lanjutkan">
                    <Play size={12} fill="currentColor" />
                  </button>
                  <button onClick={() => { setEditingId(game.id); setNewName(game.name || ""); }} className="p-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-colors">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => setDeletingId(game.id)} className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-2 text-center">Hapus Sesi Ini?</h3>
              <p className="text-xs text-gray-400 text-center mb-6">Data tidak bisa dikembalikan setelah dihapus.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeletingId(null)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm">Batal</button>
                <button onClick={handleDelete} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}