import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { Trophy, X, Users, Globe } from 'lucide-react';
import { LeaderboardItem } from './ui/LeaderboardItem';
import { NeonText } from './ui/NeonText';
import { auth } from '../lib/firebase';

interface LeaderboardProps {
  users: User[];
  userProfile: User | null;
  onClose: () => void;
}

export function Leaderboard({ users, userProfile, onClose }: LeaderboardProps) {
  const currentUserId = auth.currentUser?.uid;
  const [filter, setFilter] = useState<'global' | 'friends'>('global');

  const filteredUsers = useMemo(() => {
    if (filter === 'global') return users;
    
    const friendIds = userProfile?.friends || [];
    // Include self and friends
    return users.filter(user => user.uid === currentUserId || friendIds.includes(user.uid));
  }, [users, filter, userProfile, currentUserId]);

  return (
    <section aria-labelledby="leaderboard-heading" className="w-full max-w-md mx-auto flex flex-col h-full animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
           <div className="bg-teal-500/10 p-2.5 rounded-2xl border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <Trophy aria-hidden="true" className="h-5 w-5 text-teal-600 dark:text-teal-400" />
           </div>
          <NeonText className="text-2xl font-display font-bold tracking-tight text-teal-600 dark:text-teal-400" color="currentColor">
            <h1 id="leaderboard-heading">{filter === 'global' ? 'Global Ranking' : 'Friend Ranking'}</h1>
          </NeonText>
        </div>
        <button
          onClick={onClose}
          aria-label="Close Leaderboard"
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>

      {/* Filter Toggle */}
      <nav aria-label="Leaderboard Filters" className="flex bg-slate-200 dark:bg-white/5 rounded-2xl p-1.5 mb-8 relative z-10 border border-black/5 dark:border-white/5">
        <button
          onClick={() => setFilter('global')}
          aria-pressed={filter === 'global'}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
            filter === 'global' 
              ? 'bg-white dark:bg-white/10 text-teal-600 dark:text-teal-400 shadow-lg shadow-black/5' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Globe aria-hidden="true" className="w-3.5 h-3.5" />
          Global
        </button>
        <button
          onClick={() => setFilter('friends')}
          aria-pressed={filter === 'friends'}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
            filter === 'friends' 
              ? 'bg-white dark:bg-white/10 text-teal-600 dark:text-teal-400 shadow-lg shadow-black/5' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Users aria-hidden="true" className="w-3.5 h-3.5" />
          Friends
        </button>
      </nav>

      {/* List */}
      <ul role="list" className="flex-1 space-y-3 relative z-10 pb-8">
        {filteredUsers.map((user, index) => (
          <li key={user.uid} role="listitem">
            <LeaderboardItem
              rank={index + 1}
              name={user.displayName || 'Runner'}
              score={user.territoryStrength || 0}
              avatarUrl={user.photoURL || undefined}
              isCurrentUser={user.uid === currentUserId}
              color={user.territoryColor}
            />
          </li>
        ))}

        {filteredUsers.length === 0 && (
          <li className="text-center p-8 text-slate-600 font-medium tracking-wide">
            <p>No runners found in this category.</p>
          </li>
        )}
      </ul>
    </section>
  );
}
