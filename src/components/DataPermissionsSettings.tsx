import React from 'react';
import { Activity, MapPin, HeartPulse, ShieldAlert } from 'lucide-react';

export function DataPermissionsSettings() {
  return (
    <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10 space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Data & Permissions</h3>
      
      <div className="space-y-4">
        {/* Location Services */}
        <div className="flex items-center justify-between opacity-70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Location Services</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Always On required</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 px-2 py-1 bg-teal-100 dark:bg-teal-900/30 rounded-full">
            Allowed
          </span>
        </div>

        {/* Health Connect */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              <Activity className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Health Connect</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sync workouts & steps</p>
            </div>
          </div>
          <button className="text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Connect
          </button>
        </div>

        {/* Heart Rate Monitor */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              <HeartPulse className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Heart Rate Sensors</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pair Bluetooth devices</p>
            </div>
          </div>
          <button className="text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Manage
          </button>
        </div>
        
        {/* Privacy Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              <ShieldAlert className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Privacy Controls</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage blocked users & zones</p>
            </div>
          </div>
          <button className="text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
