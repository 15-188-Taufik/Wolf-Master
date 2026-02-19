"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Minus, Play, Loader2, ChevronRight, Check, Search, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Role {
  id: string;
  name: string;
  alignment: string;
  description: string;
  nightPriority?: number;
}

interface RoleCount {
  [roleId: string]: number;
}

interface RoleAssignment {
  [roleId: string]: string[]; // Array of player IDs
}

type PageStep = 'selectCounts' | 'assignPlayers';

// --- URUTAN ROLE (PRIORITAS) ---
const ROLE_ORDER = [
  'werewolf',
  'wolfman',
  'seer',
  'guardian',
  'gunner',
  'doctor',
  'lycan',
  'orphan',
  'great_shaman',
  'ghost',
  'harlot',
  'disease',
  'psycopath',
  'lover'
];

export default function RoleSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id as string;

  const [roles, setRoles] = useState<Role[]>([]);
  const [game, setGame] = useState<any>(null);
  const [roleCounts, setRoleCounts] = useState<RoleCount>({});
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [currentStep, setCurrentStep] = useState<PageStep>('selectCounts');
  const [searchQuery, setSearchQuery] = useState('');

  // Sort and filter roles
  const sortedRoles = useMemo(() => {
    if (!roles.length) return [];
    const otherRoles = roles.filter(r => r.id !== 'villager');
    
    const sorted = otherRoles.sort((a, b) => {
      const aIdx = ROLE_ORDER.indexOf(a.id);
      const bIdx = ROLE_ORDER.indexOf(b.id);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return sorted;
  }, [roles]);

  const filteredRoles = useMemo(() => {
    return sortedRoles.filter(role =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedRoles, searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gameRes, rolesRes] = await Promise.all([
          fetch(`/api/game/${gameId}`),
          fetch('/api/roles')
        ]);

        if (!gameRes.ok || !rolesRes.ok) throw new Error("Failed to fetch data");

        const gameData = await gameRes.json();
        const rolesData = await rolesRes.json();

        setGame(gameData);
        setRoles(rolesData);

        const initialCounts: RoleCount = {};
        rolesData.forEach((role: Role) => {
          initialCounts[role.id] = 0;
        });
        setRoleCounts(initialCounts);
      } catch (error) {
        console.error(error);
        alert("Gagal memuat data game.");
      } finally {
        setLoading(false);
      }
    };

    if (gameId) fetchData();
  }, [gameId]);

  const addRole = (roleId: string) => {
    const totalRoles = Object.values(roleCounts).reduce((sum, count) => sum + count, 0);
    if (totalRoles < (game?.players?.length || 0)) {
      setRoleCounts(prev => ({ ...prev, [roleId]: (prev[roleId] || 0) + 1 }));
    }
  };

  const removeRole = (roleId: string) => {
    setRoleCounts(prev => ({ ...prev, [roleId]: Math.max(0, (prev[roleId] || 0) - 1) }));
  };

  const handleNextStep = () => {
    const assignments: RoleAssignment = {};
    Object.entries(roleCounts).forEach(([roleId, count]) => {
      if (count > 0 && roleId !== 'villager') {
        assignments[roleId] = [];
      }
    });
    setRoleAssignments(assignments);
    setCurrentStep('assignPlayers');
  };

  const getSortedRoleEntries = (roleCountsObj: RoleCount) => {
    return Object.entries(roleCountsObj)
      .filter(([roleId, count]) => count > 0 && roleId !== 'villager')
      .sort((a, b) => {
        const roleA = roles.find(r => r.id === a[0]);
        const roleB = roles.find(r => r.id === b[0]);
        const priorityA = roleA?.nightPriority ?? 99;
        const priorityB = roleB?.nightPriority ?? 99;
        return priorityA - priorityB;
      });
  };

  const togglePlayerForRole = (roleId: string, playerId: string) => {
    setRoleAssignments(prev => {
      const current = prev[roleId] || [];
      const isSelected = current.includes(playerId);
      
      if (isSelected) {
        return { ...prev, [roleId]: current.filter(id => id !== playerId) };
      }
      
      const isAssignedToOtherRole = Object.entries(prev).some(
        ([rId, playerIds]) => rId !== roleId && playerIds.includes(playerId)
      );
      
      if (isAssignedToOtherRole) return prev;
      
      return { ...prev, [roleId]: [...current, playerId] };
    });
  };

  const isRoleAssignmentComplete = () => {
    for (const [roleId, count] of Object.entries(roleCounts)) {
      if (count > 0 && roleId !== 'villager') {
        const assigned = roleAssignments[roleId]?.length || 0;
        if (assigned !== count) return false;
      }
    }
    return true;
  };

  const handleStartGame = async () => {
    setStarting(true);
    try {
      const response = await fetch(`/api/game/${gameId}/assign-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleAssignments })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error || 'Gagal mengassign role'}`);
        setStarting(false);
        return;
      }

      window.scrollTo(0, 0);
      router.push(`/game/${gameId}`);
    } catch (error) {
      alert("Terjadi kesalahan koneksi");
      setStarting(false);
    }
  };

  const totalSelected = Object.values(roleCounts).reduce((sum, count) => sum + count, 0);
  const playerCount = game?.players?.length || 0;
  const remainingSlots = playerCount - totalSelected;

  if (loading) {
    return (
      <div className="min-h-screen bg-night-gradient flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-12 text-white bg-night-gradient pb-32">
      <div className="max-w-6xl mx-auto">
        
        {/* --- HEADER STICKY --- */}
        <header className="sticky top-2 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl p-3 md:p-4 rounded-2xl border border-white/10 shadow-2xl flex justify-between items-center mb-6 transition-all">
           <div>
              <h1 className="text-lg md:text-3xl font-black italic">
                 {currentStep === 'selectCounts' ? 'Pilih Role' : 'Assign Player'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] md:text-xs text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                   Pemain: <strong className="text-white">{playerCount}</strong>
                 </span>
                 <span className={`text-[10px] md:text-xs font-mono px-2 py-0.5 rounded border ${remainingSlots === 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                   Sisa Slot: <strong>{remainingSlots}</strong>
                 </span>
              </div>
           </div>

           <div className="flex gap-3">
             {currentStep === 'assignPlayers' && (
                <button 
                  onClick={() => setCurrentStep('selectCounts')}
                  className="h-10 w-10 md:h-12 md:w-auto md:px-5 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/5"
                >
                   <ArrowLeft size={20} />
                </button>
             )}
             
             {currentStep === 'selectCounts' ? (
                /* --- TOMBOL LANJUT YANG LEBIH MENCOROK --- */
                <button 
                   onClick={handleNextStep}
                   disabled={totalSelected === 0 || remainingSlots < 0}
                   className={`h-10 md:h-12 px-5 md:px-8 rounded-xl font-black text-xs md:text-base flex items-center gap-2 transition-all duration-300 shadow-xl ${
                      totalSelected > 0 && remainingSlots >= 0
                      ? 'bg-gradient-to-r from-wolf-gold to-yellow-400 text-black shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] hover:scale-105 active:scale-95' 
                      : 'bg-white/10 text-gray-500 cursor-not-allowed opacity-50 border border-white/5'
                   }`}
                >
                   LANJUT <ChevronRight size={18} className="md:w-5 md:h-5 stroke-[3]"/>
                </button>
             ) : (
                <button 
                   onClick={handleStartGame}
                   disabled={!isRoleAssignmentComplete() || starting}
                   className={`h-10 md:h-12 px-5 md:px-8 rounded-xl font-black text-xs md:text-base flex items-center gap-2 transition-all duration-300 shadow-xl ${
                      isRoleAssignmentComplete()
                      ? 'bg-gradient-to-r from-red-600 to-wolf-blood text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:scale-105 active:scale-95' 
                      : 'bg-white/10 text-gray-500 cursor-not-allowed opacity-50 border border-white/5'
                   }`}
                >
                   {starting ? <Loader2 className="animate-spin" size={18}/> : <Play size={18} fill="currentColor"/>}
                   MULAI GAME
                </button>
             )}
           </div>
        </header>

        <AnimatePresence mode="wait">
          {currentStep === 'selectCounts' ? (
            /* --- STEP 1: SELECT ROLE COUNTS --- */
            <motion.div
              key="selectCounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col"
            >
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm md:text-base bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-wolf-gold/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 mb-8">
                {filteredRoles.map((role) => (
                  <motion.div
                    key={role.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`glass-card p-3 md:p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[130px] md:min-h-[150px] ${
                        roleCounts[role.id] > 0 
                        ? 'bg-white/10 border-wolf-gold/40 shadow-[0_0_15px_rgba(255,215,0,0.05)]' 
                        : 'bg-[#1a1a1a]/40 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <h3 className={`text-sm md:text-xl font-bold leading-tight mb-2 ${roleCounts[role.id] > 0 ? 'text-white' : 'text-gray-300'}`}>
                         {role.name}
                      </h3>
                      
                      <span className={`text-[9px] md:text-xs px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        role.alignment === 'Goodside' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        role.alignment === 'Badside' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {role.alignment}
                      </span>

                      <p className="text-[10px] md:text-xs text-gray-400 mt-2 line-clamp-2 md:line-clamp-3 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    <div className={`flex items-center justify-between rounded-lg p-1 mt-3 transition-colors ${roleCounts[role.id] > 0 ? 'bg-black/40 border border-wolf-gold/30' : 'bg-white/5 border border-white/5'}`}>
                      <button
                        onClick={() => removeRole(role.id)}
                        disabled={!roleCounts[role.id]}
                        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={14} className="md:w-5 md:h-5" />
                      </button>
                      <span className={`text-lg md:text-2xl font-bold w-6 text-center ${roleCounts[role.id] > 0 ? 'text-wolf-gold' : 'text-gray-500'}`}>
                        {roleCounts[role.id] || 0}
                      </span>
                      <button
                        onClick={() => addRole(role.id)}
                        disabled={totalSelected >= playerCount}
                        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus size={14} className="md:w-5 md:h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-3 md:p-5 rounded-xl border border-green-500/30 bg-green-500/5 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-sm md:text-xl font-bold text-green-400 mb-1">Villager</h3>
                    <span className="text-[9px] md:text-xs px-1.5 py-0.5 rounded border border-green-500/20 text-green-400 bg-green-500/10 uppercase tracking-wider">
                       DEFAULT
                    </span>
                    <p className="text-[10px] md:text-xs text-gray-300 mt-2 leading-relaxed">
                      Sisa pemain otomatis menjadi Villager.
                    </p>
                  </div>

                  <div className="flex items-center justify-center bg-black/20 rounded-lg p-2 mt-3 border border-green-500/20">
                    <span className="text-[10px] md:text-xs text-gray-400 mr-2">Auto:</span>
                    <span className="text-lg md:text-2xl font-bold text-green-400">
                      {remainingSlots}
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            /* --- STEP 2: ASSIGN PLAYERS --- */
            <motion.div
              key="assignPlayers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col space-y-4"
            >
              {getSortedRoleEntries(roleCounts).map(([roleId, count]) => {
                const role = roles.find(r => r.id === roleId);
                const assignedPlayers = roleAssignments[roleId] || [];
                
                return (
                  <motion.div
                    key={roleId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 md:p-6 rounded-xl border border-white/10"
                  >
                    <div className="flex justify-between items-center mb-4">
                       <div>
                          <h3 className="text-xl md:text-2xl font-bold">{role?.name}</h3>
                          <p className="text-xs text-gray-400 line-clamp-1">{role?.description}</p>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          assignedPlayers.length === count ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                       }`}>
                          {assignedPlayers.length}/{count}
                       </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                      {game?.players?.map((player: any) => {
                         const isAssigned = assignedPlayers.includes(player.id);
                         const isAssignedToOther = Object.entries(roleAssignments).some(
                           ([rId, pIds]) => rId !== roleId && pIds.includes(player.id)
                         );
                         const isDisabled = !isAssigned && (assignedPlayers.length >= count || isAssignedToOther);

                         return (
                           <button
                             key={player.id}
                             onClick={() => togglePlayerForRole(roleId, player.id)}
                             disabled={isDisabled}
                             className={`p-3 rounded-lg border text-sm font-bold transition-all relative overflow-hidden ${
                                isAssigned 
                                ? 'bg-wolf-blood text-white border-wolf-blood shadow-lg' 
                                : isAssignedToOther
                                ? 'bg-white/5 text-gray-600 border-transparent opacity-30 cursor-not-allowed'
                                : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:bg-white/10'
                             }`}
                           >
                              {player.nickname}
                              {isAssigned && <Check size={16} className="absolute top-1 right-1 text-white/80"/>}
                           </button>
                         )
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}