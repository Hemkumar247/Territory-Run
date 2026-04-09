import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap, ZoomControl, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { useLocation } from '../hooks/useLocation';
import { useFirebase } from './FirebaseProvider';
import { useGlobalData } from '../hooks/useGlobalData';
import { LogOut, Navigation, AlertTriangle, Play, CheckCircle2, Loader2, Trophy, Moon, Sun, Square, X, LocateFixed } from 'lucide-react';
import { logout } from '../services/authService';
import { saveRunSession } from '../services/runService';
import { Leaderboard } from './Leaderboard';
import { WelcomeModal } from './WelcomeModal';
import * as turf from '@turf/turf';
import { calculateDecayedStrength, getStrengthLevel } from '../lib/utils';

import { NavigationTabBar } from './ui/NavigationTabBar';
import { BottomHUD } from './ui/BottomHUD';
import { RivalAlertBanner } from './ui/RivalAlertBanner';
import { TerritoryPolygon } from './ui/TerritoryPolygon';
import { ProfileCard } from './ui/ProfileCard';
import { ProfileSettings } from './ProfileSettings';
import { GeneralSettings } from './GeneralSettings';
import { RunHistory } from './RunHistory';
import { SocialScreen } from './SocialScreen';

// Fix for default Leaflet icon missing in Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter map when location updates during tracking
function RecenterAutomatically({ lat, lng, isRunning }: { lat: number; lng: number, isRunning: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (isRunning) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map, isRunning]);
  return null;
}

// Component to set initial bounds to include user territory and current location
function InitialMapBounds({ currentLocation }: { currentLocation: any }) {
  const map = useMap();
  const [hasSetInitialBounds, setHasSetInitialBounds] = useState(false);

  useEffect(() => {
    if (!hasSetInitialBounds && currentLocation) {
      // Always center on the user's exact current location with a close-up zoom
      map.setView([currentLocation.lat, currentLocation.lng], 17);
      setHasSetInitialBounds(true);
    }
  }, [currentLocation, map, hasSetInitialBounds]);

  return null;
}

import { AchievementBadge } from './ui/AchievementBadge';
import { User } from '../types';

function getTerritoryBadgeSVG(user: User | undefined): string {
  if (!user) return '';
  
  const achs = user.achievements || [];
  
  // Define SVGs for achievements and levels
  const svgs = {
    century_club: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.8)]"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>`,
    marathoner: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400 drop-shadow-[0_0_3px_rgba(96,165,250,0.8)]"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"></path><path d="M11 12 5.12 2.2"></path><path d="m13 12 5.88-9.8"></path><path d="M8 7h8"></path><circle cx="12" cy="17" r="5"></circle><path d="M12 18v-2h-.5"></path></svg>`,
    empire_builder: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400 drop-shadow-[0_0_3px_rgba(52,211,153,0.8)]"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" x2="4" y1="22" y2="15"></line></svg>`,
    first_run: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-400 drop-shadow-[0_0_3px_rgba(251,146,60,0.8)]"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"></path><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"></path><path d="M16 17h4"></path><path d="M4 13h4"></path></svg>`,
    default: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300 drop-shadow-[0_0_3px_rgba(203,213,225,0.8)]"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
  };

  if (achs.includes('century_club')) return svgs.century_club;
  if (achs.includes('marathoner')) return svgs.marathoner;
  if (achs.includes('empire_builder')) return svgs.empire_builder;
  if (achs.includes('first_run')) return svgs.first_run;
  
  // Fallback to level-based
  const level = Math.floor((user.totalDistance || 0) / 10) + 1;
  if (level >= 10) return svgs.century_club; // Gold/Trophy
  if (level >= 5) return svgs.marathoner; // Silver/Medal
  
  return svgs.default; // Bronze/Star
}

