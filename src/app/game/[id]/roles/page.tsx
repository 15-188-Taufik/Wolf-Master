"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Minus, Play, Loader2, ChevronRight, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Role {
  id: string;
  name: string;
  alignment: string;
  description: string;
}

interface RoleCount {
  [roleId: string]: number;
}

interface RoleAssignment {
  [roleId: string]: string[]; // Array of player IDs
}

type PageStep = 'selectCounts' | 'assignPlayers';

// Frequent roles ordering
const ROLE_ORDER = ['villager', 'werewolf', 'seer', 'guardian', 'gunner', 'wolfman'];

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
    
    // Separate villager from other roles
    const villagerRole = roles.find(r => r.id === 'villager');
    const otherRoles = roles.filter(r => r.id !== 'villager');
    
    // Sort other roles by ROLE_ORDER
    const sorted = otherRoles.sort((a, b) => {
      const aIdx = ROLE_ORDER.indexOf(a.id);
      const bIdx = ROLE_ORDER.indexOf(b.id);
      
      // If in ROLE_ORDER, sort by position
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      // If only a is in ROLE_ORDER, a comes first
      if (aIdx !== -1) return -1;
      // If only b is in ROLE_ORDER, b comes first
      if (bIdx !== -1) return 1;
      // Otherwise, sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    return sorted;
  }, [roles]);

  // Filter roles by search
  const filteredRoles = useMemo(() => {
    return sortedRoles.filter(role =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedRoles, searchQuery]);

  // Load game data and available roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`[RoleSelection] Fetching game data for ID: ${gameId}`);
        
        // Get game data
        const gameRes = await fetch(`/api/game/${gameId}`);
        if (!gameRes.ok) {
          throw new Error(`Failed to fetch game: ${gameRes.status} ${gameRes.statusText}`);
        }
        const gameData = await gameRes.json();
        console.log('[RoleSelection] Game data:', gameData);
        setGame(gameData);

        // Get roles
        console.log('[RoleSelection] Fetching roles...');
        const rolesRes = await fetch('/api/roles');
        if (!rolesRes.ok) {
          throw new Error(`Failed to fetch roles: ${rolesRes.status} ${rolesRes.statusText}`);
        }
        const rolesData = await rolesRes.json();
        console.log('[RoleSelection] Roles data:', rolesData);
        setRoles(rolesData);

        // Initialize role counts - exclude villager as default
        const initialCounts: RoleCount = {};
        rolesData.forEach((role: Role) => {
          initialCounts[role.id] = 0;
        });
        setRoleCounts(initialCounts);
      } catch (error) {
        console.error('[RoleSelection] Error fetching data:', error);
        alert(`Error loading data: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) fetchData();
  }, [gameId]);

  const addRole = (roleId: string) => {
    const totalRoles = Object.values(roleCounts).reduce((sum, count) => sum + count, 0);
    if (totalRoles < (game?.players?.length || 0)) {
      setRoleCounts(prev => ({
        ...prev,
        [roleId]: (prev[roleId] || 0) + 1
      }));
    }
  };

  const removeRole = (roleId: string) => {
    setRoleCounts(prev => ({
      ...prev,
      [roleId]: Math.max(0, (prev[roleId] || 0) - 1)
    }));
  };

  const handleNextStep = () => {
    // Initialize role assignments for roles with count > 0
    const assignments: RoleAssignment = {};
    Object.entries(roleCounts).forEach(([roleId, count]) => {
      if (count > 0 && roleId !== 'villager') {
        assignments[roleId] = [];
      }
    });
    setRoleAssignments(assignments);
    setCurrentStep('assignPlayers');
  };

  const togglePlayerForRole = (roleId: string, playerId: string) => {
    setRoleAssignments(prev => {
      const current = prev[roleId] || [];
      const isSelected = current.includes(playerId);
      
      // If already selected, allow deselection
      if (isSelected) {
        return {
          ...prev,
          [roleId]: current.filter(id => id !== playerId)
        };
      }
      
      // If trying to select, check if player is already assigned to another role
      const isAssignedToOtherRole = Object.entries(prev).some(
        ([rId, playerIds]) => rId !== roleId && playerIds.includes(playerId)
      );
      
      if (isAssignedToOtherRole) {
        // Prevent assignment to multiple roles
        return prev;
      }
      
      // Allow selection if not assigned elsewhere
      return {
        ...prev,
        [roleId]: [...current, playerId]
      };
    });
  };

  const isRoleAssignmentComplete = () => {
    // Check all roles have correct number of assignments
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
      console.log('Starting game with role assignments:', roleAssignments);
      
      // Assign roles to players
      const response = await fetch(`/api/game/${gameId}/assign-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleAssignments })
      });

      console.log('Assign roles response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Assign roles error:', error);
        alert(`Error (${response.status}): ${error.error || 'Gagal mengassign role'}`);
        setStarting(false);
        return;
      }

      const data = await response.json();
      console.log('Game started successfully:', data);
      
      // Redirect to game dashboard
      router.push(`/game/${gameId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Gagal memulai permainan'}`);
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
    <div className="min-h-screen p-6 md:p-12 text-white bg-night-gradient">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-5xl font-black italic mb-2">
            Wolf<span className="text-wolf-blood">Master</span>
          </h1>
          <p className="text-gray-400">
            {currentStep === 'selectCounts' ? 'Pilih jumlah role' : 'Assign role kepada pemain'}
          </p>
        </header>

        {/* Game Info */}
        <div className="glass-card p-6 rounded-[24px] border border-white/10 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm mb-2">Sesi Game</p>
              <p className="text-2xl font-bold">{game?.name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Pemain</p>
              <p className="text-2xl font-bold">{playerCount}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">
                {currentStep === 'selectCounts' ? 'Slot Tersedia' : 'Step'}
              </p>
              <p className={`text-2xl font-bold ${remainingSlots === 0 ? 'text-green-400' : remainingSlots > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                {currentStep === 'selectCounts' 
                  ? remainingSlots > 0 ? `+${remainingSlots}` : remainingSlots === 0 ? '✓' : '✗'
                  : '2 / 2'
                }
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 'selectCounts' ? (
            /* --- STEP 1: SELECT ROLE COUNTS --- */
            <motion.div
              key="selectCounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Search Bar */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cari role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-[16px] text-white placeholder-gray-500 focus:outline-none focus:border-wolf-gold/50 transition-all"
                />
              </div>

              {/* Role Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredRoles.map((role) => (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-[24px] border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-1">{role.name}</h3>
                      <p className={`text-sm font-semibold ${
                        role.alignment === 'Goodside' ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        {role.alignment}
                      </p>
                    </div>

                    <p className="text-sm text-gray-300 mb-6 line-clamp-2">
                      {role.description}
                    </p>

                    {/* Counter */}
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <button
                        onClick={() => removeRole(role.id)}
                        disabled={!roleCounts[role.id]}
                        className="p-2 hover:bg-white/10 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-xl font-bold w-8 text-center">
                        {roleCounts[role.id] || 0}
                      </span>
                      <button
                        onClick={() => addRole(role.id)}
                        disabled={totalSelected >= playerCount}
                        className="p-2 hover:bg-white/10 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Villager (Default Role) */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-[24px] border border-green-500/30 bg-green-500/5"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-1">Villager</h3>
                    <p className="text-sm font-semibold text-green-400">Default Role</p>
                  </div>

                  <p className="text-sm text-gray-300 mb-6">
                    Pemain yang tidak mendapat role khusus akan menjadi Villager
                  </p>

                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">Auto assign</span>
                    <span className="text-xl font-bold text-green-400">
                      {remainingSlots}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex-1 glass-card px-8 py-4 font-bold hover:bg-white/10 transition-all rounded-[24px]"
                >
                  Kembali
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={totalSelected === 0 || remainingSlots < 0}
                  className={`flex-1 px-8 py-4 font-bold rounded-[24px] transition-all flex items-center justify-center gap-2 ${
                    totalSelected > 0 && remainingSlots >= 0
                      ? 'bg-wolf-gold hover:bg-wolf-gold/80'
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  <ChevronRight size={20} />
                  Lanjut ke Assignment
                </button>
              </div>
            </motion.div>
          ) : (
            /* --- STEP 2: ASSIGN ROLES TO PLAYERS --- */
            <motion.div
              key="assignPlayers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Role Assignment Sections */}
              <div className="space-y-6">
                {Object.entries(roleCounts).map(([roleId, count]) => {
                  if (count === 0 || roleId === 'villager') return null;
                  
                  const role = roles.find(r => r.id === roleId);
                  const assignedPlayers = roleAssignments[roleId] || [];
                  const availablePlayers = game?.players?.filter(
                    (p: any) => !Object.values(roleAssignments).flat().includes(p.id)
                  ) || [];

                  return (
                    <motion.div
                      key={roleId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-6 rounded-[24px] border border-white/10"
                    >
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-2xl font-bold">{role?.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            assignedPlayers.length === count
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {assignedPlayers.length} / {count}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {role?.description}
                        </p>
                      </div>

                      {/* Player Selection Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {game?.players?.map((player: any) => {
                          const isAssigned = assignedPlayers.includes(player.id);
                          const isAssignedToOtherRole = Object.entries(roleAssignments).some(
                            ([rId, playerIds]) => rId !== roleId && playerIds.includes(player.id)
                          );
                          const isDisabled = !isAssigned && (assignedPlayers.length >= count || isAssignedToOtherRole);

                          return (
                            <motion.button
                              key={player.id}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => togglePlayerForRole(roleId, player.id)}
                              disabled={isDisabled}
                              className={`p-4 rounded-[16px] border-2 transition-all text-left font-bold ${
                                isAssigned
                                  ? 'border-wolf-blood bg-wolf-blood/10 text-white'
                                  : isAssignedToOtherRole
                                  ? 'border-gray-600 bg-gray-600/10 text-gray-400 cursor-not-allowed opacity-50'
                                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{player.nickname}</span>
                                {isAssigned && <Check size={20} className="text-wolf-blood" />}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Villager Assignment Info */}
              <div className="glass-card p-6 rounded-[24px] border border-green-500/30 bg-green-500/5">
                <h3 className="text-lg font-bold mb-2">Villager (Otomatis)</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Pemain yang belum terassign ke role khusus akan otomatis menjadi Villager:
                </p>
                <div className="flex flex-wrap gap-2">
                  {game?.players?.map((player: any) => {
                    const isAssigned = Object.values(roleAssignments).flat().includes(player.id);
                    return !isAssigned ? (
                      <div
                        key={player.id}
                        className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full font-bold text-green-400 text-sm"
                      >
                        {player.nickname}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('selectCounts')}
                  className="flex-1 glass-card px-8 py-4 font-bold hover:bg-white/10 transition-all rounded-[24px]"
                >
                  Kembali
                </button>
                <button
                  onClick={handleStartGame}
                  disabled={!isRoleAssignmentComplete() || starting}
                  className={`flex-1 px-8 py-4 font-bold rounded-[24px] transition-all flex items-center justify-center gap-2 ${
                    isRoleAssignmentComplete()
                      ? 'bg-wolf-blood hover:bg-wolf-blood/80'
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  {starting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      Mulai Permainan
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
