import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { User } from '../types';
import { getUserByFriendCode, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, getUserByUid } from '../services/socialService';
import { generateFriendCode } from '../services/authService';
import { X, Copy, Check, Search, UserPlus, UserCheck, UserX, Clock } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function SocialScreen({ onClose }: { onClose: () => void }) {
  const { authUser, userProfile } = useFirebase();
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Real-time data
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser || !userProfile) return;

    // Generate friend code for existing users if they don't have one
    if (!userProfile.friendCode) {
      const userRef = doc(db, 'users', authUser.uid);
      updateDoc(userRef, {
        friendCode: generateFriendCode(),
        friends: userProfile.friends || [],
        friendRequests: userProfile.friendRequests || []
      }).catch(err => {
        console.error("Failed to generate friend code:", err);
        setUpdateError(err.message);
      });
    }
  }, [authUser, userProfile]);

  useEffect(() => {
    if (!authUser) return;

    // Listen to current user's profile to get updated friends/requests lists
    const unsubscribe = onSnapshot(doc(db, 'users', authUser.uid), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const friendIds = data.friends || [];
        const requestIds = data.friendRequests || [];

        // Fetch friend profiles
        // Note: In a production app with many friends, you'd want to paginate or use a different structure.
        // For this prototype, we'll fetch them individually or in small batches.
        const fetchProfiles = async (uids: string[]) => {
          const profiles: User[] = [];
          for (const uid of uids) {
            const userDoc = await getUserByUid(uid);
            if (userDoc) profiles.push(userDoc);
          }
          return profiles;
        };

        // Fetch friends and requests
        const [friendsData, requestsData] = await Promise.all([
          fetchProfiles(friendIds),
          fetchProfiles(requestIds)
        ]);

        setFriends(friendsData);
        setRequests(requestsData);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [authUser]);

  const handleCopyCode = () => {
    if (userProfile?.friendCode) {
      navigator.clipboard.writeText(userProfile.friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    if (searchCode.toUpperCase() === userProfile?.friendCode) {
      setSearchError("You can't add yourself!");
      setIsSearching(false);
      return;
    }

    const user = await getUserByFriendCode(searchCode);
    if (user) {
      setSearchResult(user);
    } else {
      setSearchError("No runner found with that code.");
    }
    setIsSearching(false);
  };

  const handleSendRequest = async () => {
    if (!authUser || !searchResult) return;
    
    // Check if already friends or request pending
    if (userProfile?.friends?.includes(searchResult.uid)) {
      setSearchError("You are already friends!");
      return;
    }
    if (searchResult.friendRequests?.includes(authUser.uid)) {
      setSearchError("Request already sent!");
      return;
    }

    await sendFriendRequest(authUser.uid, searchResult.uid);
    setSearchResult(null);
    setSearchCode('');
    // Show some success feedback (could use a toast here)
  };

  return (
    <div className="absolute inset-0 z-[2000] bg-slate-100 dark:bg-[#050505] overflow-y-auto pb-32 pt-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-md mt-4 mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Social</h2>
        <button
          onClick={onClose}
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        
        {/* My Code Section */}
        <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium uppercase tracking-wider">Your Friend Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-mono font-bold tracking-widest text-slate-900 dark:text-white">
              {userProfile?.friendCode || '------'}
            </span>
            <button 
              onClick={handleCopyCode}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
            </button>
          </div>
          {updateError && (
            <p className="text-red-500 text-xs mt-2">Error generating code: {updateError}</p>
          )}
        </div>

        {/* Add Friend Section */}
        <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10">
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">Add a Friend</h3>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Enter 6-digit code" 
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white font-mono uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button 
              type="submit"
              disabled={isSearching || searchCode.length < 6}
              className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-4 rounded-xl font-medium transition-colors flex items-center justify-center"
            >
              Find
            </button>
          </form>

          {searchError && (
            <p className="text-red-500 text-sm mt-2">{searchError}</p>
          )}

          {searchResult && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner" style={{ backgroundColor: searchResult.territoryColor }}>
                  {searchResult.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{searchResult.displayName}</p>
                  <p className="text-xs text-slate-500">Level {Math.floor((searchResult.totalDistance || 0) / 10) + 1}</p>
                </div>
              </div>
              <button 
                onClick={handleSendRequest}
                className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 rounded-full transition-colors"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {requests.length > 0 && (
          <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10">
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Friend Requests
            </h3>
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.uid} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner" style={{ backgroundColor: req.territoryColor }}>
                      {req.displayName.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">{req.displayName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => authUser && acceptFriendRequest(authUser.uid, req.uid)}
                      className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-full transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => authUser && declineFriendRequest(authUser.uid, req.uid)}
                      className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10">
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-500" />
            My Friends
          </h3>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500/20 border-t-teal-500"></div>
            </div>
          ) : friends.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-4">You haven't added any friends yet.</p>
          ) : (
            <div className="space-y-3">
              {friends.map(friend => (
                <div key={friend.uid} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner" style={{ backgroundColor: friend.territoryColor }}>
                      {friend.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{friend.displayName}</p>
                      <p className="text-xs text-slate-500">Level {Math.floor((friend.totalDistance || 0) / 10) + 1}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Remove ${friend.displayName} from friends?`)) {
                        authUser && removeFriend(authUser.uid, friend.uid);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