export function MapScreen() {
  const { userProfile, authUser } = useFirebase();
  const { currentLocation, trail, error, isTracking, isRunning, isPaused, elapsedTime, totalDistanceCovered, startRun, pauseRun, resumeRun, endRun, resetRun, simulateRun } = useLocation();
  const { territories, leaderboardUsers, loading } = useGlobalData();
  
  // Calculate user's total territory stats
  const userTerritoryStats = useMemo(() => {
    if (!authUser) return { totalArea: 0, avgStrength: 0 };
    
    const userTerritories = territories.filter(t => t.uid === authUser.uid);
    if (userTerritories.length === 0) return { totalArea: 0, avgStrength: 0 };
    
    let totalArea = 0;
    let totalStrength = 0;
    
    userTerritories.forEach(t => {
      totalArea += (t.areaKm2 || 0);
      totalStrength += calculateDecayedStrength(t.strength || 0, t.lastUpdated);
    });
    
    return {
      totalArea: totalArea,
      avgStrength: Math.round(totalStrength / userTerritories.length)
    };
  }, [territories, authUser]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'leaderboard' | 'history' | 'profile' | 'settings' | 'social'>('map');
  const [showWelcome, setShowWelcome] = useState(() => {
    return !sessionStorage.getItem('welcomeShown');
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [summaryData, setSummaryData] = useState({ distance: 0, area: 0 });
  const [showRivalAlert, setShowRivalAlert] = useState(false);

  const handleCloseWelcome = () => {
    sessionStorage.setItem('welcomeShown', 'true');
    setShowWelcome(false);
  };

  // Randomly show rival alert during a run
  useEffect(() => {
    if (isRunning && !isPaused) {
      const interval = setInterval(() => {
        if (Math.random() > 0.8) {
          setShowRivalAlert(true);
          setTimeout(() => setShowRivalAlert(false), 5000);
        }
      }, 15000);
      return () => clearInterval(interval);
    } else {
      setShowRivalAlert(false);
    }
  }, [isRunning, isPaused]);

  // Toggle dark mode class on document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Custom pulsing marker for current location
  const createPulsingIcon = (color: string) => L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative flex h-8 w-8 items-center justify-center -ml-4 -mt-4">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 mix-blend-screen" style="background-color: ${color}; box-shadow: 0 0 20px ${color}"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 border-[1.5px] border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="background-color: ${color}"></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  // Convert trail to Leaflet LatLng format
  const polylinePositions = trail.map(point => [point.lat, point.lng] as [number, number]);

  // Filter territories within 5km radius, always include user's own territory
  const visibleTerritories = useMemo(() => {
    if (!currentLocation || loading) return [];
    const userPt = turf.point([currentLocation.lng, currentLocation.lat]);

    return territories.filter(t => {
      if (!t.coordinates || t.coordinates.length === 0) return false;
      // Always show current user's territory
      if (t.uid === authUser?.uid) return true;
      
      // Check distance to the first coordinate of the territory
      const terrPt = turf.point([t.coordinates[0].lng, t.coordinates[0].lat]);
      const dist = turf.distance(userPt, terrPt, { units: 'kilometers' });
      return dist <= 5;
    });
  }, [territories, currentLocation, loading, authUser]);

  // Calculate Contested Zones (Intersections)
  const contestedZones = useMemo(() => {
    const zones: { id: string; geometry: any; users: any[] }[] = [];
    if (visibleTerritories.length < 2) return zones;

    for (let i = 0; i < visibleTerritories.length; i++) {
      for (let j = i + 1; j < visibleTerritories.length; j++) {
        const t1 = visibleTerritories[i];
        const t2 = visibleTerritories[j];

        if (t1.coordinates.length >= 3 && t2.coordinates.length >= 3) {
          try {
            const coords1 = t1.coordinates.map(c => [c.lng, c.lat]);
            coords1.push([...coords1[0]]);
            const poly1 = turf.polygon([coords1]);

            const coords2 = t2.coordinates.map(c => [c.lng, c.lat]);
            coords2.push([...coords2[0]]);
            const poly2 = turf.polygon([coords2]);

            const intersection = turf.intersect(turf.featureCollection([poly1, poly2]));
            if (intersection) {
              zones.push({
                id: `${t1.uid}-${t2.uid}`,
                geometry: intersection.geometry,
                users: [t1.user, t2.user]
              });
            }
          } catch (e) {
            console.error("Error calculating intersection:", e);
          }
        }
      }
    }
    return zones;
  }, [visibleTerritories]);

  // Calculate Distance and Territory using Turf.js
  const { distance, territoryArea, territoryPolygon } = useMemo(() => {
    let dist = 0;
    let area = 0;
    let polygon: [number, number][] | null = null;

    if (trail.length > 1) {
      // 1. Calculate Distance
      const line = turf.lineString(trail.map(p => [p.lng, p.lat]));
      dist = turf.length(line, { units: 'kilometers' });

      // 2. Calculate Territory (Convex Hull)
      // We need at least 3 points to make a polygon
      if (trail.length >= 3) {
        const points = turf.featureCollection(trail.map(p => turf.point([p.lng, p.lat])));
        const hull = turf.convex(points);
        
        if (hull) {
          // Calculate area in square meters
          area = turf.area(hull);
          
          // Extract coordinates for Leaflet (Leaflet expects [lat, lng], Turf uses [lng, lat])
          const coords = hull.geometry.coordinates[0];
          polygon = coords.map(c => [c[1], c[0]] as [number, number]);
        }
      }
    }

    return { distance: dist, territoryArea: area, territoryPolygon: polygon };
  }, [trail]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatPace = (distanceKm: number, seconds: number) => {
    if (distanceKm === 0 || seconds === 0) return "0:00";
    const paceSeconds = seconds / distanceKm;
    const m = Math.floor(paceSeconds / 60);
    const s = Math.floor(paceSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  const handleFinishRun = async () => {
    if (!authUser || !userProfile) return;
    
    if (trail.length < 2) {
      // Not enough data to save a run
      endRun();
      resetRun();
      return;
    }

    setIsSaving(true);
    try {
      const unlockedAchievements = await saveRunSession(
        userProfile,
        trail,
        distance * 1000, // Convert km to meters for storage
        territoryPolygon,
        territoryArea
      );
      
      setSummaryData({ distance, area: territoryArea });
      if (unlockedAchievements && unlockedAchievements.length > 0) {
        setNewAchievements(unlockedAchievements);
      }
      setShowSummary(true);
      resetRun();
    } catch (err) {
      console.error("Failed to save run:", err);
      alert("Failed to save run. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (showSummary) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-100/80 dark:bg-[#050505]/80 backdrop-blur-md p-4 relative overflow-hidden animate-in fade-in duration-500 z-[2000]">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
        
        <div className="text-center space-y-8 max-w-sm w-full glass-panel bg-white/90 dark:bg-black/40 p-10 rounded-[2.5rem] relative z-10 shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-black/10 dark:border-white/10">
          <div className="mx-auto w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
          </div>
          <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Sector Secured</h2>
          
          <div className="grid grid-cols-2 gap-4 my-8">
            <div className="bg-black/5 dark:bg-white/5 p-6 rounded-3xl border border-black/5 dark:border-white/5 backdrop-blur-sm transition-transform hover:scale-105">
              <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] font-semibold mb-2">Distance</p>
              <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">{summaryData.distance.toFixed(2)} <span className="text-sm text-slate-600 dark:text-slate-400 font-sans">km</span></p>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-6 rounded-3xl border border-black/5 dark:border-white/5 backdrop-blur-sm transition-transform hover:scale-105">
              <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] font-semibold mb-2">Territory</p>
              <p className="text-3xl font-display font-bold text-glow" style={{ color: userProfile?.territoryColor }}>
                {Math.round(summaryData.area).toLocaleString()} <span className="text-sm text-slate-600 dark:text-slate-400 font-sans">m²</span>
              </p>
            </div>
          </div>

          {newAchievements.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] font-semibold mb-3">Achievements Unlocked</p>
              <div className="flex flex-wrap justify-center gap-2">
                {newAchievements.map(achId => (
                  <AchievementBadge key={achId} id={achId} size="md" />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setShowSummary(false);
              setNewAchievements([]);
            }}
            className="w-full rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black px-4 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.15)] dark:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[0.98]"
          >
            Initialize Next Run
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-100 dark:bg-[#050505] flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between p-6 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 glass-panel bg-white/90 dark:bg-black/40 px-5 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-black/10 dark:border-white/10">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 tracking-[0.2em] uppercase">
            {isTracking ? 'GPS Active' : 'Locating...'}
          </span>
        </div>

        {/* Simulate Run Button (Dev only) */}
        {!isRunning && !isPaused && (
          <button
            onClick={simulateRun}
            className="pointer-events-auto flex items-center gap-2 glass-panel bg-white/90 dark:bg-black/40 px-4 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-black/60 transition-colors"
          >
            <Play className="h-3.5 w-3.5 text-slate-700 dark:text-slate-200" />
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 tracking-[0.2em] uppercase">
              Simulate
            </span>
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[1000] glass-panel bg-slate-100/80 dark:bg-[#050505]/80 border-red-500/20 px-6 py-5 rounded-[2rem] flex items-center gap-5 w-[90%] max-w-md shadow-[0_20px_40px_rgba(239,68,68,0.15)] backdrop-blur-xl">
          <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-red-600 dark:text-red-100 tracking-wide">GPS Signal Lost</h3>
            <p className="text-xs text-red-500/80 dark:text-red-200/60 mt-1 font-medium tracking-wide">Please ensure location services are enabled.</p>
          </div>
        </div>
      )}

      {/* Loading Indicator for Territories */}
      {loading && currentLocation && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[1000] glass-panel bg-white/90 dark:bg-black/40 px-6 py-3 rounded-full flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-black/10 dark:border-white/10">
          <Loader2 className="h-5 w-5 animate-spin text-teal-500 dark:text-teal-400" />
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em]">Syncing Map...</span>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 w-full relative z-0">
        {!currentLocation && !error ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-100 dark:bg-[#050505] text-slate-600 dark:text-slate-400 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center mb-8 bg-black/5 dark:bg-white/5 shadow-[0_0_30px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                <Navigation className="h-10 w-10 animate-bounce text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
              </div>
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-slate-600 dark:text-slate-300 mb-2">Acquiring Satellites</p>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-wide">Establishing secure connection...</p>
            </div>
          </div>
        ) : currentLocation ? (
          <MapContainer 
            center={[currentLocation.lat, currentLocation.lng]} 
            zoom={16} 
            className="h-full w-full bg-slate-100 dark:bg-[#050505]"
            zoomControl={false}
          >
            <ZoomControl position="bottomleft" />
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url={isDarkMode 
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              }
            />
            
            <InitialMapBounds 
              currentLocation={currentLocation} 
            />
            <RecenterAutomatically lat={currentLocation.lat} lng={currentLocation.lng} isRunning={isRunning} />
            
            {/* Render all saved territories from the database */}
            {!loading && visibleTerritories.map((territory) => {
              const polyCoords = territory.coordinates.map(c => [c.lat, c.lng] as [number, number]);
              const isCurrentUser = territory.uid === authUser?.uid;
              const color = territory.user?.territoryColor || '#3b82f6';
              
              let centroid: [number, number] | null = null;
              if (polyCoords.length >= 3) {
                try {
                  const turfCoords = polyCoords.map(c => [c[1], c[0]]);
                  turfCoords.push([...turfCoords[0]]); // close the polygon
                  const polygon = turf.polygon([turfCoords]);
                  const center = turf.centroid(polygon);
                  centroid = [center.geometry.coordinates[1], center.geometry.coordinates[0]];
                } catch (e) {
                  centroid = polyCoords[0];
                }
              } else if (polyCoords.length > 0) {
                centroid = polyCoords[0];
              }

              const initial = (territory.user?.displayName || 'U').charAt(0).toUpperCase();
              const originalStrength = territory.strength || 0;
              const strength = calculateDecayedStrength(originalStrength, territory.lastUpdated);
              const strengthLevel = getStrengthLevel(strength);

              const labelIcon = L.divIcon({
                className: 'bg-transparent border-none',
                html: `
                  <div class="territory-label">
                    <div class="relative flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shadow-inner" style="background-color: ${color}">
                      ${initial}
                      <div class="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-slate-700 shadow-sm flex items-center justify-center">
                        ${getTerritoryBadgeSVG(territory.user)}
                      </div>
                    </div>
                    <span class="px-1.5 font-display font-bold tracking-tight text-white drop-shadow-md">${territory.user?.displayName || 'Unknown'}</span>
                    <div class="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5 ml-0.5 border border-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      <span class="text-[9px] font-bold text-white">${strength}</span>
                    </div>
                  </div>
                `,
                iconSize: [0, 0],
                iconAnchor: [0, 0]
              });
              
              const level = Math.floor((territory.user?.totalDistance || 0) / 10) + 1;
              const achs = territory.user?.achievements || [];

              return (
                <React.Fragment key={territory.uid}>
                  <TerritoryPolygon 
                    positions={polyCoords}
                    color={color}
                    strength={strengthLevel}
                    isContested={false}
                    pathOptions={{
                      dashArray: isCurrentUser ? '5, 5' : undefined,
                    }}
                  >
                    <Popup className="modern-territory-popup" closeButton={false}>
                      <div className="glass-panel bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl p-4 rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl min-w-[200px]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0" style={{ backgroundColor: color }}>
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-display font-bold text-slate-900 dark:text-white text-base leading-tight truncate">{territory.user?.displayName || 'Unknown'}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Level {level} Runner</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-2 text-center">
                            <p className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Power</p>
                            <p className="font-mono font-bold text-slate-900 dark:text-white text-sm" style={{ color }}>{strength}</p>
                          </div>
                          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-2 text-center">
                            <p className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Distance</p>
                            <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">{(territory.user?.totalDistance || 0).toFixed(1)}<span className="text-[10px] text-slate-500 font-sans ml-0.5">km</span></p>
                          </div>
                        </div>

                        {achs.length > 0 && (
                          <div className="pt-2 border-t border-black/5 dark:border-white/5">
                            <p className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Achievements</p>
                            <div className="flex flex-wrap gap-1">
                              {achs.slice(0, 3).map(achId => (
                                <AchievementBadge key={achId} id={achId} size="sm" />
                              ))}
                              {achs.length > 3 && (
                                <span className="text-[10px] text-slate-500 flex items-center pl-1 font-bold">+{achs.length - 3}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </TerritoryPolygon>
                  {centroid && (
                    <Marker position={centroid} icon={labelIcon} interactive={false} />
                  )}
                </React.Fragment>
              );
            })}

            {/* Contested Zones */}
            {contestedZones.map((zone) => {
              if (zone.geometry.type === 'Polygon') {
                const positions = zone.geometry.coordinates[0].map((c: number[]) => [c[1], c[0]] as [number, number]);
                return (
                  <Polygon
                    key={zone.id}
                    positions={positions}
                    pathOptions={{
                      color: '#ef4444',
                      fillColor: '#ef4444',
                      fillOpacity: 0.6,
                      weight: 2,
                      dashArray: '4, 4',
                      className: 'animate-pulse'
                    }}
                  >
                    <Popup className="modern-territory-popup" closeButton={false}>
                      <div className="glass-panel bg-red-500/90 backdrop-blur-xl p-3 rounded-2xl border border-red-400/50 shadow-2xl min-w-[150px] text-center">
                        <AlertTriangle className="w-6 h-6 text-white mx-auto mb-1" />
                        <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider">Contested Zone</h4>
                        <p className="text-[10px] text-red-100 font-medium mt-1">
                          {zone.users[0]?.displayName || 'Unknown'} vs {zone.users[1]?.displayName || 'Unknown'}
                        </p>
                      </div>
                    </Popup>
                  </Polygon>
                );
              }
              return null;
            })}

            {/* User's actively claimed territory polygon (being drawn) */}
            {territoryPolygon && (
              <TerritoryPolygon 
                positions={territoryPolygon}
                color={userProfile?.territoryColor || '#3b82f6'}
                strength="medium"
                pathOptions={{ 
                  fillOpacity: 0.5,
                  weight: 3,
                }}
              />
            )}

            {/* User's current location marker */}
            <Marker 
              position={[currentLocation.lat, currentLocation.lng]}
              icon={createPulsingIcon(userProfile?.territoryColor || '#3b82f6')}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-slate-900">{userProfile?.displayName || 'You'}</p>
                  <p className="text-xs text-slate-600">Current Location</p>
                </div>
              </Popup>
            </Marker>

            {/* User's trail */}
            {polylinePositions.length > 1 && (
              <Polyline 
                positions={polylinePositions} 
                color={userProfile?.territoryColor || (isDarkMode ? "#ffffff" : "#0f172a")}
                weight={4}
                opacity={0.9}
                dashArray="1, 8"
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapContainer>
        ) : null}
      </div>

      {/* Bottom HUD & Navigation */}
      {activeTab === 'map' && (
        <>
          {/* Rival Alert Banner (Example) */}
          <div className="absolute top-24 left-0 right-0 z-[1000] pointer-events-none">
            {showRivalAlert && (
              <RivalAlertBanner 
                rivalName="NeonGhost" 
                territoryName="Downtown Sector" 
                timeAgo="Just now" 
              />
            )}
          </div>

          <BottomHUD
            className={(!isRunning && !isPaused) ? "bottom-[100px]" : ""}
            isRunning={isRunning && !isPaused}
            isPaused={isPaused}
            distance={distance.toFixed(2)}
            pace={formatPace(distance, elapsedTime)}
            time={formatTime(elapsedTime)}
            onStart={startRun}
            onPause={pauseRun}
            onResume={resumeRun}
            onStop={handleFinishRun}
          />
        </>
      )}

      {/* Navigation Tab Bar */}
      {(!isRunning && !isPaused) && (
        <NavigationTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Leaderboard Modal / Screen */}
      {activeTab === 'leaderboard' && (
        <div className="absolute inset-0 z-[2000] bg-slate-100 dark:bg-[#050505] overflow-y-auto pb-32 pt-8 px-4">
          <Leaderboard users={leaderboardUsers} onClose={() => setActiveTab('map')} />
        </div>
      )}

      {/* History Screen */}
      {activeTab === 'history' && (
        <RunHistory />
      )}

      {/* Social Screen */}
      {activeTab === 'social' && (
        <SocialScreen onClose={() => setActiveTab('map')} />
      )}

      {/* Profile Screen */}
      {activeTab === 'profile' && userProfile && (
        <div className="absolute inset-0 z-[2000] bg-slate-100 dark:bg-[#050505] overflow-y-auto pb-32 pt-8 px-4 flex flex-col items-center">
          <div className="w-full max-w-md mt-4 mb-4 flex justify-end">
            <button
              onClick={() => setActiveTab('map')}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="w-full max-w-md">
            <ProfileCard
              name={userProfile.displayName || 'Runner'}
              level={Math.floor((userProfile.totalDistance || 0) / 10) + 1}
              xp={(userProfile.totalDistance || 0) % 10 * 100}
              nextLevelXp={1000}
              avatarUrl={userProfile.photoURL || undefined}
              totalDistance={userProfile.totalDistance || 0}
              totalRuns={userProfile.totalRuns || 0}
              territoryControlled={Number(userTerritoryStats.totalArea.toFixed(2))}
              avgStrength={userTerritoryStats.avgStrength}
              achievements={userProfile.achievements || []}
              color={userProfile.territoryColor}
            />
          </div>
        </div>
      )}

      {/* Settings Screen */}
      {activeTab === 'settings' && (
        <div className="absolute inset-0 z-[2000] bg-slate-100 dark:bg-[#050505] overflow-y-auto pb-32 pt-8 px-4 flex flex-col items-center">
          <div className="w-full max-w-md mt-4 mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Settings</h2>
            <button
              onClick={() => setActiveTab('map')}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="w-full max-w-md space-y-6">
            
            <ProfileSettings />
            
            <GeneralSettings />

            <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                    {isDarkMode ? <Moon className="h-5 w-5 text-slate-400" /> : <Sun className="h-5 w-5 text-slate-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Toggle dark/light theme</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-500/10 p-3 rounded-xl transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcome && userProfile && (
        <WelcomeModal user={userProfile} onClose={handleCloseWelcome} />
      )}
    </div>
  );
}
