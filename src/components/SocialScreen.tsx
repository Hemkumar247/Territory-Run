import React, { useEffect, useState } from 'react';
import { ChevronRight, Check, Clock, Copy, Search, UserCheck, UserPlus, UserX, X } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useFirebase } from './FirebaseProvider';
import { FriendStatsModal } from './FriendStatsModal';
import { db } from '../lib/firebase';
import { generateFriendCode } from '../services/authService';
import {
  acceptFriendRequest,
  declineFriendRequest,
  getUserByFriendCode,
  removeFriend,
  sendFriendRequest,
} from '../services/socialService';
import { getUserRank } from '../lib/ranks';
import { Territory, User } from '../types';

const mapOrderedUsers = (uids: string[], usersById: Map<string, User>): User[] =>
  uids
    .map((uid) => usersById.get(uid))
    .filter((user): user is User => Boolean(user));

export function SocialScreen({ onClose }: { onClose: () => void }) {
  const { authUser, userProfile } = useFirebase();
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);

  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [requestIds, setRequestIds] = useState<string[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<User[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(true);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [friendToRemove, setFriendToRemove] = useState<User | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedFriendProfile, setSelectedFriendProfile] = useState<User | null>(null);
  const [selectedFriendTerritory, setSelectedFriendTerritory] = useState<Territory | null>(null);
  const [selectedFriendLoading, setSelectedFriendLoading] = useState(false);

  useEffect(() => {
    if (!authUser || !userProfile) return;

    if (!userProfile.friendCode) {
      const userRef = doc(db, 'users', authUser.uid);
      updateDoc(userRef, {
        friendCode: generateFriendCode(),
        friends: userProfile.friends || [],
        friendRequests: userProfile.friendRequests || [],
      }).catch((err) => {
        console.error('Failed to generate friend code:', err);
        setUpdateError(err.message);
      });
    }
  }, [authUser, userProfile]);

  useEffect(() => {
    if (!authUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', authUser.uid),
      (docSnap) => {
        if (!docSnap.exists()) {
          setFriendIds([]);
          setRequestIds([]);
          setFriends([]);
          setRequests([]);
          setIsFriendsLoading(false);
          return;
        }

        const data = docSnap.data();
        setFriendIds(data.friends || []);
        setRequestIds(data.friendRequests || []);
      },
      (error) => {
        console.error('Failed to sync social profile:', error);
        setUpdateError(error.message);
        setIsFriendsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!friendIds.length) {
      setFriends([]);
      setIsFriendsLoading(false);
      return;
    }

    setIsFriendsLoading(true);
    const friendsById = new Map<string, User>();
    const pendingFriendIds = new Set(friendIds);

    const syncFriends = () => {
      setFriends(mapOrderedUsers(friendIds, friendsById));
    };

    const markReady = (uid: string) => {
      pendingFriendIds.delete(uid);
      if (pendingFriendIds.size === 0) {
        setIsFriendsLoading(false);
      }
    };

    const unsubscribers = friendIds.map((uid) =>
      onSnapshot(
        doc(db, 'users', uid),
        (docSnap) => {
          if (docSnap.exists()) {
            friendsById.set(uid, { ...docSnap.data(), uid: docSnap.id } as User);
          } else {
            friendsById.delete(uid);
          }

          syncFriends();
          markReady(uid);
        },
        (error) => {
          console.error(`Failed to sync friend profile ${uid}:`, error);
          setUpdateError(error.message);
          friendsById.delete(uid);
          syncFriends();
          markReady(uid);
        }
      )
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [friendIds]);

  useEffect(() => {
    if (!requestIds.length) {
      setRequests([]);
      return;
    }

    const requestsById = new Map<string, User>();
    const syncRequests = () => {
      setRequests(mapOrderedUsers(requestIds, requestsById));
    };

    const unsubscribers = requestIds.map((uid) =>
      onSnapshot(
        doc(db, 'users', uid),
        (docSnap) => {
          if (docSnap.exists()) {
            requestsById.set(uid, { ...docSnap.data(), uid: docSnap.id } as User);
          } else {
            requestsById.delete(uid);
          }

          syncRequests();
        },
        (error) => {
          console.error(`Failed to sync friend request ${uid}:`, error);
          setUpdateError(error.message);
          requestsById.delete(uid);
          syncRequests();
        }
      )
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [requestIds]);

  useEffect(() => {
    if (selectedFriendId && !friendIds.includes(selectedFriendId)) {
      setSelectedFriendId(null);
      setSelectedFriendProfile(null);
      setSelectedFriendTerritory(null);
      setSelectedFriendLoading(false);
    }
  }, [friendIds, selectedFriendId]);

  useEffect(() => {
    if (!selectedFriendId) {
      setSelectedFriendProfile(null);
      setSelectedFriendTerritory(null);
      setSelectedFriendLoading(false);
      return;
    }

    const friendPreview = friends.find((friend) => friend.uid === selectedFriendId) || null;
    setSelectedFriendProfile(friendPreview);
    setSelectedFriendLoading(true);

    let profileReady = false;
    let territoryReady = false;

    const markReady = () => {
      if (profileReady && territoryReady) {
        setSelectedFriendLoading(false);
      }
    };

    const unsubscribeProfile = onSnapshot(
      doc(db, 'users', selectedFriendId),
      (docSnap) => {
        setSelectedFriendProfile(docSnap.exists() ? ({ ...docSnap.data(), uid: docSnap.id } as User) : null);
        profileReady = true;
        markReady();
      },
      (error) => {
        console.error(`Failed to sync selected friend ${selectedFriendId}:`, error);
        setUpdateError(error.message);
        profileReady = true;
        markReady();
      }
    );

    const unsubscribeTerritory = onSnapshot(
      doc(db, 'territories', selectedFriendId),
      (docSnap) => {
        setSelectedFriendTerritory(docSnap.exists() ? ({ ...docSnap.data(), uid: docSnap.id } as Territory) : null);
        territoryReady = true;
        markReady();
      },
      (error) => {
        console.error(`Failed to sync territory for ${selectedFriendId}:`, error);
        setUpdateError(error.message);
        territoryReady = true;
        markReady();
      }
    );

    return () => {
      unsubscribeProfile();
      unsubscribeTerritory();
    };
  }, [friends, selectedFriendId]);

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
      setSearchError('No runner found with that code.');
    }
    setIsSearching(false);
  };

  const handleSendRequest = async () => {
    if (!authUser || !searchResult) return;

    if (userProfile?.friends?.includes(searchResult.uid)) {
      setSearchError('You are already friends!');
      return;
    }
    if (searchResult.friendRequests?.includes(authUser.uid)) {
      setSearchError('Request already sent!');
      return;
    }

    await sendFriendRequest(authUser.uid, searchResult.uid, userProfile?.displayName || 'A runner');
    setSearchResult(null);
    setSearchCode('');
  };

  const openFriendStats = (friend: User) => {
    setSelectedFriendId(friend.uid);
    setSelectedFriendProfile(friend);
    setSelectedFriendTerritory(null);
  };

  return (
    <div className="absolute inset-0 z-[2000] flex flex-col items-center overflow-y-auto bg-slate-100 px-4 pb-32 pt-8 dark:bg-[#050505]">
      <div className="mt-4 mb-4 flex w-full max-w-md items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Social</h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-slate-600 transition-colors hover:bg-black/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="glass-panel rounded-2xl border border-black/10 bg-white/90 p-6 text-center dark:border-white/10 dark:bg-black/40">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Your Friend Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-3xl font-bold tracking-widest text-slate-900 dark:text-white">
              {userProfile?.friendCode || '------'}
            </span>
            <button
              onClick={handleCopyCode}
              className="rounded-xl bg-slate-100 p-2 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
            </button>
          </div>
          {updateError && (
            <p className="mt-2 text-xs text-red-500">{updateError}</p>
          )}
        </div>

        <div className="glass-panel rounded-2xl border border-black/10 bg-white/90 p-6 dark:border-white/10 dark:bg-black/40">
          <h3 className="mb-4 font-display text-lg font-bold text-slate-900 dark:text-white">Add a Friend</h3>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 py-3 pl-10 pr-4 font-mono uppercase text-slate-900 placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || searchCode.length < 6}
              className="flex items-center justify-center rounded-xl bg-teal-500 px-4 font-medium text-white transition-colors hover:bg-teal-600 disabled:opacity-50"
            >
              Find
            </button>
          </form>

          {searchError && (
            <p className="mt-2 text-sm text-red-500">{searchError}</p>
          )}

          {searchResult && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white shadow-inner" style={{ backgroundColor: searchResult.territoryColor }}>
                  {searchResult.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{searchResult.displayName}</p>
                  <p className="text-xs text-slate-500">{getUserRank(searchResult.totalDistance || 0).title}</p>
                </div>
              </div>
              <button
                onClick={handleSendRequest}
                className="rounded-full bg-teal-500/10 p-2 text-teal-600 transition-colors hover:bg-teal-500/20 dark:text-teal-400"
                aria-label={`Send friend request to ${searchResult.displayName}`}
              >
                <UserPlus className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {requests.length > 0 && (
          <div className="glass-panel rounded-2xl border border-black/10 bg-white/90 p-6 dark:border-white/10 dark:bg-black/40">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
              <Clock className="h-5 w-5 text-orange-500" />
              Friend Requests
            </h3>
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.uid} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white shadow-inner" style={{ backgroundColor: req.territoryColor }}>
                      {req.displayName.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">{req.displayName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => authUser && acceptFriendRequest(authUser.uid, req.uid)}
                      className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                      aria-label={`Accept friend request from ${req.displayName}`}
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => authUser && declineFriendRequest(authUser.uid, req.uid)}
                      className="rounded-full bg-red-500/10 p-2 text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
                      aria-label={`Decline friend request from ${req.displayName}`}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-panel rounded-2xl border border-black/10 bg-white/90 p-6 dark:border-white/10 dark:bg-black/40">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
              <UserCheck className="h-5 w-5 text-teal-500" />
              My Friends
            </h3>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Tap for live stats
            </p>
          </div>

          {isFriendsLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500/20 border-t-teal-500" />
            </div>
          ) : friends.length === 0 ? (
            <p className="py-4 text-center text-slate-500 dark:text-slate-400">You haven't added any friends yet.</p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => {
                const friendRank = getUserRank(friend.totalDistance || 0);
                return (
                  <div key={friend.uid} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-800/30">
                    <button
                      onClick={() => openFriendStats(friend)}
                      className="group flex flex-1 items-center justify-between gap-3 rounded-xl p-1 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      aria-label={`View live stats for ${friend.displayName}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-inner" style={{ backgroundColor: friend.territoryColor }}>
                          {friend.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900 dark:text-white">{friend.displayName}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {friendRank.title} • {((friend.totalDistance || 0) / 1000).toFixed(2)} km
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-slate-400 transition-colors group-hover:text-teal-500">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Stats</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>

                    <button
                      onClick={() => setFriendToRemove(friend)}
                      aria-label={`Remove ${friend.displayName} from friends`}
                      className="rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedFriendId && (
        <FriendStatsModal
          friend={selectedFriendProfile}
          territory={selectedFriendTerritory}
          loading={selectedFriendLoading}
          onClose={() => setSelectedFriendId(null)}
        />
      )}

      {friendToRemove && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-xs scale-in rounded-3xl border border-black/10 bg-white p-6 shadow-2xl duration-200 dark:border-white/10 dark:bg-slate-900">
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white font-display">Remove Friend?</h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to remove <span className="font-bold text-slate-700 dark:text-slate-200">{friendToRemove.displayName}</span> from your friends list?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setFriendToRemove(null)}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (authUser && friendToRemove) {
                    removeFriend(authUser.uid, friendToRemove.uid);
                    setFriendToRemove(null);
                  }
                }}
                className="flex-1 rounded-xl bg-red-500 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
