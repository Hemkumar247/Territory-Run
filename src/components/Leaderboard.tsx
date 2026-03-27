import React from 'react';
import { User } from '../types';
import { Trophy, X } from 'lucide-react';
import { LeaderboardItem } from './ui/LeaderboardItem';
import { NeonText } from './ui/NeonText';
import { auth } from '../lib/firebase';

interface LeaderboardProps {
  users: User[];
  onClose: () => void;
}

export function Leaderboard({ users, onClose }: LeaderboardProps) {
  const currentUserId = auth.currentUser?.uid;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col h-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/10 p-2.5 rounded-2xl border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <Trophy className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <NeonText className="text-2xl font-display font-bold tracking-tight text-teal-600 dark:text-teal-400" color="currentColor">
            Global Ranking
          </NeonText>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 relative z-10">
        {users.map((user, index) => (
          <LeaderboardItem
            key={user.uid}
            rank={index + 1}
            name={user.displayName || 'Runner'}
            score={user.territoryStrength || 0}
            avatarUrl={user.photoURL || undefined}
            isCurrentUser={user.uid === currentUserId}
            color={user.territoryColor}
          />
        ))}

        {users.length === 0 && (
          <div className="text-center p-8 text-slate-600 font-medium tracking-wide">
            <p>No runners yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}
