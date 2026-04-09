import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from './FirebaseProvider';
import { Bell, Globe, Ruler } from 'lucide-react';
import { requestNotificationPermission } from '../services/notificationService';

export function GeneralSettings() {
  const { authUser, userProfile } = useFirebase();
  
  // Local state for toggles
  const [units, setUnits] = useState<'metric' | 'imperial'>(userProfile?.preferences?.units || 'metric');
  const [notifications, setNotifications] = useState(userProfile?.preferences?.notifications ?? true);
  const [publicProfile, setPublicProfile] = useState(userProfile?.preferences?.publicProfile ?? true);

  const handleToggle = async (field: string, value: any) => {
    if (!authUser) return;
    
    try {
      await updateDoc(doc(db, 'users', authUser.uid), {
        [`preferences.${field}`]: value
      });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const handleNotificationToggle = async () => {
    const newVal = !notifications;
    setNotifications(newVal);
    handleToggle('notifications', newVal);
    
    if (newVal) {
      await requestNotificationPermission();
    }
  };

  return (
    <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10 space-y-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">General Settings</h3>
      
      {/* Units */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
            <Ruler className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Distance Units</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Kilometers or Miles</p>
          </div>
        </div>
        <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => { setUnits('metric'); handleToggle('units', 'metric'); }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${units === 'metric' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            KM
          </button>
          <button
            onClick={() => { setUnits('imperial'); handleToggle('units', 'imperial'); }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${units === 'imperial' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            MI
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Rival Alerts</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Get notified when territory is contested</p>
          </div>
        </div>
        <button
          onClick={handleNotificationToggle}
          className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      {/* Public Profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
            <Globe className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Public Profile</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Show stats to other runners</p>
          </div>
        </div>
        <button
          onClick={() => { const newVal = !publicProfile; setPublicProfile(newVal); handleToggle('publicProfile', newVal); }}
          className={`w-12 h-6 rounded-full transition-colors relative ${publicProfile ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${publicProfile ? 'left-7' : 'left-1'}`} />
        </button>
      </div>
    </div>
  );
}
