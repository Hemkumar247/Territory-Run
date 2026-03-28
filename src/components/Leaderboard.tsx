import React, { useState } from 'react';
import { User } from '../types';
import { Trophy, X } from 'lucide-react';
import { LeaderboardItem } from './ui/LeaderboardItem';
import { NeonText } from './ui/NeonText';
import { auth } from '../lib/firebase';

interface LeaderboardProps {
  users: User[];
  onClose: () => void;
}

const FILTER_TABS = ['Global', 'City', 'Friends'] as const;
type FilterTab = typeof FILTER_TABS[number];

export function Leaderboard({ users, onClose }: LeaderboardProps) {
  const currentUserId = auth.currentUser?.uid;
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Global');

  // For now only Global has real data; others show placeholder
  const visibleUsers = activeFilter === 'Global' ? users : [];

  return (
    <div className="w-full max-w-md mx-auto flex flex-col h-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#B38000]/10 dark:bg-[#FFB800]/10 p-2.5 rounded-2xl border border-[#B38000]/20 dark:border-[#FFB800]/20 shadow-[0_0_15px_rgba(179,128,0,0.15)] dark:shadow-[0_0_15px_rgba(255,184,0,0.15)]">
            <Trophy className="h-5 w-5 text-[#B38000] dark:text-[#FFB800]" />
          </div>
          <div>
            <NeonText className="text-2xl font-display font-bold tracking-tight text-[#B38000] dark:text-[#FFB800]" color="currentColor">
              Leaderboard
            </NeonText>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/40 mt-0.5">Season 1 · All Time</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 relative z-10">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={[
              'flex-1 py-2 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200',
              activeFilter === tab
                ? 'bg-[#B38000]/15 dark:bg-[#FFB800]/15 text-[#B38000] dark:text-[#FFB800] border border-[#B38000]/30 dark:border-[#FFB800]/30 shadow-[0_0_12px_rgba(179,128,0,0.15)] dark:shadow-[0_0_12px_rgba(255,184,0,0.15)]'
                : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 border border-black/10 dark:border-white/10 hover:bg-black/8 dark:hover:bg-white/8',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 relative z-10">
        {visibleUsers.map((user, index) => (
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

        {visibleUsers.length === 0 && (
          <div className="text-center py-16 px-8">
            <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-slate-400 dark:text-white/30" />
            </div>
            <p className="text-slate-600 dark:text-white/40 font-medium tracking-wide text-sm">
              {activeFilter === 'Global' ? 'No runners yet. Be the first!' : `${activeFilter} data coming soon.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
