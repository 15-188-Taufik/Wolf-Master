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
}

interface RoleAction {
  [playerId: string]: string; // Map actor player id to target player id
}

interface NightPhaseModerationProps {
  game: any;
  onComplete: (actions: RoleAction) => void;
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

  // Get unique roles with night actions, sorted by priority
  const nightRoles = React.useMemo(() => {
    const uniqueRoles = new Map();
    
    players
      .filter(p => p.isAlive && p.role.nightPriority < 99)
      .forEach(p => {
        if (!uniqueRoles.has(p.role.id)) {
          uniqueRoles.set(p.role.id, p.role);
        }
      });

    return Array.from(uniqueRoles.values()).sort(
      (a: any, b: any) => a.nightPriority - b.nightPriority
    );
  }, [players]);

  const currentRole = nightRoles[currentRoleIdx];
  const playersWithRole = players.filter(
    p => p.isAlive && p.role.id === currentRole?.id
  );
  const currentActor = playersWithRole[0]; // Get first player with this role

  // Filter available targets based on role
  const availableTargets = players.filter(
    p => p.isAlive && p.role.id !== currentRole?.id
  ).filter(p => {
    // Werewolf, Wolfman, and Lone Wolf cannot prey on each other
    const wolfRoles = ['werewolf', 'wolfman', 'lone_wolf'];
    if (wolfRoles.includes(currentRole?.id || '')) {
      return !wolfRoles.includes(p.roleId);
    }
    return true;
  });

  const handleSelectTarget = (playerId: string) => {
    setSelectedTarget(selectedTarget === playerId ? null : playerId);
  };

  const handleConfirmRole = () => {
    if (currentActor && selectedTarget) {
      // Store action for this specific actor
      setActions(prev => ({
        ...prev,
        [currentActor.id]: selectedTarget,
      }));
    }
    
    // Move to next role
    if (currentRoleIdx < nightRoles.length - 1) {
      setCurrentRoleIdx(currentRoleIdx + 1);
      setSelectedTarget(null);
    }
  };

  const handleSkipRole = () => {
    // Move to next role without action
    if (currentRoleIdx < nightRoles.length - 1) {
      setCurrentRoleIdx(currentRoleIdx + 1);
      setSelectedTarget(null);
    }
  };

  const handleFinish = () => {
    onComplete(actions);
  };

  const isLastRole = currentRoleIdx === nightRoles.length - 1;
  const progress = ((currentRoleIdx + 1) / nightRoles.length) * 100;

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
      <div className="glass-card p-6 rounded-[24px] border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
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
        className="glass-card p-8 rounded-[32px] border-2 border-wolf-gold/30 bg-gradient-to-br from-wolf-gold/5 to-transparent"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-2 text-wolf-gold italic">
            {currentRole.name}
          </h1>
          <p className="text-gray-400">
            {playersWithRole.length > 1
              ? `${playersWithRole.length} pemain dengan role ini`
              : '1 pemain dengan role ini'}
          </p>
        </div>

        {/* Players with this role */}
        {playersWithRole.length > 0 && (
          <div className="mb-8">
            <p className="text-sm font-bold text-gray-400 mb-3">PEMAIN DENGAN ROLE INI:</p>
            <div className="flex flex-wrap gap-2">
              {playersWithRole.map(p => (
                <div
                  key={p.id}
                  className="px-4 py-2 bg-wolf-gold/10 border border-wolf-gold/50 rounded-full font-bold text-wolf-gold flex items-center gap-2"
                >
                  <Users size={14} />
                  {p.nickname}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/5 border border-white/10 rounded-[20px] p-6 mb-8">
          <div className="flex gap-3 mb-4">
            <AlertCircle className="text-wolf-gold flex-shrink-0" size={20} />
            <div>
              <p className="font-bold mb-2">Instruksi:</p>
              <p className="text-sm text-gray-300">
                {currentRole.name} BUKA MATA! Silakan pilih 1 target pemain untuk aksi malam.
              </p>
            </div>
          </div>
        </div>

        {/* Target Selection Grid */}
        <div className="mb-8">
          <p className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
            <Target size={14} />
            PILIH TARGET:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableTargets.map(target => (
              <motion.button
                key={target.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectTarget(target.id)}
                className={`p-4 rounded-[16px] border-2 transition-all text-left font-bold ${
                  selectedTarget === target.id
                    ? 'border-wolf-blood bg-wolf-blood/10 text-wolf-blood'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{target.nickname}</span>
                  {selectedTarget === target.id && (
                    <Check size={20} className="text-wolf-blood" />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{target.role.name}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSkipRole}
            className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-[16px] font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <SkipForward size={18} />
            Lewati
          </button>

          <button
            onClick={isLastRole ? handleFinish : handleConfirmRole}
            disabled={!selectedTarget}
            className={`flex-1 px-6 py-3 rounded-[16px] font-bold transition-all flex items-center justify-center gap-2 ${
              selectedTarget
                ? 'bg-wolf-blood hover:bg-wolf-blood/80'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={18} />
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
