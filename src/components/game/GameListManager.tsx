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

  if (loading) return <div className="text-center text-xs sm:text-sm text-gray-500 animate-pulse">Memuat...</div>;

  return (
    <div className="w-full space-y-3">
      {games.length === 0 ? <p className="text-center text-xs sm:text-sm text-gray-500">Belum ada sesi.</p> : (
        <div className="flex flex-col gap-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence>
            {games.map((game) => (
              <motion.div key={game.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] gap-3 sm:gap-0">
                <div className="flex-1 pr-0 sm:pr-2 w-full sm:w-auto">
                  {editingId === game.id ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-black/50 border border-blue-500 rounded px-3 py-2 text-sm w-full sm:w-auto text-white"/>
                      <div className="flex gap-2">
                        <button onClick={handleRename} className="p-2 sm:p-2 bg-blue-600 rounded flex-1 sm:flex-none min-h-[40px] flex items-center justify-center"><Check size={16}/></button>
                        <button onClick={() => setEditingId(null)} className="p-2 sm:p-2 bg-white/10 rounded flex-1 sm:flex-none min-h-[40px] flex items-center justify-center"><X size={16}/></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm sm:text-base font-bold text-gray-200 cursor-pointer truncate" onClick={() => router.push(`/game/${game.id}`)}>{game.name || `Sesi ${game.createdAt.substring(0,10)}`}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{game._count?.players || 0} Pemain • {game.status}</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:sm:opacity-100 transition-opacity w-full sm:w-auto">
                  <button onClick={() => router.push(`/game/${game.id}`)} className="p-2 sm:p-2 bg-white/10 rounded hover:bg-white hover:text-black flex-1 sm:flex-none min-h-[40px] flex items-center justify-center"><Play size={16}/></button>
                  <button onClick={() => { setEditingId(game.id); setNewName(game.name || ""); }} className="p-2 sm:p-2 hover:text-blue-400 flex-1 sm:flex-none min-h-[40px] flex items-center justify-center"><Edit2 size={16}/></button>
                  <button onClick={() => setDeletingId(game.id)} className="p-2 sm:p-2 hover:text-red-400 flex-1 sm:flex-none min-h-[40px] flex items-center justify-center"><Trash2 size={16}/></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center w-full max-w-xs">
            <h3 className="text-white font-bold mb-4 text-base sm:text-lg">Hapus Permanen?</h3>
            <div className="flex gap-3 sm:gap-4 justify-center">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 sm:px-6 py-3 rounded bg-white/10 text-white text-sm sm:text-base min-h-[44px] flex items-center justify-center">Batal</button>
              <button onClick={handleDelete} className="flex-1 px-4 sm:px-6 py-3 rounded bg-red-600 text-white text-sm sm:text-base font-bold min-h-[44px] flex items-center justify-center">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}