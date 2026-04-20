import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from './FirebaseProvider';
import { Session } from '../types';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import { format } from 'date-fns';
import { Activity, Map as MapIcon, Clock, Ruler, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

export function RunHistory() {
  const { authUser } = useFirebase();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!authUser) return;
      try {
        const q = query(
          collection(db, 'sessions'),
          where('uid', '==', authUser.uid)
        );
        const snapshot = await getDocs(q);
        const fetchedSessions = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as unknown as Session[];
        
        // Sort locally to avoid needing a composite index
        fetchedSessions.sort((a, b) => {
          const checkMillis = (dateObj: any): number => {
            if (!dateObj) return 0;
            if (typeof dateObj.toMillis === 'function') return dateObj.toMillis();
            if (dateObj.seconds) return dateObj.seconds * 1000;
            return new Date(dateObj).getTime() || 0;
          };
          
          const timeA = checkMillis(a.startTime);
          const timeB = checkMillis(b.startTime);
          return timeB - timeA;
        });
        
        setSessions(fetchedSessions);
      } catch (error) {
        console.error("Error fetching run history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [authUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-32 px-4 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Activity className="h-10 w-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">No Runs Yet</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs">
          Start your first run to claim territory and build your empire. Your history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[2000] bg-slate-100 dark:bg-[#050505] overflow-y-auto pb-32 pt-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-md mt-4 mb-6">
        <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Run History</h2>
        <p className="text-slate-500 dark:text-slate-400">Your past conquests and territories claimed.</p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {sessions.map((session, index) => {
            const getValidDate = (dateObj: any): Date => {
                if (typeof dateObj === 'object' && dateObj !== null && typeof dateObj.toDate === 'function') {
                    return dateObj.toDate();
                }
                return new Date(dateObj as any);
            };
          const startTime = getValidDate(session.startTime);
          const endTime = getValidDate(session.endTime);
          const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
          const distanceKm = session.distanceCovered / 1000;
          
          let paceStr = "0:00";
          if (distanceKm > 0) {
            const paceSeconds = durationSeconds / distanceKm;
            const m = Math.floor(paceSeconds / 60);
            const s = Math.floor(paceSeconds % 60);
            paceStr = `${m}:${s.toString().padStart(2, '0')}`;
          }

          // Calculate map bounds
          const lats = session.coordinatesTrail.map(c => c.lat);
          const lngs = session.coordinatesTrail.map(c => c.lng);
          let minLat = Math.min(...lats);
          let maxLat = Math.max(...lats);
          let minLng = Math.min(...lngs);
          let maxLng = Math.max(...lngs);
          
          // Add padding if bounds are too small or identical
          if (maxLat - minLat < 0.001) {
            minLat -= 0.005;
            maxLat += 0.005;
          }
          if (maxLng - minLng < 0.001) {
            minLng -= 0.005;
            maxLng += 0.005;
          }

          const bounds: [[number, number], [number, number]] = [
            [minLat, minLng],
            [maxLat, maxLng]
          ];

          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={(session as any).id || index} 
              className="glass-panel bg-white/90 dark:bg-black/40 rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 shadow-sm"
            >
              {/* Map Header */}
              <div className="h-40 w-full relative bg-slate-200 dark:bg-slate-800">
                {session.coordinatesTrail.length > 0 ? (
                  <MapContainer 
                    bounds={bounds} 
                    zoomControl={false} 
                    dragging={false} 
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    className="h-full w-full z-0"
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                      className="dark:hidden"
                    />
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      className="hidden dark:block"
                    />
                    <Polyline 
                      positions={session.coordinatesTrail.map(c => [c.lat, c.lng])} 
                      color="#10b981" 
                      weight={4} 
                      opacity={0.8} 
                    />
                  </MapContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <MapIcon className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                <div className="absolute top-3 left-3 z-[1000] bg-white/90 dark:bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-900 dark:text-white shadow-sm border border-black/5 dark:border-white/10">
                  {format(startTime, 'MMM d, yyyy • h:mm a')}
                </div>
              </div>

              {/* Stats Body */}
              <div className="p-5">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                      <Ruler className="h-3.5 w-3.5" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold">Distance</span>
                    </div>
                    <p className="text-xl font-display font-bold text-slate-900 dark:text-white">
                      {distanceKm.toFixed(2)} <span className="text-xs font-sans text-slate-500">km</span>
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold">Pace</span>
                    </div>
                    <p className="text-xl font-display font-bold text-slate-900 dark:text-white">
                      {paceStr} <span className="text-xs font-sans text-slate-500">/km</span>
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold">Gained</span>
                    </div>
                    <p className="text-xl font-display font-bold text-emerald-600 dark:text-emerald-400">
                      {session.territoryGained > 0 ? (session.territoryGained / 1000000).toFixed(2) : '0'} <span className="text-xs font-sans text-emerald-600/70 dark:text-emerald-400/70">km²</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
