"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Moon, Volume2, Check, X, ChevronRight,
  Users, AlertCircle, Target, Clock, SkipForward
} from 'lucide-react';

interface Player {
  id: string;
  nickname: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    nightPriority: number;
  };
  isAlive: boolean;
  parentId?: string | null;
  effects?: string[];
}

interface RoleAction {
  [playerId: string]: string;
}

interface NightPhaseModerationProps {
  game: any;
  onComplete: (payload: { actions: RoleAction; great_shaman_mode?: 'check' | 'transform' }) => void;
  players: Player[];
}

export default function NightPhaseModeration({
  game,
  onComplete,
  players,
}: NightPhaseModerationProps) {
  const [currentRoleIdx, setCurrentRoleIdx] = useState(0);
  const [actions, setActions] = useState<RoleAction>({});
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [huntingConfirmed, setHuntingConfirmed] = useState(false);
  const [greatShamanMode, setGreatShamanMode] = useState<'check' | 'transform' | null>(null);

  const currentTurn = game?.currentTurn ?? 1;
  const deadPlayers = players.filter(p => !p.isAlive);

  // Get unique roles with night actions, sorted by priority
  // Orphan hanya malam pertama; Great Shaman hanya jika ada mayat
  const nightRoles = React.useMemo(() => {
    const uniqueRoles = new Map();
    const hasWerewolf = players.some(p => p.isAlive && p.role.id === 'werewolf');
    const hasWolfman = players.some(p => p.isAlive && p.role.id === 'wolfman');

    players
      .filter(p => p.isAlive && p.role.nightPriority < 99)
      .forEach(p => {
        if (p.role.id === 'wolfman' && hasWerewolf) return;
        if (p.role.id === 'orphan' && currentTurn > 1) return; // Orphan hanya hari pertama
        if (p.role.id === 'great_shaman' && deadPlayers.length === 0) return; // Great Shaman hanya jika ada mayat
        if (!uniqueRoles.has(p.role.id)) uniqueRoles.set(p.role.id, p.role);
      });

    return Array.from(uniqueRoles.values()).sort(
      (a: any, b: any) => a.nightPriority - b.nightPriority
    );
  }, [players, currentTurn, deadPlayers.length]);

  const currentRole = nightRoles[currentRoleIdx];
  
  // Get all players with current role (werewolf + wolfman combined)
  let playersWithRole = players.filter(p => p.isAlive && p.role.id === currentRole?.id);
  
  // If current role is werewolf and hunting hasn't been processed, include wolfman too
  if (currentRole?.id === 'werewolf' && !huntingConfirmed) {
    const wolfmanPlayers = players.filter(p => p.isAlive && p.role.id === 'wolfman');
    playersWithRole = [...playersWithRole, ...wolfmanPlayers];
  }

  const currentActor = playersWithRole[0]; // Get first player with this role

  // Debug logging
  React.useEffect(() => {
    if (currentRole) {
      console.log(`👁️ [NIGHT] Current role: ${currentRole.id}, Actor: ${currentActor?.nickname} (${currentActor?.id}), Priority: ${currentRole.nightPriority}`);
    }
  }, [currentRole, currentActor]);

  // Filter available targets based on role
  // Great Shaman memilih mayat; Orphan memilih pemain hidup (bapak); lainnya pemain hidup
  const canTargetSelf = currentRole?.id === 'guardian' || currentRole?.id === 'doctor';
  const availableTargets = currentRole?.id === 'great_shaman'
    ? deadPlayers
    : players
        .filter(p => p.isAlive && (canTargetSelf || p.role.id !== currentRole?.id))
        .filter(p => {
          const wolfRoles = ['werewolf', 'wolfman', 'lone_wolf'];
          if (wolfRoles.includes(currentRole?.id || '')) return !wolfRoles.includes(p.roleId);
          return true;
        });

  React.useEffect(() => {
    console.log(`🌙 [NightPhaseModeration] Component mounted. Night roles: ${nightRoles.map(r => r.id).join(', ')}`);
  }, [nightRoles]);

  const handleSelectTarget = (playerId: string) => {
    const isSelected = selectedTarget === playerId;
    const targetName = players.find(p => p.id === playerId)?.nickname;
    console.log(`🎯 [SELECT TARGET] ${isSelected ? 'Deselecting' : 'Selecting'}: ${targetName} (${playerId})`);
    setSelectedTarget(selectedTarget === playerId ? null : playerId);
  };

  const handleConfirmRole = () => {
    console.log(`✅ [CONFIRM] Role: ${currentRole?.id}, Target: ${selectedTarget}, Actor: ${currentActor?.id}`);
    
    if (currentRole?.id === 'werewolf') {
      // Store action for the hunt (applies to both werewolf and wolfman)
      if (selectedTarget) {
        console.log(`🐺 [WEREWOLF] Setting hunt target: ${selectedTarget}`);
        setActions(prev => {
          const newActions = {
            ...prev,
            werewolf_hunt: selectedTarget,
          };
          console.log(`🐺 [WEREWOLF] Actions after update:`, newActions);
          return newActions;
        });
      }
      setHuntingConfirmed(true);
      setSelectedTarget(null);
      
      // Move to next role
      if (currentRoleIdx < nightRoles.length - 1) {
        setCurrentRoleIdx(currentRoleIdx + 1);
      }
    } else if (currentRole?.id === 'gunner') {
      // For gunner, store action with gunner player ID
      if (selectedTarget && currentActor) {
        console.log(`🔫 [GUNNER] Confirm: Gunner ${currentActor.id} (${currentActor.nickname}) → Target ${selectedTarget} (${players.find(p => p.id === selectedTarget)?.nickname})`);
        setActions(prev => {
          const newActions = {
            ...prev,
            [currentActor.id]: selectedTarget,
          };
          console.log(`🔫 [GUNNER] Actions after confirm:`, newActions);
          return newActions;
        });
      } else {
        console.log(`⚠️ [GUNNER] Missing data - selectedTarget: ${selectedTarget}, currentActor: ${currentActor?.id}`);
      }
      
      // Move to next role
      if (currentRoleIdx < nightRoles.length - 1) {
        console.log(`➡️ [GUNNER] Moving to next role (${currentRoleIdx} → ${currentRoleIdx + 1})`);
        setCurrentRoleIdx(currentRoleIdx + 1);
        setSelectedTarget(null);
      }
    } else if (currentRole?.id === 'great_shaman' && currentActor && selectedTarget && greatShamanMode) {
      setActions(prev => ({ ...prev, [currentActor.id]: selectedTarget }));
      if (currentRoleIdx < nightRoles.length - 1) {
        setCurrentRoleIdx(currentRoleIdx + 1);
        setSelectedTarget(null);
        setGreatShamanMode(null);
      }
    } else if (currentActor && selectedTarget) {
      console.log(`🎯 [OTHER] Storing action for ${currentActor.id} → ${selectedTarget}`);
      setActions(prev => ({ ...prev, [currentActor.id]: selectedTarget }));
      if (currentRoleIdx < nightRoles.length - 1) {
        setCurrentRoleIdx(currentRoleIdx + 1);
        setSelectedTarget(null);
      }
    } else {
      console.log(`⚠️ [CONFIRM] No action taken - all conditions failed`);
    }
  };

  const handleSkipRole = () => {
    if (currentRole?.id === 'werewolf') {
      setHuntingConfirmed(true);
    }
    // Move to next role without action
    if (currentRoleIdx < nightRoles.length - 1) {
      setCurrentRoleIdx(currentRoleIdx + 1);
      setSelectedTarget(null);
    } else if (currentRoleIdx === nightRoles.length - 1) {
      // For last role, allow skip and clear selected target
      setSelectedTarget(null);
    }
  };

  const handleFinish = () => {
    onComplete({ actions, great_shaman_mode: greatShamanMode ?? undefined });
  };

  const isLastRole = currentRoleIdx === nightRoles.length - 1;
  const progress = nightRoles.length ? ((currentRoleIdx + 1) / nightRoles.length) * 100 : 0;
  const isGreatShamanReady = currentRole?.id === 'great_shaman' ? (!!selectedTarget && !!greatShamanMode) : !!selectedTarget;

  if (!currentRole) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Tidak ada role dengan aksi malam</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Progress Bar */}
      <div className="glass-card p-6 rounded-[24px] border border-white/10 text-center">
        <div className="flex flex-col items-center justify-center mb-4">
          <h2 className="text-lg font-bold flex items-center justify-center gap-2">
            <Moon size={20} className="text-wolf-gold" />
            Ritual Malam: {currentRoleIdx + 1} / {nightRoles.length}
          </h2>
          <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-wolf-gold to-wolf-blood"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Current Role Section */}
      <motion.div
        key={currentRole.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[32px] border-2 border-wolf-gold/30 bg-gradient-to-br from-wolf-gold/5 to-transparent"
      >
        <div className="mb-4 sm:mb-6 md:mb-8 text-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mb-2 text-wolf-gold italic">
            {currentRole?.id === 'werewolf' ? 'BERBURU MALAM' : currentRole?.name}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-400">
            {currentRole?.id === 'werewolf' 
              ? `Werewolf & Wolfman - Pilih 1 target`
              : playersWithRole.length > 1
              ? `${playersWithRole.length} pemain dengan role ini`
              : '1 pemain dengan role ini'}
          </p>
        </div>

        {/* Players with this role */}
        {playersWithRole.length > 0 && (
          <div className="mb-4 sm:mb-6 md:mb-8 text-center">
            <p className="text-base sm:text-lg md:text-xl font-bold text-gray-400 mb-3 text-center">PEMAIN DENGAN ROLE INI:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {playersWithRole.map(p => (
                <div
                  key={p.id}
                  className="px-4 py-2 bg-wolf-gold/10 border border-wolf-gold/50 rounded-full font-bold text-wolf-gold flex items-center gap-2 text-center text-sm sm:text-base"
                >
                  <Users size={16} />
                  {p.nickname}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-[20px] p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 text-center">
          <div className="flex flex-col items-center gap-3 mb-4">
            <AlertCircle className="text-wolf-gold flex-shrink-0" size={24} />
            <div className="text-center">
              <p className="font-bold mb-2 text-center text-base sm:text-lg">Instruksi:</p>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 text-center">
                {currentRole?.id === 'werewolf' 
                  ? 'WEREWOLF & WOLFMAN BUKA MATA! Silakan pilih 1 target pemain untuk diburu. Atau lewati jika ingin tidak memburu.'
                  : currentRole?.id === 'gunner'
                  ? 'GUNNER BUKA MATA! Silakan pilih 1 target pemain untuk ditambak. Atau lewati jika ingin tidak menembak.'
                  : currentRole?.id === 'orphan'
                  ? 'ORPHAN BUKA MATA! Pilih 1 pemain sebagai bapak. Jika bapak mati nanti, Orphan berubah jadi Werewolf.'
                  : currentRole?.id === 'great_shaman'
                  ? 'GREAT SHAMAN BUKA MATA! Pilih 1 mayat, lalu pilih: Cek role mayat ATAU Berubah jadi role mayat (sekali saja).'
                  : `${currentRole?.name} BUKA MATA! Silakan pilih 1 target pemain untuk aksi malam.`}
              </p>
            </div>
          </div>
        </div>

        {/* Target Selection Grid */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <p className="text-sm sm:text-base font-bold text-gray-400 mb-3 flex items-center justify-center gap-2 text-center">
            <Target size={18} />
            PILIH TARGET:
          </p>
          {currentRole?.id === 'great_shaman' && (
            <div className="flex gap-3 justify-center mb-4">
              <button
                type="button"
                onClick={() => setGreatShamanMode('check')}
                className={`px-4 py-2 rounded-xl font-bold border-2 transition-all ${greatShamanMode === 'check' ? 'border-wolf-gold bg-wolf-gold/20 text-wolf-gold' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                Cek role mayat
              </button>
              <button
                type="button"
                onClick={() => setGreatShamanMode('transform')}
                className={`px-4 py-2 rounded-xl font-bold border-2 transition-all ${greatShamanMode === 'transform' ? 'border-wolf-gold bg-wolf-gold/20 text-wolf-gold' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                Berubah jadi role mayat
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {availableTargets.map(target => (
              <motion.button
                key={target.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectTarget(target.id)}
                className={`p-3 sm:p-4 md:p-5 rounded-xl md:rounded-[16px] border-2 transition-all text-center font-bold text-sm sm:text-base ${
                  selectedTarget === target.id
                    ? 'border-wolf-blood bg-wolf-blood/10 text-wolf-blood'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{target.nickname}</span>
                  {selectedTarget === target.id && (
                    <Check size={22} className="text-wolf-blood" />
                  )}
                </div>
                <p className="text-sm sm:text-base md:text-lg text-gray-400 mt-1 text-center">
                  {target.role?.name ?? '-'}{!target.isAlive ? ' (mayat)' : ''}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSkipRole}
            className="flex-1 px-6 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-[16px] font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-center text-base sm:text-lg md:text-xl"
          >
            <SkipForward size={20} />
            {currentRole?.id === 'werewolf' || currentRole?.id === 'gunner' ? 'Tidak ' + (currentRole?.id === 'werewolf' ? 'Berburu' : 'Menembak') : 'Lewati'}
          </button>

          <button
            onClick={() => {
              window.scrollTo(0, 0);
              console.log(`📌 [BUTTON CLICK] isLastRole: ${isLastRole}, selectedTarget: ${selectedTarget}, currentRole: ${currentRole?.id}`);
              if (isLastRole) {
                console.log(`📌 [BUTTON CLICK] Calling handleFinish`);
                handleFinish();
              } else {
                console.log(`📌 [BUTTON CLICK] Calling handleConfirmRole`);
                handleConfirmRole();
              }
            }}
            disabled={!isGreatShamanReady}
            className={`flex-1 px-6 py-3 sm:py-4 rounded-[16px] font-bold transition-all flex items-center justify-center gap-2 text-center text-base sm:text-lg md:text-xl ${
              selectedTarget
                ? 'bg-wolf-blood hover:bg-wolf-blood/80'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={20} />
            {isLastRole ? 'Waktunya Pagi' : 'Lanjut'}
          </button>
        </div>
      </motion.div>

      {/* Sound cue reminder */}
      <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
        <Volume2 size={14} />
        Pastikan pemain menutup mata saat role lain sedang mengambil aksi
      </div>
    </motion.div>
  );
}
