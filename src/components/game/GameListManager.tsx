"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Trash2, Edit2, Calendar, Users, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameListManager() {
  const router = useRouter();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      setGames(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchGames(); }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    await fetch(`/api/game/${deletingId}`, { method: 'DELETE' });
    setGames(games.filter(g => g.id !== deletingId));
    setDeletingId(null);
  };

  const handleRename = async () => {
    if (!editingId || !newName.trim()) return;
    await fetch(`/api/game/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    setGames(games.map(g => g.id === editingId ? { ...g, name: newName } : g));
    setEditingId(null);
  };

  if (loading) return <div className="text-center text-xs text-gray-500 animate-pulse">Memuat...</div>;

  return (
    <div className="w-full space-y-3">
      {games.length === 0 ? <p className="text-center text-xs text-gray-500">Belum ada sesi.</p> : (
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence>
            {games.map((game) => (
              <motion.div key={game.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07]">
                <div className="flex-1 pr-2">
                  {editingId === game.id ? (
                    <div className="flex gap-1">
                      <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-black/50 border border-blue-500 rounded px-2 py-1 text-xs w-full text-white"/>
                      <button onClick={handleRename} className="p-1 bg-blue-600 rounded"><Check size={12}/></button>
                      <button onClick={() => setEditingId(null)} className="p-1 bg-white/10 rounded"><X size={12}/></button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-bold text-gray-200 cursor-pointer" onClick={() => router.push(`/game/${game.id}`)}>{game.name || `Sesi ${game.createdAt.substring(0,10)}`}</h3>
                      <p className="text-[10px] text-gray-500">{game._count?.players || 0} Pemain • {game.status}</p>
                    </>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => router.push(`/game/${game.id}`)} className="p-2 bg-white/10 rounded hover:bg-white hover:text-black"><Play size={12}/></button>
                  <button onClick={() => { setEditingId(game.id); setNewName(game.name || ""); }} className="p-2 hover:text-blue-400"><Edit2 size={12}/></button>
                  <button onClick={() => setDeletingId(game.id)} className="p-2 hover:text-red-400"><Trash2 size={12}/></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 text-center">
            <h3 className="text-white font-bold mb-4">Hapus Permanen?</h3>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 rounded bg-white/10 text-white text-xs">Batal</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded bg-red-600 text-white text-xs font-bold">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}